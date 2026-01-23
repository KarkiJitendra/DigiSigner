from django import forms
from .models import Users, Signature, Document, ApiToken

# forms.py
from django import forms
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.db import transaction
import secrets
import re
from datetime import datetime, timedelta
from .models import ApiToken, Users, Organizations

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

class SignatureForm(forms.ModelForm):
    class Meta:
        model = Signature
        fields = ['image']

class DocumentForm(forms.ModelForm):
    class Meta:
        model = Document
        fields = ['title', 'file']


class APITokenCreationForm(forms.ModelForm):
    # Form field constants
    ORGANIZATION_CHOICES = []
    
    EXPIRY_OPTIONS = [
        ('7', 'Short-term (7 days)'),
        ('30', 'Standard (30 days)'),
        ('90', 'Extended (90 days)'),
        ('365', 'Long-term (1 year)'),
        ('custom', 'Custom Date & Time'),
        ('never', 'Never Expire'),
    ]
    
    PERMISSION_CHOICES = [
        ('allow_pdf_signing', 'Allow PDF Signing'),
        ('allow_pdf_verification', 'Allow PDF Verification'),
        ('allow_form_signing', 'Allow Form Signing'),
        ('allow_form_verification', 'Allow Form Verification'),
    ]
    
    PERMISSION_GROUPS = {
        'PDF Operations': ['allow_pdf_signing', 'allow_pdf_verification'],
        'Form Operations': ['allow_form_signing', 'allow_form_verification'],
    }
    
    # Step 1: Basic Information
    organization = forms.ChoiceField(
        choices=[],
        required=False,
        label=_('Organization'),
        widget=forms.Select(attrs={
            'class': 'form-select',
            'id': 'id_organization',
        }),
        help_text=_('Scope token to a specific organization for better access control')
    )
    
    description = forms.CharField(
        max_length=255,
        required=True,
        label=_('Description'),
        widget=forms.Textarea(attrs={
            'class': 'form-textarea',
            'id': 'id_description',
            'placeholder': _('e.g., Production server access for PDF signing'),
            'rows': 3,
        }),
        help_text=_('Provide a meaningful description to identify this token\'s purpose')
    )
    
    user = forms.ModelChoiceField(
        queryset=Users.objects.all(),
        required=True,
        label=_('User'),
        widget=forms.Select(attrs={
            'class': 'form-select',
            'id': 'id_user',
        }),
        help_text=_('Select the user who will own this API token')
    )
    
    expiry_option = forms.ChoiceField(
        choices=EXPIRY_OPTIONS,
        required=True,
        label=_('Token Expiry'),
        widget=forms.RadioSelect(attrs={
            'class': 'expiry-option',
        }),
        initial='30',
        help_text=_('Set when this token should expire. For security, we recommend setting an expiry date.')
    )
    
    custom_date = forms.DateField(
        required=False,
        label=_('Custom Date'),
        widget=forms.DateInput(attrs={
            'class': 'date-picker',
            'type': 'text',
            'placeholder': _('Select date'),
            'id': 'custom_date',
            'disabled': True,
        }),
        input_formats=['%Y-%m-%d']
    )
    
    custom_time = forms.TimeField(
        required=False,
        label=_('Custom Time'),
        widget=forms.TimeInput(attrs={
            'class': 'time-picker',
            'type': 'text',
            'placeholder': _('Select time'),
            'id': 'custom_time',
            'disabled': True,
        }),
        input_formats=['%H:%M']
    )
    
    # Step 2: Permissions (these map to model boolean fields)
    permissions = forms.MultipleChoiceField(
        choices=PERMISSION_CHOICES,
        required=False,
        label=_('Permissions'),
        widget=forms.CheckboxSelectMultiple(attrs={
            'class': 'permission-checkbox',
        }),
        help_text=_('Select what this token is allowed to do')
    )
    
    # Additional Options
    notify_team = forms.BooleanField(
        required=False,
        initial=True,
        label=_('Send notification to team members about this new token'),
        widget=forms.CheckboxInput(attrs={
            'class': 'checkbox-input',
            'id': 'notifyTeam',
        })
    )
    
    auto_renew = forms.BooleanField(
        required=False,
        initial=False,
        label=_('Enable automatic renewal 7 days before expiry'),
        widget=forms.CheckboxInput(attrs={
            'class': 'checkbox-input',
            'id': 'autoRenew',
        })
    )
    
    rate_limit = forms.BooleanField(
        required=False,
        initial=True,
        label=_('Apply standard rate limiting (1000 requests/hour)'),
        widget=forms.CheckboxInput(attrs={
            'class': 'checkbox-input',
            'id': 'rateLimit',
        })
    )
    
    # Hidden fields
    generated_token = forms.CharField(
        required=False,
        widget=forms.HiddenInput(attrs={
            'id': 'generated_token',
        })
    )
    
    class Meta:
        model = ApiToken
        fields = ['user', 'description', 'organization']
        widgets = {
            'user': forms.Select(attrs={'class': 'form-select'}),
            'organization': forms.Select(attrs={'class': 'form-select'}),
        }
    
    def __init__(self, *args, **kwargs):
        self.request = kwargs.pop('request', None)
        self.created_by = kwargs.pop('created_by', None)
        super().__init__(*args, **kwargs)
        
        # Dynamically populate organization choices
        organizations = Organizations.objects.all()
        org_choices = [('', '-- Select Organization --')]
        org_choices.extend([(org.id, org.name) for org in organizations])
        self.fields['organization'].choices = org_choices
        
        # Set initial permissions if editing an existing token
        if self.instance and self.instance.pk:
            self.set_initial_permissions()
            self.set_initial_expiry_option()
        
        # Set initial user to current user if available
        if self.request and self.request.user.is_authenticated:
            try:
                current_user = Users.objects.get(pk=self.request.user.pk)
                self.fields['user'].initial = current_user
            except Users.DoesNotExist:
                pass
        
        # Add CSS classes to all fields
        for field_name, field in self.fields.items():
            if field_name not in ['expiry_option', 'permissions'] and not isinstance(field.widget, forms.HiddenInput):
                if 'class' not in field.widget.attrs:
                    field.widget.attrs['class'] = 'form-control'
    
    def set_initial_permissions(self):
        """Set initial permissions from the model instance."""
        initial_permissions = []
        if self.instance.allow_pdf_signing:
            initial_permissions.append('allow_pdf_signing')
        if self.instance.allow_pdf_verification:
            initial_permissions.append('allow_pdf_verification')
        if self.instance.allow_form_signing:
            initial_permissions.append('allow_form_signing')
        if self.instance.allow_form_verification:
            initial_permissions.append('allow_form_verification')
        
        self.fields['permissions'].initial = initial_permissions
    
    def set_initial_expiry_option(self):
        """Set initial expiry option based on instance expiry date."""
        if not self.instance.expires_at:
            self.fields['expiry_option'].initial = 'never'
        else:
            # Calculate days difference from now
            now = timezone.now()
            expires_at = self.instance.expires_at
            
            # If expiry is in the past, set as expired
            if expires_at < now:
                self.fields['expiry_option'].initial = 'custom'
                self.fields['custom_date'].initial = expires_at.date()
                self.fields['custom_time'].initial = expires_at.time()
            else:
                # Calculate days difference
                delta = expires_at - now
                days = delta.days
                
                # Check if it matches any predefined option
                if days == 7:
                    self.fields['expiry_option'].initial = '7'
                elif days == 30:
                    self.fields['expiry_option'].initial = '30'
                elif days == 90:
                    self.fields['expiry_option'].initial = '90'
                elif days == 365:
                    self.fields['expiry_option'].initial = '365'
                else:
                    # Custom expiry
                    self.fields['expiry_option'].initial = 'custom'
                    self.fields['custom_date'].initial = expires_at.date()
                    self.fields['custom_time'].initial = expires_at.time()
    
    def clean_description(self):
        description = self.cleaned_data.get('description', '').strip()
        
        if not description:
            raise ValidationError(_('Description is required.'))
        
        if len(description) > 255:
            raise ValidationError(_('Description must be 255 characters or less.'))
        
        # Check for suspicious patterns
        suspicious_patterns = [
            r'password\s*[:=]',
            r'token\s*[:=]',
            r'secret\s*[:=]',
            r'key\s*[:=]',
        ]
        
        for pattern in suspicious_patterns:
            if re.search(pattern, description, re.IGNORECASE):
                raise ValidationError(_('Description contains suspicious content. Please use a generic description.'))
        
        return description
    
    def clean_custom_date(self):
        date = self.cleaned_data.get('custom_date')
        expiry_option = self.data.get('expiry_option')
        
        if expiry_option == 'custom' and not date:
            raise ValidationError(_('Please select a date for custom expiry.'))
        
        if date and date < timezone.now().date():
            raise ValidationError(_('Custom expiry date cannot be in the past.'))
        
        return date
    
    def clean_custom_time(self):
        time = self.cleaned_data.get('custom_time')
        expiry_option = self.data.get('expiry_option')
        
        if expiry_option == 'custom' and not time:
            raise ValidationError(_('Please select a time for custom expiry.'))
        
        return time
    
    def clean_permissions(self):
        permissions = self.cleaned_data.get('permissions', [])
        
        if not permissions:
            raise ValidationError(_('Please select at least one permission.'))
        
        return permissions
    
    def clean_organization(self):
        organization_id = self.cleaned_data.get('organization')
        
        if organization_id:
            try:
                organization = Organizations.objects.get(pk=int(organization_id))
                return organization
            except (Organizations.DoesNotExist, ValueError):
                raise ValidationError(_('Selected organization does not exist.'))
        
        # Organization is optional, return None if not selected
        return None
    
    def clean(self):
        cleaned_data = super().clean()
        expiry_option = cleaned_data.get('expiry_option')
        custom_date = cleaned_data.get('custom_date')
        custom_time = cleaned_data.get('custom_time')
        
        # Validate custom expiry option
        if expiry_option == 'custom':
            if not custom_date or not custom_time:
                raise ValidationError({
                    'custom_date': _('Both date and time are required for custom expiry.'),
                    'custom_time': _('Both date and time are required for custom expiry.')
                })
            
            # Combine date and time
            try:
                expiry_datetime = datetime.combine(custom_date, custom_time)
                expiry_datetime = timezone.make_aware(expiry_datetime)
                
                if expiry_datetime < timezone.now():
                    raise ValidationError({
                        'custom_date': _('Custom expiry must be in the future.'),
                        'custom_time': _('Custom expiry must be in the future.')
                    })
                
                # Store calculated expiry datetime
                cleaned_data['calculated_expiry'] = expiry_datetime
            except ValueError:
                raise ValidationError({
                    'custom_date': _('Invalid date/time combination.'),
                    'custom_time': _('Invalid date/time combination.')
                })
        
        # Validate that user doesn't already have an API token
        user = cleaned_data.get('user')
        if user and ApiToken.objects.filter(user=user).exists():
            if not (self.instance and self.instance.pk):
                raise ValidationError({
                    'user': _('This user already has an API token. Each user can only have one token.')
                })
        
        return cleaned_data
    
    def calculate_expiry_date(self):
        """Calculate the expiry date based on the selected option."""
        expiry_option = self.cleaned_data.get('expiry_option')
        
        if expiry_option == 'never':
            # Set expiry to a very distant future date
            return timezone.now() + timedelta(days=365 * 100)  # 100 years
        
        if expiry_option == 'custom':
            return self.cleaned_data.get('calculated_expiry')
        
        # Handle predefined durations
        days = int(expiry_option)
        return timezone.now() + timedelta(days=days)
    
    def generate_token_string(self):
        """Generate a secure API token string."""
        # Generate a cryptographically secure token
        token = secrets.token_urlsafe(32)
        return token
    
    def get_permission_display_names(self):
        """Get display names for selected permissions."""
        permissions = self.cleaned_data.get('permissions', [])
        permission_map = dict(self.PERMISSION_CHOICES)
        return [permission_map.get(perm, perm) for perm in permissions]
    
    def get_organization_display_name(self):
        """Get display name for selected organization."""
        organization = self.cleaned_data.get('organization')
        if organization:
            return organization.name
        return 'Global'
    
    def get_expiry_display(self):
        """Get human-readable expiry information."""
        expiry_option = self.cleaned_data.get('expiry_option')
        
        if expiry_option == 'never':
            return 'Never expires'
        
        if expiry_option == 'custom':
            date = self.cleaned_data.get('custom_date')
            time = self.cleaned_data.get('custom_time')
            if date and time:
                expiry_datetime = datetime.combine(date, time)
                return expiry_datetime.strftime('%B %d, %Y, %I:%M %p')
        
        days = int(expiry_option)
        expiry_date = timezone.now() + timedelta(days=days)
        return expiry_date.strftime('%B %d, %Y, %I:%M %p')
    
    def get_formatted_data(self):
        """Get all form data in a structured format for display."""
        return {
            'user': self.cleaned_data.get('user').username if self.cleaned_data.get('user') else 'Unknown',
            'organization': self.get_organization_display_name(),
            'description': self.cleaned_data.get('description'),
            'expiry': self.get_expiry_display(),
            'permissions': self.get_permission_display_names(),
            'notify_team': self.cleaned_data.get('notify_team', False),
            'auto_renew': self.cleaned_data.get('auto_renew', False),
            'rate_limit': self.cleaned_data.get('rate_limit', True),
        }
    
    @transaction.atomic
    def save(self, commit=True):
        """Save the API token with generated token and calculated expiry."""
        instance = super().save(commit=False)
        
        # Generate token if this is a new instance
        if not instance.pk:
            instance.token = self.generate_token_string()
        
        # Calculate and set expiry date
        instance.expires_at = self.calculate_expiry_date()
        
        # Calculate expiry status (True if expired, False if active)
        instance.expiry_status = instance.expires_at < timezone.now() if instance.expires_at else False
        
        # Set permissions from form data
        permissions = self.cleaned_data.get('permissions', [])
        instance.allow_pdf_signing = 'allow_pdf_signing' in permissions
        instance.allow_pdf_verification = 'allow_pdf_verification' in permissions
        instance.allow_form_signing = 'allow_form_signing' in permissions
        instance.allow_form_verification = 'allow_form_verification' in permissions
        
        # Store the generated token in cleaned_data for display
        self.cleaned_data['generated_token'] = instance.token
        
        # Store additional options in model metadata (if you add a JSONField)
        # For now, we'll handle notifications separately
        
        if commit:
            instance.save()
        
        return instance


