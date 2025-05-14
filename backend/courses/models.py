from django.db import models
from django.conf import settings
from django.utils.text import slugify
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver

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
    is_free = models.BooleanField(default=False, help_text='Whether the course is free or paid')
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
    
    # Content type for the module
    content_type = models.CharField(max_length=20, choices=[
        ('video', 'Video'),
        ('pdf', 'PDF Document'),
        ('both', 'Both Video & PDF'),
        ('text', 'Text Content'),
        ('quiz', 'Quiz'),
    ], default='video')
    
    # Fields for video content
    video_url = models.URLField(max_length=500, blank=True, null=True)
    video_id = models.CharField(max_length=100, blank=True, null=True, help_text="YouTube video ID for embedding")
    
    # Fields for PDF content
    pdf_file = models.FileField(upload_to='module_pdfs/', blank=True, null=True)
    pdf_url = models.URLField(max_length=500, blank=True, null=True)
    
    # Field for storing PDF directly in database
    pdf_binary = models.BinaryField(blank=True, null=True)
    pdf_filename = models.CharField(max_length=255, blank=True, null=True)
    pdf_content_type = models.CharField(max_length=100, blank=True, null=True, default='application/pdf')
    
    class Meta:
        ordering = ['order']
        unique_together = ['course', 'order']
    
    def __str__(self):
        return f"{self.course.title} - {self.title}"
        
    def save(self, *args, **kwargs):
        """
        Override save to handle file handling and keep content_type updated
        """
        # Update content type based on available content
        if self.pdf_file or self.pdf_url or self.pdf_binary:
            if self.video_url or self.video_id:
                self.content_type = 'both'
            else:
                self.content_type = 'pdf'
        elif self.video_url or self.video_id:
            self.content_type = 'video'
            
        # If PDF file is uploaded, set the URL for convenience
        # and save binary data to pdf_binary field
        if self.pdf_file and not self.pdf_url:
            need_url_update = True
            
            # Read the binary data from the file and store it in the pdf_binary field
            try:
                self.pdf_file.seek(0)  # Go to the start of the file
                self.pdf_binary = self.pdf_file.read()  # Read the binary data
                self.pdf_filename = self.pdf_file.name  # Store the filename
            except Exception as e:
                print(f"Error reading PDF file: {str(e)}")
        else:
            need_url_update = False
            
        # Save the model first to ensure file is saved
        super().save(*args, **kwargs)
        
        # Update pdf_url after save if needed
        if need_url_update and self.pdf_file:
            try:
                # Update URL without triggering another save
                type(self).objects.filter(pk=self.pk).update(pdf_url=self.pdf_file.url)
                # Update in-memory instance too
                self.pdf_url = self.pdf_file.url
            except Exception as e:
                print(f"Error updating PDF URL: {str(e)}")
    
    def get_pdf_data(self):
        """
        Return the PDF binary data, either from the database or from the file
        """
        if self.pdf_binary:
            return self.pdf_binary
        elif self.pdf_file:
            try:
                self.pdf_file.open('rb')
                data = self.pdf_file.read()
                self.pdf_file.close()
                return data
            except Exception as e:
                print(f"Error reading PDF file: {str(e)}")
                return None
        return None

@receiver(post_save, sender=Module)
def update_module_pdf_url(sender, instance, created, **kwargs):
    """
    Signal receiver to update pdf_url after the Module model has been saved
    This runs after saving, so the file is already stored and has a URL
    """
    if instance.pdf_file and not instance.pdf_url:
        try:
            # Get the URL of the saved file
            pdf_url = instance.pdf_file.url
            print(f"Module PDF File URL: {pdf_url}")
            
            # Update the model without triggering the save method again
            Module.objects.filter(pk=instance.pk).update(
                pdf_url=pdf_url,
                content_type='pdf' if not instance.video_url else 'both'
            )
            
            # Also update the instance in memory
            instance.pdf_url = pdf_url
            print(f"Updated pdf_url for module {instance.pk}: {pdf_url}")
        except Exception as e:
            print(f"Error in post_save signal for Module: {str(e)}")

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
        """
        Override save to handle file handling and keep pdf_url in sync with pdf_file
        """
        # Capture the current state 
        had_pdf_file_previously = bool(self.pdf_file) 
        pdf_file_changed = hasattr(self, '_pdf_file_changed') and self._pdf_file_changed
        
        # First time save
        is_new = self.pk is None
        
        # Call the standard save method first 
        super().save(*args, **kwargs)
        
        # Now that the file is saved, we can get its URL
        if had_pdf_file_previously and (pdf_file_changed or not self.pdf_url):
            try:
                # At this point the file is saved and has a URL
                # Direct database update to avoid recursion
                pdf_url = self.pdf_file.url if self.pdf_file else None
                type(self).objects.filter(pk=self.pk).update(pdf_url=pdf_url)
                # Update this instance too
                self.pdf_url = pdf_url
                print(f"Updated pdf_url for section {self.pk}: {pdf_url}")
            except Exception as e:
                print(f"Error updating PDF URL: {str(e)}")
        
        # Make sure we handle content_type if it's changed
        if self.pdf_file and not self.content_type.startswith('pdf'):
            # Auto set content type if the file exists
            if self.video_url:
                type(self).objects.filter(pk=self.pk).update(content_type='both')
            else:
                type(self).objects.filter(pk=self.pk).update(content_type='pdf')

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

class File(models.Model):
    """
    Model to handle file uploads for sections, particularly PDFs
    """
    FILE_TYPES = (
        ('pdf', 'PDF Document'),
        ('doc', 'Word Document'),
        ('sheet', 'Spreadsheet'),
        ('image', 'Image'),
        ('video', 'Video'),
        ('audio', 'Audio'),
        ('other', 'Other'),
    )
    
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='files')
    file = models.FileField(upload_to='section_files/')
    file_type = models.CharField(max_length=10, choices=FILE_TYPES, default='pdf')
    name = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name or self.file.name} ({self.get_file_type_display()})"
    
    def save(self, *args, **kwargs):
        # Set name from file if not provided
        if not self.name and self.file:
            self.name = self.file.name
        super().save(*args, **kwargs)
        
        # Update section's content type if this is a PDF
        if self.file_type == 'pdf' and self.section:
            if self.section.content_type == 'video':
                self.section.content_type = 'both'
            elif self.section.content_type not in ['pdf', 'both']:
                self.section.content_type = 'pdf'
            self.section.save(update_fields=['content_type'])

class UserProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lesson_progress')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='student_progress', null=True)
    completed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'lesson')
    
    def __str__(self):
        return f"{self.user.username}'s progress on {self.lesson.title}"

@receiver(post_save, sender=Section)
def update_pdf_url(sender, instance, created, **kwargs):
    """
    Signal receiver to update pdf_url after the model has been saved
    This runs after saving, so the file is already stored and has a URL
    """
    if instance.pdf_file and not instance.pdf_url:
        try:
            # Get the URL of the saved file
            pdf_url = instance.pdf_file.url
            print(f"PDF File URL: {pdf_url}")
            
            # Update the model without triggering the save method again
            Section.objects.filter(pk=instance.pk).update(
                pdf_url=pdf_url,
                content_type='pdf' if not instance.video_url else 'both'
            )
            
            # Also update the instance in memory
            instance.pdf_url = pdf_url
            print(f"Updated pdf_url for section {instance.pk}: {pdf_url}")
        except Exception as e:
            print(f"Error in post_save signal for Section: {str(e)}")