from django.shortcuts import redirect

def login_redirect(request):
    """
    Redirects legacy login calls to the React frontend login page.
    This prevents 500 errors from Django internals that expect a 'login' named route.
    """
    return redirect('/login')