class APITokenEditForm(APITokenCreationForm):
    """Form for editing existing API tokens."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Make token field read-only for editing
        if self.instance and self.instance.pk:
            # Disable user field when editing
            self.fields['user'].disabled = True
            self.fields['user'].help_text = _('User cannot be changed for existing tokens.')
            
            # Show current token (masked)
            self.fields['current_token'] = forms.CharField(
                required=False,
                label=_('Current Token'),
                initial=f"{self.instance.token[:8]}...{self.instance.token[-8:]}",
                widget=forms.TextInput(attrs={
                    'class': 'form-control',
                    'readonly': True,
                    'disabled': True,
                }),
                help_text=_('For security reasons, the full token cannot be displayed.')
            )
    
    def clean_user(self):
        """User should not be changed when editing."""
        if self.instance and self.instance.pk:
            return self.instance.user
        return self.cleaned_data.get('user')
    
    def generate_token_string(self):
        """Don't generate new token when editing unless explicitly requested."""
        if self.instance and self.instance.pk:
            return self.instance.token
        return super().generate_token_string()


class APIRegenerateTokenForm(forms.Form):
    """Form for regenerating/revoking API tokens."""
    
    ACTION_CHOICES = [
        ('regenerate', 'Regenerate Token (creates new token, invalidates old one)'),
        ('revoke', 'Revoke Token (immediately invalidates token)'),
        ('extend', 'Extend Expiry (add 30 days to current expiry)'),
    ]
    
    action = forms.ChoiceField(
        choices=ACTION_CHOICES,
        required=True,
        label=_('Action'),
        widget=forms.RadioSelect(attrs={
            'class': 'action-option',
        }),
        initial='regenerate',
        help_text=_('Choose what action to perform on this API token')
    )
    
    reason = forms.CharField(
        required=True,
        label=_('Reason for Action'),
        widget=forms.Textarea(attrs={
            'class': 'form-textarea',
            'placeholder': _('Explain why you are performing this action...'),
            'rows': 3,
        }),
        help_text=_('Please provide a reason for this action for audit purposes')
    )
    
    notify_user = forms.BooleanField(
        required=False,
        initial=True,
        label=_('Notify the token owner about this action'),
        widget=forms.CheckboxInput(attrs={
            'class': 'checkbox-input',
        })
    )
    
    def clean_reason(self):
        reason = self.cleaned_data.get('reason', '').strip()
        
        if not reason:
            raise ValidationError(_('Please provide a reason for this action.'))
        
        if len(reason) < 10:
            raise ValidationError(_('Reason must be at least 10 characters long.'))
        
        return reason


