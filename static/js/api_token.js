// static/admin/js/api_tokens.js

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Clipboard.js
    const clipboard = new ClipboardJS('.copy-btn');
    
    clipboard.on('success', function(e) {
        showNotification('Token copied to clipboard!', 'success');
        e.clearSelection();
    });
    
    clipboard.on('error', function(e) {
        showNotification('Failed to copy token', 'error');
    });
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Initialize chart
    initializeUsageChart();
    
    // Initialize view toggle
    initializeViewToggle();
    
    // Initialize select all
    initializeSelectAll();
});

function initializeEventListeners() {
    // Add token button
    const addTokenBtn = document.getElementById('addTokenBtn');
    const emptyAddTokenBtn = document.getElementById('emptyAddTokenBtn');
    
    if (addTokenBtn) {
        addTokenBtn.addEventListener('click', showAddTokenModal);
    }
    
    if (emptyAddTokenBtn) {
        emptyAddTokenBtn.addEventListener('click', showAddTokenModal);
    }
    
    // Export button
    const exportBtn = document.getElementById('exportTokensBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportTokens);
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            this.classList.add('rotating');
            setTimeout(() => {
                location.reload();
            }, 500);
        });
    }
    
    // Search functionality
    const searchInput = document.getElementById('tokenSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function(e) {
            filterTokens(e.target.value);
        }, 300));
    }
    
    // Bulk actions
    const applyBulkActionBtn = document.getElementById('applyBulkAction');
    if (applyBulkActionBtn) {
        applyBulkActionBtn.addEventListener('click', applyBulkAction);
    }
    
    // Sortable headers
    const sortableHeaders = document.querySelectorAll('.sortable-header');
    sortableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            sortTable(this.dataset.sort);
        });
    });
    
    // Apply filters
    const applyFiltersBtn = document.getElementById('applyFilters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    // Reset filters
    const resetFiltersBtn = document.getElementById('resetFilters');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }
    
    // Page size change
    const pageSizeSelect = document.getElementById('pageSize');
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', function() {
            changePageSize(this.value);
        });
    }
}

function initializeViewToggle() {
    const viewBtns = document.querySelectorAll('.view-btn');
    const tableView = document.getElementById('tableView');
    const gridView = document.getElementById('gridView');
    
    viewBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            viewBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            if (this.dataset.view === 'table') {
                tableView.style.display = 'block';
                gridView.style.display = 'none';
            } else {
                tableView.style.display = 'none';
                gridView.style.display = 'block';
            }
        });
    });
}

function initializeSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const tokenCheckboxes = document.querySelectorAll('.token-select');
    
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            tokenCheckboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
            updateSelectedCount();
        });
    }
    
    tokenCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateSelectedCount();
            updateSelectAllCheckbox();
        });
    });
}

function updateSelectedCount() {
    const selectedTokens = document.querySelectorAll('.token-select:checked');
    const bulkActionSelect = document.getElementById('bulkAction');
    
    if (bulkActionSelect) {
        if (selectedTokens.length > 0) {
            bulkActionSelect.disabled = false;
        } else {
            bulkActionSelect.disabled = true;
        }
    }
}

function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const tokenCheckboxes = document.querySelectorAll('.token-select');
    const checkedCount = document.querySelectorAll('.token-select:checked').length;
    
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = checkedCount === tokenCheckboxes.length && tokenCheckboxes.length > 0;
        selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < tokenCheckboxes.length;
    }
}

function toggleTokenView(button) {
    const row = button.closest('.token-display');
    const fullToken = row.nextElementSibling;
    
    if (fullToken.style.display === 'none') {
        fullToken.style.display = 'block';
        button.innerHTML = '<i class="fas fa-eye-slash"></i>';
        button.title = 'Hide token';
    } else {
        fullToken.style.display = 'none';
        button.innerHTML = '<i class="fas fa-eye"></i>';
        button.title = 'Show token';
    }
}

function toggleGridTokenView(button) {
    const card = button.closest('.token-card');
    const fullToken = card.querySelector('.token-full');
    const displayToken = card.querySelector('.token-display-grid');
    
    if (fullToken.style.display === 'none') {
        fullToken.style.display = 'block';
        displayToken.style.display = 'none';
        button.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        fullToken.style.display = 'none';
        displayToken.style.display = 'block';
        button.innerHTML = '<i class="fas fa-eye"></i>';
    }
}

