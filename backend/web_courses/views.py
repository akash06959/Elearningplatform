from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.exceptions import ObjectDoesNotExist
from courses.models import Course
from enrollments.models import Enrollment
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# Create your views here.

def course_list(request):
    """Display all available courses"""
    try:
        courses = Course.objects.filter(is_published=True).order_by('-created_at')
        context = {
            'courses': courses,
            'debug': settings.DEBUG
        }
        return render(request, 'web_courses/course_list.html', context)
    except Exception as e:
        logger.error(f"Error in course list view: {str(e)}")
        messages.error(request, "Unable to load courses. Please try again later.")
        return render(request, 'web_courses/course_list.html', {'courses': []})

@login_required
def course_detail(request, course_id):
    """Display details of a specific course"""
    try:
        course = get_object_or_404(Course, id=course_id)
        
        # Check if user is enrolled
        is_enrolled = Enrollment.objects.filter(
            user=request.user,
            course=course,
            status='active'
        ).exists()
        
        context = {
            'course': course,
            'is_enrolled': is_enrolled,
            'debug': settings.DEBUG
        }
        return render(request, 'web_courses/course_detail.html', context)
    except Exception as e:
        logger.error(f"Error in course detail view: {str(e)}")
        messages.error(request, "Unable to load course details. Please try again later.")
        return redirect('web_courses:course_list')

@login_required
def enrolled_courses(request):
    logger.info(f"Enrolled courses view accessed by user: {request.user.username}")
    try:
        # Get active enrollments for the user
        logger.info(f"Fetching enrollments for user: {request.user.username}")
        enrollments = Enrollment.objects.filter(
            user=request.user,
            status='active'
        ).select_related('course')
        
        logger.info(f"Found {enrollments.count()} enrollments")
        
        # Get the courses from enrollments
        enrolled_courses = [enrollment.course for enrollment in enrollments]
        
        logger.info(f"Preparing context with {len(enrolled_courses)} courses")
        context = {
            'enrolled_courses': enrolled_courses,
            'debug': settings.DEBUG
        }
        return render(request, 'web_courses/enrolled_courses.html', context)
    except ObjectDoesNotExist as e:
        # Log specific database lookup errors
        logger.error(f"Database lookup error for user {request.user.username}: {str(e)}")
        messages.error(request, "Unable to load your enrolled courses. Please try again later.")
        context = {
            'enrolled_courses': [],
            'debug': settings.DEBUG
        }
        return render(request, 'web_courses/enrolled_courses.html', context)
    except Exception as e:
        # Log any other unexpected errors
        logger.error(f"Unexpected error for user {request.user.username}: {str(e)}")
        messages.error(request, "An unexpected error occurred. Please try again later.")
        context = {
            'enrolled_courses': [],
            'debug': settings.DEBUG
        }
        return render(request, 'web_courses/enrolled_courses.html', context)

@login_required
def enroll_course(request, course_id):
    """Handle course enrollment"""
    if request.method != 'POST':
        return redirect('web_courses:course_detail', course_id=course_id)
        
    try:
        course = get_object_or_404(Course, id=course_id)
        
        # Check if already enrolled
        existing_enrollment = Enrollment.objects.filter(
            user=request.user,
            course=course
        ).first()
        
        if existing_enrollment:
            if existing_enrollment.status == 'active':
                messages.info(request, "You are already enrolled in this course.")
            elif existing_enrollment.status == 'dropped':
                existing_enrollment.status = 'active'
                existing_enrollment.save()
                messages.success(request, "Successfully re-enrolled in the course.")
            else:
                messages.error(request, "Unable to enroll in this course.")
        else:
            # Create new enrollment
            Enrollment.objects.create(
                user=request.user,
                course=course,
                status='active'
            )
            messages.success(request, "Successfully enrolled in the course.")
            
        return redirect('web_courses:course_detail', course_id=course_id)
        
    except Exception as e:
        logger.error(f"Error enrolling in course {course_id}: {str(e)}")
        messages.error(request, "An error occurred while enrolling in the course. Please try again later.")
        return redirect('web_courses:course_list')
