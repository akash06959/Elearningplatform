from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    # Regular views
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('login/', views.UserLoginView.as_view(), name='login'),
    path('logout/', views.user_logout, name='logout'),
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('profile/edit/', views.UserProfileUpdateView.as_view(), name='edit_profile'),
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    
    # API endpoints
    path('api/profile/', views.UserProfileAPIView.as_view(), name='profile-api'),
]