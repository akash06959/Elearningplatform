from django.contrib.auth import get_user_model
from courses.models import Course
from enrollments.models import Enrollment
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta

def admin_stats(request):
    """
    Add statistics to the admin dashboard context.
    """
    if not request.path.startswith('/admin/'):
        return {}

    User = get_user_model()
    
    # Calculate statistics
    user_count = User.objects.count()
    course_count = Course.objects.filter(is_published=True).count()
    enrollment_count = Enrollment.objects.count()
    
    # Count recent activities (last 7 days)
    last_week = timezone.now() - timedelta(days=7)
    recent_activities = (
        Enrollment.objects.filter(enrolled_at__gte=last_week).count() +
        Course.objects.filter(created_at__gte=last_week).count()
    )

    return {
        'user_count': user_count,
        'course_count': course_count,
        'enrollment_count': enrollment_count,
        'recent_activities': recent_activities,
    } 