# courses/forms.py
from django import forms
from .models import Course, Section, Lesson, Review

class CourseForm(forms.ModelForm):
    class Meta:
        model = Course
        fields = ['title', 'description', 'category', 'cover_image', 'price', 
                  'difficulty', 'duration_in_weeks', 'is_published']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 4}),
        }

class SectionForm(forms.ModelForm):
    class Meta:
        model = Section
        fields = ['title', 'description', 'order']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 4}),
        }

class LessonForm(forms.ModelForm):
    class Meta:
        model = Lesson
        fields = ['title', 'description', 'content_type', 'content', 'order']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 4}),
            'content': forms.Textarea(attrs={'rows': 4}),
        }
    
    def clean(self):
        cleaned_data = super().clean()
        content_type = cleaned_data.get('content_type')
        content = cleaned_data.get('content')
        
        # Validate based on content type
        if content_type == 'video' and not content.get('video_url'):
            self.add_error('content', 'Video URL is required for video content')
        elif content_type == 'text' and not content.get('text'):
            self.add_error('content', 'Text content is required for text content')
        elif content_type == 'file' and not content.get('file_url'):
            self.add_error('content', 'File URL is required for file content')
        
        return cleaned_data

class ReviewForm(forms.ModelForm):
    class Meta:
        model = Review
        fields = ['rating', 'comment']
        widgets = {
            'comment': forms.Textarea(attrs={'rows': 4}),
            'rating': forms.NumberInput(attrs={'min': 1, 'max': 5}),
        } 