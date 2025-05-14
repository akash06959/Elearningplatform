# enrollments/views.py
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import ListView, DetailView
from django.contrib import messages
from django.urls import reverse
from django.utils import timezone
from django.db import models
from django.http import JsonResponse
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework import generics, permissions
from rest_framework.views import APIView

from .models import Enrollment, Progress
from courses.models import Course, Section, Lesson
from .serializers import EnrollmentSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enroll_course(request, course_id):
    """Enroll a user in a course"""
    try:
        course = get_object_or_404(Course, id=course_id)
        
        # Check if course is published
        if not course.is_published:
            return Response({
                'status': 'error',
                'message': 'This course is not available for enrollment'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check enrollment type
        if course.enrollment_type != 'self':
            return Response({
                'status': 'error',
                'message': 'This course requires manual enrollment by the instructor'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check max students limit
        if course.max_students:
            current_enrollments = Enrollment.objects.filter(
                course=course,
                status__in=['active', 'pending']
            ).count()
            if current_enrollments >= course.max_students:
                return Response({
                    'status': 'error',
                    'message': 'Course has reached maximum enrollment capacity'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user is already enrolled
        existing_enrollment = Enrollment.objects.filter(
            user=request.user,
            course=course
        ).first()
        
        if existing_enrollment:
            if existing_enrollment.status == 'dropped':
                # Reactivate dropped enrollment
                existing_enrollment.status = 'active'
                existing_enrollment.save()
                return Response({
                    'status': 'success',
                    'message': 'Course enrollment reactivated',
                    'enrollment': {
                        'id': existing_enrollment.id,
                        'course_id': course.id,
                        'course_title': course.title,
                        'enrolled_at': existing_enrollment.enrolled_at,
                        'status': existing_enrollment.status
                    }
                }, status=status.HTTP_200_OK)
            elif existing_enrollment.status == 'completed':
                return Response({
                    'status': 'error',
                    'message': 'You have already completed this course'
                }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    'status': 'error',
                    'message': 'You are already enrolled in this course',
                    'enrollment': {
                        'id': existing_enrollment.id,
                        'course_id': course.id,
                        'course_title': course.title,
                        'enrolled_at': existing_enrollment.enrolled_at,
                        'status': existing_enrollment.status
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create new enrollment
        enrollment = Enrollment.objects.create(
            user=request.user,
            course=course,
            status='active',
            enrolled_at=timezone.now()
        )
        
        # Create progress records for each lesson
        sections = course.sections.prefetch_related('lessons').all()
        progress_records = []
        
        for section in sections:
            for lesson in section.lessons.all():
                progress_records.append(Progress(
                    enrollment=enrollment,
                    lesson=lesson,
                    completed=False
                ))
        
        if progress_records:
            Progress.objects.bulk_create(progress_records)
        
        return Response({
            'status': 'success',
            'message': 'Successfully enrolled in course',
            'enrollment': {
                'id': enrollment.id,
                'course_id': course.id,
                'course_title': course.title,
                'enrolled_at': enrollment.enrolled_at,
                'status': enrollment.status
            }
        }, status=status.HTTP_201_CREATED)
        
    except Course.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Course not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'Error enrolling in course: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_enrollment(request, course_id):
    """Check if a user is enrolled in a course"""
    try:
        course = get_object_or_404(Course, id=course_id)
        enrollment = Enrollment.objects.filter(
            user=request.user,
            course=course,
            status='active'
        ).exists()
        
        return Response({'enrolled': enrollment}, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@login_required
def unenroll_course(request, course_id):
    course = get_object_or_404(Course, id=course_id)
    enrollment = get_object_or_404(Enrollment, user=request.user, course=course)
    
    if request.method == 'POST':
        enrollment.status = 'dropped'
        enrollment.save()
        messages.success(request, f"You have successfully unenrolled from {course.title}.")
        return redirect('accounts:dashboard')
    
    return render(request, 'enrollments/confirm_unenroll.html', {'course': course})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_lesson_complete(request, lesson_id):
    """Mark a lesson as complete"""
    try:
        lesson = get_object_or_404(Lesson, id=lesson_id)
        course = lesson.section.course
        
        # Check if user is enrolled
        enrollment = get_object_or_404(Enrollment, user=request.user, course=course, status='active')
        
        # Mark lesson as complete
        progress = enrollment.progress.get(lesson=lesson)
        progress.completed = True
        progress.completed_at = timezone.now()
        progress.save()
        
        # Check if all lessons are completed
        total_lessons = course.sections.aggregate(
            total=models.Count('lessons')
        )['total']
        
        completed_lessons = enrollment.progress.filter(
            completed=True
        ).count()
        
        # Update enrollment progress percentage
        enrollment.progress_percentage = (completed_lessons / total_lessons) * 100
        
        # If all lessons are completed, mark the course as completed
        if completed_lessons == total_lessons:
            enrollment.status = 'completed'
            enrollment.completed_at = timezone.now()
        
        enrollment.save()
        
        # Get next lesson
        next_lesson = None
        lessons = list(lesson.section.lessons.all())
        current_index = lessons.index(lesson)
        
        if current_index < len(lessons) - 1:
            next_lesson = lessons[current_index + 1]
            return Response({
                'message': 'Lesson marked as complete',
                'next_lesson': next_lesson.id
            }, status=status.HTTP_200_OK)
        
        # If no next lesson, check for next section
        sections = list(course.sections.all())
        current_section_index = sections.index(lesson.section)
        
        if current_section_index < len(sections) - 1:
            next_section = sections[current_section_index + 1]
            if next_section.lessons.exists():
                next_lesson = next_section.lessons.first()
                return Response({
                    'message': 'Lesson marked as complete',
                    'next_lesson': next_lesson.id
                }, status=status.HTTP_200_OK)
        
        return Response({
            'message': 'Course completed',
            'completed': True
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_course_progress(request, course_id):
    """Get progress details for a course"""
    try:
        course = get_object_or_404(Course, id=course_id)
        enrollment = get_object_or_404(
            Enrollment,
            user=request.user,
            course=course,
            status='active'
        )
        
        # Calculate progress for each section
        section_progress = {}
        for section in course.sections.all():
            total_lessons = section.lessons.count()
            if total_lessons == 0:
                section_progress[section.id] = 0
                continue
            
            completed_lessons = enrollment.progress.filter(
                lesson__section=section,
                completed=True
            ).count()
            
            section_progress[section.id] = (completed_lessons / total_lessons) * 100
        
        return Response({
            'overall_progress': enrollment.progress_percentage,
            'section_progress': section_progress
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_user_enrollments(request):
    """Get all courses a user is enrolled in"""
    try:
        enrollments = Enrollment.objects.filter(
            user=request.user,
            status='active'
        )
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EnrolledCoursesListView(LoginRequiredMixin, ListView):
    template_name = 'enrollments/enrolled_courses.html'
    context_object_name = 'enrollments'
    
    def get_queryset(self):
        return Enrollment.objects.filter(
            user=self.request.user,
            status='active'
        ).select_related('course')
    
    def render_to_response(self, context, **response_kwargs):
        if self.request.headers.get('Accept') == 'application/json':
            enrollments = self.get_queryset()
            data = []
            for enrollment in enrollments:
                course = enrollment.course
                data.append({
                    'id': enrollment.id,
                    'course_id': course.id,
                    'title': course.title,
                    'description': course.description,
                    'thumbnail': course.thumbnail.url if course.thumbnail else None,
                    'thumbnail_url': course.thumbnail.url if course.thumbnail else None,
                    'cover_image': course.cover_image.url if course.cover_image else None,
                    'instructor': course.instructor.username,
                    'category': course.category.name,
                    'difficulty': course.difficulty,
                    'price': str(course.price),
                    'duration_in_weeks': course.duration_in_weeks,
                    'enrolled_at': enrollment.created_at.isoformat(),
                    'status': enrollment.status
                })
            return JsonResponse(data, safe=False)
        return super().render_to_response(context, **response_kwargs)

class CourseProgressView(LoginRequiredMixin, DetailView):
    model = Enrollment
    template_name = 'enrollments/course_progress.html'
    context_object_name = 'enrollment'
    
    def get_object(self):
        course_id = self.kwargs.get('course_id')
        course = get_object_or_404(Course, id=course_id)
        return get_object_or_404(Enrollment, user=self.request.user, course=course)
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        enrollment = self.get_object()
        course = enrollment.course
        
        context['course'] = course
        context['modules'] = course.sections.all()
        
        # Calculate progress for each section
        section_progress = {}
        for section in Section.objects.filter(module__course=course):
            total_lessons = Lesson.objects.filter(section=section).count()
            if total_lessons == 0:
                section_progress[section.id] = 0
                continue
                
            completed_lessons = Progress.objects.filter(
                enrollment=enrollment,
                lesson__section=section,
                completed=True
            ).count()
            
            section_progress[section.id] = (completed_lessons / total_lessons) * 100
            
        context['section_progress'] = section_progress
        return context

class CourseCompletionView(LoginRequiredMixin, DetailView):
    model = Course
    template_name = 'enrollments/course_completion.html'
    context_object_name = 'course'
    
    def get_object(self):
        course_id = self.kwargs.get('course_id')
        return get_object_or_404(Course, id=course_id)
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        course = self.get_object()
        user = self.request.user
        
        enrollment = get_object_or_404(Enrollment, user=user, course=course)
        context['enrollment'] = enrollment
        
        # Suggest related courses
        context['related_courses'] = Course.objects.filter(
            category=course.category,
            is_published=True
        ).exclude(id=course.id)[:3]
        
        return context

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_enrollment_status(request, course_id):
    """Check if a user is enrolled in a specific course"""
    try:
        course = get_object_or_404(Course, id=course_id)
        
        # Check if the user is enrolled and not dropped
        is_enrolled = Enrollment.objects.filter(
            user=request.user,
            course=course,
            status__in=['active', 'completed', 'pending']
        ).exists()
        
        # Get enrollment if exists
        enrollment = None
        if is_enrolled:
            enrollment = Enrollment.objects.get(
                user=request.user,
                course=course
            )
        
        return Response({
            'is_enrolled': is_enrolled,
            'enrollment_status': enrollment.status if enrollment else None,
            'progress_percentage': enrollment.progress_percentage if enrollment else 0
        })
        
    except Exception as e:
        return Response({
            'is_enrolled': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

class EnrollmentListView(ListView):
    """View to list all enrollments for the current user"""
    model = Enrollment
    template_name = 'enrollments/enrollment_list.html'
    context_object_name = 'enrollments'
    
    def get_queryset(self):
        return Enrollment.objects.filter(user=self.request.user).order_by('-enrolled_at')
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['active_enrollments'] = self.get_queryset().filter(status='active')
        context['completed_enrollments'] = self.get_queryset().filter(status='completed')
        context['dropped_enrollments'] = self.get_queryset().filter(status='dropped')
        return context

class EnrollmentDetailView(LoginRequiredMixin, DetailView):
    """View for seeing details of a specific enrollment"""
    model = Enrollment
    template_name = 'enrollments/enrollment_detail.html'
    context_object_name = 'enrollment'
    
    def get_queryset(self):
        # Ensure users can only view their own enrollments
        return Enrollment.objects.filter(user=self.request.user)
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        enrollment = self.get_object()
        context['course'] = enrollment.course
        # Get progress data
        total_lessons = Lesson.objects.filter(section__module__course=enrollment.course).count()
        completed_lessons = Progress.objects.filter(
            enrollment=enrollment, 
            completed=True
        ).count()
        context['progress'] = {
            'completed_lessons': completed_lessons,
            'total_lessons': total_lessons,
            'percentage': (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
        }
        return context

class EnrollmentCreateView(LoginRequiredMixin, DetailView):
    """View for creating a new enrollment"""
    model = Course
    template_name = 'enrollments/enrollment_create.html'
    context_object_name = 'course'
    pk_url_kwarg = 'course_id'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        course = self.get_object()
        context['is_enrolled'] = Enrollment.objects.filter(
            user=self.request.user, 
            course=course,
            status__in=['active', 'completed']
        ).exists()
        return context
    
    def post(self, request, *args, **kwargs):
        course = self.get_object()
        
        # Check if already enrolled
        existing_enrollment = Enrollment.objects.filter(
            user=request.user,
            course=course
        ).first()
        
        if existing_enrollment:
            if existing_enrollment.status == 'dropped':
                # Reactivate enrollment
                existing_enrollment.status = 'active'
                existing_enrollment.save()
                messages.success(request, f"Your enrollment in {course.title} has been reactivated.")
            else:
                messages.info(request, f"You are already enrolled in {course.title}.")
            return redirect('enrollments:enrollment_detail', pk=existing_enrollment.pk)
        
        # Create new enrollment
        enrollment = Enrollment.objects.create(
            user=request.user,
            course=course,
            status='active',
            enrolled_at=timezone.now()
        )
        
        messages.success(request, f"You have successfully enrolled in {course.title}.")
        return redirect('enrollments:enrollment_detail', pk=enrollment.pk)

class EnrollmentCancelView(LoginRequiredMixin, DetailView):
    """View for cancelling/dropping an enrollment"""
    model = Enrollment
    template_name = 'enrollments/enrollment_cancel.html'
    context_object_name = 'enrollment'
    
    def get_queryset(self):
        # Ensure users can only cancel their own enrollments
        return Enrollment.objects.filter(user=self.request.user)
    
    def post(self, request, *args, **kwargs):
        enrollment = self.get_object()
        enrollment.status = 'dropped'
        enrollment.save()
        
        messages.success(request, f"You have successfully unenrolled from {enrollment.course.title}.")
        return redirect('enrollments:enrollment_list')