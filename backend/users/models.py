from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()  # Or your custom User model

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    # Add your profile fields here, such as:
    bio = models.TextField(blank=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    # Other fields...
    
    def __str__(self):
        return f"{self.user.username}'s profile"