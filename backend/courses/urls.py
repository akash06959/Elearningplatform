# courses/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import (
    CourseListAPIView, 
    CreateCourseAPIView, 
    InstructorCoursesAPIView, 
    CourseStatusUpdateAPIView,
    InstructorCourseDetailAPIView,
    CategoryListAPIView,
    EnrolledCoursesAPIView,
    CourseContentAPIView,
    complete_lesson,
    course_progress,
    CourseDetailAPIView,
    CheckEnrollmentAPIView,
    CourseModulesAPIView,
    ModuleSectionsAPIView,
    mark_section_complete,
    get_course_progress,
    submit_quiz_results,
    save_section_notes,
    unenroll_course
)

app_name = 'courses'

# Create a router and register the viewset
router = DefaultRouter()
router.register(r'', views.CourseViewSet, basename='course')

# Define URL patterns
urlpatterns = [
    # Course detail and enrollment endpoints
    path('<int:pk>/detail/', CourseDetailAPIView.as_view(), name='course-detail-api'),
    path('<int:pk>/enrollment-status/', CheckEnrollmentAPIView.as_view(), name='check-enrollment-api'),
    
    # Course listing endpoint
    path('list/', CourseListAPIView.as_view(), name='course-list'),
    
    # Course content and progress endpoints
    path('<int:pk>/content/', CourseContentAPIView.as_view(), name='course-content'),
    path('lessons/<int:lesson_id>/complete/', complete_lesson, name='complete-lesson'),
    path('<int:course_id>/progress/', course_progress, name='course-progress'),
    
    # Instructor API endpoints
    path('instructor/courses/', InstructorCoursesAPIView.as_view(), name='instructor-courses-api'),
    path('instructor/courses/<int:pk>/', InstructorCourseDetailAPIView.as_view(), name='instructor-course-detail-api'),
    path('instructor/enrolled-students/', views.get_enrolled_students, name='enrolled-students'),
    path('instructor/enrollments/', views.get_course_enrollments, name='course-enrollments'),
    path('instructor/remove-student/<int:student_id>/', views.remove_student, name='remove-student'),
    path('<int:pk>/update_status/', CourseStatusUpdateAPIView.as_view(), name='course-status-update-api'),
    
    # Other endpoints
    path('create/', views.CreateCourseAPIView.as_view(), name='course_create_api'),
    path('categories/', views.CategoryListAPIView.as_view(), name='category_list_api'),
    path('enrolled/', views.EnrolledCoursesAPIView.as_view(), name='enrolled_courses_api'),
    
    # Include router URLs after custom endpoints
    path('', include(router.urls)),
    
    # Web views
    path('web/', views.CourseListView.as_view(), name='course_list'),
    path('web/<int:course_id>/', views.CourseDetailView.as_view(), name='course_detail'),
    path('web/<int:course_id>/review/', views.create_review, name='create_review'),
    path('web/section/<int:section_id>/', views.SectionDetailView.as_view(), name='section_detail'),
    path('web/lesson/<int:lesson_id>/', views.LessonDetailView.as_view(), name='lesson_detail'),
    path('web/lesson/<int:lesson_id>/complete/', views.mark_lesson_complete, name='mark_lesson_complete'),
    
    # API Endpoints
    path('api/courses/', CourseListAPIView.as_view(), name='course_list_api'),
    path('api/courses/<int:pk>/', CourseDetailAPIView.as_view(), name='course_detail_api'),
    path('api/courses/<int:pk>/status/', CourseStatusUpdateAPIView.as_view(), name='course_status_update_api'),
    path('api/courses/<int:pk>/content/', CourseContentAPIView.as_view(), name='course_content_api'),
    
    # New API endpoints for course learning
    path('api/courses/<int:course_id>/modules/', CourseModulesAPIView.as_view(), name='course_modules_api'),
    path('api/modules/<int:module_id>/sections/', ModuleSectionsAPIView.as_view(), name='module_sections_api'),
    path('api/courses/<int:course_id>/sections/<int:section_id>/complete/', mark_section_complete, name='mark_section_complete'),
    path('api/courses/<int:course_id>/progress/', get_course_progress, name='get_course_progress'),
    path('api/courses/<int:course_id>/quizzes/<int:quiz_id>/submit/', submit_quiz_results, name='submit_quiz_results'),
    path('api/courses/<int:course_id>/sections/<int:section_id>/notes/', save_section_notes, name='save_section_notes'),
    path('api/courses/<int:course_id>/unenroll/', unenroll_course, name='unenroll_course_api'),
]