from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()
from .models import Category, Course, Section, Lesson, Enrollment

class CoursesAPITestCase(TestCase):
    def setUp(self):
        # Create users
        self.admin_user = User.objects.create_superuser(
            'admin', 'admin@example.com', 'adminpass')
        self.regular_user = User.objects.create_user(
            'student', 'student@example.com', 'studentpass')
        
        # Set up API client
        self.client = APIClient()
        
        # Create test data
        self.category = Category.objects.create(
            name="Programming", 
            description="Learn programming languages"
        )
        
        self.course = Course.objects.create(
            title="Python for Beginners",
            description="Learn Python basics",
            price=29.99,
            instructor="John Doe",
            category=self.category
        )
        
        self.section = Section.objects.create(
            course=self.course,
            title="Introduction",
            order=1
        )
        
        self.lesson = Lesson.objects.create(
            section=self.section,
            title="Hello World",
            content_type="video",
            video_url="https://example.com/video.mp4",
            order=1
        )
    
    def test_list_courses_unauthenticated(self):
        response = self.client.get(reverse('course-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_course_detail_unauthenticated(self):
        response = self.client.get(reverse('course-detail', args=[self.course.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_enroll_in_course(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            reverse('course-enroll', args=[self.course.id]))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check enrollment was created
        self.assertTrue(
            Enrollment.objects.filter(
                user=self.regular_user, course=self.course).exists())
    
    def test_create_course_as_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'title': 'New Course',
            'description': 'New course description',
            'price': 49.99,
            'instructor': 'Jane Smith',
            'category': self.category.id
        }
        response = self.client.post(reverse('course-list'), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_create_course_as_regular_user(self):
        self.client.force_authenticate(user=self.regular_user)
        data = {
            'title': 'Unauthorized Course',
            'description': 'This should fail',
            'price': 49.99,
            'instructor': 'Jane Smith',
            'category': self.category.id
        }
        response = self.client.post(reverse('course-list'), data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)