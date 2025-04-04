from django.contrib import admin
from .models import (
    Course, Category, Module, Section, Lesson,
    Quiz, Assignment, Review, CourseTag,
    UserProgress
)

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'instructor', 'category', 'difficulty_level', 'is_published']
    list_filter = ['category', 'difficulty_level', 'is_published', 'enrollment_type']
    search_fields = ['title', 'description']
    date_hierarchy = 'created_at'

@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'order']
    list_filter = ['course']
    search_fields = ['title', 'description']
    ordering = ['course', 'order']

class SectionInline(admin.TabularInline):
    model = Section
    extra = 1

@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ['title', 'module', 'order', 'is_published']
    list_filter = ['module__course', 'is_published']
    search_fields = ['title', 'description']
    ordering = ['module', 'order']

    def get_module_course(self, obj):
        return obj.module.course
    get_module_course.short_description = 'Course'
    get_module_course.admin_order_field = 'module__course'

class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 1

@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ['title', 'section', 'content_type', 'order', 'is_published']
    list_filter = ['section__module__course', 'content_type', 'is_published']
    search_fields = ['title', 'description']
    ordering = ['section', 'order']

@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ['title', 'lesson', 'passing_score', 'time_limit']
    list_filter = ['lesson__section__module__course']
    search_fields = ['title', 'description']

@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ['title', 'lesson', 'max_score', 'due_date']
    list_filter = ['lesson__section__module__course']
    search_fields = ['title', 'description']

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['course', 'user', 'rating', 'created_at']
    list_filter = ['course', 'rating']
    search_fields = ['comment']
    date_hierarchy = 'created_at'

@admin.register(CourseTag)
class CourseTagAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name', 'description']

@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'lesson', 'completed_at']
    list_filter = ['user', 'lesson__section__module__course']
    search_fields = ['user__username', 'lesson__title']
    date_hierarchy = 'completed_at'