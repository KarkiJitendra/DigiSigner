from django.contrib import admin

# Register your models here.
from .models import Users, Organizations, Signature, Document, UserKey, ApiToken
# admin.py
from django.contrib import admin
from django.urls import path
from django.shortcuts import render, redirect
from django.contrib import messages
from django.utils.html import format_html
from django.utils import timezone
from datetime import timedelta
from .models import ApiToken
from .forms import APITokenCreationForm, APITokenEditForm, APIRegenerateTokenForm, APITokenBulkActionForm

admin.site.register(Users)
admin.site.register(Organizations)
admin.site.register(Signature)
admin.site.register(Document)
admin.site.register(UserKey)
admin.site.register(ApiToken)


class ApiTokenAdmin(admin.ModelAdmin):
    list_display = ('token_preview', 'user', 'organization', 'expires_at', 'expiry_status_display', 
                    'permissions_display', 'created_at')
    list_filter = ('expiry_status', 'organization', 'created_at', 'allow_pdf_signing', 
                   'allow_pdf_verification', 'allow_form_signing', 'allow_form_verification')
    search_fields = ('token', 'description', 'user__username', 'organization__name')
    readonly_fields = ('token', 'created_at', 'updated_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'organization', 'description', 'token')
        }),
        ('Expiry Information', {
            'fields': ('expires_at', 'expiry_status')
        }),
        ('Permissions', {
            'fields': ('allow_pdf_signing', 'allow_pdf_verification', 
                      'allow_form_signing', 'allow_form_verification')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('add/', self.admin_site.admin_view(self.add_api_token_view), name='api_token_add'),
            path('<int:token_id>/regenerate/', self.admin_site.admin_view(self.regenerate_token_view), name='api_token_regenerate'),
            path('bulk-action/', self.admin_site.admin_view(self.bulk_action_view), name='api_token_bulk_action'),
        ]
        return custom_urls + urls
    
    def token_preview(self, obj):
        """Display masked token in list view."""
        if obj.token:
            return format_html('<code>{}</code>', f"{obj.token[:8]}...{obj.token[-8:]}")
        return "-"
    token_preview.short_description = 'Token'
    
    def expiry_status_display(self, obj):
        """Display expiry status with colored badge."""
        now = timezone.now()
        
        if not obj.expires_at:
            return format_html('<span class="badge badge-secondary">Never Expires</span>')
        
        if obj.expires_at < now:
            return format_html('<span class="badge badge-danger">Expired</span>')
        
        # Check if expiring soon (within 7 days)
        if obj.expires_at - now <= timedelta(days=7):
            return format_html('<span class="badge badge-warning">Expiring Soon</span>')
        
        return format_html('<span class="badge badge-success">Active</span>')
    expiry_status_display.short_description = 'Status'
    
    def permissions_display(self, obj):
        """Display permissions as badges."""
        badges = []
        if obj.allow_pdf_signing:
            badges.append('<span class="badge badge-primary">PDF Sign</span>')
        if obj.allow_pdf_verification:
            badges.append('<span class="badge badge-info">PDF Verify</span>')
        if obj.allow_form_signing:
            badges.append('<span class="badge badge-success">Form Sign</span>')
        if obj.allow_form_verification:
            badges.append('<span class="badge badge-secondary">Form Verify</span>')
        
        if not badges:
            return format_html('<span class="text-muted">No permissions</span>')
        
        return format_html(' '.join(badges))
    permissions_display.short_description = 'Permissions'
    
    def add_api_token_view(self, request):
        """Custom view for adding API tokens with enhanced UI."""
        if request.method == 'POST':
            form = APITokenCreationForm(request.POST, request=request)
            if form.is_valid():
                try:
                    token = form.save()
                    
                    # Store token in session for display in success page
                    request.session['generated_token'] = token.token
                    request.session['token_description'] = token.description
                    
                    messages.success(request, f'API token generated successfully!')
                    return redirect('admin:api_token_success')
                except Exception as e:
                    messages.error(request, f'Error generating token: {str(e)}')
        else:
            form = APITokenCreationForm(request=request)
        
        context = {
            **self.admin_site.each_context(request),
            'title': 'Generate New API Token',
            'form': form,
            'opts': self.model._meta,
            'add': True,
            'change': False,
            'is_popup': False,
            'save_as': False,
            'has_delete_permission': False,
            'has_add_permission': True,
            'has_change_permission': True,
            'has_view_permission': True,
        }
        
        return render(request, 'admin/add_api_token.html', context)
    
    def change_view(self, request, object_id, form_url='', extra_context=None):
        """Override change view to use our custom form."""
        if extra_context is None:
            extra_context = {}
        
        token = self.get_object(request, object_id)
        
        if request.method == 'POST':
            form = APITokenEditForm(request.POST, instance=token, request=request)
            if form.is_valid():
                form.save()
                messages.success(request, 'API token updated successfully!')
                return redirect('admin:api_token_changelist')
        else:
            form = APITokenEditForm(instance=token, request=request)
        
        extra_context['form'] = form
        extra_context['show_save'] = True
        extra_context['show_save_and_continue'] = True
        extra_context['show_save_and_add_another'] = False
        
        return super().change_view(request, object_id, form_url, extra_context)
    
    def regenerate_token_view(self, request, token_id):
        """View for regenerating or revoking tokens."""
        try:
            token = ApiToken.objects.get(pk=token_id)
        except ApiToken.DoesNotExist:
            messages.error(request, 'Token not found.')
            return redirect('admin:api_token_changelist')
        
        if request.method == 'POST':
            form = APIRegenerateTokenForm(request.POST)
            if form.is_valid():
                action = form.cleaned_data['action']
                reason = form.cleaned_data['reason']
                
                if action == 'regenerate':
                    # Generate new token
                    import secrets
                    old_token = token.token
                    token.token = secrets.token_urlsafe(32)
                    token.expires_at = timezone.now() + timedelta(days=30)
                    token.save()
                    
                    messages.success(request, f'Token regenerated. Old token: {old_token[:8]}... is now invalid.')
                    
                elif action == 'revoke':
                    # Immediately expire the token
                    token.expires_at = timezone.now()
                    token.expiry_status = True
                    token.save()
                    
                    messages.warning(request, 'Token has been revoked.')
                    
                elif action == 'extend':
                    # Extend expiry by 30 days
                    token.expires_at = token.expires_at + timedelta(days=30) if token.expires_at else timezone.now() + timedelta(days=30)
                    token.expiry_status = False
                    token.save()
                    
                    messages.info(request, 'Token expiry extended by 30 days.')
                
                # Log the action (you should implement logging)
                # log_action(request.user, f'{action} token: {reason}')
                
                return redirect('admin:api_token_changelist')
        else:
            form = APIRegenerateTokenForm()
        
        context = {
            **self.admin_site.each_context(request),
            'title': f'Manage Token: {token.description}',
            'token': token,
            'form': form,
            'opts': self.model._meta,
        }
        
        return render(request, 'admin/regenerate_token.html', context)
    
    def bulk_action_view(self, request):
        """View for bulk actions on tokens."""
        if request.method == 'POST':
            form = APITokenBulkActionForm(request.POST)
            if form.is_valid():
                token_ids = form.cleaned_data['token_ids']
                action = form.cleaned_data['action']
                reason = form.cleaned_data['reason']
                
                tokens = ApiToken.objects.filter(pk__in=token_ids)
                count = tokens.count()
                
                if action == 'revoke':
                    now = timezone.now()
                    tokens.update(expires_at=now, expiry_status=True)
                    messages.warning(request, f'{count} tokens have been revoked.')
                
                elif action == 'extend_30':
                    for token in tokens:
                        if token.expires_at:
                            token.expires_at = token.expires_at + timedelta(days=30)
                        else:
                            token.expires_at = timezone.now() + timedelta(days=30)
                        token.expiry_status = False
                        token.save()
                    messages.info(request, f'{count} tokens extended by 30 days.')
                
                elif action == 'extend_90':
                    for token in tokens:
                        if token.expires_at:
                            token.expires_at = token.expires_at + timedelta(days=90)
                        else:
                            token.expires_at = timezone.now() + timedelta(days=90)
                        token.expiry_status = False
                        token.save()
                    messages.info(request, f'{count} tokens extended by 90 days.')
                
                elif action == 'regenerate':
                    import secrets
                    for token in tokens:
                        token.token = secrets.token_urlsafe(32)
                        token.expires_at = timezone.now() + timedelta(days=30)
                        token.save()
                    messages.success(request, f'{count} tokens regenerated.')
                
                elif action == 'delete':
                    deleted_count, _ = tokens.delete()
                    messages.error(request, f'{deleted_count} tokens have been deleted.')
                
                # Log bulk action
                # log_bulk_action(request.user, action, count, reason)
                
                return redirect('admin:api_token_changelist')
        else:
            token_ids = request.GET.get('ids', '')
            form = APITokenBulkActionForm(initial={'token_ids': token_ids})
        
        context = {
            **self.admin_site.each_context(request),
            'title': 'Bulk Action on API Tokens',
            'form': form,
            'opts': self.model._meta,
        }
        
        return render(request, 'admin/bulk_action.html', context)
    
    class Media:
        css = {
            'all': ('admin/css/api_tokens.css',)
        }
        js = ('admin/js/api_tokens.js',)

# Register the admin