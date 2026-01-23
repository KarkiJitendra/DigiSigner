from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path('', views.register, name='register'),
    path('login/', views.login_view, name='login'), 
    path('dashboard/', views.dashboard, name='dashboard'),
    path('signature/upload/', views.upload_signature, name='upload_signature'),
    path('keys/generate/', views.generate_keys, name='generate_keys'),
    path('document/upload/', views.upload_document, name='upload_document'),
    path('document/<int:document_id>/sign/', views.sign_document, name='sign_document'),
    path('document/verify/', views.verify_document, name='verify_document'),
    path('api_tokens/', views.api_tokens_view, name='api_token'),
    path('api_tokens/generate/', views.add_api_token_view, name='generate_token_view'),

    path('logout/', auth_views.LogoutView.as_view(next_page='login'), name='logout'),
]