// static/admin/js/add_api_token.js

document.addEventListener('DOMContentLoaded', function() {
    // Initialize form
    initializeForm();
    
    // Initialize date pickers
    initializeDatePickers();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Initialize preview
    updatePreview();
});

function initializeForm() {
    // Set default expiry to 30 days
    calculateExpiry(30);
}

function initializeDatePickers() {
    // Initialize date picker
    const datePicker = flatpickr("#custom_date", {
        dateFormat: "Y-m-d",
        minDate: "today",
        onChange: function(selectedDates, dateStr) {
            updateCustomExpiry();
        }
    });
    
    // Initialize time picker
    const timePicker = flatpickr("#custom_time", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        onChange: function(selectedDates, timeStr) {
            updateCustomExpiry();
        }
    });
}

function initializeEventListeners() {
    // Step navigation
    const nextButtons = document.querySelectorAll('.btn-next');
    const prevButtons = document.querySelectorAll('.btn-prev');
    
    nextButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const nextStep = this.dataset.next;
            navigateToStep(nextStep);
        });
    });
    
    prevButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const prevStep = this.dataset.prev;
            navigateToStep(prevStep);
        });
    });
    
    // Expiry options
    const expiryOptions = document.querySelectorAll('input[name="expiry_option"]');
    expiryOptions.forEach(option => {
        option.addEventListener('change', function() {
            handleExpiryOptionChange(this.value);
        });
    });
    
    // Custom expiry quick buttons
    const quickButtons = document.querySelectorAll('.btn-quick');
    quickButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            setQuickDate(this.dataset.date);
        });
    });
    
    // Permission toggles
    const toggleAllButtons = document.querySelectorAll('.toggle-all');
    toggleAllButtons.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const group = this.closest('.permission-group');
            const checkboxes = group.querySelectorAll('input[type="checkbox"][name="permissions"]');
            checkboxes.forEach(cb => cb.checked = this.checked);
            updatePermissionsSummary();
            updateReview();
        });
    });
    
    // Individual permission checkboxes
    const permissionCheckboxes = document.querySelectorAll('input[name="permissions"]');
    permissionCheckboxes.forEach(cb => {
        cb.addEventListener('change', function() {
            updateToggleAllState(this);
            updatePermissionsSummary();
            updateReview();
        });
    });
    
    // Description character count
    const descriptionTextarea = document.getElementById('id_description');
    if (descriptionTextarea) {
        descriptionTextarea.addEventListener('input', function() {
            updateCharCount();
            updateReview();
        });
    }
    
    // Organization select
    const organizationSelect = document.getElementById('id_organization');
    if (organizationSelect) {
        organizationSelect.addEventListener('change', function() {
            updateReview();
        });
    }
    
    // Form submission
    const form = document.getElementById('apiTokenForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Generate & Copy button
    const generateCopyBtn = document.getElementById('generateCopyBtn');
    if (generateCopyBtn) {
        generateCopyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleGenerateAndCopy();
        });
    }
    
    // Save draft button
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', saveAsDraft);
    }
    
    // Modal events
    const modalCloseBtn = document.querySelector('.modal-close');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const viewTokensBtn = document.getElementById('viewTokensBtn');
    const modalCopyBtn = document.getElementById('modalCopyBtn');
    
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    if (viewTokensBtn) {
        viewTokensBtn.addEventListener('click', function() {
            window.location.href = '/admin/api-tokens/';
        });
    }
    
    if (modalCopyBtn) {
        modalCopyBtn.addEventListener('click', copyGeneratedToken);
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('tokenModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
}

function navigateToStep(stepId) {
    // Validate current step before proceeding
    const currentStep = document.querySelector('.form-step.active');
    if (!validateStep(currentStep.id)) {
        return;
    }
    
    // Update progress steps
    const steps = document.querySelectorAll('.step');
    steps.forEach(step => {
        step.classList.remove('active');
        if (step.dataset.step === stepId.charAt(stepId.length - 1)) {
            step.classList.add('active');
        }
    });
    
    // Show target step
    const formSteps = document.querySelectorAll('.form-step');
    formSteps.forEach(step => {
        step.classList.remove('active');
        if (step.id === stepId) {
            step.classList.add('active');
            // Scroll to top of step
            step.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
    
    updateReview();
}

function validateStep(stepId) {
    switch(stepId) {
        case 'step1':
            return validateStep1();
        case 'step2':
            return validateStep2();
        default:
            return true;
    }
}

function validateStep1() {
    const description = document.getElementById('id_description').value.trim();
    if (!description) {
        showValidationError('Please enter a description for the token');
        return false;
    }
    
    if (description.length > 200) {
        showValidationError('Description must be 200 characters or less');
        return false;
    }
    
    const expiryOption = document.querySelector('input[name="expiry_option"]:checked');
    if (!expiryOption) {
        showValidationError('Please select an expiry option');
        return false;
    }
    
    if (expiryOption.value === 'custom') {
        const customDate = document.getElementById('custom_date').value;
        const customTime = document.getElementById('custom_time').value;
        if (!customDate || !customTime) {
            showValidationError('Please select both date and time for custom expiry');
            return false;
        }
    }
    
    return true;
}

function validateStep2() {
    const selectedPermissions = document.querySelectorAll('input[name="permissions"]:checked');
    if (selectedPermissions.length === 0) {
        showValidationError('Please select at least one permission for the token');
        return false;
    }
    
    return true;
}

function showValidationError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: message,
        confirmButtonColor: '#ef476f'
    });
}

function handleExpiryOptionChange(value) {
    const customCard = document.querySelector('.option-card.custom-expiry');
    const datePicker = document.getElementById('custom_date');
    const timePicker = document.getElementById('custom_time');
    
    if (value === 'custom') {
        customCard.classList.add('selected');
        datePicker.disabled = false;
        timePicker.disabled = false;
        updateCustomExpiry();
    } else {
        customCard.classList.remove('selected');
        datePicker.disabled = true;
        timePicker.disabled = true;
        
        if (value === 'never') {
            document.getElementById('expiryPreview').textContent = 'Never expires';
            document.getElementById('expiryPreview').style.color = '#ef476f';
        } else {
            calculateExpiry(parseInt(value));
        }
    }
    
    // Update card selection
    document.querySelectorAll('.option-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`.option-card[data-expiry="${value}"]`).classList.add('selected');
}

function calculateExpiry(days) {
    const now = new Date();
    const expiryDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    
    const formattedDate = expiryDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const formattedTime = expiryDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    document.getElementById('expiryPreview').textContent = `${formattedDate}, ${formattedTime}`;
    document.getElementById('expiryPreview').style.color = '#4cc9f0';
}

function setQuickDate(dateType) {
    const now = new Date();
    let targetDate = new Date(now);
    
    switch(dateType) {
        case 'today':
            // Set to end of today
            targetDate.setHours(23, 59, 59, 999);
            break;
        case 'tomorrow':
            targetDate.setDate(targetDate.getDate() + 1);
            targetDate.setHours(12, 0, 0, 0);
            break;
        case 'next-week':
            targetDate.setDate(targetDate.getDate() + 7);
            targetDate.setHours(12, 0, 0, 0);
            break;
    }
    
    // Update date picker
    const datePicker = document.querySelector("#custom_date")._flatpickr;
    if (datePicker) {
        datePicker.setDate(targetDate, true);
    }
    
    // Update time picker
    const timePicker = document.querySelector("#custom_time")._flatpickr;
    if (timePicker) {
        const timeStr = targetDate.getHours().toString().padStart(2, '0') + ':' + 
                       targetDate.getMinutes().toString().padStart(2, '0');
        timePicker.setDate(timeStr, true);
    }
    
    updateCustomExpiry();
}

function updateCustomExpiry() {
    const date = document.getElementById('custom_date').value;
    const time = document.getElementById('custom_time').value;
    
    if (date && time) {
        const expiryDate = new Date(`${date}T${time}:00`);
        const formattedDate = expiryDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const formattedTime = expiryDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        document.getElementById('expiryPreview').textContent = `${formattedDate}, ${formattedTime}`;
        document.getElementById('expiryPreview').style.color = '#4cc9f0';
    }
}

function updateCharCount() {
    const textarea = document.getElementById('id_description');
    const charCount = document.getElementById('charCount');
    if (textarea && charCount) {
        const count = textarea.value.length;
        charCount.textContent = count;
        
        if (count > 200) {
            charCount.style.color = '#ef476f';
        } else if (count > 150) {
            charCount.style.color = '#f72585';
        } else {
            charCount.style.color = '#6c757d';
        }
    }
}

function updateToggleAllState(changedCheckbox) {
    const group = changedCheckbox.closest('.permission-group');
    const toggleAll = group.querySelector('.toggle-all');
    const checkboxes = group.querySelectorAll('input[type="checkbox"][name="permissions"]');
    
    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    
    if (checkedCount === 0) {
        toggleAll.checked = false;
        toggleAll.indeterminate = false;
    } else if (checkedCount === checkboxes.length) {
        toggleAll.checked = true;
        toggleAll.indeterminate = false;
    } else {
        toggleAll.checked = false;
        toggleAll.indeterminate = true;
    }
}

function updatePermissionsSummary() {
    const selectedPermissions = document.querySelectorAll('input[name="permissions"]:checked');
    const container = document.getElementById('selectedPermissions');
    const reviewContainer = document.getElementById('reviewPermissions');
    
    if (!container || !reviewContainer) return;
    
    container.innerHTML = '';
    reviewContainer.innerHTML = '';
    
    if (selectedPermissions.length === 0) {
        container.innerHTML = `
            <div class="empty-permissions">
                <i class="fas fa-info-circle"></i>
                No permissions selected yet. Select at least one permission above.
            </div>
        `;
        reviewContainer.innerHTML = '<div class="empty-review">No permissions selected</div>';
    } else {
        selectedPermissions.forEach(cb => {
            const label = cb.closest('label').querySelector('h4').textContent;
            
            // Add to permissions summary
            const tag = document.createElement('span');
            tag.className = 'permission-tag';
            tag.innerHTML = `
                <i class="fas fa-check"></i>
                ${label}
            `;
            container.appendChild(tag);
            
            // Add to review section
            const reviewItem = document.createElement('div');
            reviewItem.className = 'review-item';
            reviewItem.innerHTML = `
                <span class="review-label">${label}:</span>
                <span class="review-value">Allowed</span>
            `;
            reviewContainer.appendChild(reviewItem);
        });
    }
}

function updateReview() {
    // Update description
    const description = document.getElementById('id_description').value;
    const reviewDescription = document.getElementById('reviewDescription');
    const modalDescription = document.getElementById('modalDescription');
    
    if (description) {
        reviewDescription.textContent = description;
        modalDescription.textContent = description;
    } else {
        reviewDescription.textContent = 'Not set';
        modalDescription.textContent = '-';
    }
    
    // Update organization
    const orgSelect = document.getElementById('id_organization');
    const reviewOrganization = document.getElementById('reviewOrganization');
    const modalOrganization = document.getElementById('modalOrganization');
    
    if (orgSelect.value) {
        const orgText = orgSelect.options[orgSelect.selectedIndex].text;
        reviewOrganization.textContent = orgText;
        modalOrganization.textContent = orgText;
    } else {
        reviewOrganization.textContent = 'Global (No organization)';
        modalOrganization.textContent = 'Global';
    }
    
    // Update expiry
    const expiryPreview = document.getElementById('expiryPreview');
    const reviewExpiry = document.getElementById('reviewExpiry');
    const modalExpiry = document.getElementById('modalExpiry');
    
    reviewExpiry.textContent = expiryPreview.textContent;
    modalExpiry.textContent = expiryPreview.textContent;
}

function updatePreview() {
    const description = document.getElementById('id_description').value;
    const previewValue = document.querySelector('.token-preview-value');
    const copyBtn = document.getElementById('previewCopyBtn');
    
    if (description) {
        // Generate a preview token based on description
        const hash = hashCode(description).toString(16).substring(0, 8);
        previewValue.textContent = `${hash}...`;
        copyBtn.disabled = true;
    } else {
        previewValue.textContent = 'generated-on-save';
        copyBtn.disabled = true;
    }
}

function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateStep('step1') || !validateStep('step2')) {
        navigateToStep('step1');
        return;
    }
    
    generateToken(false);
}