class APITokenFilterForm(forms.Form):
    """Form for filtering API tokens list."""
    
    SEARCH_FIELDS = [
        ('token', 'Token'),
        ('description', 'Description'),
        ('user__username', 'Username'),
        ('organization__name', 'Organization'),
    ]
    
    STATUS_CHOICES = [
        ('', 'All Status'),
        ('active', 'Active'),
        ('expiring_soon', 'Expiring Soon (within 7 days)'),
        ('expired', 'Expired'),
    ]
    
    search = forms.CharField(
        required=False,
        label=_('Search'),
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': _('Search tokens, users, descriptions...'),
        })
    )
    
    search_field = forms.ChoiceField(
        choices=SEARCH_FIELDS,
        required=False,
        initial='description',
        label=_('Search In'),
        widget=forms.Select(attrs={
            'class': 'form-select',
        })
    )
    
    status = forms.ChoiceField(
        choices=STATUS_CHOICES,
        required=False,
        label=_('Status'),
        widget=forms.Select(attrs={
            'class': 'form-select',
        })
    )
    
    organization = forms.ModelChoiceField(
        queryset=Organizations.objects.all(),
        required=False,
        label=_('Organization'),
        widget=forms.Select(attrs={
            'class': 'form-select',
        })
    )
    
    user = forms.ModelChoiceField(
        queryset=Users.objects.all(),
        required=False,
        label=_('User'),
        widget=forms.Select(attrs={
            'class': 'form-select',
        })
    )
    
    date_from = forms.DateField(
        required=False,
        label=_('From Date'),
        widget=forms.DateInput(attrs={
            'class': 'form-control date-picker',
            'type': 'date',
        })
    )
    
    date_to = forms.DateField(
        required=False,
        label=_('To Date'),
        widget=forms.DateInput(attrs={
            'class': 'form-control date-picker',
            'type': 'date',
        })
    )
    
    has_pdf_signing = forms.BooleanField(
        required=False,
        label=_('Has PDF Signing Permission'),
        widget=forms.CheckboxInput(attrs={
            'class': 'form-check-input',
        })
    )
    
    has_form_signing = forms.BooleanField(
        required=False,
        label=_('Has Form Signing Permission'),
        widget=forms.CheckboxInput(attrs={
            'class': 'form-check-input',
        })
    )
    
    def clean(self):
        cleaned_data = super().clean()
        date_from = cleaned_data.get('date_from')
        date_to = cleaned_data.get('date_to')
        
        if date_from and date_to and date_from > date_to:
            raise ValidationError(_('"From Date" cannot be after "To Date".'))
        
        return cleaned_data
    
    def get_filtered_queryset(self, queryset):
        """Apply filters to the queryset."""
        search = self.cleaned_data.get('search')
        search_field = self.cleaned_data.get('search_field')
        status = self.cleaned_data.get('status')
        organization = self.cleaned_data.get('organization')
        user = self.cleaned_data.get('user')
        date_from = self.cleaned_data.get('date_from')
        date_to = self.cleaned_data.get('date_to')
        has_pdf_signing = self.cleaned_data.get('has_pdf_signing')
        has_form_signing = self.cleaned_data.get('has_form_signing')
        
        if search and search_field:
            lookup = f'{search_field}__icontains'
            queryset = queryset.filter(**{lookup: search})
        
        if status:
            now = timezone.now()
            if status == 'active':
                queryset = queryset.filter(expires_at__gt=now)
            elif status == 'expiring_soon':
                seven_days_later = now + timedelta(days=7)
                queryset = queryset.filter(
                    expires_at__gt=now,
                    expires_at__lte=seven_days_later
                )
            elif status == 'expired':
                queryset = queryset.filter(expires_at__lte=now)
        
        if organization:
            queryset = queryset.filter(organization=organization)
        
        if user:
            queryset = queryset.filter(user=user)
        
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)
        
        if has_pdf_signing:
            queryset = queryset.filter(allow_pdf_signing=True)
        
        if has_form_signing:
            queryset = queryset.filter(allow_form_signing=True)
        
        return queryset


