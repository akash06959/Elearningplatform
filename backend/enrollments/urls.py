# enrollments/urls.py
from django.urls import path
from . import views

app_name = 'enrollments'

urlpatterns = [
    # API endpoints
    path('api/courses/<int:course_id>/enroll/', views.enroll_course, name='enroll_course_api'),
    path('api/courses/<int:course_id>/check-enrollment/', views.check_enrollment, name='check_enrollment_api'),
    path('api/courses/<int:course_id>/progress/', views.get_course_progress, name='course_progress_api'),
    path('api/enrollments/', views.get_user_enrollments, name='user_enrollments_api'),
    path('api/lessons/<int:lesson_id>/complete/', views.mark_lesson_complete, name='mark_lesson_complete_api'),
    
    # Web views
    path('courses/', views.EnrolledCoursesListView.as_view(), name='enrolled_courses'),
    path('courses/<int:course_id>/progress/', views.CourseProgressView.as_view(), name='course_progress'),
    path('courses/<slug:course_slug>/completion/', views.CourseCompletionView.as_view(), name='course_completion'),
    path('courses/<slug:course_slug>/unenroll/', views.unenroll_course, name='unenroll_course'),
]