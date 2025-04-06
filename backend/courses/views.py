from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy
from django.contrib import messages
from django.db.models import Q, Avg, Count, Prefetch
from django.conf import settings
from django.db import models
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from .models import Course, Category, Section, Lesson, Review, Module, UserProgress, Quiz
from .forms import CourseForm, SectionForm, LessonForm, ReviewForm
from accounts.models import User
from enrollments.models import Enrollment, Progress
from .serializers import (
    CourseSerializer,
    ModuleSerializer,
    SectionSerializer,
    LessonSerializer,
    UserProgressSerializer,
    ReviewSerializer,
    CourseListSerializer
)
from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination
from django.http import Http404
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
import json

class CourseListView(ListView):
    model = Course
    template_name = 'courses/course_list.html'
    context_object_name = 'courses'
    paginate_by = 9
    
    def get_queryset(self):
        queryset = Course.objects.filter(is_published=True)
        category = self.request.GET.get('category')
        search = self.request.GET.get('search')
        difficulty = self.request.GET.get('difficulty')
        
        if category:
            queryset = queryset.filter(category__id=category)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(description__icontains=search)
            )
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
            
        return queryset
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categories'] = Category.objects.all()
        context['selected_category'] = self.request.GET.get('category', '')
        context['search_query'] = self.request.GET.get('search', '')
        context['selected_difficulty'] = self.request.GET.get('difficulty', '')
        return context

    def render_to_response(self, context, **response_kwargs):
        if self.request.headers.get('Accept') == 'application/json' or self.request.path.startswith('/api/'):
            courses = self.get_queryset()
            data = []
            for course in courses:
                data.append({
                    'id': course.id,
                    'title': course.title,
                    'description': course.description,
                    'thumbnail': course.thumbnail.url if course.thumbnail else None,
                    'cover_image': course.cover_image.url if course.cover_image else None,
                    'instructor': course.instructor.username,
                    'category': course.category.name,
                    'difficulty': course.difficulty,
                    'price': str(course.price),
                    'duration_in_weeks': course.duration_in_weeks,
                    'created_at': course.created_at.isoformat(),
                    'updated_at': course.updated_at.isoformat(),
                })
            return JsonResponse(data, safe=False)
        return super().render_to_response(context, **response_kwargs)

class CourseDetailView(DetailView):
    model = Course
    template_name = 'courses/course_detail.html'
    context_object_name = 'course'
    pk_url_kwarg = 'course_id'
    
    def get_object(self, queryset=None):
        """Get the course object and handle errors appropriately"""
        try:
            # Get the course ID from the URL
            course_id = self.kwargs.get(self.pk_url_kwarg)
            if not course_id:
                raise Http404("Course ID not provided")
            
            # Try to get the course with proper relationships
            course = Course.objects.select_related(
                'instructor', 
                'category'
            ).prefetch_related(
                'modules',
                'modules__sections',
                'modules__sections__lessons',
                'reviews__user',
                'enrollments'
            ).get(id=course_id)
            
            # Check if course is published or user is staff/instructor
            if not course.is_published and not (
                self.request.user.is_staff or 
                (self.request.user.is_authenticated and self.request.user == course.instructor)
            ):
                raise Http404("Course not found or not available")
                
            return course
            
        except Course.DoesNotExist:
            if self.request.headers.get('Accept') == 'application/json' or self.request.path.startswith('/api/'):
                return JsonResponse({
                    'error': 'Course not found',
                    'message': 'The requested course does not exist'
                }, status=404)
            raise Http404("Course not found")
        except Http404 as e:
            if self.request.headers.get('Accept') == 'application/json' or self.request.path.startswith('/api/'):
                return JsonResponse({
                    'error': str(e),
                    'message': 'Course not found or not available'
                }, status=404)
            raise
        except Exception as e:
            if self.request.headers.get('Accept') == 'application/json' or self.request.path.startswith('/api/'):
                return JsonResponse({
                    'error': 'Server error',
                    'message': str(e)
                }, status=500)
            raise

    def render_to_response(self, context, **response_kwargs):
        """Handle both API and web responses"""
        if self.request.headers.get('Accept') == 'application/json' or self.request.path.startswith('/api/'):
            try:
                course = self.get_object()
                if isinstance(course, JsonResponse):  # If get_object returned an error response
                    return course
                    
                data = {
                    'id': course.id,
                    'title': course.title,
                    'description': course.description,
                    'thumbnail': course.thumbnail.url if course.thumbnail else None,
                    'cover_image': course.cover_image.url if course.cover_image else None,
                    'instructor': {
                        'id': course.instructor.id,
                        'username': course.instructor.username,
                        'name': course.instructor.get_full_name()
                    },
                    'category': {
                        'id': course.category.id,
                        'name': course.category.name
                    },
                    'difficulty': course.difficulty,
                    'price': str(course.price),
                    'duration_in_weeks': course.duration_in_weeks,
                    'created_at': course.created_at.isoformat(),
                    'updated_at': course.updated_at.isoformat(),
                    'modules': [{
                        'id': module.id,
                        'title': module.title,
                        'order': module.order,
                        'sections': [{
                            'id': section.id,
                            'title': section.title,
                            'order': section.order,
                            'lessons': [{
                                'id': lesson.id,
                                'title': lesson.title,
                                'order': lesson.order,
                                'content_type': lesson.content_type,
                                'duration': lesson.duration
                            } for lesson in section.lessons.all()]
                        } for section in module.sections.all()]
                    } for module in course.modules.all()],
                    'reviews': [{
                        'id': review.id,
                        'user': review.user.username,
                        'rating': review.rating,
                        'comment': review.comment,
                        'created_at': review.created_at.isoformat()
                    } for review in course.reviews.all()],
                    'avg_rating': course.reviews.aggregate(Avg('rating'))['rating__avg'] or 0,
                    'total_students': course.enrollments.filter(status='active').count(),
                    'is_published': course.is_published
                }
                
                if self.request.user.is_authenticated:
                    enrollment = Enrollment.objects.filter(
                        user=self.request.user,
                        course=course
                    ).first()
                    
                    if enrollment:
                        data['enrollment'] = {
                            'id': enrollment.id,
                            'status': enrollment.status,
                            'progress_percentage': enrollment.progress_percentage,
                            'enrolled_at': enrollment.enrolled_at.isoformat()
                        }
                    
                    user_review = Review.objects.filter(
                        user=self.request.user,
                        course=course
                    ).first()
                    
                    if user_review:
                        data['user_review'] = {
                            'id': user_review.id,
                            'rating': user_review.rating,
                            'comment': user_review.comment,
                            'created_at': user_review.created_at.isoformat()
                        }
                
                return JsonResponse(data)
            except Exception as e:
                return JsonResponse({
                    'error': 'Server error',
                    'message': str(e)
                }, status=500)
        return super().render_to_response(context, **response_kwargs)

@login_required
def create_review(request, course_id):
    course = get_object_or_404(Course, id=course_id)
    
    # Check if user is enrolled in the course
    if not Enrollment.objects.filter(user=request.user, course=course).exists():
        messages.error(request, "You must be enrolled in this course to leave a review.")
        return redirect('courses:course_detail', course_id=course_id)
    
    # Check if user already reviewed the course
    existing_review = Review.objects.filter(user=request.user, course=course).first()
    
    if request.method == 'POST':
        form = ReviewForm(request.POST, instance=existing_review)
        if form.is_valid():
            review = form.save(commit=False)
            review.user = request.user
            review.course = course
            review.save()
            messages.success(request, "Your review has been submitted successfully.")
            return redirect('courses:course_detail', course_id=course_id)
    else:
        form = ReviewForm(instance=existing_review)
    
    return render(request, 'courses/create_review.html', {
        'form': form,
        'course': course,
        'existing_review': existing_review
    })

