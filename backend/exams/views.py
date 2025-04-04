# exams/views.py
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import ListView, DetailView, CreateView
from django.contrib import messages
from django.urls import reverse
from django.utils import timezone
from django.http import Http404, JsonResponse
from django.db.models import Count, Max, Q
from django.views import View
from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import Exam, Question, Choice, ExamAttempt, Answer
from .forms import ExamAttemptForm
from courses.models import Course
from enrollments.models import Enrollment
from .serializers import ExamSerializer, QuestionSerializer, ExamAttemptSerializer

class UpcomingExamsListView(LoginRequiredMixin, ListView):
    template_name = 'exams/upcoming_exams.html'
    context_object_name = 'upcoming_exams'
    
    def get_queryset(self):
        now = timezone.now()
        enrolled_courses = Course.objects.filter(
            enrollments__user=self.request.user,
            enrollments__status='active'
        )
        
        return Exam.objects.filter(
            course__in=enrolled_courses,
            start_date__gt=now,
            is_active=True
        ).order_by('start_date')

class ExamDetailView(LoginRequiredMixin, DetailView):
    model = Exam
    template_name = 'exams/exam_detail.html'
    context_object_name = 'exam'
    pk_url_kwarg = 'exam_id'
    
    def get_object(self):
        exam = super().get_object()
        
        # Check if user is enrolled in the course
        if not Enrollment.objects.filter(
            user=self.request.user, 
            course=exam.course, 
            status='active'
        ).exists():
            raise Http404("You are not enrolled in this course")
        
        return exam
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        exam = self.get_object()
        user = self.request.user
        
        # Get previous attempts
        previous_attempts = ExamAttempt.objects.filter(
            exam=exam,
            user=user
        ).order_by('-start_time')
        
        context['previous_attempts'] = previous_attempts
        context['attempts_left'] = exam.max_attempts - previous_attempts.count()
        context['can_take_exam'] = (
            context['attempts_left'] > 0 and
            exam.start_date <= timezone.now() <= exam.end_date
        )
        
        return context

@login_required
def start_exam(request, exam_id):
    exam = get_object_or_404(Exam, id=exam_id)
    
    # Check if user is enrolled in the course
    if not Enrollment.objects.filter(
        user=request.user, 
        course=exam.course, 
        status='active'
    ).exists():
        messages.error(request, "You are not enrolled in this course.")
        return redirect('courses:course_detail', course_slug=exam.course.slug)
    
    # Check if exam is active and within time period
    now = timezone.now()
    if now < exam.start_date:
        messages.error(request, "This exam has not started yet.")
        return redirect('exams:exam_detail', exam_id=exam.id)
    
    if now > exam.end_date:
        messages.error(request, "This exam has already ended.")
        return redirect('exams:exam_detail', exam_id=exam.id)
    
    # Check if user has attempts left
    attempts_count = ExamAttempt.objects.filter(
        exam=exam,
        user=request.user
    ).count()
    
    if attempts_count >= exam.max_attempts:
        messages.error(request, "You have used all your attempts for this exam.")
        return redirect('exams:exam_detail', exam_id=exam.id)
    
    # Check if user has an in-progress attempt
    existing_attempt = ExamAttempt.objects.filter(
        exam=exam,
        user=request.user,
        status='in_progress'
    ).first()
    
    if existing_attempt:
        return redirect('exams:take_exam', attempt_id=existing_attempt.id)
    
    # Create a new attempt
    attempt = ExamAttempt.objects.create(
        exam=exam,
        user=request.user,
        status='in_progress'
    )
    
    return redirect('exams:take_exam', attempt_id=attempt.id)

