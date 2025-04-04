from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'user_type', 'profile_picture', 'bio', 'date_of_birth', 
            'phone_number', 'address', 'points', 'badges',
            'learning_preferences', 'preferred_language', 'timezone'
        ]
        read_only_fields = ['id', 'username', 'email', 'user_type', 'points', 'badges'] 