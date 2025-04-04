from rest_framework import serializers
from .models import Enrollment, Progress
from courses.models import Course, Section, Lesson

class EnrollmentSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_thumbnail = serializers.ImageField(source='course.thumbnail', read_only=True)
    instructor_name = serializers.CharField(source='course.instructor.username', read_only=True)
    progress_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = Enrollment
        fields = [
            'id', 'user', 'course', 'course_title', 'course_thumbnail',
            'instructor_name', 'enrolled_at', 'completed_at', 'status',
            'progress_percentage'
        ]
        read_only_fields = ['user', 'enrolled_at', 'completed_at', 'status']
    
    def get_progress_percentage(self, obj):
        total_lessons = Lesson.objects.filter(section__course=obj.course).count()
        if total_lessons == 0:
            return 0
        completed_lessons = Progress.objects.filter(
            enrollment=obj,
            lesson__section__course=obj.course,
            completed_at__isnull=False
        ).count()
        return int((completed_lessons / total_lessons) * 100)

class ProgressSerializer(serializers.ModelSerializer):
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    section_title = serializers.CharField(source='lesson.section.title', read_only=True)
    
    class Meta:
        model = Progress
        fields = [
            'id', 'enrollment', 'lesson', 'lesson_title', 'section_title',
            'completed_at'
        ]
        read_only_fields = ['enrollment', 'completed_at'] 