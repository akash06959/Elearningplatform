from django.contrib.auth import authenticate
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.tokens import RefreshToken
import json

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            requested_user_type = data.get('user_type', '').lower()
            
            if not username or not password or not requested_user_type:
                return JsonResponse({
                    'success': False,
                    'message': 'Please provide username, password, and user type'
                }, status=400)
            
            user = authenticate(username=username, password=password)
            
            if user is not None:
                # Check if user_type matches
                user_type = getattr(user, 'user_type', '').lower()
                print(f"Login attempt - Username: {username}, Requested type: {requested_user_type}, Actual type: {user_type}")
                
                if user_type != requested_user_type:
                    return JsonResponse({
                        'success': False,
                        'message': f'This account is not registered as a {requested_user_type}.'
                    }, status=403)
                
                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)
                
                # Authentication successful
                return JsonResponse({
                    'success': True,
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user_type': user_type,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'message': 'Login successful'
                })
            else:
                # Authentication failed
                return JsonResponse({
                    'success': False,
                    'message': 'Invalid username or password'
                }, status=401)
                
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'message': 'Invalid JSON data'
            }, status=400)
            
        except Exception as e:
            print(f"Login error: {str(e)}")
            return JsonResponse({
                'success': False,
                'message': 'An error occurred during login'
            }, status=500)
    
    return JsonResponse({
        'success': False,
        'message': 'Method not allowed'
    }, status=405)

# views.py
from django.contrib.auth import get_user_model
User = get_user_model()
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.views.decorators.csrf import csrf_exempt
import json

User = get_user_model()  # This gets the proper User model as configured in settings.py

@csrf_exempt
def register_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
            first_name = data.get('first_name', '')
            last_name = data.get('last_name', '')
            user_type = data.get('user_type', 'student')
            
            # Validate input data
            if not username or not email or not password:
                return JsonResponse({
                    'success': False,
                    'message': 'Please provide all required fields'
                }, status=400)
            
            # Check if username already exists
            if User.objects.filter(username=username).exists():
                return JsonResponse({
                    'success': False,
                    'message': 'Username already exists'
                }, status=400)
            
            # Check if email already exists
            if User.objects.filter(email=email).exists():
                return JsonResponse({
                    'success': False,
                    'message': 'Email address already in use'
                }, status=400)
            
            # Create new user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                user_type=user_type  # Set user_type directly
            )
            
            # Generate JWT token
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)
            
            return JsonResponse({
                'success': True,
                'message': 'User registered successfully',
                'user_id': user.id,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user_type': user.user_type,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name
            })
            
        except Exception as e:
            print(f"Registration error: {str(e)}")  # Add logging
            return JsonResponse({
                'success': False,
                'message': str(e)
            }, status=500)
    
    return JsonResponse({
        'success': False,
        'message': 'Method not allowed'
    }, status=405)