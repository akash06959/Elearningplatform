from django.core.management.base import BaseCommand
from courses.models import Category

class Command(BaseCommand):
    help = 'Creates default course categories'

    def handle(self, *args, **kwargs):
        categories = [
            {
                'name': 'Programming',
                'description': 'Learn programming languages and software development'
            },
            {
                'name': 'Web Development',
                'description': 'Master web technologies and frameworks'
            },
            {
                'name': 'Data Science',
                'description': 'Explore data analysis, machine learning, and statistics'
            },
            {
                'name': 'Mobile Development',
                'description': 'Build mobile applications for iOS and Android'
            },
            {
                'name': 'Design',
                'description': 'Learn UI/UX design, graphic design, and digital art'
            },
            {
                'name': 'Business',
                'description': 'Study business management, marketing, and entrepreneurship'
            },
            {
                'name': 'Mathematics',
                'description': 'Learn mathematics, from basics to advanced topics'
            },
            {
                'name': 'Science',
                'description': 'Study various scientific disciplines'
            }
        ]

        for category_data in categories:
            category, created = Category.objects.get_or_create(
                name=category_data['name'],
                defaults={'description': category_data['description']}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created category "{category.name}"'))
            else:
                self.stdout.write(f'Category "{category.name}" already exists') 