function handleGenerateAndCopy() {
    if (!validateStep('step1') || !validateStep('step2')) {
        navigateToStep('step1');
        return;
    }
    
    generateToken(true);
}

function generateToken(copyToClipboard = false) {
    // Show loading
    Swal.fire({
        title: 'Generating Token...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    // Simulate API call
    setTimeout(() => {
        Swal.close();
        
        // Generate a realistic token
        const token = generateUUID();
        const description = document.getElementById('id_description').value;
        const orgSelect = document.getElementById('id_organization');
        const orgText = orgSelect.value ? orgSelect.options[orgSelect.selectedIndex].text : 'Global';
        const expiry = document.getElementById('expiryPreview').textContent;
        
        // Update modal with generated token
        document.getElementById('generatedToken').textContent = token;
        document.getElementById('modalDescription').textContent = description;
        document.getElementById('modalOrganization').textContent = orgText;
        document.getElementById('modalExpiry').textContent = expiry;
        
        // Update permissions in modal
        const selectedPermissions = document.querySelectorAll('input[name="permissions"]:checked');
        const modalPermissions = document.getElementById('modalPermissions');
        if (selectedPermissions.length > 0) {
            const permissionNames = Array.from(selectedPermissions).map(cb => {
                return cb.closest('label').querySelector('h4').textContent;
            });
            modalPermissions.textContent = permissionNames.join(', ');
        } else {
            modalPermissions.textContent = 'None';
        }
        
        // Show modal
        document.getElementById('tokenModal').classList.add('active');
        
        // Copy to clipboard if requested
        if (copyToClipboard) {
            setTimeout(() => {
                copyGeneratedToken();
            }, 500);
        }
        
        // In a real app, you would submit the form here
        // const form = document.getElementById('apiTokenForm');
        // form.submit();
    }, 1500);
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function saveAsDraft() {
    if (!validateStep('step1')) {
        showValidationError('Please fill in at least the required fields in step 1');
        return;
    }
    
    Swal.fire({
        title: 'Save as Draft?',
        text: 'Your token configuration will be saved as a draft for later completion.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Save Draft',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            // Simulate saving draft
            Swal.fire({
                title: 'Draft Saved!',
                text: 'Your token configuration has been saved as a draft.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        }
    });
}

function copyGeneratedToken() {
    const token = document.getElementById('generatedToken').textContent;
    
    navigator.clipboard.writeText(token).then(() => {
        // Update button text temporarily
        const copyBtn = document.getElementById('modalCopyBtn');
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        copyBtn.style.background = '#4cc9f0';
        
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.style.background = '';
        }, 2000);
        
        showNotification('Token copied to clipboard!', 'success');
    }).catch(() => {
        showNotification('Failed to copy token', 'error');
    });
}

function closeModal() {
    document.getElementById('tokenModal').classList.remove('active');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                         type === 'error' ? 'times-circle' : 
                         type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        border-left: 4px solid ${type === 'success' ? '#2ecc71' : 
                              type === 'error' ? '#ef476f' : 
                              type === 'warning' ? '#f72585' : '#4361ee'};
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
    
    // Add keyframes if not already added
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}