function showAddTokenModal() {
    Swal.fire({
        title: 'Generate New API Token',
        html: `
            <div class="swal-form">
                <div class="form-group">
                    <label for="tokenDescription">Description</label>
                    <input type="text" id="tokenDescription" class="swal2-input" placeholder="e.g., Production Server Access">
                </div>
                <div class="form-group">
                    <label for="tokenUser">User</label>
                    <select id="tokenUser" class="swal2-input">
                        <option value="admin1">admin1</option>
                        <option value="admin2">admin2</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="tokenOrganization">Organization</label>
                    <select id="tokenOrganization" class="swal2-input">
                        <option value="nepal-insurance">Nepal Insurance Authority</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="tokenExpiry">Expiry Period</label>
                    <select id="tokenExpiry" class="swal2-input">
                        <option value="7">7 days</option>
                        <option value="30" selected>30 days</option>
                        <option value="90">90 days</option>
                        <option value="365">1 year</option>
                        <option value="never">Never</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="tokenPermissions">Permissions</label>
                    <div class="permissions-grid">
                        <label class="checkbox-label">
                            <input type="checkbox" name="permissions" value="read" checked>
                            <span class="checkmark"></span> Read
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="permissions" value="write" checked>
                            <span class="checkmark"></span> Write
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="permissions" value="delete">
                            <span class="checkmark"></span> Delete
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="permissions" value="admin">
                            <span class="checkmark"></span> Admin
                        </label>
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Generate Token',
        cancelButtonText: 'Cancel',
        customClass: {
            popup: 'swal-wide'
        },
        preConfirm: () => {
            const description = document.getElementById('tokenDescription').value;
            const user = document.getElementById('tokenUser').value;
            const organization = document.getElementById('tokenOrganization').value;
            const expiry = document.getElementById('tokenExpiry').value;
            
            if (!description.trim()) {
                Swal.showValidationMessage('Please enter a description');
                return false;
            }
            
            // Simulate API call
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        description,
                        user,
                        organization,
                        expiry,
                        token: '8da8d5a9-7ea5-4f50-88d3-2eaf144457c1'
                    });
                }, 1000);
            });
        }
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: 'API Token Generated!',
                html: `
                    <div class="token-result">
                        <p>Your new API token has been generated:</p>
                        <div class="token-display">
                            <code class="generated-token">${result.value.token}</code>
                            <button class="btn-icon copy-btn" onclick="copyToClipboard('${result.value.token}')">
                                <i class="far fa-copy"></i>
                            </button>
                        </div>
                        <p class="warning-text">
                            <i class="fas fa-exclamation-triangle"></i>
                            Copy this token now. You won't be able to see it again!
                        </p>
                    </div>
                `,
                icon: 'success',
                showCancelButton: true,
                confirmButtonText: 'I\'ve copied the token',
                cancelButtonText: 'Copy again'
            }).then((copyResult) => {
                if (copyResult.isConfirmed) {
                    showNotification('Token saved successfully!', 'success');
                    // Reload or update the table
                    setTimeout(() => location.reload(), 1000);
                }
            });
        }
    });
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Token copied to clipboard!', 'success');
    }).catch(() => {
        showNotification('Failed to copy token', 'error');
    });
}

function renewToken(tokenId) {
    Swal.fire({
        title: 'Renew API Token',
        text: 'Are you sure you want to renew this token?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, renew it',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            // Show loading
            Swal.fire({
                title: 'Renewing Token...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            // Simulate API call
            setTimeout(() => {
                Swal.fire(
                    'Renewed!',
                    'The API token has been renewed for another 30 days.',
                    'success'
                );
                // Reload or update the specific row
                updateTokenStatus(tokenId, 'active');
            }, 1500);
        }
    });
}

function revokeToken(tokenId) {
    Swal.fire({
        title: 'Revoke API Token',
        text: 'This will immediately invalidate the token. Are you sure?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, revoke it',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#ef476f'
    }).then((result) => {
        if (result.isConfirmed) {
            // Simulate API call
            fetch(`/api/tokens/${tokenId}/revoke/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCSRFToken(),
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateTokenStatus(tokenId, 'expired');
                    showNotification('Token revoked successfully!', 'success');
                } else {
                    showNotification('Failed to revoke token', 'error');
                }
            })
            .catch(() => {
                showNotification('Failed to revoke token', 'error');
            });
        }
    });
}

