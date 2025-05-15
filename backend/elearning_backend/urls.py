from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static
from . import views
from courses.views import CreateCourseAPIView, CategoryListAPIView
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from django.middleware.csrf import get_token

@ensure_csrf_cookie
def get_csrf_token(request):
    token = get_token(request)
    response = JsonResponse({'csrfToken': token})
    response.set_cookie('csrftoken', token, samesite='Lax', httponly=False)
    return response

urlpatterns = [
    # Authentication endpoints
    path('api/login/', views.login_view, name='login'),
    path('api/register/', views.register_view, name='register'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Admin site
    path('admin/', admin.site.urls),
    
    # Direct API endpoints for course creation and management
    path('api/courses/create/', CreateCourseAPIView.as_view(), name='create-course-api'),
    path('api/categories/', CategoryListAPIView.as_view(), name='categories-api'),
    
    # API endpoints for existing apps
    path('api/accounts/', include('accounts.urls')),
    path('api/courses/', include('courses.urls')),
    path('api/enrollments/', include('enrollments.urls')),
    path('api/exams/', include('exams.urls')),
    
    # Web application endpoints
    path('accounts/', include('accounts.urls', namespace='web_accounts')),
    path('courses/', include('web_courses.urls', namespace='web_courses')),
    
    # Default redirect
    path('', RedirectView.as_view(url='http://localhost:3000/login', permanent=False)),
    
    # CSRF token endpoint
    path('api/csrf-token/', get_csrf_token, name='csrf_token'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)