from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.contrib.auth.forms import AuthenticationForm
from .forms import *



def register(request):
    # Initialize form variable outside the if/else or in both branches
    if request.method == 'POST':
        form = UserForm(request.POST)
        if form.is_valid():
            user=form.save(commit=False)
            raw_password = form.cleaned_data.get('password')
            user.set_password(raw_password)
            form.save()
            return redirect('login')
    else:
        # This handles the 'GET' request (initial page load)
        form = UserForm()

    # Now 'form' is guaranteed to exist whether it was a POST or GET
    return render(request, 'users/register.html', {'form': form})

def login_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
    
    if request.method == 'POST':
        # AuthenticationForm handles the authenticate() call internally
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            # Use the form's helper to get the authenticated user
            user = form.get_user() 
            
            login(request, user)
            messages.success(request, f'Welcome back!')
            
            return redirect('dashboard')
        else:
            # If the form is invalid, Django usually attaches "invalid password" 
            # errors to the form itself.
            messages.error(request, 'Invalid email or password.')
    else:
        form = AuthenticationForm()
    
    return render(request, 'users/login.html', {
        'form': form,
        'next': request.GET.get('next', '')
    })

def logout_view(request):
    # This removes the user ID from the session and deletes the session cookie
    logout(request)
    
    # Add a success message to show on the login page
    messages.info(request, "You have successfully logged out.")
    
    # Redirect to the login page or home page
    return redirect('login')

def dashboard(request):
    return render(request, 'users/dashboard.html')