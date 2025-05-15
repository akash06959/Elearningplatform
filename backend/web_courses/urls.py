from django.urls import path
from . import views

app_name = 'web_courses'

urlpatterns = [
    path('', views.course_list, name='course_list'),
    path('enrolled/', views.enrolled_courses, name='enrolled_courses'),
    path('<int:course_id>/', views.course_detail, name='course_detail'),
    path('<int:course_id>/enroll/', views.enroll_course, name='enroll'),
] 