@login_required
def take_exam(request, attempt_id):
    attempt = get_object_or_404(ExamAttempt, id=attempt_id)
    
    # Check if this attempt belongs to the user
    if attempt.user != request.user:
        messages.error(request, "You do not have permission to access this exam attempt.")
        return redirect('accounts:dashboard')
    
    # Check if the attempt is still in progress
    if attempt.status != 'in_progress':
        messages.info(request, "This exam attempt has already been submitted.")
        return redirect('exams:exam_results', attempt_id=attempt.id)
    
    exam = attempt.exam
    
    # Check if exam time has expired
    time_elapsed = timezone.now() - attempt.start_time
    if time_elapsed.total_seconds() > exam.duration_minutes * 60:
        # Auto-submit if time expired
        return submit_exam(request, attempt_id)
    
    # Get all questions for the exam
    questions = exam.questions.all().prefetch_related('choices')
    
    if request.method == 'POST':
        # Process answers
        for question in questions:
            if question.question_type == 'multiple_choice':
                choice_id = request.POST.get(f'question_{question.id}')
                if choice_id:
                    choice = get_object_or_404(Choice, id=choice_id)
                    answer, created = Answer.objects.update_or_create(
                        attempt=attempt,
                        question=question,
                        defaults={
                            'selected_choice': choice,
                            'is_correct': choice.is_correct
                        }
                    )
            elif question.question_type == 'true_false':
                answer_value = request.POST.get(f'question_{question.id}')
                if answer_value:
                    is_correct = (answer_value == 'true' and 
                                  question.choices.filter(is_correct=True, choice_text='True').exists()) or \
                                 (answer_value == 'false' and 
                                  question.choices.filter(is_correct=True, choice_text='False').exists())
                    
                    choice = question.choices.get(choice_text=answer_value.capitalize())
                    answer, created = Answer.objects.update_or_create(
                        attempt=attempt,
                        question=question,
                        defaults={
                            'selected_choice': choice,
                            'is_correct': is_correct
                        }
                    )
            else:  # Essay or short answer
                text_answer = request.POST.get(f'question_{question.id}')
                if text_answer:
                    answer, created = Answer.objects.update_or_create(
                        attempt=attempt,
                        question=question,
                        defaults={
                            'text_answer': text_answer,
                            # These will be graded later
                            'is_correct': None,
                            'points_earned': None
                        }
                    )
        
        # Check if it's a save or submit action
        if 'save' in request.POST:
            messages.success(request, "Your answers have been saved.")
            return redirect('exams:take_exam', attempt_id=attempt.id)
        elif 'submit' in request.POST:
            return submit_exam(request, attempt_id)
    
    # Get existing answers
    answers = {}
    for answer in Answer.objects.filter(attempt=attempt):
        if answer.selected_choice:
            answers[answer.question.id] = answer.selected_choice.id
        else:
            answers[answer.question.id] = answer.text_answer
    
    # Calculate time remaining
    time_limit_seconds = exam.duration_minutes * 60
    elapsed_seconds = time_elapsed.total_seconds()
    remaining_seconds = max(0, time_limit_seconds - elapsed_seconds)
    
    return render(request, 'exams/take_exam.html', {
        'attempt': attempt,
        'exam': exam,
        'questions': questions,
        'answers': answers,
        'remaining_seconds': int(remaining_seconds)
    })

@login_required
def submit_exam(request, attempt_id):
    attempt = get_object_or_404(ExamAttempt, id=attempt_id, user=request.user)
    
    if attempt.status != 'in_progress':
        messages.info(request, "This exam has already been submitted.")
        return redirect('exams:exam_results', attempt_id=attempt.id)
    
    # Mark the attempt as submitted
    attempt.status = 'submitted'
    attempt.end_time = timezone.now()
    
    # Auto-grade multiple-choice and true/false questions
    total_points = 0
    earned_points = 0
    
    for question in attempt.exam.questions.all():
        total_points += question.points
        
        if question.question_type in ['multiple_choice', 'true_false']:
            answer = Answer.objects.filter(attempt=attempt, question=question).first()
            
            if answer and answer.is_correct:
                answer.points_earned = question.points
                earned_points += question.points
                answer.save()
            elif answer:
                answer.points_earned = 0
                answer.save()
    
    # Calculate score as percentage
    if total_points > 0:
        attempt.score = (earned_points / total_points) * 100
    else:
        attempt.score = 0
    
    # For exams with only auto-graded questions, mark as graded
    if not attempt.exam.questions.filter(question_type__in=['short_answer', 'essay']).exists():
        attempt.status = 'graded'
    
    attempt.save()
    
    messages.success(request, "Your exam has been submitted successfully.")
    return redirect('exams:exam_results', attempt_id=attempt.id)

@login_required
def exam_results(request, attempt_id):
    attempt = get_object_or_404(ExamAttempt, id=attempt_id)
    
    # Check if this attempt belongs to the user
    if attempt.user != request.user:
        messages.error(request, "You do not have permission to view these results.")
        return redirect('accounts:dashboard')
    
    # Get all answers for this attempt
    answers = Answer.objects.filter(attempt=attempt).select_related('question', 'selected_choice')
    
    return render(request, 'exams/exam_results.html', {
        'attempt': attempt,
        'exam': attempt.exam,
        'answers': answers,
        'passed': attempt.is_passed if attempt.score is not None else False
    })

class InstructorExamListView(LoginRequiredMixin, ListView):
    template_name = 'exams/instructor_exam_list.html'
    context_object_name = 'exams'
    
    def get_queryset(self):
        return Exam.objects.filter(course__instructor=self.request.user)

@login_required
def grade_exam(request, attempt_id):
    attempt = get_object_or_404(ExamAttempt, id=attempt_id)
    
    # Check if the user is the instructor of the course
    if attempt.exam.course.instructor != request.user:
        messages.error(request, "You do not have permission to grade this exam.")
        return redirect('accounts:dashboard')
    
    if request.method == 'POST':
        total_points = 0
        earned_points = 0
        
        for question in attempt.exam.questions.all():
            total_points += question.points
            answer = Answer.objects.get(attempt=attempt, question=question)
            
            if question.question_type in ['multiple_choice', 'true_false']:
                # These were already auto-graded
                if answer.points_earned is not None:
                    earned_points += answer.points_earned
            else:
                # Grade essay/short answer questions
                points = request.POST.get(f'points_{answer.id}')
                feedback = request.POST.get(f'feedback_{answer.id}')
                
                if points:
                    answer.points_earned = min(float(points), question.points)
                    answer.feedback = feedback
                    answer.save()
                    
                    earned_points += answer.points_earned
        
        # Update the attempt
        attempt.status = 'graded'
        attempt.score = (earned_points / total_points) * 100 if total_points > 0 else 0
        attempt.feedback = request.POST.get('overall_feedback', '')
        attempt.save()
        
        messages.success(request, "The exam has been graded successfully.")
        return redirect('exams:instructor_exam_attempts', exam_id=attempt.exam.id)
    
    # Get all answers for this attempt
    answers = Answer.objects.filter(attempt=attempt).select_related('question')
    
    return render(request, 'exams/grade_exam.html', {
        'attempt': attempt,
        'exam': attempt.exam,
        'answers': answers,
        'student': attempt.user
    })

@login_required
def instructor_exam_attempts(request, exam_id):
    exam = get_object_or_404(Exam, id=exam_id)
    
    # Check if the user is the instructor of the course
    if exam.course.instructor != request.user:
        messages.error(request, "You do not have permission to view these attempts.")
        return redirect('accounts:dashboard')
    
    attempts = ExamAttempt.objects.filter(exam=exam).select_related('user')
    
    return render(request, 'exams/instructor_exam_attempts.html', {
        'exam': exam,
        'attempts': attempts
    })

class StudentExamHistoryView(LoginRequiredMixin, ListView):
    template_name = 'exams/student_exam_history.html'
    context_object_name = 'attempts'
    
    def get_queryset(self):
        return ExamAttempt.objects.filter(
            user=self.request.user
        ).select_related('exam', 'exam__course').order_by('-start_time')

class ExamViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows exams to be viewed or edited.
    """
    queryset = Exam.objects.all()
    serializer_class = ExamSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'])
    def start_attempt(self, request, pk=None):
        exam = self.get_object()
        user = request.user
        
        # Check if exam is available
        if not exam.is_published:
            return Response({'detail': 'Exam is not available'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user has remaining attempts
        if exam.attempts.filter(user=user).count() >= exam.max_attempts:
            return Response({'detail': 'No attempts remaining'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create new attempt
        attempt = exam.attempts.create(user=user)
        serializer = ExamAttemptSerializer(attempt)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def submit_attempt(self, request, pk=None):
        exam = self.get_object()
        user = request.user
        
        # Get the latest attempt
        attempt = exam.attempts.filter(user=user, status='in_progress').first()
        if not attempt:
            return Response({'detail': 'No active attempt found'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update attempt with answers and calculate score
        answers = request.data.get('answers', {})
        attempt.answers = answers
        attempt.end_time = timezone.now()
        attempt.status = 'submitted'
        
        # Calculate score
        total_marks = sum(question.marks for question in exam.questions.all())
        scored_marks = 0
        for question in exam.questions.all():
            if str(question.id) in answers:
                if answers[str(question.id)] == question.correct_answer:
                    scored_marks += question.marks
        
        attempt.score = (scored_marks / total_marks) * 100 if total_marks > 0 else 0
        attempt.save()
        
        serializer = ExamAttemptSerializer(attempt)
        return Response(serializer.data)

class ExamListAPIView(generics.ListAPIView):
    queryset = Exam.objects.filter(is_published=True)
    serializer_class = ExamSerializer
    permission_classes = [IsAuthenticated]

class ExamAttemptView(LoginRequiredMixin, generics.CreateAPIView):
    serializer_class = ExamAttemptSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        exam = get_object_or_404(Exam, pk=self.kwargs['pk'])
        if not exam.is_published or exam.start_time > timezone.now() or exam.end_time < timezone.now():
            raise PermissionDenied("Exam is not available at this time")
        serializer.save(user=self.request.user, exam=exam)

class ExamSubmitView(LoginRequiredMixin, generics.UpdateAPIView):
    serializer_class = ExamAttemptSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ExamAttempt.objects.filter(user=self.request.user, exam_id=self.kwargs['pk'])

    def perform_update(self, serializer):
        attempt = serializer.instance
        if attempt.status != 'in_progress':
            raise PermissionDenied("This attempt has already been submitted")
        serializer.save(status='submitted', end_time=timezone.now())

class ExamAttemptListView(LoginRequiredMixin, generics.ListAPIView):
    serializer_class = ExamAttemptSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.kwargs.get('instructor'):
            if not self.request.user.is_staff:
                raise PermissionDenied("Only instructors can access this view")
            return ExamAttempt.objects.filter(exam_id=self.kwargs['pk'])
        return ExamAttempt.objects.filter(user=self.request.user)

class ExamResultView(LoginRequiredMixin, generics.RetrieveAPIView):
    serializer_class = ExamAttemptSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ExamAttempt.objects.filter(
            Q(user=self.request.user) | Q(exam__section__course__instructor=self.request.user)
        )

class InstructorExamListView(LoginRequiredMixin, generics.ListCreateAPIView):
    serializer_class = ExamSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.is_staff:
            raise PermissionDenied("Only instructors can access this view")
        return Exam.objects.filter(section__course__instructor=self.request.user)

    def perform_create(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionDenied("Only instructors can create exams")
        serializer.save()

class ExamGradeView(LoginRequiredMixin, generics.UpdateAPIView):
    serializer_class = ExamAttemptSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.is_staff:
            raise PermissionDenied("Only instructors can grade exams")
        return ExamAttempt.objects.filter(exam__section__course__instructor=self.request.user)

    def perform_update(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionDenied("Only instructors can grade exams")
        serializer.save(status='graded')