def enrolled_courses(request):
    if request.user.is_authenticated:
        try:
            enrolled_courses = Course.objects.filter(students=request.user)
            context = {
                'enrolled_courses': enrolled_courses
            }
            return render(request, 'courses/enrolled_courses.html', context)
        except Exception as e:
            # Log the error for debugging
            print(f"Error loading enrolled courses: {str(e)}")
            # Return empty list instead of error
            context = {
                'enrolled_courses': []
            }
            return render(request, 'courses/enrolled_courses.html', context)
    return redirect('login')