function editToken(tokenId) {
    // Get token data (in a real app, you would fetch this from the server)
    const tokenRow = document.querySelector(`.token-row[data-token-id="${tokenId}"]`);
    
    Swal.fire({
        title: 'Edit API Token',
        html: `
            <div class="swal-form">
                <div class="form-group">
                    <label for="editDescription">Description</label>
                    <input type="text" id="editDescription" class="swal2-input" value="${tokenRow.querySelector('.description-text').textContent}">
                </div>
                <div class="form-group">
                    <label for="editExpiry">New Expiry Date</label>
                    <input type="date" id="editExpiry" class="swal2-input">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Save Changes',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            // Simulate saving changes
            showNotification('Token updated successfully!', 'success');
        }
    });
}

function deleteToken(tokenId) {
    Swal.fire({
        title: 'Delete API Token',
        text: 'This action cannot be undone. Are you sure?',
        icon: 'error',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#ef476f'
    }).then((result) => {
        if (result.isConfirmed) {
            // Simulate API call
            fetch(`/api/tokens/${tokenId}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': getCSRFToken()
                }
            })
            .then(response => {
                if (response.ok) {
                    const tokenRow = document.querySelector(`.token-row[data-token-id="${tokenId}"]`);
                    tokenRow.style.opacity = '0.5';
                    setTimeout(() => {
                        tokenRow.remove();
                        updateStats();
                        showNotification('Token deleted successfully!', 'success');
                    }, 500);
                } else {
                    showNotification('Failed to delete token', 'error');
                }
            })
            .catch(() => {
                showNotification('Failed to delete token', 'error');
            });
        }
    });
}

