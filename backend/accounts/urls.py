from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    # Regular web views
    path('web/register/', views.UserRegistrationView.as_view(), name='register'),
    path('web/login/', views.UserLoginView.as_view(), name='login'),
    path('web/logout/', views.user_logout, name='logout'),
    path('web/profile/', views.UserProfileView.as_view(), name='profile'),
    path('web/profile/edit/', views.UserProfileUpdateView.as_view(), name='edit_profile'),
    path('web/dashboard/', views.DashboardView.as_view(), name='dashboard'),
    
    # API endpoints
    path('profile/', views.UserProfileAPIView.as_view(), name='profile-api'),
    
    # Instructor list endpoints
    path('instructors/', views.instructor_list, name='instructor-list'),
    path('instructors/featured/', views.featured_instructors, name='featured-instructors'),
    path('instructors/top-rated/', views.top_rated_instructors, name='top-rated-instructors'),
]