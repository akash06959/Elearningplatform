from rest_framework import serializers
from .models import Category, Course, Section, Lesson, Review, CourseTag, Module, UserProgress
from enrollments.models import Enrollment, Progress
from django.contrib.auth.models import User
from django.db import models

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']

class CourseTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseTag
        fields = ['id', 'name', 'description']

class ReviewSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'user', 'user_username', 'rating', 'comment', 'created_at']
        read_only_fields = ['user']

class LessonSerializer(serializers.ModelSerializer):
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            'id', 'section', 'title', 'description', 'content_type',
            'content', 'order', 'duration', 'is_published',
            'allow_comments', 'allow_download', 'created_at', 'is_completed'
        ]

    def get_is_completed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return UserProgress.objects.filter(
                user=request.user,
                lesson=obj
            ).exists()
        return False

class SectionSerializer(serializers.ModelSerializer):
    completed = serializers.SerializerMethodField()
    pdf_file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Section
        fields = [
            'id', 'title', 'description', 'order', 'content_type',
            'video_url', 'video_id', 'pdf_url', 'pdf_file', 'pdf_file_url',
            'completed'
        ]
        extra_kwargs = {
            'pdf_file': {'write_only': True}  # Don't include the actual file in responses
        }
    
    def get_completed(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        # Check if user has completed this section
        from enrollments.models import Enrollment, Progress
        
        try:
            # Get the user's enrollment for this course
            enrollment = Enrollment.objects.get(
                user=request.user,
                course=obj.module.course,
                status='active'
            )
            
            # Get lessons in this section
            lessons = Lesson.objects.filter(section=obj)
            
            if not lessons.exists():
                return False
            
            # Check if all lessons are completed
            completed_count = Progress.objects.filter(
                enrollment=enrollment,
                lesson__in=lessons,
                completed=True
            ).count()
            
            return completed_count == lessons.count()
            
        except (Enrollment.DoesNotExist, AttributeError):
            return False
            
    def get_pdf_file_url(self, obj):
        if obj.pdf_file:
            request = self.context.get('request')
            if request:
                # Return the full URL including domain
                return request.build_absolute_uri(obj.pdf_file.url)
            # If no request in context, just return the relative URL
            return obj.pdf_file.url
        return None
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        # If we have a PDF file but no PDF URL, use the file URL
        if not representation.get('pdf_url') and representation.get('pdf_file_url'):
            representation['pdf_url'] = representation['pdf_file_url']
            
        # For YouTube videos, ensure video_id is extracted if not already set
        if representation.get('video_url') and not representation.get('video_id'):
            video_url = representation.get('video_url')
            try:
                video_id = None
                if 'youtube.com/watch' in video_url:
                    from urllib.parse import urlparse, parse_qs
                    parsed_url = urlparse(video_url)
                    video_id = parse_qs(parsed_url.query).get('v', [None])[0]
                elif 'youtu.be/' in video_url:
                    video_id = video_url.split('youtu.be/')[1].split('?')[0]
                elif 'youtube.com/embed/' in video_url:
                    video_id = video_url.split('youtube.com/embed/')[1].split('?')[0]
                
                if video_id:
                    representation['video_id'] = video_id
            except Exception as e:
                print(f"Error extracting video ID: {str(e)}")
                
        return representation

class InstructorSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'name', 'email']
        
    def get_name(self, obj):
        if hasattr(obj, 'full_name'):
            return obj.full_name
        full_name = obj.get_full_name().strip()
        if full_name:
            return full_name
        return obj.username

class ModuleSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, read_only=True)
    pdf_file_url = serializers.SerializerMethodField()
    has_pdf_binary = serializers.SerializerMethodField()
    
    class Meta:
        model = Module
        fields = [
            'id', 'title', 'description', 'order', 
            'content_type', 'video_url', 'video_id', 
            'pdf_url', 'pdf_file_url', 'has_pdf_binary', 'sections'
        ]
        extra_kwargs = {
            'pdf_file': {'write_only': True}  # Don't include the actual file in responses
        }
    
    def get_pdf_file_url(self, obj):
        if obj.pdf_file:
            request = self.context.get('request')
            if request:
                # Return the full URL including domain
                return request.build_absolute_uri(obj.pdf_file.url)
            # If no request in context, just return the relative URL
            return obj.pdf_file.url
        return None
    
    def get_has_pdf_binary(self, obj):
        # Check if the module has PDF data stored in the database
        return bool(obj.pdf_binary)
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        # If we have a PDF file but no PDF URL, use the file URL
        if not representation.get('pdf_url') and representation.get('pdf_file_url'):
            representation['pdf_url'] = representation['pdf_file_url']
            
        # For YouTube videos, ensure video_id is extracted if not already set
        if representation.get('video_url') and not representation.get('video_id'):
            video_url = representation.get('video_url')
            try:
                video_id = None
                if 'youtube.com/watch' in video_url:
                    from urllib.parse import urlparse, parse_qs
                    parsed_url = urlparse(video_url)
                    video_id = parse_qs(parsed_url.query).get('v', [None])[0]
                elif 'youtu.be/' in video_url:
                    video_id = video_url.split('youtu.be/')[1].split('?')[0]
                elif 'youtube.com/embed/' in video_url:
                    video_id = video_url.split('youtube.com/embed/')[1].split('?')[0]
                
                if video_id:
                    representation['video_id'] = video_id
            except Exception as e:
                print(f"Error extracting video ID: {str(e)}")
                
        return representation

