from django import forms
from .models import Users

class UserForm(forms.ModelForm):
    # Field not in model but needed for validation
    confirm_password = forms.CharField(
        widget=forms.PasswordInput(attrs={'placeholder': 'Re-enter your password'})
    )
    terms = forms.BooleanField(required=True)

    class Meta:
        model = Users
        fields = ['username', 'email', 'contact', 'password']
        widgets = {
            'username': forms.TextInput(attrs={'placeholder': 'Enter your full name'}),
            'email': forms.EmailInput(attrs={'placeholder': 'Enter your email address'}),
            'contact': forms.TextInput(attrs={'placeholder': 'Enter your phone number'}),
            'password': forms.PasswordInput(attrs={'placeholder': 'Create a strong password'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Automatically add the 'input' or custom class to all fields
        for field in self.fields.values():
            field.widget.attrs.update({'class': 'my-input-class'}) # Optional