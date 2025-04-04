from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class CourseAnalytics(models.Model):
    course = models.OneToOneField('courses.Course', on_delete=models.CASCADE, related_name='course_analytics', null=True, blank=True)
    total_enrollments = models.IntegerField(default=0)
    active_students = models.IntegerField(default=0)
    completion_rate = models.FloatField(default=0.0)
    average_grade = models.FloatField(default=0.0)
    average_time_spent = models.IntegerField(default=0)  # in minutes
    student_engagement_score = models.FloatField(default=0.0)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Course Analytics')
        verbose_name_plural = _('Course Analytics')

    def __str__(self):
        return f"Analytics for {self.course.title if self.course else 'No Course'}"

class StudentAnalytics(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='student_analytics')
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='student_analytics')
    time_spent = models.IntegerField(default=0)  # in minutes
    completion_percentage = models.FloatField(default=0.0)
    quiz_scores = models.JSONField(default=dict)
    assignment_scores = models.JSONField(default=dict)
    engagement_score = models.FloatField(default=0.0)
    last_accessed = models.DateTimeField(auto_now=True)
    risk_level = models.CharField(max_length=20, choices=[
        ('low', 'Low Risk'),
        ('medium', 'Medium Risk'),
        ('high', 'High Risk')
    ], default='low')
    predicted_completion = models.FloatField(default=0.0)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Student Analytics')
        verbose_name_plural = _('Student Analytics')
        unique_together = ['student', 'course']

    def __str__(self):
        return f"Analytics for {self.student.username} in {self.course.title}"

class ContentAnalytics(models.Model):
    lesson = models.OneToOneField('courses.Lesson', on_delete=models.CASCADE, related_name='content_analytics')
    views = models.IntegerField(default=0)
    average_time_spent = models.IntegerField(default=0)  # in minutes
    completion_rate = models.FloatField(default=0.0)
    engagement_score = models.FloatField(default=0.0)
    difficulty_rating = models.FloatField(default=0.0)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Content Analytics')
        verbose_name_plural = _('Content Analytics')

    def __str__(self):
        return f"Analytics for {self.lesson.title}"

class LearningPath(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='learning_paths')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    courses = models.ManyToManyField('courses.Course', related_name='learning_paths')
    current_course_index = models.IntegerField(default=0)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Learning Path')
        verbose_name_plural = _('Learning Paths')

    def __str__(self):
        return f"Learning Path for {self.student.username}: {self.title}"

class Achievement(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    icon = models.ImageField(upload_to='achievement_icons/', null=True, blank=True)
    points = models.IntegerField(default=0)
    criteria = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Achievement')
        verbose_name_plural = _('Achievements')

    def __str__(self):
        return self.title

class StudentAchievement(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='student_achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE, related_name='student_achievements')
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Student Achievement')
        verbose_name_plural = _('Student Achievements')
        unique_together = ['student', 'achievement']

    def __str__(self):
        return f"{self.student.username} earned {self.achievement.title}"

class Report(models.Model):
    REPORT_TYPES = (
        ('course', 'Course Report'),
        ('student', 'Student Report'),
        ('content', 'Content Report'),
        ('engagement', 'Engagement Report'),
        ('completion', 'Completion Report'),
    )

    title = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=REPORT_TYPES)
    description = models.TextField(blank=True)
    parameters = models.JSONField(default=dict)
    data = models.JSONField(default=dict)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Report')
        verbose_name_plural = _('Reports')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type.title()} Report: {self.title}" 