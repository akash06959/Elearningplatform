# exams/urls.py
from django.urls import path
from . import views

app_name = 'exams'

urlpatterns = [
    # API endpoints
    path('', views.ExamListAPIView.as_view(), name='exam-list'),
    path('<int:pk>/', views.ExamDetailView.as_view(), name='exam-detail'),
    path('<int:pk>/attempt/', views.ExamAttemptView.as_view(), name='exam-attempt'),
    path('<int:pk>/submit/', views.ExamSubmitView.as_view(), name='exam-submit'),
    path('history/', views.ExamAttemptListView.as_view(), name='exam-history'),
    path('attempt/<int:pk>/results/', views.ExamResultView.as_view(), name='exam-results'),
    
    # Instructor endpoints
    path('instructor/', views.InstructorExamListView.as_view(), name='instructor-exams'),
    path('instructor/<int:pk>/attempts/', views.ExamAttemptListView.as_view(), {'instructor': True}, name='instructor-exam-attempts'),
    path('instructor/attempt/<int:pk>/grade/', views.ExamGradeView.as_view(), name='grade-exam'),
]