class SectionDetailView(LoginRequiredMixin, DetailView):
    model = Section
    template_name = 'courses/section_detail.html'
    context_object_name = 'section'
    pk_url_kwarg = 'section_id'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        section = self.get_object()
        course = section.course
        user = self.request.user
        
        # Check if user is enrolled in the course
        if not Enrollment.objects.filter(user=user, course=course).exists():
            messages.error(self.request, "You must be enrolled in this course to view this section.")
            return redirect('courses:course_detail', course_id=course.id)
        
        context['course'] = course
        context['lessons'] = section.lessons.all()
        context['enrollment'] = Enrollment.objects.get(user=user, course=course)
        
        # Navigation
        sections = list(course.sections.all())
        current_index = sections.index(section)
        
        if current_index > 0:
            context['prev_section'] = sections[current_index - 1]
        if current_index < len(sections) - 1:
            context['next_section'] = sections[current_index + 1]
            
        return context

class LessonDetailView(LoginRequiredMixin, DetailView):
    model = Lesson
    template_name = 'courses/lesson_detail.html'
    context_object_name = 'lesson'
    pk_arg = 'lesson_id'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        lesson = self.get_object()
        section = lesson.section
        course = section.course
        user = self.request.user
        
        # Check if user is enrolled in the course
        enrollment = get_object_or_404(Enrollment, user=user, course=course)
        
        context['section'] = section
        context['course'] = course
        
        # Mark section as completed
        progress, created = Progress.objects.get_or_create(
            enrollment=enrollment,
            section=section
        )
        
        # Navigation
        lessons = list(section.lessons.all())
        current_index = lessons.index(lesson)
        
        if current_index > 0:
            context['prev_lesson'] = lessons[current_index - 1]
        if current_index < len(lessons) - 1:
            context['next_lesson'] = lessons[current_index + 1]
            
        return context

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        """
        Filter courses based on user type and request:
        - Students see only published courses
        - Instructors see their own courses in instructor views
        - Staff/admin see all courses
        """
        queryset = Course.objects.prefetch_related(
            'modules',
            'modules__sections',
            'modules__sections__lessons',
            'tags',
            'reviews'
        ).select_related('instructor', 'category')
        
        # If it's an instructor accessing their courses
        if self.action == 'instructor_courses':
            return queryset.filter(instructor=self.request.user)
        
        # For regular course listing (students), show only published courses
        if self.action == 'list':
            return queryset.filter(is_published=True)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def instructor_courses(self, request):
        """Get courses created by the instructor"""
        if request.user.user_type != 'instructor':
            return Response(
                {'message': 'Only instructors can access this endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        courses = self.get_queryset()
        serializer = self.get_serializer(courses, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update course publication status"""
        try:
            course = self.get_object()
            
            # Check if user is the course instructor
            if course.instructor != request.user and not request.user.is_staff:
                return Response(
                    {'message': 'You do not have permission to modify this course'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get status from request data
            new_status = request.data.get('status')
            if new_status not in ['draft', 'published']:
                return Response(
                    {'message': 'Invalid status value. Must be "draft" or "published"'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update course status
            course.status = new_status
            course.is_published = new_status == 'published'
            course.save()
            
            # Serialize and return the updated course
            serializer = self.get_serializer(course)
            serialized_data = {
                'id': course.id,
                'title': course.title,
                'description': course.description,
                'status': course.status,
                'is_published': course.is_published,
                'price': str(course.price),
                'created_at': course.created_at.isoformat(),
                'thumbnail_url': course.thumbnail.url if course.thumbnail else None,
                'cover_image_url': course.cover_image.url if course.cover_image else None,
                'instructor': {
                    'id': course.instructor.id,
                    'username': course.instructor.username,
                    'name': course.instructor.get_full_name()
                },
                'category': {
                    'id': course.category.id,
                    'name': course.category.name
                } if course.category else None,
                'difficulty_level': course.difficulty,
                'total_students': course.enrollments.filter(status='active').count(),
                'total_lessons': sum(section.lessons.count() for section in course.sections.all())
            }
            
            return Response({
                'status': 'success',
                'message': f'Course {new_status} successfully',
                'course': serialized_data
            })
            
        except Course.DoesNotExist:
            return Response(
                {'message': 'Course not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Error updating course status: {str(e)}")
            return Response(
                {'message': f'Error updating course status: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, *args, **kwargs):
        """Delete a course"""
        course = self.get_object()
        
        # Check if user is the course instructor
        if course.instructor != request.user and not request.user.is_staff:
            return Response(
                {'message': 'You do not have permission to delete this course'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            course.delete()
            return Response(
                {'message': 'Course deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
        except Exception as e:
            return Response(
                {'message': f'Error deleting course: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def enroll(self, request, pk=None):
        try:
            course = self.get_object()
            user = request.user
            
            # Check if course exists and is published
            if not course.is_published:
                return Response(
                    {'message': 'This course is not available for enrollment.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if already enrolled
            enrollment = Enrollment.objects.filter(user=user, course=course).first()
            if enrollment:
                if enrollment.status == 'active':
                    return Response(
                        {'message': 'You are already enrolled in this course'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                elif enrollment.status == 'dropped':
                    # Reactivate enrollment
                    enrollment.status = 'active'
                    enrollment.save()
                    return Response(
                        {'message': 'Your enrollment has been reactivated'},
                        status=status.HTTP_200_OK
                    )
            
            # Create new enrollment
            enrollment = Enrollment.objects.create(
                user=user,
                course=course,
                status='active'
            )
            
            # Create progress records for all lessons
            lessons = Lesson.objects.filter(section__course=course)
            Progress.objects.bulk_create([
                Progress(
                    user=user,
                    lesson=lesson,
                    enrollment=enrollment,
                    completed=False
                ) for lesson in lessons
            ])
            
            return Response(
                {'message': 'Successfully enrolled in the course'},
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            print(f"Error in enrollment: {str(e)}")
            return Response(
                {'message': 'An error occurred during enrollment'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def enrollment_status(self, request, pk=None):
        try:
            course = self.get_object()
            
            # If user is not authenticated, they're not enrolled
            if not request.user.is_authenticated:
                return Response({'is_enrolled': False})
            
            # Check if user is enrolled
            is_enrolled = Enrollment.objects.filter(
                user=request.user,
                course=course,
                status='active'
            ).exists()
            
            return Response({
                'is_enrolled': is_enrolled
            })
            
        except Exception as e:
            print(f"Error checking enrollment status: {str(e)}")
            return Response(
                {'message': 'Failed to check enrollment status'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def reviews(self, request, pk=None):
        course = self.get_object()
        reviews = course.reviews.all()
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_review(self, request, pk=None):
        course = self.get_object()
        user = request.user
        
        # Check if user has already reviewed
        if course.reviews.filter(user=user).exists():
            return Response({'detail': 'Already reviewed'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = ReviewSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(course=course, user=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SectionViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows sections to be viewed or edited.
    """
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        course_id = self.request.data.get('course')
        course = get_object_or_404(Course, id=course_id)
        if course.instructor != self.request.user:
            raise permissions.PermissionDenied("You are not the instructor of this course")
        serializer.save()

class LessonViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows lessons to be viewed or edited.
    """
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        section_id = self.request.data.get('section')
        section = get_object_or_404(Section, id=section_id)
        if section.course.instructor != self.request.user:
            raise permissions.PermissionDenied("You are not the instructor of this course")
        serializer.save()

@login_required
def mark_lesson_complete(request, lesson_id):
    lesson = get_object_or_404(Lesson, id=lesson_id)
    enrollment = get_object_or_404(Enrollment, user=request.user, course=lesson.section.course)
    
    # Create or update progress
    progress, created = Progress.objects.get_or_create(
        enrollment=enrollment,
        lesson=lesson,
        defaults={'completed': True, 'completed_at': timezone.now()}
    )
    
    if not created:
        progress.completed = True
        progress.completed_at = timezone.now()
        progress.save()
    
    return JsonResponse({
        'status': 'success',
        'message': 'Lesson marked as complete',
        'data': {
            'lesson_id': lesson_id,
            'completed': True,
            'completed_at': progress.completed_at.isoformat()
        }
    })

class EnrolledCoursesAPIView(generics.ListAPIView):
    """API endpoint to list all courses the user is enrolled in"""
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = PageNumberPagination

    def get_queryset(self):
        """Return courses that the user is enrolled in"""
        return Course.objects.filter(
            enrollments__user=self.request.user,
            enrollments__status='active'
        ).select_related(
            'instructor',
            'category'
        ).prefetch_related(
            'modules',
            'modules__sections',
            'modules__sections__lessons'
        ).distinct()

    def list(self, request, *args, **kwargs):
        try:
            queryset = self.get_queryset()
            page = self.paginate_queryset(queryset)
            
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                response = self.get_paginated_response(serializer.data)
            else:
                serializer = self.get_serializer(queryset, many=True)
                response = Response(serializer.data)

            # Add enrollment data to each course
            for course_data in response.data['results'] if page is not None else response.data:
                enrollment = Enrollment.objects.filter(
                    user=request.user,
                    course_id=course_data['id']
                ).first()
                
                if enrollment:
                    course_data['enrollment'] = {
                        'id': enrollment.id,
                        'status': enrollment.status,
                        'enrolled_at': enrollment.enrolled_at,
                        'progress_percentage': enrollment.progress_percentage
                    }
                    
                    # Add progress data
                    progress_data = Progress.objects.filter(
                        enrollment=enrollment
                    ).select_related('lesson').values(
                        'lesson_id',
                        'completed',
                        'completed_at'
                    )
                    
                    # Calculate total lessons across all modules and sections
                    course = queryset.get(id=course_data['id'])
                    total_lessons = sum(
                        section.lessons.count()
                        for module in course.modules.all()
                        for section in module.sections.all()
                    )
                    
                    course_data['progress'] = {
                        'completed_lessons': len([p for p in progress_data if p['completed']]),
                        'total_lessons': total_lessons,
                        'lessons': {p['lesson_id']: {
                            'completed': p['completed'],
                            'completed_at': p['completed_at']
                        } for p in progress_data}
                    }

            return response

        except Exception as e:
            print(f"Error in EnrolledCoursesAPIView: {str(e)}")
            return Response({
                'error': 'Failed to fetch enrolled courses',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CourseListAPIView(generics.ListAPIView):
    serializer_class = CourseSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        print("\n=== CourseListAPIView.get_queryset ===")
        queryset = Course.objects.filter(is_published=True).select_related(
            'instructor',
            'category'
        ).prefetch_related(
            'modules',
            'modules__sections',
            'modules__sections__lessons',
            'enrollments'
        ).order_by('-created_at')
        
        print(f"Found {queryset.count()} published courses")
        
        # Apply filters
        category = self.request.query_params.get('category', None)
        search = self.request.query_params.get('search', None)
        difficulty = self.request.query_params.get('difficulty', None)
        price_min = self.request.query_params.get('price_min', None)
        price_max = self.request.query_params.get('price_max', None)
        
        if category:
            queryset = queryset.filter(category__id=category)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(description__icontains=search) |
                Q(instructor__username__icontains=search)
            )
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        if price_min is not None:
            queryset = queryset.filter(price__gte=float(price_min))
        if price_max is not None:
            queryset = queryset.filter(price__lte=float(price_max))
        
        print(f"After applying filters: {queryset.count()} courses")
        return queryset

    def list(self, request, *args, **kwargs):
        try:
            print("\n=== CourseListAPIView.list ===")
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            
            # Return the serialized data directly as a list
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error in CourseListAPIView.list: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {
                    'error': 'Failed to fetch courses',
                    'message': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CreateCourseAPIView(generics.CreateAPIView):
    """API endpoint to create a new course"""
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        # Ensure the current user is set as the instructor
        serializer.save(instructor=self.request.user, status='draft')
        
    def create(self, request, *args, **kwargs):
        print("\n=== Creating New Course ===")
        print(f"User: {request.user.username} (ID: {request.user.id})")
        print(f"Request Data: {request.data}")
        
        # Handle the file upload (thumbnail)
        thumbnail = request.FILES.get('thumbnail')
        
        # Prepare the data
        data = request.data.copy()
        print(f"Processed Data: {data}")
        
        try:
            # Get the category
            category_id = int(data.get('category'))
            category = Category.objects.get(id=category_id)
            print(f"Category: {category.name} (ID: {category.id})")
            
            # Create a new course with the provided data
            course = Course.objects.create(
                title=data.get('title'),
                description=data.get('description'),
                price=float(data.get('price', 0)),
                category=category,
                instructor=request.user,
                difficulty=data.get('level', 'beginner'),
                duration_in_weeks=int(data.get('duration', 1)),
                status='draft'  # Default to draft
            )
            print(f"Created course: {course.title} (ID: {course.id})")
            
            # Handle thumbnail if provided
            if thumbnail:
                course.thumbnail = thumbnail
                course.save()
                print("Thumbnail uploaded successfully")
            
            # Return success response with course details
            response_data = {
                'id': course.id,
                'title': course.title,
                'instructor': request.user.username,
                'status': course.status,
                'message': 'Course created successfully'
            }
            print(f"Response data: {response_data}")
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except (ValueError, Category.DoesNotExist) as e:
            error_message = f'Invalid category ID: {str(e)}'
            print(f"Error: {error_message}")
            return Response(
                {'message': error_message},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            error_message = f'Error creating course: {str(e)}'
            print(f"Error: {error_message}")
            return Response(
                {'message': error_message},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class InstructorCoursesAPIView(generics.ListAPIView):
    """API endpoint to list all courses created by the logged-in instructor"""
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        print("\n=== InstructorCoursesAPIView.get_queryset ===")
        print(f"User: {self.request.user.username} (ID: {self.request.user.id})")
        print(f"Is authenticated: {self.request.user.is_authenticated}")
        print(f"User type: {getattr(self.request.user, 'user_type', 'unknown')}")
        print(f"Auth header: {self.request.headers.get('Authorization', 'Not present')}")
        
        if not self.request.user.is_authenticated:
            print("Error: User is not authenticated")
            return Course.objects.none()
        
        if not hasattr(self.request.user, 'user_type'):
            print("Error: User has no user_type attribute")
            return Course.objects.none()
        
        if self.request.user.user_type != 'instructor':
            print(f"Error: User type '{self.request.user.user_type}' is not instructor")
            return Course.objects.none()
            
        queryset = Course.objects.filter(
            instructor=self.request.user
        ).select_related(
            'instructor',
            'category'
        ).prefetch_related(
            'modules',
            'modules__sections',
            'modules__sections__lessons',
            'enrollments'
        ).order_by('-created_at')
        
        print(f"Found {queryset.count()} courses for instructor")
        return queryset

    def list(self, request, *args, **kwargs):
        try:
            print("\n=== InstructorCoursesAPIView.list ===")
            print(f"User: {request.user.username} (ID: {request.user.id})")
            print(f"Is authenticated: {request.user.is_authenticated}")
            print(f"User type: {getattr(request.user, 'user_type', 'unknown')}")
            print(f"Auth header: {request.headers.get('Authorization', 'Not present')}")
            
            if not request.user.is_authenticated:
                print("Error: User is not authenticated")
                return Response(
                    {
                        'status': 'error',
                        'message': 'Authentication required'
                    },
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            if not hasattr(request.user, 'user_type'):
                print("Error: User has no user_type attribute")
                return Response(
                    {
                        'status': 'error',
                        'message': 'User type not found'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if request.user.user_type != 'instructor':
                print(f"Error: User type '{request.user.user_type}' is not instructor")
                return Response(
                    {
                        'status': 'error',
                        'message': 'Only instructors can access this endpoint'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get and serialize the courses
            queryset = self.get_queryset()
            print(f"Found {queryset.count()} courses for instructor")
            
            serializer = self.get_serializer(queryset, many=True)
            serialized_data = serializer.data
            print("Successfully serialized courses")
            
            # Process each course to include additional data
            courses_data = []
            for course in serialized_data:
                try:
                    course_obj = queryset.get(id=course['id'])
                    course_data = {
                        'id': course['id'],
                        'title': course['title'],
                        'description': course.get('description', ''),
                        'status': course.get('status', 'draft'),
                        'is_published': course.get('is_published', False),
                        'price': str(course.get('price', '0.00')),
                        'created_at': course.get('created_at'),
                        'thumbnail_url': course.get('thumbnail'),
                        'cover_image_url': course.get('cover_image'),
                        'instructor': {
                            'id': request.user.id,
                            'username': request.user.username,
                            'name': request.user.get_full_name() or request.user.username
                        },
                        'category': course.get('category'),
                        'difficulty_level': course.get('difficulty', 'beginner'),
                        'total_students': course_obj.enrollments.filter(status='active').count(),
                        'total_lessons': sum(
                            section.lessons.count() 
                            for module in course_obj.modules.all() 
                            for section in module.sections.all()
                        )
                    }
                    courses_data.append(course_data)
                    print(f"Successfully processed course {course['id']}")
                except Exception as e:
                    print(f"Error processing course {course.get('id', 'unknown')}: {str(e)}")
                    continue
            
            print(f"Successfully processed {len(courses_data)} courses")
            return Response({
                'status': 'success',
                'message': 'Courses retrieved successfully',
                'courses': courses_data
            })
            
        except Exception as e:
            print(f"Error in InstructorCoursesAPIView: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {
                    'status': 'error',
                    'message': 'Failed to fetch instructor courses',
                    'error': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CourseStatusUpdateAPIView(generics.UpdateAPIView):
    """API endpoint to update a course's status (publish/unpublish)"""
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'
    
    def get_queryset(self):
        # Only allow updating courses where the user is the instructor
        return Course.objects.filter(instructor=self.request.user)
    
    def update(self, request, *args, **kwargs):
        try:
            course = self.get_object()
            status_value = request.data.get('status')
            
            # Validate the status value
            if status_value not in ['draft', 'published']:
                return Response(
                    {
                        'status': 'error',
                        'message': 'Invalid status value. Must be "draft" or "published"'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Update the course status
            course.is_published = (status_value == 'published')
            course.save()
            
            serializer = self.get_serializer(course)
            return Response(
                {
                    'status': 'success',
                    'message': f'Course {status_value} successfully',
                    'course': serializer.data
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {
                    'status': 'error',
                    'message': f'Error updating course status: {str(e)}'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CategoryListAPIView(generics.ListAPIView):
    """API endpoint to list all categories"""
    queryset = Category.objects.all()
    permission_classes = [AllowAny]
    
    def list(self, request, *args, **kwargs):
        categories = self.get_queryset()
        data = [
            {
                'id': category.id,
                'name': category.name,
                'description': category.description
            }
            for category in categories
        ]
        return Response(data)

class InstructorCourseDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """API endpoint to retrieve, update, or delete a specific course"""
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only allow access to courses where the logged-in user is the instructor
        return Course.objects.filter(instructor=self.request.user)
    
    def retrieve(self, request, *args, **kwargs):
        """Override to include modules and sections data"""
        try:
            course = self.get_object()
            serializer = self.get_serializer(course)
            data = serializer.data
            
            # Add modules data
            modules_data = []
            for module in course.modules.all().order_by('order'):
                sections_data = []
                for section in module.sections.all().order_by('order'):
                    sections_data.append({
                        'id': section.id,
                        'title': section.title,
                        'description': section.description,
                        'content_type': section.content_type,
                        'video_url': section.video_url,
                        'pdf_url': section.pdf_url,
                        'order': section.order
                    })
                
                modules_data.append({
                    'id': module.id,
                    'title': module.title,
                    'description': module.description,
                    'order': module.order,
                    'sections': sections_data
                })
            
            data['modules'] = modules_data
            
            return Response(data)
        except Exception as e:
            return Response(
                {'message': f'Error retrieving course: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def update(self, request, *args, **kwargs):
        print("\n=== Updating Course ===")
        print(f"User: {request.user.username} (ID: {request.user.id})")
        print(f"Course ID: {kwargs.get('pk')}")
        print(f"Request Data: {request.data}")
        
        try:
            course = self.get_object()
            
            # Handle the file upload (thumbnail)
            thumbnail = request.FILES.get('thumbnail')
            
            # Update course fields
            course.title = request.data.get('title', course.title)
            course.description = request.data.get('description', course.description)
            course.price = float(request.data.get('price', course.price))
            course.difficulty = request.data.get('level', course.difficulty)
            course.duration_in_weeks = int(request.data.get('duration', course.duration_in_weeks))
            
            # Update category if provided
            category_id = request.data.get('category')
            if category_id:
                try:
                    category = Category.objects.get(id=category_id)
                    course.category = category
                except Category.DoesNotExist:
                    return Response(
                        {'message': f'Invalid category ID: {category_id}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Handle thumbnail if provided
            if thumbnail:
                course.thumbnail = thumbnail
            
            course.save()
            print(f"Course updated successfully: {course.title}")
            
            # ===== Handle modules data =====
            modules_json = request.data.get('modules_json') or request.data.get('modules')
            if modules_json:
                try:
                    # If modules_json is a string, parse it
                    if isinstance(modules_json, str):
                        modules_data = json.loads(modules_json)
                    else:
                        modules_data = modules_json
                    
                    print(f"Processing {len(modules_data)} modules")
                    
                    # Get existing modules
                    existing_modules = list(course.modules.all())
                    existing_module_ids = [module.id for module in existing_modules]
                    
                    # Track processed module IDs to determine which ones to delete
                    processed_module_ids = []
                    
                    # Process each module
                    for module_data in modules_data:
                        module_id = module_data.get('id')
                        
                        # Check if this is an existing module
                        if module_id and Module.objects.filter(id=module_id, course=course).exists():
                            # Update existing module
                            module = Module.objects.get(id=module_id, course=course)
                            module.title = module_data.get('title', module.title)
                            module.description = module_data.get('description', module.description)
                            module.order = module_data.get('order', module.order)
                            module.save()
                            
                            # Track that we processed this module
                            processed_module_ids.append(module_id)
                            
                            # Process sections for this module
                            if 'sections' in module_data:
                                # Get existing sections
                                existing_sections = list(module.sections.all())
                                existing_section_ids = [section.id for section in existing_sections]
                                processed_section_ids = []
                                
                                for section_data in module_data['sections']:
                                    section_id = section_data.get('id')
                                    
                                    # Check if this is an existing section
                                    if section_id and Section.objects.filter(id=section_id, module=module).exists():
                                        # Update existing section
                                        section = Section.objects.get(id=section_id, module=module)
                                        section.title = section_data.get('title', section.title)
                                        section.description = section_data.get('description', section.description)
                                        section.order = section_data.get('order', section.order)
                                        section.content_type = section_data.get('content_type', section.content_type)
                                        section.video_url = section_data.get('video_url', section.video_url)
                                        section.pdf_url = section_data.get('pdf_url', section.pdf_url)
                                        section.save()
                                        
                                        # Track that we processed this section
                                        processed_section_ids.append(section_id)
                                    else:
                                        # Create new section
                                        section = Section.objects.create(
                                            module=module,
                                            title=section_data.get('title', f'Section {len(processed_section_ids) + 1}'),
                                            description=section_data.get('description', ''),
                                            order=section_data.get('order', len(processed_section_ids) + 1),
                                            content_type=section_data.get('content_type', 'video'),
                                            video_url=section_data.get('video_url', ''),
                                            pdf_url=section_data.get('pdf_url', '')
                                        )
                                        processed_section_ids.append(section.id)
                                
                                # Delete sections that weren't in the update
                                for section in existing_sections:
                                    if section.id not in processed_section_ids:
                                        section.delete()
                        else:
                            # Create new module
                            module = Module.objects.create(
                                course=course,
                                title=module_data.get('title', f'Module {len(processed_module_ids) + 1}'),
                                description=module_data.get('description', ''),
                                order=module_data.get('order', len(processed_module_ids) + 1)
                            )
                            
                            # Track that we processed this module
                            processed_module_ids.append(module.id)
                            
                            # Process sections for this module
                            if 'sections' in module_data:
                                for idx, section_data in enumerate(module_data['sections']):
                                    # Create new section
                                    Section.objects.create(
                                        module=module,
                                        title=section_data.get('title', f'Section {idx + 1}'),
                                        description=section_data.get('description', ''),
                                        order=section_data.get('order', idx + 1),
                                        content_type=section_data.get('content_type', 'video'),
                                        video_url=section_data.get('video_url', ''),
                                        pdf_url=section_data.get('pdf_url', '')
                                    )
                    
                    # Delete modules that weren't in the update
                    for module in existing_modules:
                        if module.id not in processed_module_ids:
                            module.delete()
                    
                    print(f"Successfully processed modules and sections")
                    
                except Exception as e:
                    print(f"Error processing modules: {str(e)}")
                    # Continue with the update even if modules processing fails
                    
            # ===== Handle quizzes data =====
            quizzes_json = request.data.get('quizzes_json') or request.data.get('quizzes')
            if quizzes_json:
                try:
                    # If quizzes_json is a string, parse it
                    if isinstance(quizzes_json, str):
                        quizzes_data = json.loads(quizzes_json)
                    else:
                        quizzes_data = quizzes_json
                    
                    print(f"Processing {len(quizzes_data)} quizzes")
                    
                    from .models import Quiz, Lesson
                    
                    # Get existing quizzes
                    existing_quizzes = []
                    for module in course.modules.all():
                        for section in module.sections.all():
                            for lesson in section.lessons.filter(content_type='quiz'):
                                try:
                                    existing_quizzes.append(lesson.quiz)
                                except Quiz.DoesNotExist:
                                    pass
                    
                    existing_quiz_ids = [quiz.id for quiz in existing_quizzes]
                    processed_quiz_ids = []
                    
                    # Process each quiz
                    for quiz_data in quizzes_data:
                        quiz_id = quiz_data.get('id')
                        module_id = quiz_data.get('module_id')
                        
                        # Skip if no module ID is provided
                        if not module_id:
                            continue
                        
                        # Get the associated module
                        try:
                            module = Module.objects.get(id=module_id, course=course)
                        except Module.DoesNotExist:
                            continue
                        
                        # Get or create a section for this quiz
                        section, _ = Section.objects.get_or_create(
                            module=module,
                            title=f"Quiz: {quiz_data.get('title', 'Quiz')}",
                            defaults={
                                'description': quiz_data.get('description', ''),
                                'order': 999  # Put quizzes at the end by default
                            }
                        )
                        
                        # Get or create a lesson for this quiz
                        lesson, _ = Lesson.objects.get_or_create(
                            section=section,
                            content_type='quiz',
                            defaults={
                                'title': quiz_data.get('title', 'Quiz'),
                                'description': quiz_data.get('description', ''),
                                'order': 1  # First and only lesson in this section
                            }
                        )
                        
                        # Check if this is an existing quiz
                        if quiz_id and quiz_id in existing_quiz_ids:
                            # Update existing quiz
                            quiz = Quiz.objects.get(id=quiz_id)
                            quiz.lesson = lesson
                            quiz.title = quiz_data.get('title', quiz.title)
                            quiz.description = quiz_data.get('description', quiz.description)
                            
                            # Handle questions data
                            if 'questions' in quiz_data:
                                questions_data = quiz_data['questions']
                                quiz.questions = questions_data
                            
                            quiz.save()
                            processed_quiz_ids.append(quiz.id)
                        else:
                            # Create new quiz
                            quiz = Quiz.objects.create(
                                lesson=lesson,
                                title=quiz_data.get('title', 'Quiz'),
                                description=quiz_data.get('description', ''),
                                questions=quiz_data.get('questions', [])
                            )
                            processed_quiz_ids.append(quiz.id)
                    
                    # Delete quizzes that weren't in the update
                    for quiz in existing_quizzes:
                        if quiz.id not in processed_quiz_ids:
                            # Delete associated lesson and section too
                            lesson = quiz.lesson
                            section = lesson.section
                            quiz.delete()
                            lesson.delete()
                            
                            # Check if section has other lessons
                            if not section.lessons.exists():
                                section.delete()
                    
                    print(f"Successfully processed quizzes")
                    
                except Exception as e:
                    print(f"Error processing quizzes: {str(e)}")
                    # Continue with the update even if quizzes processing fails
            
            # Return success response
            response_data = {
                'id': course.id,
                'title': course.title,
                'instructor': request.user.username,
                'status': course.status,
                'message': 'Course updated successfully',
                'modules': [
                    {
                        'id': module.id,
                        'title': module.title,
                        'description': module.description,
                        'order': module.order,
                        'sections': [
                            {
                                'id': section.id,
                                'title': section.title,
                                'description': section.description,
                                'content_type': section.content_type if hasattr(section, 'content_type') else None,
                                'video_url': section.video_url if hasattr(section, 'video_url') else None,
                                'pdf_url': section.pdf_url if hasattr(section, 'pdf_url') else None,
                                'order': section.order
                            }
                            for section in module.sections.all().order_by('order')
                        ]
                    }
                    for module in course.modules.all().order_by('order')
                ],
                'quizzes': []
            }
            
            # Add quizzes to response
            try:
                quizzes = []
                for module in course.modules.all():
                    for section in module.sections.all():
                        for lesson in section.lessons.filter(content_type='quiz'):
                            try:
                                quiz = lesson.quiz
                                quizzes.append({
                                    'id': quiz.id,
                                    'title': quiz.title,
                                    'description': quiz.description,
                                    'module_id': module.id,
                                    'module_title': module.title,
                                    'questions': quiz.questions
                                })
                            except Quiz.DoesNotExist:
                                pass
                
                response_data['quizzes'] = quizzes
            except Exception as e:
                print(f"Error preparing quizzes for response: {str(e)}")
            
            return Response(response_data)
            
        except Exception as e:
            error_message = f'Error updating course: {str(e)}'
            print(f"Error: {error_message}")
            return Response(
                {'message': error_message},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CourseContentAPIView(generics.RetrieveAPIView):
    """
    API endpoint that returns a course's complete content structure
    including modules, sections, and lessons
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CourseSerializer
    queryset = Course.objects.all()

    def get_queryset(self):
        return Course.objects.prefetch_related(
            Prefetch('modules', queryset=Module.objects.order_by('order')),
            Prefetch('modules__sections', queryset=Section.objects.order_by('order')),
            Prefetch('modules__sections__lessons', queryset=Lesson.objects.order_by('order')),
            'modules__sections__lessons__user_progress'
        )

    def get(self, request, *args, **kwargs):
        course = self.get_object()
        
        # Check if user is enrolled
        if not course.enrollments.filter(user=request.user, status='active').exists():
            return Response(
                {"detail": "You must be enrolled in this course to view its content."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(course)
        return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def complete_lesson(request, lesson_id):
    """
    API endpoint to mark a lesson as completed
    """
    lesson = get_object_or_404(Lesson, id=lesson_id)
    
    # Check if user is enrolled in the course
    course = lesson.section.module.course
    if not course.enrollments.filter(user=request.user, status='active').exists():
        return Response(
            {"detail": "You must be enrolled in this course to mark lessons as complete."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Create or update progress
    progress, created = UserProgress.objects.get_or_create(
        user=request.user,
        lesson=lesson
    )
    
    return Response({
        "status": "success",
        "message": "Lesson marked as complete",
        "created": created
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def course_progress(request, course_id):
    """
    API endpoint to get course progress statistics
    """
    course = get_object_or_404(Course, id=course_id)
    
    # Check if user is enrolled
    if not course.enrollments.filter(user=request.user, status='active').exists():
        return Response(
            {"detail": "You must be enrolled in this course to view progress."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get total lessons count
    total_lessons = Lesson.objects.filter(
        section__module__course=course
    ).count()
    
    # Get completed lessons count
    completed_lessons = UserProgress.objects.filter(
        user=request.user,
        lesson__section__module__course=course
    ).count()
    
    # Calculate progress percentage
    progress_percentage = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
    
    return Response({
        "total_lessons": total_lessons,
        "completed_lessons": completed_lessons,
        "progress_percentage": round(progress_percentage, 2)
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_enrolled_students(request):
    """Get all students enrolled in the instructor's courses"""
    if request.user.user_type != 'instructor':
        return Response(
            {'message': 'Only instructors can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        # Get all courses by the instructor
        courses = Course.objects.filter(instructor=request.user)
        
        # Get unique students enrolled in any of the instructor's courses
        students = get_user_model().objects.filter(
            enrollments__course__in=courses,
            enrollments__status='active'
        ).distinct().annotate(
            enrolled_courses=Count('enrollments', filter=models.Q(enrollments__status='active'))
        )

        student_data = [{
            'id': student.id,
            'name': student.get_full_name() or student.username,
            'email': student.email,
            'enrolled_courses': list(student.enrollments.filter(
                status='active',
                course__in=courses
            ).values_list('course__title', flat=True))
        } for student in students]

        return Response(student_data)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_course_enrollments(request):
    """Get all enrollments for the instructor's courses"""
    if request.user.user_type != 'instructor':
        return Response(
            {'message': 'Only instructors can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        # Get all enrollments for the instructor's courses
        enrollments = Enrollment.objects.filter(
            course__instructor=request.user,
            status='active'
        ).select_related('user', 'course')

        enrollment_data = [{
            'id': enrollment.id,
            'student_name': enrollment.user.get_full_name() or enrollment.user.username,
            'course_title': enrollment.course.title,
            'enrolled_at': enrollment.enrolled_at,
            'progress_percentage': enrollment.progress_percentage
        } for enrollment in enrollments]

        return Response(enrollment_data)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_student(request, student_id):
    """Remove a student from all of the instructor's courses"""
    if request.user.user_type != 'instructor':
        return Response(
            {'message': 'Only instructors can remove students'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        # Get the student
        student = get_user_model().objects.get(id=student_id)
        
        # Get all enrollments for this student in the instructor's courses
        enrollments = Enrollment.objects.filter(
            user=student,
            course__instructor=request.user,
            status='active'
        )
        
        # Update the status to 'dropped' instead of actually deleting
        enrollments.update(status='dropped')

        return Response({
            'message': f'Successfully removed student from {enrollments.count()} courses'
        })
    except get_user_model().DoesNotExist:
        return Response(
            {'error': 'Student not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class CourseDetailAPIView(generics.RetrieveAPIView):
    """API endpoint for retrieving course details"""
    serializer_class = CourseSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'pk'

    def get_queryset(self):
        return Course.objects.select_related(
            'instructor',
            'category'
        ).prefetch_related(
            'modules',
            'modules__sections',
            'modules__sections__lessons',
            'reviews'
        )

    def retrieve(self, request, *args, **kwargs):
        try:
            course = self.get_object()
            
            # Check if course is published or user is instructor/staff
            if not course.is_published and not (
                request.user.is_staff or 
                (request.user.is_authenticated and request.user == course.instructor)
            ):
                return Response(
                    {'message': 'Course not found or not available'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            serializer = self.get_serializer(course)
            data = serializer.data
            
            # Add modules and their sections to the response
            modules_data = []
            for module in course.modules.all().order_by('order'):
                # Get sections data for this module
                sections_data = []
                for section in module.sections.all().order_by('order'):
                    section_data = {
                        'id': section.id,
                        'title': section.title,
                        'description': section.description,
                        'order': section.order,
                        'content_type': section.content_type,
                        'video_url': section.video_url,
                        'pdf_url': section.pdf_url,
                    }
                    sections_data.append(section_data)
                
                # Add module data with its sections
                module_data = {
                    'id': module.id,
                    'title': module.title,
                    'description': module.description,
                    'order': module.order,
                    'sections': sections_data
                }
                modules_data.append(module_data)
            
            # Add modules to course data
            data['modules'] = modules_data
            
            # Log what we're returning for debugging
            print(f"CourseDetailAPIView: Returning course {course.id} with {len(modules_data)} modules")
            for idx, module in enumerate(modules_data):
                print(f"  Module {idx+1}: {module['title']} with {len(module['sections'])} sections")
                
            return Response(data)
            
        except Course.DoesNotExist:
            return Response(
                {'message': 'Course not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Error in CourseDetailAPIView.retrieve: {str(e)}")
            return Response(
                {'message': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CheckEnrollmentAPIView(generics.RetrieveAPIView):
    """API endpoint for checking enrollment status"""
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'

    def get_queryset(self):
        return Course.objects.all()

    def retrieve(self, request, *args, **kwargs):
        try:
            course = self.get_object()
            enrollment = Enrollment.objects.filter(
                user=request.user,
                course=course,
                status='active'
            ).exists()
            
            return Response({
                'is_enrolled': enrollment,
                'status': 'success',
                'message': 'Successfully checked enrollment status'
            })
            
        except Course.DoesNotExist:
            return Response(
                {
                    'is_enrolled': False,
                    'status': 'error',
                    'message': 'Course not found'
                },
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {
                    'is_enrolled': False,
                    'status': 'error',
                    'message': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CourseModulesAPIView(generics.ListAPIView):
    """API view to get all modules for a specific course"""
    serializer_class = ModuleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        course_id = self.kwargs.get('course_id')
        return Module.objects.filter(course_id=course_id).order_by('order')

class ModuleSectionsAPIView(generics.ListAPIView):
    """API view to get all sections for a specific module"""
    serializer_class = SectionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        module_id = self.kwargs.get('module_id')
        return Section.objects.filter(module_id=module_id).order_by('order')

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_section_complete(request, course_id, section_id):
    """Mark a section as complete for the current user"""
    try:
        course = get_object_or_404(Course, id=course_id)
        section = get_object_or_404(Section, id=section_id)
        
        # Check if user is enrolled
        enrollment = get_object_or_404(Enrollment, user=request.user, course=course, status='active')
        
        # Get lessons in this section
        lessons = Lesson.objects.filter(section=section)
        
        # Mark all lessons as complete
        for lesson in lessons:
            progress, created = Progress.objects.get_or_create(
                enrollment=enrollment,
                lesson=lesson,
                defaults={
                    'completed': True,
                    'completed_at': timezone.now()
                }
            )
            
            if not created and not progress.completed:
                progress.completed = True
                progress.completed_at = timezone.now()
                progress.save()
        
        # Update enrollment progress
        total_lessons = Lesson.objects.filter(section__module__course=course).count()
        completed_lessons = Progress.objects.filter(
            enrollment=enrollment,
            completed=True
        ).count()
        
        if total_lessons > 0:
            enrollment.progress_percentage = (completed_lessons / total_lessons) * 100
            enrollment.current_section = section
            enrollment.save()
        
        return Response({
            'success': True,
            'message': 'Section marked as complete',
            'progress_percentage': enrollment.progress_percentage
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_course_progress(request, course_id):
    """Get the user's progress for a specific course"""
    try:
        course = get_object_or_404(Course, id=course_id)
        
        # Check if user is enrolled
        enrollment = get_object_or_404(Enrollment, user=request.user, course=course, status='active')
        
        # Get all completed lessons for this enrollment
        completed_progress = Progress.objects.filter(
            enrollment=enrollment,
            completed=True
        )
        
        # Create a dictionary of section_id -> completed status
        sections_completed = {}
        for progress in completed_progress:
            if progress.lesson.section:
                section_id = progress.lesson.section.id
                if section_id not in sections_completed:
                    # Check if all lessons in this section are completed
                    total_lessons = Lesson.objects.filter(section_id=section_id).count()
                    completed_lessons = completed_progress.filter(lesson__section_id=section_id).count()
                    sections_completed[section_id] = total_lessons == completed_lessons
        
        # Get quiz progress
        quiz_progress = {}
        for progress in completed_progress:
            if progress.lesson.content_type == 'quiz' and progress.score is not None:
                quiz = get_object_or_404(Quiz, lesson=progress.lesson)
                quiz_progress[quiz.id] = {
                    'score': progress.score,
                    'passed': progress.score >= quiz.passing_score
                }
        
        return Response({
            'sections_completed': sections_completed,
            'quiz_progress': quiz_progress,
            'overall_progress': enrollment.progress_percentage
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_quiz_results(request, course_id, quiz_id):
    """Submit quiz results for a user"""
    try:
        course = get_object_or_404(Course, id=course_id)
        
        # Check if user is enrolled
        enrollment = get_object_or_404(Enrollment, user=request.user, course=course, status='active')
        
        # Get the quiz
        lesson = get_object_or_404(Lesson, content_type='quiz', id=quiz_id)
        quiz = get_object_or_404(Quiz, lesson=lesson)
        
        # Get the score from request
        score = request.data.get('score', 0)
        answers = request.data.get('answers', {})
        
        # Update progress
        progress, created = Progress.objects.get_or_create(
            enrollment=enrollment,
            lesson=lesson,
            defaults={
                'completed': True,
                'completed_at': timezone.now(),
                'score': score
            }
        )
        
        if not created:
            progress.completed = True
            progress.completed_at = timezone.now()
            progress.score = score
            progress.save()
        
        # Check if passed
        passed = score >= quiz.passing_score
        
        return Response({
            'success': True,
            'score': score,
            'passed': passed,
            'passing_score': quiz.passing_score
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def save_section_notes(request, course_id, section_id):
    """Save notes for a specific section"""
    try:
        course = get_object_or_404(Course, id=course_id)
        section = get_object_or_404(Section, id=section_id)
        
        # Check if user is enrolled
        enrollment = get_object_or_404(Enrollment, user=request.user, course=course, status='active')
        
        # Get notes from request
        notes = request.data.get('notes', '')
        
        # Create or update first lesson's progress with notes
        first_lesson = Lesson.objects.filter(section=section).first()
        
        if first_lesson:
            progress, created = Progress.objects.get_or_create(
                enrollment=enrollment,
                lesson=first_lesson,
                defaults={'notes': notes}
            )
            
            if not created:
                progress.notes = notes
                progress.save()
        
        return Response({
            'success': True,
            'message': 'Notes saved successfully'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def unenroll_course(request, course_id):
    """Unenroll from a course"""
    try:
        course = get_object_or_404(Course, id=course_id)
        
        # Check if user is enrolled
        enrollment = get_object_or_404(Enrollment, user=request.user, course=course)
        
        # Update enrollment status to dropped
        enrollment.status = 'dropped'
        enrollment.save()
        
        return Response({
            'success': True,
            'message': 'Successfully unenrolled from the course'
        })
        
    except Enrollment.DoesNotExist:
        return Response({
            'success': False,
            'message': 'You are not enrolled in this course'
        }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def instructor_course_view(request, course_id):
    """API view to get complete course details including modules and sections for instructors"""
    try:
        # Get the course
        course = get_object_or_404(Course, id=course_id, instructor=request.user)
        
        # Build the basic course data
        course_data = {
            'id': course.id,
            'title': course.title,
            'description': course.description,
            'price': str(course.price),
            'difficulty_level': course.difficulty,
            'duration_in_weeks': course.duration_in_weeks,
            'is_published': course.is_published,
            'status': course.status,
            'category': course.category.name if course.category else 'Uncategorized',
            'thumbnail': course.thumbnail.url if course.thumbnail else None,
            'thumbnail_url': course.thumbnail.url if course.thumbnail else None,
        }
        
        # Get modules data
        modules_data = []
        for module in course.modules.all().order_by('order'):
            # Get sections data for this module
            sections_data = []
            for section in module.sections.all().order_by('order'):
                section_data = {
                    'id': section.id,
                    'title': section.title,
                    'description': section.description,
                    'order': section.order,
                    'content_type': section.content_type,
                    'video_url': section.video_url,
                    'pdf_url': section.pdf_url,
                }
                sections_data.append(section_data)
            
            # Add module data with its sections
            module_data = {
                'id': module.id,
                'title': module.title,
                'description': module.description,
                'order': module.order,
                'sections': sections_data
            }
            modules_data.append(module_data)
        
        # Add modules to course data - use both keys to ensure compatibility
        course_data['modules'] = modules_data
        
        # Log the structure of what we're returning
        print(f"Returning course data for ID {course_id} with {len(modules_data)} modules")
        for idx, module in enumerate(modules_data):
            print(f"Module {idx+1}: {module['title']} with {len(module.get('sections', []))} sections")
            
        return Response(course_data)
        
    except Exception as e:
        print(f"Error in instructor_course_view: {str(e)}")
        return Response(
            {'message': f'Error getting course details: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_section_pdf(request, course_id, section_id):
    """
    Process a PDF file upload for a specific section
    """
    try:
        # Check if the user is the instructor of the course
        course = get_object_or_404(Course, id=course_id)
        if course.instructor != request.user:
            return Response(
                {'error': 'You do not have permission to update this course'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Get the section
        section = get_object_or_404(Section, id=section_id)
        
        # Make sure the section belongs to a module in this course
        if not section.module or section.module.course.id != int(course_id):
            return Response(
                {'error': 'Section does not belong to this course'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Check if a file was uploaded
        if 'pdf_file' not in request.FILES:
            return Response(
                {'error': 'No PDF file was provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        pdf_file = request.FILES['pdf_file']
        
        # Check if it's a PDF (simple check based on file extension)
        if not pdf_file.name.lower().endswith('.pdf'):
            return Response(
                {'error': 'The uploaded file is not a PDF'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Save the PDF file to the section
        section.pdf_file = pdf_file
        
        # Update content type if not already set
        if section.content_type not in ['pdf', 'both']:
            if section.video_url:
                section.content_type = 'both'
            else:
                section.content_type = 'pdf'
                
        section.save()
        
        # Return the updated section data
        serializer = SectionSerializer(
            section,
            context={'request': request}
        )
        
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_course_with_files(request, course_id):
    """
    Update a course with module and section data, including file uploads
    """
    try:
        # Check if the user is the instructor of the course
        course = get_object_or_404(Course, id=course_id)
        if course.instructor != request.user:
            return Response(
                {'error': 'You do not have permission to update this course'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Process regular form data
        title = request.data.get('title')
        description = request.data.get('description')
        price = request.data.get('price')
        category_id = request.data.get('category')
        difficulty_level = request.data.get('difficulty_level')
        duration_in_weeks = request.data.get('duration_in_weeks')
        
        # Update basic course details
        if title:
            course.title = title
        if description:
            course.description = description
        if price:
            course.price = price
        if category_id:
            try:
                category = Category.objects.get(id=category_id)
                course.category = category
            except Category.DoesNotExist:
                pass
        if difficulty_level:
            course.difficulty_level = difficulty_level
        if duration_in_weeks:
            course.duration_in_weeks = duration_in_weeks
            
        # Handle thumbnail upload
        if 'thumbnail' in request.FILES:
            course.thumbnail = request.FILES['thumbnail']
            
        course.save()
        
        # Process modules and sections data from JSON
        modules_json = request.data.get('modules_json')
        if modules_json:
            try:
                modules_data = json.loads(modules_json)
                
                # Check PDF files metadata if provided
                pdf_uploads_meta = request.data.get('pdf_uploads_meta')
                pdf_uploads = []
                
                if pdf_uploads_meta:
                    try:
                        pdf_uploads = json.loads(pdf_uploads_meta)
                    except json.JSONDecodeError:
                        pdf_uploads = []
                
                # Track existing modules to detect deletions
                existing_module_ids = set(course.modules.values_list('id', flat=True))
                updated_module_ids = set()
                
                for module_data in modules_data:
                    module_id = module_data.get('id')
                    
                    # Create or update the module
                    if module_id and Module.objects.filter(id=module_id, course=course).exists():
                        # Update existing module
                        module = Module.objects.get(id=module_id)
                        module.title = module_data.get('title', module.title)
                        module.description = module_data.get('description', module.description)
                        module.order = module_data.get('order', module.order)
                        module.save()
                        updated_module_ids.add(module.id)
                    else:
                        # Create new module
                        module = Module.objects.create(
                            course=course,
                            title=module_data.get('title', 'Untitled Module'),
                            description=module_data.get('description', ''),
                            order=module_data.get('order', 1)
                        )
                        updated_module_ids.add(module.id)
                    
                    # Process sections if they exist
                    if 'sections' in module_data and isinstance(module_data['sections'], list):
                        # Track existing sections to detect deletions
                        existing_section_ids = set(module.sections.values_list('id', flat=True))
                        updated_section_ids = set()
                        
                        for section_data in module_data['sections']:
                            section_id = section_data.get('id')
                            
                            # Create or update the section
                            if section_id and Section.objects.filter(id=section_id, module=module).exists():
                                # Update existing section
                                section = Section.objects.get(id=section_id)
                                section.title = section_data.get('title', section.title)
                                section.description = section_data.get('description', section.description)
                                section.order = section_data.get('order', section.order)
                                section.content_type = section_data.get('content_type', section.content_type)
                                section.video_url = section_data.get('video_url', section.video_url)
                                section.video_id = section_data.get('video_id', section.video_id)
                                
                                # Only update pdf_url if it's not being replaced by a file upload
                                if not section_data.get('has_new_pdf', False):
                                    section.pdf_url = section_data.get('pdf_url', section.pdf_url)
                                
                                section.save()
                                updated_section_ids.add(section.id)
                            else:
                                # Create new section
                                section = Section.objects.create(
                                    module=module,
                                    title=section_data.get('title', 'Untitled Section'),
                                    description=section_data.get('description', ''),
                                    order=section_data.get('order', 1),
                                    content_type=section_data.get('content_type', 'video'),
                                    video_url=section_data.get('video_url', ''),
                                    video_id=section_data.get('video_id', ''),
                                    pdf_url=section_data.get('pdf_url', '')
                                )
                                updated_section_ids.add(section.id)
                            
                            # Handle PDF file uploads for this section
                            if section_data.get('has_new_pdf', False) and section_data.get('pdf_key'):
                                pdf_key = section_data.get('pdf_key')
                                
                                # Find PDF upload metadata
                                pdf_meta = next((item for item in pdf_uploads if item.get('pdfKey') == pdf_key), None)
                                
                                # Find the actual file in the request.FILES
                                for i in range(len(pdf_uploads)):
                                    file_key = f'section_pdf_{i}'
                                    if file_key in request.FILES:
                                        # If we found the right file, attach it to the section
                                        if not pdf_meta or i == pdf_meta.get('pdfIndex'):
                                            section.pdf_file = request.FILES[file_key]
                                            section.save()
                                            break
                        
                        # Delete sections that weren't updated
                        sections_to_delete = existing_section_ids - updated_section_ids
                        if sections_to_delete:
                            Section.objects.filter(id__in=sections_to_delete).delete()
                
                # Delete modules that weren't updated
                modules_to_delete = existing_module_ids - updated_module_ids
                if modules_to_delete:
                    Module.objects.filter(id__in=modules_to_delete).delete()
                
            except json.JSONDecodeError as e:
                return Response(
                    {'error': f'Invalid JSON in modules_json: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Return the updated course data
        serializer = CourseSerializer(
            course,
            context={'request': request}
        )
        
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )