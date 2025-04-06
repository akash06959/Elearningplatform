from django.db import models
from django.conf import settings
from django.utils.text import slugify
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name

class Course(models.Model):
    DIFFICULTY_CHOICES = (
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    thumbnail = models.ImageField(upload_to='course_thumbnails/', blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='courses')
    instructor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='courses_taught')
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='beginner')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    is_published = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    enrollment_type = models.CharField(max_length=20, choices=[
        ('self', 'Self Enrollment'),
        ('manual', 'Manual Enrollment'),
        ('group', 'Group Enrollment')
    ], default='self')
    max_students = models.IntegerField(null=True, blank=True)
    prerequisites = models.ManyToManyField('self', symmetrical=False, blank=True)
    tags = models.ManyToManyField('CourseTag')
    difficulty_level = models.CharField(max_length=20, choices=[
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced')
    ], default='beginner')
    estimated_duration = models.IntegerField(help_text='Duration in minutes', default=60)
    language = models.CharField(max_length=10, default='en')
    certificate_available = models.BooleanField(default=False)
    certificate_template = models.FileField(upload_to='certificate_templates/', null=True, blank=True)
    course_objectives = models.TextField(blank=True)
    target_audience = models.TextField(blank=True)
    course_features = models.JSONField(default=list, blank=True)
    course_requirements = models.TextField(blank=True)
    course_resources = models.JSONField(default=list, blank=True)
    course_schedule = models.JSONField(default=dict, blank=True)
    analytics_enabled = models.BooleanField(default=True)
    discussion_enabled = models.BooleanField(default=True)
    peer_review_enabled = models.BooleanField(default=False)
    auto_grade_enabled = models.BooleanField(default=True)
    proctoring_enabled = models.BooleanField(default=False)
    offline_access_enabled = models.BooleanField(default=False)
    mobile_compatible = models.BooleanField(default=True)
    accessibility_features = models.JSONField(default=list, blank=True)
    version = models.CharField(max_length=20, default='1.0.0')
    status = models.CharField(max_length=20, choices=[
        ('draft', 'Draft'),
        ('review', 'Under Review'),
        ('published', 'Published'),
        ('archived', 'Archived')
    ], default='draft')
    duration_in_weeks = models.IntegerField(default=1)
    cover_image = models.ImageField(upload_to='course_covers/', null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['title']),
            models.Index(fields=['instructor']),
            models.Index(fields=['is_published']),
            models.Index(fields=['difficulty_level']),
        ]
    
    def __str__(self):
        return self.title
    
    def get_absolute_url(self):
        return reverse('courses:course_detail', kwargs={'course_id': self.id})

    def delete(self, *args, **kwargs):
        # Safely delete analytics before deleting the course
        try:
            analytics = self.course_analytics
            analytics.delete()
        except:
            pass  # Analytics don't exist, which is fine
        super().delete(*args, **kwargs)

class Module(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order']
        unique_together = ['course', 'order']
    
    def __str__(self):
        return f"{self.course.title} - {self.title}"

class Section(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='sections', null=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=False)
    release_date = models.DateTimeField(null=True, blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    estimated_duration = models.IntegerField(help_text='Duration in minutes', default=60)
    prerequisites = models.ManyToManyField('self', symmetrical=False, blank=True)
    completion_criteria = models.JSONField(default=dict, blank=True)
    resources = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Add fields for content_type, video_url, and pdf_url
    content_type = models.CharField(max_length=20, choices=[
        ('video', 'Video'),
        ('pdf', 'PDF Document'),
        ('both', 'Both Video & PDF'),
        ('text', 'Text Content'),
        ('quiz', 'Quiz'),
    ], default='video')
    video_url = models.URLField(max_length=500, blank=True, null=True)
    pdf_url = models.URLField(max_length=500, blank=True, null=True)
    
    # Add field for storing PDF files directly
    pdf_file = models.FileField(upload_to='course_pdfs/', blank=True, null=True)
    video_id = models.CharField(max_length=100, blank=True, null=True, help_text="YouTube video ID for embedding")

    class Meta:
        ordering = ['order']
        unique_together = ['module', 'order']
    
    def __str__(self):
        return f"{self.module.course.title} - {self.title}" if self.module else self.title
        
    def save(self, *args, **kwargs):
        # If a new PDF file is uploaded, update the pdf_url to point to it
        if self.pdf_file and not self.pdf_url:
            self.pdf_url = self.pdf_file.url if self.pdf_file else None
            
        super().save(*args, **kwargs)

class Lesson(models.Model):
    CONTENT_TYPES = (
        ('video', 'Video'),
        ('text', 'Text'),
        ('quiz', 'Quiz'),
        ('assignment', 'Assignment'),
        ('file', 'File'),
        ('audio', 'Audio'),
        ('interactive', 'Interactive Content')
    )
    
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPES)
    content = models.JSONField(default=dict, blank=True)
    order = models.IntegerField(default=0)
    duration = models.IntegerField(help_text='Duration in minutes', default=30)
    is_published = models.BooleanField(default=False)
    allow_comments = models.BooleanField(default=True)
    allow_download = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']
        unique_together = ['section', 'order']

    def __str__(self):
        return f"{self.section.title} - {self.title}"

class Quiz(models.Model):
    lesson = models.OneToOneField(Lesson, on_delete=models.CASCADE, related_name='quiz')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    time_limit = models.IntegerField(help_text='Time limit in minutes', null=True, blank=True)
    passing_score = models.IntegerField(default=70)
    max_attempts = models.IntegerField(default=1)
    shuffle_questions = models.BooleanField(default=True)
    show_correct_answers = models.BooleanField(default=False)
    questions = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Quiz: {self.title}"

class Assignment(models.Model):
    lesson = models.OneToOneField(Lesson, on_delete=models.CASCADE, related_name='assignment')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    max_score = models.IntegerField(default=100)
    submission_type = models.CharField(max_length=20, choices=[
        ('text', 'Text'),
        ('file', 'File'),
        ('link', 'Link'),
        ('code', 'Code'),
    ], default='text')
    instructions = models.TextField(blank=True)
    rubric = models.JSONField(default=dict, blank=True)
    allow_late_submissions = models.BooleanField(default=False)
    late_submission_penalty = models.FloatField(default=0.0)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Assignment: {self.title}"

class Review(models.Model):
    RATING_CHOICES = (
        (1, '1 - Poor'),
        (2, '2 - Fair'),
        (3, '3 - Good'),
        (4, '4 - Very Good'),
        (5, '5 - Excellent'),
    )
    
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='course_reviews')
    rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES)
    comment = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('course', 'user')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username}'s review for {self.course.title}"

class CourseTag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.name

class UserProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lesson_progress')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='student_progress', null=True)
    completed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'lesson')
    
    def __str__(self):
        return f"{self.user.username}'s progress on {self.lesson.title}"