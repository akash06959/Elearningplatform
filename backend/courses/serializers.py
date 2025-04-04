from rest_framework import serializers
from .models import Category, Course, Section, Lesson, Review, CourseTag, Module, UserProgress
from enrollments.models import Enrollment, Progress
from django.contrib.auth.models import User

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
    lessons = LessonSerializer(many=True, read_only=True)
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Section
        fields = [
            'id', 'course', 'title', 'description', 'order',
            'is_published', 'release_date', 'due_date',
            'estimated_duration', 'completion_criteria',
            'resources', 'lessons', 'progress'
        ]

    def get_progress(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            total_lessons = obj.lessons.count()
            if total_lessons == 0:
                return 0
            completed_lessons = UserProgress.objects.filter(
                user=request.user,
                lesson__section=obj
            ).count()
            return round((completed_lessons / total_lessons) * 100, 2)
        return 0

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
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = [
            'id', 'title', 'description', 'order',
            'sections', 'progress'
        ]

    def get_progress(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            total_lessons = Lesson.objects.filter(section__module=obj).count()
            if total_lessons == 0:
                return 0
            completed_lessons = UserProgress.objects.filter(
                user=request.user,
                lesson__section__module=obj
            ).count()
            return round((completed_lessons / total_lessons) * 100, 2)
        return 0

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
            'reviews', 'modules', 'progress'
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
                'progress': 0
            }

class CourseListSerializer(serializers.ModelSerializer):
    category = serializers.StringRelatedField()
    
    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'price', 'instructor', 'thumbnail', 'category', 'created_at']

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