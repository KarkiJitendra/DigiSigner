from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth.forms import AuthenticationForm
from django.core.files import File
from django.conf import settings
import os
from .forms import *
from .models import *
from .models import *
from .utils import sign_pdf, calculate_hash, generate_key_pair, encrypt_private_key, decrypt_private_key, sign_hash, verify_signature



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

@login_required
def dashboard(request):
    documents = Document.objects.filter(user=request.user).order_by('-updated_at')
    try:
        has_keys = hasattr(request.user, 'key_pair')
    except:
        has_keys = False
    return render(request, 'users/dashboard.html', {'documents': documents, 'has_keys': has_keys})

@login_required
def upload_signature(request):
    if request.method == 'POST':
        form = SignatureForm(request.POST, request.FILES)
        if form.is_valid():
            signature = form.save(commit=False)
            signature.user = request.user
            signature.save()
            messages.success(request, 'Signature uploaded successfully.')
            return redirect('dashboard')
    else:
        # Check if user already has a signature
        existing_sig = Signature.objects.filter(user=request.user).first()
        form = SignatureForm(instance=existing_sig) if existing_sig else SignatureForm()
        
    return render(request, 'signatures/upload.html', {'form': form})

@login_required
def generate_keys(request):
    if request.method == 'POST':
        # Check if keys already exist
        if hasattr(request.user, 'key_pair'):
             messages.warning(request, 'You already have a key pair.')
             return redirect('dashboard')
             
        private_pem, public_pem = generate_key_pair()
        encrypted_private = encrypt_private_key(private_pem)
        
        UserKey.objects.create(
            user=request.user,
            public_key=public_pem,
            private_key=encrypted_private
        )
        messages.success(request, 'Cryptographic keys generated successfully.')
        return redirect('dashboard')
    
    return render(request, 'users/generate_keys.html')

@login_required
def upload_document(request):
    if request.method == 'POST':
        form = DocumentForm(request.POST, request.FILES)
        if form.is_valid():
            document = form.save(commit=False)
            document.user = request.user
            document.save()
            messages.success(request, 'Document uploaded successfully.')
            return redirect('dashboard') # Should redirect to list eventually
    else:
        form = DocumentForm()
    return render(request, 'documents/upload.html', {'form': form})

@login_required
def sign_document(request, document_id):
    document = get_object_or_404(Document, id=document_id, user=request.user)
    signature = Signature.objects.filter(user=request.user).first()
    
    if not signature:
        messages.error(request, 'Please upload a signature first.')
        return redirect('upload_signature')

    if request.method == 'POST':
        output_filename = f"signed_{document.file.name.split('/')[-1]}"
        output_path = os.path.join(settings.MEDIA_ROOT, 'documents/signed', output_filename)
        
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        try:
            sign_pdf(document.file.path, signature.image.path, output_path)
            
            with open(output_path, 'rb') as f:
                document.signed_file.save(output_filename, File(f), save=True)
            
            document.hash_value = calculate_hash(document.signed_file.path)
            
            # Cryptographic Signing
            if hasattr(request.user, 'key_pair'):
                user_keys = request.user.key_pair
                decrypted_private_key = decrypt_private_key(user_keys.private_key)
                signature = sign_hash(document.hash_value, decrypted_private_key)
                document.signature_data = signature
            else:
                 messages.warning(request, 'Document signed visually, but NO cryptographic signature added (No keys found).')
            
            document.save()

            messages.success(request, 'Document signed successfully.')
            return redirect('dashboard')
        except Exception as e:
            messages.error(request, f'Error signing document: {e}')
            
    return render(request, 'documents/sign.html', {'document': document})

def verify_document(request):
    verification_result = None
    if request.method == 'POST' and 'file' in request.FILES:
        uploaded_file = request.FILES['file']
        
        # Save temp file to calculate hash
        temp_path = os.path.join(settings.MEDIA_ROOT, 'temp', uploaded_file.name)
        os.makedirs(os.path.dirname(temp_path), exist_ok=True)
        
        with open(temp_path, 'wb+') as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)
                
        file_hash = calculate_hash(temp_path)
        os.remove(temp_path) # Cleanup
        
        # Check against DB
        try:
            doc = Document.objects.get(hash_value=file_hash)
            verification_result = {
                'valid': True, 
                'doc': doc,
                'message': f"Document verified! Signed by {doc.user.username} on {doc.updated_at}."
            }
            
            # Verify Cryptographic Signature if present
            if doc.signature_data and hasattr(doc.user, 'key_pair'):
                is_valid = verify_signature(file_hash, doc.signature_data, doc.user.key_pair.public_key)
                if is_valid:
                    verification_result['message'] += " [Valid Cryptographic Signature]"
                else:
                    verification_result['message'] += " [INVALID Cryptographic Signature]"
                    verification_result['valid'] = False
            elif doc.signature_data:
                 verification_result['message'] += " [Signed, but public key missing]"
            else:
                 verification_result['message'] += " [No Cryptographic Signature found]"
        except Document.DoesNotExist:
            verification_result = {
                'valid': False, 
                'message': "Document hash not found. This document may be invalid or not signed by our platform."
            }
            
    return render(request, 'documents/verify.html', {'result': verification_result})