// dashboard.js - Dashboard functionality

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const fileInputs = document.querySelectorAll('.file-input');
    const uploadAreas = document.querySelectorAll('.upload-area');
    const signNowBtns = document.querySelectorAll('.btn-sign');
    const sendForSigningBtns = document.querySelectorAll('.btn-sign-outline');
    const fileLists = document.querySelectorAll('.uploaded-files');
    
    // Initialize dashboard
    initDashboard();
    
    // Initialize file upload functionality
    initFileUpload();
    
    // Initialize recent documents interactions
    initRecentDocuments();
    
    // Initialize quick stats
    updateQuickStats();
    
    // Initialize drag and drop
    initDragAndDrop();
});

/**
 * Initialize dashboard
 */
function initDashboard() {
    console.log('Dashboard initialized');
    
    // Check if user is authenticated
    const userElement = document.querySelector('.user-name');
    if (userElement) {
        console.log(`Welcome, ${userElement.textContent}`);
    }
    
    // Set current date in welcome message
    const dateElement = document.querySelector('.current-date');
    if (dateElement) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = now.toLocaleDateString('en-US', options);
    }
}

/**
 * Initialize file upload functionality
 */
function initFileUpload() {
    const fileInputs = document.querySelectorAll('.file-input');
    const uploadAreas = document.querySelectorAll('.upload-area');
    
    uploadAreas.forEach((area, index) => {
        const fileInput = area.querySelector('.file-input');
        const fileList = area.nextElementSibling;
        
        if (fileInput && fileList) {
            // Click on upload area triggers file input
            area.addEventListener('click', function(e) {
                if (e.target !== fileInput) {
                    fileInput.click();
                }
            });
            
            // Handle file selection
            fileInput.addEventListener('change', function() {
                handleFileUpload(this.files, fileList, area);
            });
        }
    });
}

/**
 * Handle file upload
 */
function handleFileUpload(files, fileList, uploadArea) {
    if (!files.length) return;
    
    // Clear existing files
    fileList.innerHTML = '';
    
    Array.from(files).forEach(file => {
        if (validateFile(file)) {
            addFileToList(file, fileList);
        } else {
            showToast(`File "${file.name}" is not supported`, 'error');
        }
    });
    
    // Update upload area text
    const uploadText = uploadArea.querySelector('.upload-text');
    const uploadSubtext = uploadArea.querySelector('.upload-subtext');
    
    if (uploadText && uploadSubtext) {
        uploadText.textContent = `${files.length} file(s) selected`;
        uploadSubtext.textContent = 'Click to change or drag & drop';
    }
}

/**
 * Validate file type
 */
function validateFile(file) {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png'
    ];
    
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'];
    const fileName = file.name.toLowerCase();
    
    // Check extension
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    // Check MIME type
    const hasValidType = allowedTypes.includes(file.type);
    
    return hasValidExtension && hasValidType;
}

/**
 * Add file to list
 */
function addFileToList(file, fileList) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    // Get file icon based on type
    const icon = getFileIcon(file.type);
    
    // Format file size
    const size = formatFileSize(file.size);
    
    fileItem.innerHTML = `
        <div class="file-icon">
            <i class="${icon}"></i>
        </div>
        <div class="file-info">
            <div class="file-name">${file.name}</div>
            <div class="file-size">${size}</div>
        </div>
        <div class="file-actions">
            <button class="btn-icon" onclick="removeFile(this)" title="Remove">
                <i class="fas fa-times"></i>
            </button>
            <button class="btn-icon" onclick="previewFile('${file.name}')" title="Preview">
                <i class="fas fa-eye"></i>
            </button>
        </div>
    `;
    
    fileList.appendChild(fileItem);
}

/**
 * Get file icon based on type
 */
function getFileIcon(mimeType) {
    const iconMap = {
        'application/pdf': 'fas fa-file-pdf',
        'application/msword': 'fas fa-file-word',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'fas fa-file-word',
        'application/vnd.ms-excel': 'fas fa-file-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'fas fa-file-excel',
        'image/jpeg': 'fas fa-file-image',
        'image/png': 'fas fa-file-image',
        'image/gif': 'fas fa-file-image'
    };
    
    return iconMap[mimeType] || 'fas fa-file';
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Remove file from list
 */
function removeFile(button) {
    const fileItem = button.closest('.file-item');
    const fileList = fileItem.parentElement;
    
    fileItem.style.opacity = '0';
    fileItem.style.transform = 'translateX(-20px)';
    
    setTimeout(() => {
        fileItem.remove();
        
        // Reset upload area if no files left
        if (fileList.children.length === 0) {
            const uploadArea = fileList.previousElementSibling;
            if (uploadArea && uploadArea.classList.contains('upload-area')) {
                const uploadText = uploadArea.querySelector('.upload-text');
                const uploadSubtext = uploadArea.querySelector('.upload-subtext');
                
                if (uploadText && uploadSubtext) {
                    uploadText.textContent = 'Drop your file or choose file';
                    uploadSubtext.textContent = 'PDF | DOC | XLS | JPG';
                }
            }
        }
    }, 300);
}

/**
 * Preview file (simulated)
 */
function previewFile(fileName) {
    showToast(`Previewing "${fileName}"`, 'info');
    // In real application, this would open a preview modal
}

/**
 * Initialize drag and drop
 */
function initDragAndDrop() {
    const uploadAreas = document.querySelectorAll('.upload-area');
    
    uploadAreas.forEach(area => {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            area.addEventListener(eventName, preventDefaults, false);
        });
        
        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            area.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            area.addEventListener(eventName, unhighlight, false);
        });
        
        // Handle dropped files
        area.addEventListener('drop', handleDrop, false);
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    this.classList.add('drag-over');
}

