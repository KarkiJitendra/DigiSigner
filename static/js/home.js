// static/admin/js/dashboard.js

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Chart
    initializeChart();
    
    // Initialize Event Listeners
    initializeEventListeners();
    
    // Initialize Stats Update
    updateStats();
    
    // Initialize Filter Functionality
    initializeFilters();
});

function initializeChart() {
    const ctx = document.getElementById('apiChart').getContext('2d');
    
    // Sample data for the chart
    const data = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: 'API Calls',
            data: [320, 420, 380, 450, 480, 420, 390],
            backgroundColor: 'rgba(67, 97, 238, 0.2)',
            borderColor: 'rgba(67, 97, 238, 1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }, {
            label: 'Success Rate',
            data: [98, 99, 97, 98, 99, 98, 97],
            backgroundColor: 'rgba(76, 201, 240, 0.2)',
            borderColor: 'rgba(76, 201, 240, 1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            yAxisID: 'y1'
        }]
    };
    
    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    },
                    title: {
                        display: true,
                        text: 'API Calls'
                    }
                },
                y1: {
                    position: 'right',
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        drawOnChartArea: false,
                    },
                    title: {
                        display: true,
                        text: 'Success Rate %'
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    };
    
    window.apiChart = new Chart(ctx, config);
}

function initializeEventListeners() {
    // Time range filter
    const timeRangeSelect = document.getElementById('timeRange');
    if (timeRangeSelect) {
        timeRangeSelect.addEventListener('change', function() {
            updateChartData(this.value);
            updateStats();
        });
    }
    
    // Global search
    const globalSearch = document.getElementById('globalSearch');
    if (globalSearch) {
        globalSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch(this.value);
            }
        });
    }
    
    // Apply filters button
    const applyFiltersBtn = document.getElementById('applyFilters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    // Filter tags
    const filterTags = document.querySelectorAll('.filter-tag');
    filterTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const parent = this.parentElement;
            parent.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Navigation items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            if (this.classList.contains('add-btn') || this.parentElement.classList.contains('add-btn')) {
                e.preventDefault();
                e.stopPropagation();
                showAddModal(this.dataset.type || 'item');
            }
        });
    });
}

function initializeFilters() {
    // Method filter tags
    const methodTags = document.querySelectorAll('.filter-tag:not(.status-2xx):not(.status-4xx):not(.status-5xx)');
    methodTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const isAll = this.textContent === 'All';
            document.querySelectorAll('.filter-tag:not(.status-2xx):not(.status-4xx):not(.status-5xx)').forEach(t => {
                t.classList.remove('active');
            });
            this.classList.add('active');
            
            if (!isAll) {
                console.log('Filtering by method:', this.textContent);
            }
        });
    });
    
    // Status filter tags
    const statusTags = document.querySelectorAll('.filter-tag.status-2xx, .filter-tag.status-4xx, .filter-tag.status-5xx');
    statusTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const isAll = this.textContent === 'All';
            document.querySelectorAll('.filter-tag.status-2xx, .filter-tag.status-4xx, .filter-tag.status-5xx').forEach(t => {
                t.classList.remove('active');
            });
            this.classList.add('active');
            
            if (!isAll) {
                console.log('Filtering by status:', this.textContent);
            }
        });
    });
    
    // Date filter tags
    const dateTags = document.querySelectorAll('.filter-tag:not(.status-2xx):not(.status-4xx):not(.status-5xx):not(.active)');
    dateTags.forEach(tag => {
        if (tag.textContent.includes('date') || tag.textContent.includes('days') || 
            tag.textContent.includes('month') || tag.textContent.includes('year')) {
            tag.addEventListener('click', function() {
                document.querySelectorAll('.filter-tag').forEach(t => {
                    if (t.textContent.includes('date') || t.textContent.includes('days') || 
                        t.textContent.includes('month') || t.textContent.includes('year')) {
                        t.classList.remove('active');
                    }
                });
                this.classList.add('active');
                console.log('Filtering by date:', this.textContent);
            });
        }
    });
}

function updateChartData(timeRange) {
    // This function would typically fetch new data from the server
    // For now, we'll simulate data changes
    
    let newData;
    let labels;
    
    switch(timeRange) {
        case 'today':
            labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'];
            newData = [45, 52, 48, 65, 72, 68, 55];
            break;
        case 'week':
            labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            newData = [320, 420, 380, 450, 480, 420, 390];
            break;
        case 'month':
            labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
            newData = [1250, 1420, 1380, 1550];
            break;
        case 'year':
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            newData = [12500, 13200, 14200, 13800, 15500, 16200, 15800, 16500, 17200, 16800, 17500, 18200];
            break;
    }
    
    window.apiChart.data.labels = labels;
    window.apiChart.data.datasets[0].data = newData;
    window.apiChart.update();
    
    // Update activity badge
    const badge = document.querySelector('.card-badge');
    if (badge) {
        const randomCount = Math.floor(Math.random() * 50) + 1;
        badge.textContent = `${randomCount} new`;
    }
}

function updateStats() {
    // Simulate updating stats
    const activeUsers = document.getElementById('activeUsers');
    const apiCalls = document.getElementById('apiCalls');
    const successRate = document.getElementById('successRate');
    
    if (activeUsers) {
        const randomUsers = Math.floor(Math.random() * 50) + 100;
        activeUsers.textContent = randomUsers;
    }
    
    if (apiCalls) {
        const randomCalls = Math.floor(Math.random() * 1000) + 2000;
        apiCalls.textContent = randomCalls.toLocaleString();
    }
    
    if (successRate) {
        const randomRate = (Math.random() * 1 + 97.5).toFixed(1);
        successRate.textContent = `${randomRate}%`;
    }
}

function performSearch(query) {
    if (!query.trim()) return;
    
    console.log('Searching for:', query);
    
    // Show loading state
    const searchBtn = document.querySelector('.search-btn');
    const originalIcon = searchBtn.innerHTML;
    searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    // Simulate API call
    setTimeout(() => {
        searchBtn.innerHTML = originalIcon;
        alert(`Search results for: ${query}\n\nThis would show search results in a real implementation.`);
    }, 1000);
}

function applyFilters() {
    const method = document.querySelector('.filter-tag.active:not(.status-2xx):not(.status-4xx):not(.status-5xx)').textContent;
    const status = document.querySelector('.filter-tag.status-2xx.active, .filter-tag.status-4xx.active, .filter-tag.status-5xx.active')?.textContent || 'All';
    const date = document.querySelector('.filter-tag.active').textContent;
    const showCounts = document.getElementById('showCounts').checked;
    
    console.log('Applying filters:', {
        method,
        status,
        date,
        showCounts
    });
    
    // Show loading state
    const applyBtn = document.getElementById('applyFilters');
    const originalText = applyBtn.innerHTML;
    applyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Applying...';
    applyBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        applyBtn.innerHTML = originalText;
        applyBtn.disabled = false;
        
        // Update stats to reflect filtered data
        updateStats();
        
        // Show notification
        showNotification('Filters applied successfully!', 'success');
    }, 1500);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;
    
    // Add styles
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
        border-left: 4px solid ${type === 'success' ? '#2ecc71' : '#4361ee'};
    `;
    
    // Add close button functionality
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
    
    // Add keyframes for animation
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .notification-close {
                background: none;
                border: none;
                cursor: pointer;
                color: #666;
                padding: 4px;
            }
        `;
        document.head.appendChild(style);
    }
}

function showAddModal(type) {
    const modalTitle = type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
    alert(`This would open a modal to add a new ${modalTitle}\n\nIn a real implementation, this would show a form.`);
}