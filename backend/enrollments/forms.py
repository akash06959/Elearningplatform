# enrollments/forms.py
from django import forms
from .models import Progress

class ProgressNotesForm(forms.ModelForm):
    class Meta:
        model = Progress
        fields = ['notes']
        widgets = {
            'notes': forms.Textarea(attrs={'rows': 4, 'placeholder': 'Add your notes here'}),
        }