// login.js - Login-specific JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const rememberCheckbox = document.getElementById('remember');
    const twoFactorBtns = document.querySelectorAll('.two-factor-btn');
    
    // Initialize form
    initLoginForm();
    
    // Toggle password visibility
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function() {
            togglePasswordVisibility(passwordInput, this);
        });
    }
    
    // Form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            if (!validateLoginForm()) {
                e.preventDefault();
            } else {
                // Show loading state
                const submitBtn = this.querySelector('button[type="submit"]');
                if (submitBtn) {
                    const originalText = submitBtn.innerHTML;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
                    submitBtn.disabled = true;
                    
                    // Re-enable after 5 seconds in case of error
                    setTimeout(() => {
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                    }, 5000);
                }
            }
        });
    }
    
    // Two-factor authentication buttons
    if (twoFactorBtns.length > 0) {
        twoFactorBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                twoFactorBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Store preference in localStorage
                const method = this.querySelector('i').className.split(' ')[1];
                localStorage.setItem('preferred-2fa-method', method);
            });
        });
    }
    
    // Auto-fill username if remembered
    const rememberedUsername = localStorage.getItem('remembered-username');
    if (rememberedUsername && !document.getElementById('username').value) {
        document.getElementById('username').value = rememberedUsername;
        if (rememberCheckbox) {
            rememberCheckbox.checked = true;
        }
    }
    
    // Handle remember me checkbox
    if (rememberCheckbox) {
        rememberCheckbox.addEventListener('change', function() {
            const usernameInput = document.getElementById('username');
            if (this.checked && usernameInput.value) {
                localStorage.setItem('remembered-username', usernameInput.value);
            } else {
                localStorage.removeItem('remembered-username');
            }
        });
    }
    
    // Auto-focus on username field if empty
    const usernameField = document.getElementById('username');
    if (usernameField && !usernameField.value) {
        setTimeout(() => {
            usernameField.focus();
        }, 300);
    }
    
    // Check for URL parameters for special messages
    checkUrlParameters();
});

/**
 * Initialize login form
 */
function initLoginForm() {
    console.log('SecureSign Login Form Initialized');
    
    // Add CSRF token handling
    const csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]');
    if (csrfToken) {
        console.log('CSRF token loaded');
    }
}

/**
 * Validate login form
 */
function validateLoginForm() {
    let isValid = true;
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    // Clear previous error messages
    clearErrorMessages();
    
    // Username validation
    if (!usernameInput.value.trim()) {
        showError(usernameInput, 'Please enter your email or username');
        isValid = false;
    }
    
    // Password validation
    if (!passwordInput.value) {
        showError(passwordInput, 'Please enter your password');
        isValid = false;
    } else if (passwordInput.value.length < 6) {
        showError(passwordInput, 'Password must be at least 6 characters');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Toggle password visibility (reused from registration.js)
 */
function togglePasswordVisibility(passwordInput, toggleButton) {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Toggle eye icon
    const icon = toggleButton.querySelector('i');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
    
    // Update aria-label for accessibility
    const isVisible = type === 'text';
    toggleButton.setAttribute('aria-label', isVisible ? 'Hide password' : 'Show password');
}

/**
 * Show error message for a form field
 */
function showError(inputElement, message) {
    // Create error message element
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    // Add error class to input group
    const inputGroup = inputElement.closest('.input-group');
    if (inputGroup) {
        inputGroup.classList.add('error');
        
        // Remove existing error message
        const existingError = inputGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        inputGroup.appendChild(errorElement);
    }
    
    // Focus on the error field
    inputElement.focus();
}

/**
 * Clear all error messages
 */
function clearErrorMessages() {
    // Remove error classes
    document.querySelectorAll('.input-group.error').forEach(element => {
        element.classList.remove('error');
    });
    
    // Remove error messages
    document.querySelectorAll('.error-message').forEach(element => {
        element.remove();
    });
}

/**
 * Check URL parameters for special messages
 */
function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('expired')) {
        showToast('Your session has expired. Please sign in again.', 'warning');
    }
    
    if (urlParams.has('registered')) {
        showToast('Registration successful! Please sign in with your new account.', 'success');
    }
    
    if (urlParams.has('reset')) {
        showToast('Password reset successful! Please sign in with your new password.', 'success');
    }
    
    if (urlParams.has('logout')) {
        showToast('You have been successfully signed out.', 'info');
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 350px;
        `;
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        background: ${type === 'success' ? '#d4edda' : 
                     type === 'error' ? '#f8d7da' : 
                     type === 'warning' ? '#fff3cd' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : 
                type === 'error' ? '#721c24' : 
                type === 'warning' ? '#856404' : '#0c5460'};
        padding: 15px;
        margin-bottom: 10px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        animation: slideInRight 0.3s ease-out;
        display: flex;
        align-items: center;
        justify-content: space-between;
    `;
    
    toast.innerHTML = `
        <div style="flex: 1;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                             type === 'error' ? 'exclamation-circle' : 
                             type === 'warning' ? 'exclamation-triangle' : 'info-circle'}" 
               style="margin-right: 10px;"></i>
            ${message}
        </div>
        <button class="toast-close" style="background: none; border: none; cursor: pointer; color: inherit;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Add close button functionality
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.remove();
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

// Add CSS for toast animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Export functions for reuse
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateLoginForm,
        togglePasswordVisibility,
        showError,
        clearErrorMessages
    };
}