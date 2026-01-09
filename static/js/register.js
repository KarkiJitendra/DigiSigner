// registration.js

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const tabs = document.querySelectorAll('.tab');
    const forms = document.querySelectorAll('.form-content');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const passwordStrengthBar = document.getElementById('password-strength-bar');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleAdminPasswordBtn = document.getElementById('toggle-admin-password');
    const personalForm = document.getElementById('personal-form');
    const businessForm = document.getElementById('business-form');
    
    // Initialize form validation
    initFormValidation();
    
    // Tab switching functionality
    if (tabs.length > 0) {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Show corresponding form
                forms.forEach(form => {
                    form.classList.remove('active');
                    if (form.id === `${targetTab}-form`) {
                        form.classList.add('active');
                    }
                });
                
                // Dispatch custom event for tab change
                const event = new CustomEvent('tabChanged', { detail: { tab: targetTab } });
                document.dispatchEvent(event);
            });
        });
    }
    
    // Password strength indicator
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            updatePasswordStrength(this.value, passwordStrengthBar);
        });
    }
    
    // Toggle password visibility
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function() {
            togglePasswordVisibility(passwordInput, this);
        });
    }
    
    // Toggle admin password visibility
    if (toggleAdminPasswordBtn) {
        const adminPasswordInput = document.getElementById('admin-password');
        toggleAdminPasswordBtn.addEventListener('click', function() {
            togglePasswordVisibility(adminPasswordInput, this);
        });
    }
    
    // Form submission validation
    if (personalForm) {
        personalForm.addEventListener('submit', function(e) {
            if (!validatePersonalForm()) {
                e.preventDefault();
            }
        });
    }
    
    if (businessForm) {
        businessForm.addEventListener('submit', function(e) {
            if (!validateBusinessForm()) {
                e.preventDefault();
            }
        });
    }
    
    // Initialize password strength for admin password
    const adminPasswordInput = document.getElementById('admin-password');
    const adminPasswordStrengthBar = document.getElementById('admin-password-strength-bar');
    
    if (adminPasswordInput && adminPasswordStrengthBar) {
        adminPasswordInput.addEventListener('input', function() {
            updatePasswordStrength(this.value, adminPasswordStrengthBar);
        });
    }
    
    // Check for any existing error messages and highlight fields
    highlightErrorFields();
    
    // Add input validation on blur
    addInputValidation();
});

/**
 * Initialize form validation
 */
function initFormValidation() {
    console.log('Digital Signature Registration Form Initialized');
    
    // Check if we're in development mode
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('Development mode detected - form validation active');
    }
}

/**
 * Update password strength indicator
 */
function updatePasswordStrength(password, strengthBar) {
    let strength = 0;
    
    // Check password length
    if (password.length >= 8) strength++;
    
    // Check for lowercase letters
    if (/[a-z]/.test(password)) strength++;
    
    // Check for uppercase letters
    if (/[A-Z]/.test(password)) strength++;
    
    // Check for numbers
    if (/[0-9]/.test(password)) strength++;
    
    // Check for special characters
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    // Update strength bar
    strengthBar.className = 'password-strength-bar';
    
    if (password.length === 0) {
        strengthBar.style.width = '0%';
    } else if (strength <= 2) {
        strengthBar.classList.add('strength-weak');
    } else if (strength === 3) {
        strengthBar.classList.add('strength-fair');
    } else if (strength === 4) {
        strengthBar.classList.add('strength-good');
    } else {
        strengthBar.classList.add('strength-strong');
    }
}

/**
 * Toggle password visibility
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
 * Validate personal registration form
 */
function validatePersonalForm() {
    let isValid = true;
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const termsCheckbox = document.getElementById('terms');
    
    // Clear previous error messages
    clearErrorMessages();
    
    // Email validation
    if (!isValidEmail(emailInput.value)) {
        showError(emailInput, 'Please enter a valid email address');
        isValid = false;
    }
    
    // Password validation
    if (passwordInput.value.length < 8) {
        showError(passwordInput, 'Password must be at least 8 characters long');
        isValid = false;
    }
    
    // Password confirmation
    if (passwordInput.value !== confirmPasswordInput.value) {
        showError(confirmPasswordInput, 'Passwords do not match');
        isValid = false;
    }
    
    // Terms agreement
    if (!termsCheckbox.checked) {
        showError(termsCheckbox, 'You must agree to the terms and conditions');
        isValid = false;
    }
    
    if (!isValid) {
        showFormMessage('Please fix the errors in the form', 'error');
    }
    
    return isValid;
}

/**
 * Validate business registration form
 */
function validateBusinessForm() {
    let isValid = true;
    const emailInput = document.getElementById('business-email');
    const passwordInput = document.getElementById('admin-password');
    const termsCheckbox = document.getElementById('business-terms');
    
    // Clear previous error messages
    clearErrorMessages();
    
    // Email validation
    if (!isValidEmail(emailInput.value)) {
        showError(emailInput, 'Please enter a valid business email address');
        isValid = false;
    }
    
    // Password validation
    if (passwordInput && passwordInput.value.length < 8) {
        showError(passwordInput, 'Password must be at least 8 characters long');
        isValid = false;
    }
    
    // Terms agreement
    if (!termsCheckbox.checked) {
        showError(termsCheckbox, 'You must agree to the business terms and conditions');
        isValid = false;
    }
    
    if (!isValid) {
        showFormMessage('Please fix the errors in the form', 'error');
    }
    
    return isValid;
}

/**
 * Check if email is valid
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
    const inputGroup = inputElement.closest('.input-group') || inputElement.closest('.terms');
    if (inputGroup) {
        inputGroup.classList.add('error');
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
    document.querySelectorAll('.error').forEach(element => {
        element.classList.remove('error');
    });
    
    // Remove error messages
    document.querySelectorAll('.error-message').forEach(element => {
        element.remove();
    });
}

/**
 * Show form message
 */
function showFormMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessage = document.querySelector('.form-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `form-message alert alert-${type}`;
    messageElement.textContent = message;
    
    // Add to form
    const formContainer = document.querySelector('.form-container');
    if (formContainer) {
        formContainer.insertBefore(messageElement, formContainer.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 5000);
    }
}

/**
 * Highlight fields with errors from Django form errors
 */
function highlightErrorFields() {
    // This function would be called when Django returns form errors
    // In a real implementation, you would parse Django's form errors here
    
    // Example: Check for any elements with error class from Django
    const errorFields = document.querySelectorAll('.errorlist');
    errorFields.forEach(errorList => {
        const inputId = errorList.getAttribute('data-for');
        if (inputId) {
            const inputElement = document.getElementById(inputId);
            if (inputElement) {
                const inputGroup = inputElement.closest('.input-group');
                if (inputGroup) {
                    inputGroup.classList.add('error');
                    
                    // Move error message to input group
                    inputGroup.appendChild(errorList);
                }
            }
        }
    });
}

/**
 * Add input validation on blur
 */
function addInputValidation() {
    // Email validation on blur
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value && !isValidEmail(this.value)) {
                showError(this, 'Please enter a valid email address');
            }
        });
    });
    
    // Password confirmation validation on blur
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    if (passwordInput && confirmPasswordInput) {
        confirmPasswordInput.addEventListener('blur', function() {
            if (passwordInput.value && this.value && passwordInput.value !== this.value) {
                showError(this, 'Passwords do not match');
            }
        });
    }
}

// Export functions for use in other modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isValidEmail,
        validatePersonalForm,
        validateBusinessForm,
        updatePasswordStrength,
        togglePasswordVisibility
    };
}