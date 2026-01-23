from django.db import models
from django.contrib.auth.models import AbstractUser

class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        
        
class Users(TimeStampedModel, AbstractUser):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    contact= models.IntegerField(unique=True)
    password = models.CharField(max_length=128)
    confirm_password = models.CharField(max_length=128)
    
    
    def __str__(self):
        return self.email

class Organizations(TimeStampedModel):
    name = models.CharField(max_length=150, unique=True)
    
    

class Signature(TimeStampedModel):
    user = models.ForeignKey(Users, on_delete=models.CASCADE)
    image = models.ImageField(upload_to='signatures/',null=True, blank=True)

    def __str__(self):
        return f"{self.user.username}'s signature"

class Document(TimeStampedModel):
    user = models.ForeignKey(Users, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='documents/original/', null=False, blank=False)
    signed_file = models.FileField(upload_to='documents/signed/', null=True, blank=True)
    hash_value = models.CharField(max_length=64, blank=True, null=True)
    signature_data = models.TextField(blank=True, null=True) # Cryptographic signature

    def __str__(self):
        return self.title

class UserKey(TimeStampedModel):
    user = models.OneToOneField(Users, on_delete=models.CASCADE, related_name='key_pair')
    public_key = models.TextField()
    private_key = models.TextField() # Encrypted

    def __str__(self):
        return f"Keys for {self.user.username}"


class ApiToken(TimeStampedModel):
    user = models.OneToOneField(Users, on_delete=models.CASCADE, related_name='api_token')
    token = models.CharField(max_length=255, unique=True)
    expires_at = models.DateTimeField()
    expiry_status = models.BooleanField(default=False)
    description = models.TextField(max_length=255)
    organization = models.ForeignKey(Organizations, on_delete=models.CASCADE)
    allow_pdf_signing = models.BooleanField(default=False)
    allow_pdf_verification = models.BooleanField(default=False)
    allow_form_signing = models.BooleanField(default=False)
    allow_form_verification = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.token


    
