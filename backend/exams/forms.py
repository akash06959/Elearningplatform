# exams/forms.py
from django import forms
from .models import Exam, Question, Choice, ExamAttempt, Answer

class ExamForm(forms.ModelForm):
    class Meta:
        model = Exam
        fields = ['title', 'exam_type', 'description', 'instructions', 'start_date', 
                  'end_date', 'duration', 'total_marks', 'passing_marks', 'is_active']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 4}),
            'instructions': forms.Textarea(attrs={'rows': 4}),
            'start_date': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'end_date': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
        }

class QuestionForm(forms.ModelForm):
    class Meta:
        model = Question
        fields = ['question_text', 'question_type', 'marks', 'order']
        widgets = {
            'question_text': forms.Textarea(attrs={'rows': 3}),
        }

class ChoiceForm(forms.ModelForm):
    class Meta:
        model = Choice
        fields = ['choice_text', 'is_correct']

class ExamAttemptForm(forms.ModelForm):
    class Meta:
        model = ExamAttempt
        fields = []  # Just a placeholder, as we'll create this dynamically