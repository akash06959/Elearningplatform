# enrollments/models.py
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

class Enrollment(models.Model):
    """Represents a user's enrollment in a course"""
    ENROLLMENT_STATUS = (
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('dropped', 'Dropped'),
        ('pending', 'Pending'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='enrollments')
    status = models.CharField(max_length=20, choices=ENROLLMENT_STATUS, default='active')
    enrolled_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_accessed = models.DateTimeField(auto_now=True)
    progress_percentage = models.FloatField(default=0.0)
    current_section = models.ForeignKey('courses.Section', on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    certificate_issued = models.BooleanField(default=False)
    certificate_url = models.URLField(blank=True)

    class Meta:
        verbose_name = _('Enrollment')
        verbose_name_plural = _('Enrollments')
        unique_together = ['user', 'course']
        ordering = ['-enrolled_at']

    def __str__(self):
        return f"{self.user.username}'s enrollment in {self.course.title}"

class Progress(models.Model):
    """Tracks progress of a user through course lessons"""
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='progress')
    lesson = models.ForeignKey('courses.Lesson', on_delete=models.CASCADE, related_name='progress_records')
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    time_spent = models.IntegerField(default=0)  # in minutes
    last_accessed = models.DateTimeField(auto_now=True)
    score = models.FloatField(null=True, blank=True)  # for quizzes and assignments
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = _('Progress')
        verbose_name_plural = _('Progress')
        unique_together = ['enrollment', 'lesson']
        ordering = ['lesson__section__order', 'lesson__order']

    def __str__(self):
        return f"{self.enrollment.user.username}'s progress in {self.lesson.title}"

class EnrollmentRecord(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='enrollments_record')
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='enrollments_record')
    # Other fields...