class APITokenBulkActionForm(forms.Form):
    """Form for bulk actions on API tokens."""
    
    ACTION_CHOICES = [
        ('revoke', 'Revoke Selected Tokens'),
        ('extend_30', 'Extend Expiry by 30 Days'),
        ('extend_90', 'Extend Expiry by 90 Days'),
        ('regenerate', 'Regenerate Selected Tokens'),
        ('delete', 'Delete Selected Tokens'),
    ]
    
    action = forms.ChoiceField(
        choices=ACTION_CHOICES,
        required=True,
        label=_('Bulk Action'),
        widget=forms.Select(attrs={
            'class': 'form-select',
        })
    )
    
    token_ids = forms.CharField(
        required=True,
        widget=forms.HiddenInput()
    )
    
    reason = forms.CharField(
        required=True,
        label=_('Reason for Action'),
        widget=forms.Textarea(attrs={
            'class': 'form-textarea',
            'placeholder': _('Explain why you are performing this bulk action...'),
            'rows': 3,
        }),
        help_text=_('Please provide a reason for this action for audit purposes')
    )
    
    notify_users = forms.BooleanField(
        required=False,
        initial=True,
        label=_('Notify token owners about this action'),
        widget=forms.CheckboxInput(attrs={
            'class': 'checkbox-input',
        })
    )
    
    def clean_token_ids(self):
        token_ids = self.cleaned_data.get('token_ids', '')
        if not token_ids:
            raise ValidationError(_('No tokens selected.'))
        
        try:
            # Convert comma-separated string to list of integers
            ids = [int(id.strip()) for id in token_ids.split(',') if id.strip().isdigit()]
            if not ids:
                raise ValidationError(_('Invalid token IDs provided.'))
            return ids
        except ValueError:
            raise ValidationError(_('Invalid token IDs provided.'))
    
    def clean_reason(self):
        reason = self.cleaned_data.get('reason', '').strip()
        
        if not reason:
            raise ValidationError(_('Please provide a reason for this action.'))
        
        if len(reason) < 10:
            raise ValidationError(_('Reason must be at least 10 characters long.'))
        
        return reason