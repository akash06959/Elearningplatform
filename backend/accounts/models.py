# accounts/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.conf import settings

class User(AbstractUser):
    """Extended user model for the e-learning platform"""
    USER_TYPE_CHOICES = (
        ('admin', 'Administrator'),
        ('instructor', 'Instructor'),
        ('student', 'Student'),
        ('content_manager', 'Content Manager'),
    )

    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='student')
    email = models.EmailField(_('email address'), unique=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    learning_preferences = models.JSONField(default=dict, blank=True)
    notification_settings = models.JSONField(default=dict, blank=True)
    badges = models.JSONField(default=list, blank=True)
    points = models.IntegerField(default=0)
    last_active = models.DateTimeField(auto_now=True)
    is_verified = models.BooleanField(default=False)
    social_links = models.JSONField(default=dict, blank=True)
    preferred_language = models.CharField(max_length=10, default='en')
    timezone = models.CharField(max_length=50, default='UTC')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    date_of_birth = models.DateField(null=True, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['-date_joined']

    def __str__(self):
        return self.username
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def enrolled_courses_count(self):
        return self.enrollments.count()

class UserAchievement(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_achievements')
    title = models.CharField(max_length=100)
    description = models.TextField()
    badge_icon = models.ImageField(upload_to='achievement_badges/', null=True, blank=True)
    points = models.IntegerField(default=0)
    achieved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-achieved_at']

    def __str__(self):
        return f"{self.user.username}'s achievement: {self.title}"

class UserNotification(models.Model):
    NOTIFICATION_TYPES = (
        ('course_update', 'Course Update'),
        ('deadline', 'Deadline'),
        ('achievement', 'Achievement'),
        ('message', 'Message'),
        ('system', 'System'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    link = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.username}: {self.title}"