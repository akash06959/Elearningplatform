# accounts/views.py
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views.generic import ListView, DetailView, UpdateView, CreateView, FormView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Count, Avg
from django.contrib.auth import get_user_model

from .models import User
from .forms import UserRegistrationForm, UserProfileForm, UserLoginForm
from .serializers import UserSerializer

User = get_user_model()

class UserRegistrationView(CreateView):
    model = User
    form_class = UserRegistrationForm
    template_name = 'accounts/register.html'
    success_url = reverse_lazy('accounts:login')
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, "Your account has been created successfully! Please log in.")
        return response

class UserLoginView(FormView):
    form_class = UserLoginForm
    template_name = 'accounts/login.html'
    success_url = reverse_lazy('dashboard')
    
    def form_valid(self, form):
        username = form.cleaned_data.get('username')
        password = form.cleaned_data.get('password')
        user_type = form.cleaned_data.get('user_type')
        
        user = authenticate(username=username, password=password)
        
        if user is not None:
            # Check if user type matches
            if user.user_type == user_type:
                login(self.request, user)
                messages.success(self.request, f"Welcome back, {user.username}!")
                return super().form_valid(form)
            else:
                messages.error(self.request, "Invalid user type for this account.")
                return self.form_invalid(form)
        else:
            messages.error(self.request, "Invalid username or password.")
            return self.form_invalid(form)

@login_required
def user_logout(request):
    logout(request)
    messages.success(request, "You have been successfully logged out.")
    return redirect('home')

class UserProfileView(LoginRequiredMixin, DetailView):
    model = User
    template_name = 'accounts/profile.html'
    context_object_name = 'user_profile'
    
    def get_object(self):
        return self.request.user

class UserProfileUpdateView(LoginRequiredMixin, UpdateView):
    model = User
    form_class = UserProfileForm
    template_name = 'accounts/edit_profile.html'
    success_url = reverse_lazy('accounts:profile')
    
   # accounts/views.py (continued)
    def get_object(self):
        return self.request.user
    
    def form_valid(self, form):
        messages.success(self.request, "Your profile has been updated successfully.")
        return super().form_valid(form)

class DashboardView(LoginRequiredMixin, ListView):
    template_name = 'accounts/dashboard.html'
    context_object_name = 'enrolled_courses'
    
    def get_queryset(self):
        return self.request.user.enrollments.filter(status='active')
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user
        context['upcoming_exams'] = []
        
        for enrollment in user.enrollments.filter(status='active'):
            exams = enrollment.course.exams.filter(is_active=True)
            for exam in exams:
                if exam.is_upcoming:
                    context['upcoming_exams'].append(exam)
        
        context['completed_courses'] = user.enrollments.filter(status='completed')
        return context

class UserProfileAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def instructor_list(request):
    instructors = User.objects.filter(role='instructor').annotate(
        total_courses=Count('courses'),
        total_students=Count('courses__enrollments', distinct=True),
        rating=Avg('courses__ratings__rating')
    )
    
    data = [{
        'id': instructor.id,
        'username': instructor.username,
        'name': f"{instructor.first_name} {instructor.last_name}".strip() or instructor.username,
        'profile_picture': instructor.profile_picture.url if instructor.profile_picture else None,
        'title': instructor.title,
        'bio': instructor.bio,
        'total_courses': instructor.total_courses,
        'total_students': instructor.total_students,
        'rating': instructor.rating
    } for instructor in instructors]
    
    return Response(data)

@api_view(['GET'])
def featured_instructors(request):
    instructors = User.objects.filter(role='instructor', is_featured=True).annotate(
        total_courses=Count('courses'),
        total_students=Count('courses__enrollments', distinct=True),
        rating=Avg('courses__ratings__rating')
    )
    
    data = [{
        'id': instructor.id,
        'username': instructor.username,
        'name': f"{instructor.first_name} {instructor.last_name}".strip() or instructor.username,
        'profile_picture': instructor.profile_picture.url if instructor.profile_picture else None,
        'title': instructor.title,
        'bio': instructor.bio,
        'total_courses': instructor.total_courses,
        'total_students': instructor.total_students,
        'rating': instructor.rating
    } for instructor in instructors]
    
    return Response(data)

@api_view(['GET'])
def top_rated_instructors(request):
    instructors = User.objects.filter(role='instructor').annotate(
        total_courses=Count('courses'),
        total_students=Count('courses__enrollments', distinct=True),
        rating=Avg('courses__ratings__rating')
    ).filter(rating__isnull=False).order_by('-rating')[:10]
    
    data = [{
        'id': instructor.id,
        'username': instructor.username,
        'name': f"{instructor.first_name} {instructor.last_name}".strip() or instructor.username,
        'profile_picture': instructor.profile_picture.url if instructor.profile_picture else None,
        'title': instructor.title,
        'bio': instructor.bio,
        'total_courses': instructor.total_courses,
        'total_students': instructor.total_students,
        'rating': instructor.rating
    } for instructor in instructors]
    
    return Response(data)