from django.contrib.auth.models import User
from django.db import models

class Course(models.Model):
    # ... existing code ...
    students = models.ManyToManyField(User, related_name='enrolled_courses', blank=True)
    # ... existing code ...