function unhighlight() {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    const fileList = this.nextElementSibling;
    
    if (files.length) {
        handleFileUpload(files, fileList, this);
    }
    
    unhighlight.call(this);
}

/**
 * Initialize recent documents
 */
function initRecentDocuments() {
    // Add click handlers to document rows
    const documentRows = document.querySelectorAll('.documents-table tbody tr');
    documentRows.forEach(row => {
        row.addEventListener('click', function(e) {
            if (!e.target.closest('.action-dropdown')) {
                const documentName = this.querySelector('.document-name').textContent;
                showToast(`Opening "${documentName}"`, 'info');
                // In real application, this would open the document
            }
        });
    });
    
    // Add status colors based on data attribute
    const statusBadges = document.querySelectorAll('.status-badge');
    statusBadges.forEach(badge => {
        const status = badge.getAttribute('data-status');
        badge.classList.add(`status-${status}`);
    });
}

/**
 * Update quick stats
 */
function updateQuickStats() {
    // Simulate updating stats from server
    setTimeout(() => {
        const stats = {
            documents: '1,247',
            signed: '892',
            pending: '128',
            templates: '45'
        };
        
        Object.entries(stats).forEach(([key, value]) => {
            const element = document.querySelector(`.stat-${key}`);
            if (element) {
                animateCounter(element, value);
            }
        });
    }, 1000);
}

/**
 * Animate counter
 */
function animateCounter(element, target) {
    const current = parseInt(element.textContent.replace(',', '')) || 0;
    const targetNum = parseInt(target.replace(',', ''));
    const duration = 1000; // 1 second
    const steps = 60;
    const increment = (targetNum - current) / steps;
    let currentValue = current;
    let step = 0;
    
    const timer = setInterval(() => {
        step++;
        currentValue += increment;
        element.textContent = Math.round(currentValue).toLocaleString();
        
        if (step >= steps) {
            element.textContent = target;
            clearInterval(timer);
        }
    }, duration / steps);
}

/**
 * Handle sign now button click
 */
function handleSignNow() {
    const fileList = document.querySelector('#sign-now-upload .uploaded-files');
    const files = fileList.querySelectorAll('.file-item');
    
    if (files.length === 0) {
        showToast('Please select a file to sign', 'warning');
        return;
    }
    
    showToast('Preparing document for signing...', 'info');
    
    // Simulate processing
    setTimeout(() => {
        showToast('Document ready for signing! Redirecting to signature editor...', 'success');
        // In real application, this would redirect to signing page
    }, 1500);
}

/**
 * Handle send for signing button click
 */
function handleSendForSigning() {
    const fileList = document.querySelector('#send-signing-upload .uploaded-files');
    const files = fileList.querySelectorAll('.file-item');
    
    if (files.length === 0) {
        showToast('Please select a file to send for signing', 'warning');
        return;
    }
    
    showToast('Preparing document to send for signing...', 'info');
    
    // Simulate processing
    setTimeout(() => {
        showToast('Document ready! You can now add recipients...', 'success');
        // In real application, this would open recipient modal
    }, 1500);
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
            bottom: 20px;
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
        padding: 15px 20px;
        margin-bottom: 10px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        animation: slideInRight 0.3s ease-out;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 300px;
    `;
    
    toast.innerHTML = `
        <div style="flex: 1; display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                             type === 'error' ? 'exclamation-circle' : 
                             type === 'warning' ? 'exclamation-triangle' : 'info-circle'}" 
               style="font-size: 18px;"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close" style="background: none; border: none; cursor: pointer; color: inherit; margin-left: 10px;">
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

// Export functions for global access
window.handleSignNow = handleSignNow;
window.handleSendForSigning = handleSendForSigning;
window.removeFile = removeFile;
window.previewFile = previewFile;