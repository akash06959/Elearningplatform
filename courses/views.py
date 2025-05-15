from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from backend.courses.models import Course
from backend.enrollments.models import Enrollment

@login_required
def enrolled_courses(request):
    try:
        # Get active enrollments for the user
        enrollments = Enrollment.objects.filter(
            user=request.user,
            status='active'
        ).select_related('course')
        
        # Get the courses from enrollments
        enrolled_courses = [enrollment.course for enrollment in enrollments]
        
        context = {
            'enrolled_courses': enrolled_courses
        }
        return render(request, 'courses/enrolled_courses.html', context)
    except ObjectDoesNotExist as e:
        # Log specific database lookup errors
        print(f"Database lookup error: {str(e)}")
        messages.error(request, "Unable to load your enrolled courses. Please try again later.")
        context = {
            'enrolled_courses': []
        }
        return render(request, 'courses/enrolled_courses.html', context)
    except Exception as e:
        # Log any other unexpected errors
        print(f"Unexpected error loading enrolled courses: {str(e)}")
        messages.error(request, "An unexpected error occurred. Please try again later.")
        context = {
            'enrolled_courses': []
        }
        return render(request, 'courses/enrolled_courses.html', context)