function filterTokens(searchTerm) {
    const rows = document.querySelectorAll('.token-row, .token-card');
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(lowerSearchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function sortTable(column) {
    const table = document.querySelector('.tokens-table tbody');
    const rows = Array.from(table.querySelectorAll('.token-row'));
    
    rows.sort((a, b) => {
        const aValue = getCellValue(a, column);
        const bValue = getCellValue(b, column);
        
        if (column === 'expires_at' || column === 'created_at') {
            return new Date(aValue) - new Date(bValue);
        } else if (column === 'expiry_status') {
            const statusOrder = { 'active': 1, 'expiring': 2, 'expired': 3 };
            return statusOrder[aValue] - statusOrder[bValue];
        } else {
            return aValue.localeCompare(bValue);
        }
    });
    
    // Clear and re-append sorted rows
    rows.forEach(row => table.appendChild(row));
}

function getCellValue(row, column) {
    switch(column) {
        case 'token':
            return row.querySelector('.token-value').textContent;
        case 'expires_at':
            return row.querySelector('.expiry-cell').textContent;
        case 'expiry_status':
            return row.querySelector('.status-badge').textContent.toLowerCase();
        case 'user':
            return row.querySelector('.user-info strong').textContent;
        case 'created_at':
            return row.querySelector('.created-cell').textContent;
        default:
            return '';
    }
}

function applyBulkAction() {
    const action = document.getElementById('bulkAction').value;
    const selectedTokens = Array.from(document.querySelectorAll('.token-select:checked'))
        .map(cb => cb.value);
    
    if (!action) {
        showNotification('Please select a bulk action', 'warning');
        return;
    }
    
    if (selectedTokens.length === 0) {
        showNotification('Please select at least one token', 'warning');
        return;
    }
    
    Swal.fire({
        title: `Confirm ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        text: `This will ${action} ${selectedTokens.length} token(s). Are you sure?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: `Yes, ${action} them`,
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            // Simulate bulk action
            showNotification(`${selectedTokens.length} token(s) ${action}ed successfully!`, 'success');
            // Reset selection
            document.querySelectorAll('.token-select:checked').forEach(cb => cb.checked = false);
            document.getElementById('bulkAction').value = '';
            updateSelectedCount();
        }
    });
}

function exportTokens() {
    // Show export options
    Swal.fire({
        title: 'Export Tokens',
        html: `
            <div class="swal-form">
                <div class="form-group">
                    <label>Export Format</label>
                    <div class="radio-group">
                        <label class="radio-label">
                            <input type="radio" name="format" value="csv" checked>
                            <span class="radiomark"></span> CSV
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="format" value="json">
                            <span class="radiomark"></span> JSON
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="format" value="pdf">
                            <span class="radiomark"></span> PDF
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label>Include Columns</label>
                    <div class="columns-grid">
                        <label class="checkbox-label">
                            <input type="checkbox" name="columns" value="token" checked>
                            <span class="checkmark"></span> Token
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="columns" value="expires_at" checked>
                            <span class="checkmark"></span> Expires At
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="columns" value="description" checked>
                            <span class="checkmark"></span> Description
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="columns" value="user" checked>
                            <span class="checkmark"></span> User
                        </label>
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Export',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            // Simulate export
            showNotification('Export started. Your file will download shortly.', 'info');
            // In a real app, this would trigger a download
        }
    });
}

function applyFilters() {
    showNotification('Filters applied successfully!', 'success');
}

function resetFilters() {
    document.querySelectorAll('.filter-dropdown input[type="checkbox"]').forEach(cb => {
        cb.checked = cb.value === 'active';
    });
    showNotification('Filters reset', 'info');
}

function changePageSize(size) {
    const url = new URL(window.location);
    url.searchParams.set('page_size', size);
    url.searchParams.set('page', '1');
    window.location.href = url.toString();
}

function initializeUsageChart() {
    const ctx = document.getElementById('usageChart').getContext('2d');
    
    const data = {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
            label: 'API Calls',
            data: [1250, 1420, 1380, 1550],
            backgroundColor: 'rgba(67, 97, 238, 0.2)',
            borderColor: 'rgba(67, 97, 238, 1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }, {
            label: 'Successful Calls',
            data: [1230, 1400, 1360, 1520],
            backgroundColor: 'rgba(76, 201, 240, 0.2)',
            borderColor: 'rgba(76, 201, 240, 1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }]
    };
    
    new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    }
                }
            }
        }
    });
}

function updateTokenStatus(tokenId, status) {
    const tokenRow = document.querySelector(`.token-row[data-token-id="${tokenId}"]`);
    if (!tokenRow) return;
    
    const statusBadge = tokenRow.querySelector('.status-badge');
    const expiryBadge = tokenRow.querySelector('.expiry-badge');
    
    tokenRow.classList.remove('expired', 'expiring');
    
    switch(status) {
        case 'active':
            tokenRow.classList.add('expiring');
            statusBadge.className = 'status-badge active';
            statusBadge.innerHTML = '<i class="fas fa-check-circle"></i> Active';
            if (expiryBadge) expiryBadge.remove();
            break;
        case 'expired':
            tokenRow.classList.add('expired');
            statusBadge.className = 'status-badge expired';
            statusBadge.innerHTML = '<i class="fas fa-times-circle"></i> Expired';
            if (expiryBadge) expiryBadge.remove();
            break;
    }
}

function updateStats() {
    const activeCount = document.querySelectorAll('.status-badge.active').length;
    const expiringCount = document.querySelectorAll('.expiry-badge.warning').length;
    const expiredCount = document.querySelectorAll('.status-badge.expired').length;
    const totalCount = document.querySelectorAll('.token-row').length;
    
    // Update stat cards
    document.querySelectorAll('.stat-content h3').forEach((h3, index) => {
        switch(index) {
            case 0: h3.textContent = `${activeCount} Active`; break;
            case 1: h3.textContent = `${expiringCount} Expiring Soon`; break;
            case 2: h3.textContent = `${expiredCount} Expired`; break;
            case 3: h3.textContent = `${totalCount} Total`; break;
        }
    });
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
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        border-left: 4px solid ${type === 'success' ? '#2ecc71' : 
                              type === 'error' ? '#ef476f' : 
                              type === 'warning' ? '#f72585' : '#4361ee'};
    `;
    
    // Add close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Add to document
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function getCSRFToken() {
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
    return cookieValue || '';
}