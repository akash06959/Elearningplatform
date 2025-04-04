# enrollments/admin.py
from django.contrib import admin
from .models import Enrollment, Progress

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'status', 'enrolled_at', 'completed_at', 'progress_percentage')
    list_filter = ('status', 'enrolled_at', 'completed_at', 'certificate_issued')
    search_fields = ('user__username', 'course__title', 'notes')
    readonly_fields = ('enrolled_at', 'last_accessed', 'progress_percentage')
    ordering = ('-enrolled_at',)

@admin.register(Progress)
class ProgressAdmin(admin.ModelAdmin):
    list_display = ('enrollment', 'lesson', 'completed', 'completed_at', 'time_spent', 'score')
    list_filter = ('completed', 'completed_at')
    search_fields = ('enrollment__user__username', 'lesson__title', 'notes')
    readonly_fields = ('completed_at', 'last_accessed', 'time_spent')
    ordering = ('lesson__section__order', 'lesson__order') 