from django.core.management.base import BaseCommand
from courses.models import Category

class Command(BaseCommand):
    help = 'Seeds the database with default course categories'

    def handle(self, *args, **options):
        categories = [
            {
                'name': 'Programming',
                'description': 'Courses related to programming and software development'
            },
            {
                'name': 'Web Development',
                'description': 'Courses for creating web applications and websites'
            },
            {
                'name': 'Data Science',
                'description': 'Courses on data analysis, machine learning, and AI'
            },
            {
                'name': 'Mobile Development',
                'description': 'Courses for creating mobile applications'
            },
            {
                'name': 'Design',
                'description': 'Courses on graphic design, UI/UX, and digital art'
            },
            {
                'name': 'Business',
                'description': 'Courses on business management, entrepreneurship, and marketing'
            },
            {
                'name': 'Mathematics',
                'description': 'Courses on various mathematics topics'
            },
            {
                'name': 'Science',
                'description': 'Courses on physics, chemistry, biology, and more'
            },
        ]
        
        created_count = 0
        existing_count = 0
        
        for category_data in categories:
            category, created = Category.objects.get_or_create(
                name=category_data['name'],
                defaults={'description': category_data['description']}
            )
            
            if created:
                created_count += 1
            else:
                existing_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully seeded categories: {created_count} created, {existing_count} already existed'
            )
        ) 