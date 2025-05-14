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
    unenroll_course,
    instructor_course_view,
    process_section_pdf,
    update_course_with_files,
    admin_fix_pdf_issue,
    test_pdf_storage,
    upload_pdf_fixed,
    fix_content_types_view,
    pdf_uploader_admin,
    serve_module_pdf_from_db,
    fix_module_pdf
)

app_name = 'courses'

# Create a router for ViewSets
router = DefaultRouter()
router.register(r'courses', views.CourseViewSet, basename='course')

# Define URL patterns
urlpatterns = [
    # Public API endpoints (no authentication required)
    path('', CourseListAPIView.as_view(), name='course_list_api'),  # Main course listing endpoint
    path('categories/', CategoryListAPIView.as_view(), name='category_list_api'),
    
    # Course detail endpoints
    path('<int:pk>/', CourseDetailAPIView.as_view(), name='course_detail_api'),
    path('<int:pk>/content/', CourseContentAPIView.as_view(), name='course_content_api'),
    path('<int:pk>/enrollment-status/', CheckEnrollmentAPIView.as_view(), name='check-enrollment-api'),
    
    # Authenticated user endpoints
    path('enrolled/', EnrolledCoursesAPIView.as_view(), name='enrolled_courses_api'),
    path('<int:course_id>/enroll/', views.enroll_course, name='enroll_course_api'),
    path('<int:course_id>/unenroll/', unenroll_course, name='unenroll_course_api'),
    path('<int:course_id>/progress/', get_course_progress, name='get_course_progress'),
    
    # Instructor endpoints
    path('instructor/courses/', InstructorCoursesAPIView.as_view(), name='instructor-courses-api'),
    path('instructor/courses/<int:pk>/', InstructorCourseDetailAPIView.as_view(), name='instructor-course-detail-api'),
    path('instructor/courses/<int:course_id>/view/', instructor_course_view, name='instructor-course-view-api'),
    path('instructor/courses/<int:pk>/update_status/', CourseStatusUpdateAPIView.as_view(), name='course-status-update-api'),
    path('instructor/enrolled-students/', views.get_enrolled_students, name='enrolled-students'),
    path('instructor/enrollments/', views.get_course_enrollments, name='course-enrollments'),
    path('instructor/remove-student/<int:student_id>/', views.remove_student, name='remove-student'),
    
    # Course management endpoints
    path('create/', CreateCourseAPIView.as_view(), name='course_create_api'),
    
    # Learning content endpoints
    path('<int:course_id>/modules/', CourseModulesAPIView.as_view(), name='course_modules_api'),
    path('<int:course_id>/sections/<int:section_id>/complete/', mark_section_complete, name='mark_section_complete'),
    path('<int:course_id>/quizzes/<int:quiz_id>/submit/', submit_quiz_results, name='submit_quiz_results'),
    path('<int:course_id>/sections/<int:section_id>/notes/', save_section_notes, name='save_section_notes'),
    
    # Web views (non-API endpoints)
    path('web/', views.CourseListView.as_view(), name='course_list'),
    path('web/<int:course_id>/', views.CourseDetailView.as_view(), name='course_detail'),
    path('web/<int:course_id>/review/', views.create_review, name='create_review'),
    path('web/section/<int:section_id>/', views.SectionDetailView.as_view(), name='section_detail'),
    path('web/lesson/<int:lesson_id>/', views.LessonDetailView.as_view(), name='lesson_detail'),
    path('web/lesson/<int:lesson_id>/complete/', views.mark_lesson_complete, name='mark_lesson_complete'),
    
    # Admin endpoints
    path('admin/fix-content-type/', views.fix_content_types_view, name='fix-content-types'),
    path('admin/pdf-uploader/', views.pdf_uploader_admin, name='pdf-uploader-admin'),
    
    # Add router URLs to urlpatterns
    path('', include(router.urls)),
]