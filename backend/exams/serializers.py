from rest_framework import serializers
from .models import Exam, Question, ExamAttempt

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = [
            'id', 'exam', 'question_text', 'question_type',
            'marks', 'options', 'explanation', 'order'
        ]
        read_only_fields = ['exam']

class ExamAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamAttempt
        fields = [
            'id', 'exam', 'user', 'start_time', 'end_time',
            'status', 'score', 'answers', 'feedback'
        ]
        read_only_fields = ['user', 'start_time', 'end_time', 'score']

class ExamSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    attempts = ExamAttemptSerializer(many=True, read_only=True)
    total_attempts = serializers.IntegerField(source='attempts.count', read_only=True)
    average_score = serializers.FloatField(read_only=True)

    class Meta:
        model = Exam
        fields = [
            'id', 'title', 'description', 'exam_type', 'duration',
            'total_marks', 'passing_marks', 'instructions', 'is_proctored',
            'is_published', 'start_time', 'end_time', 'questions', 'attempts',
            'total_attempts', 'average_score'
        ] 