class CourseSerializer(serializers.ModelSerializer):
    instructor = InstructorSerializer(read_only=True)
    tags = CourseTagSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    total_students = serializers.IntegerField(source='enrollments.count', read_only=True)
    thumbnail_url = serializers.SerializerMethodField()
    cover_image_url = serializers.SerializerMethodField()
    modules = ModuleSerializer(many=True, read_only=True)
    progress = serializers.SerializerMethodField()
    is_free = serializers.BooleanField(read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'instructor', 'thumbnail_url',
            'cover_image_url', 'price', 'duration_in_weeks', 'difficulty',
            'is_published', 'created_at', 'updated_at', 'category',
            'difficulty_level', 'estimated_duration', 'language',
            'certificate_available', 'course_objectives', 'target_audience',
            'course_features', 'course_requirements', 'course_resources',
            'course_schedule', 'analytics_enabled', 'discussion_enabled',
            'peer_review_enabled', 'auto_grade_enabled', 'proctoring_enabled',
            'offline_access_enabled', 'mobile_compatible', 'accessibility_features',
            'version', 'status', 'average_rating', 'total_students', 'tags',
            'reviews', 'modules', 'progress', 'is_free'
        ]
        read_only_fields = ['instructor', 'created_at', 'updated_at']

    def get_thumbnail_url(self, obj):
        if obj.thumbnail:
            return obj.thumbnail.url
        return None

    def get_cover_image_url(self, obj):
        if obj.cover_image:
            return obj.cover_image.url
        return None

    def get_progress(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            total_lessons = Lesson.objects.filter(
                section__module__course=obj
            ).count()
            if total_lessons == 0:
                return 0
            completed_lessons = UserProgress.objects.filter(
                user=request.user,
                lesson__section__module__course=obj
            ).count()
            return round((completed_lessons / total_lessons) * 100, 2)
        return 0

    def to_representation(self, instance):
        try:
            representation = super().to_representation(instance)
            # Ensure instructor data is properly formatted
            if isinstance(representation.get('instructor'), dict):
                instructor = instance.instructor
                representation['instructor'] = {
                    'id': instructor.id,
                    'username': instructor.username,
                    'name': instructor.full_name if hasattr(instructor, 'full_name') else instructor.get_full_name().strip() or instructor.username,
                    'email': instructor.email
                }
            return representation
        except Exception as e:
            print(f"Error serializing course {instance.id}: {str(e)}")
            return {
                'id': instance.id,
                'title': instance.title,
                'description': instance.description,
                'instructor': {
                    'id': instance.instructor.id,
                    'username': instance.instructor.username,
                    'name': instance.instructor.full_name if hasattr(instance.instructor, 'full_name') else instance.instructor.get_full_name().strip() or instance.instructor.username,
                    'email': instance.instructor.email
                },
                'thumbnail_url': self.get_thumbnail_url(instance),
                'cover_image_url': self.get_cover_image_url(instance),
                'price': str(instance.price),
                'duration_in_weeks': instance.duration_in_weeks,
                'difficulty': instance.difficulty,
                'is_published': instance.is_published,
                'created_at': instance.created_at.isoformat(),
                'updated_at': instance.updated_at.isoformat(),
                'status': instance.status,
                'average_rating': 0,
                'total_students': 0,
                'progress': 0,
                'is_free': False
            }

class CourseListSerializer(serializers.ModelSerializer):
    instructor = serializers.CharField(source='instructor.username')
    category = serializers.CharField(source='category.name')
    thumbnail_url = serializers.SerializerMethodField()
    cover_image_url = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    total_students = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'price', 'instructor', 
            'thumbnail', 'thumbnail_url', 'cover_image_url', 'category', 
            'difficulty', 'duration_in_weeks', 'created_at', 'average_rating',
            'total_students'
        ]

    def get_thumbnail_url(self, obj):
        if obj.thumbnail:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
            return obj.thumbnail.url
        return None

    def get_cover_image_url(self, obj):
        if obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return obj.cover_image.url
        return None

    def get_average_rating(self, obj):
        return obj.reviews.aggregate(avg_rating=models.Avg('rating'))['avg_rating'] or 0

    def get_total_students(self, obj):
        return obj.enrollments.filter(status='active').count()

class EnrollmentSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)
    
    class Meta:
        model = Enrollment
        fields = ['id', 'course', 'status', 'created_at', 'completion_date']
        read_only_fields = ['user']

class ProgressSerializer(serializers.ModelSerializer):
    section_title = serializers.CharField(source='section.title', read_only=True)
    
    class Meta:
        model = Progress
        fields = ['id', 'section', 'section_title', 'completed', 'completed_at']

class UserProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProgress
        fields = ['id', 'user', 'lesson', 'completed_at']

class CourseDetailSerializer(serializers.ModelSerializer):
    modules = ModuleSerializer(many=True, read_only=True)
    is_enrolled = serializers.SerializerMethodField()
    instructor_name = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    thumbnail_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'thumbnail', 'thumbnail_url', 'cover_image',
            'difficulty_level', 'instructor', 'instructor_name',
            'category', 'category_name', 'estimated_duration',
            'price', 'is_published', 'is_featured', 'is_enrolled',
            'course_objectives', 'target_audience', 'modules'
        ]
    
    def get_instructor_name(self, obj):
        return f"{obj.instructor.first_name} {obj.instructor.last_name}"
    
    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        return Enrollment.objects.filter(
            user=request.user,
            course=obj,
            status__in=['active', 'completed']
        ).exists()
        
    def get_thumbnail_url(self, obj):
        if obj.thumbnail:
            return obj.thumbnail.url
        return None