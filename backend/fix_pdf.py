import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'elearning_backend.settings')
django.setup()

# Import models
from courses.models import Module, Section

# Fix functions
def fix_section_pdfs():
    """Copy PDF information from modules to their sections"""
    try:
        # Get the module with ID 1
        module = Module.objects.get(id=1)
        print(f"Found module: {module.title}")
        print(f"Module content type: {module.content_type}")
        print(f"Module PDF URL: {module.pdf_url}")
        
        # Get all sections for this module
        sections = Section.objects.filter(module=module)
        print(f"Found {len(sections)} sections")
        
        # Update each section
        for section in sections:
            print(f"Updating section: {section.title} (ID: {section.id})")
            
            # Set the content type to PDF
            section.content_type = 'pdf'
            
            # Copy the PDF URL from the module
            section.pdf_url = module.pdf_url
            
            # Save the changes
            section.save()
            
            print(f"Updated section {section.id}: content_type = {section.content_type}, pdf_url = {section.pdf_url}")
        
        print("All sections updated successfully")
    
    except Module.DoesNotExist:
        print("Module with ID 1 not found")
    except Exception as e:
        print(f"Error: {str(e)}")

# Run the fix
if __name__ == "__main__":
    fix_section_pdfs() 