// main.js - Header and Footer functionality

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.innerHTML = navMenu.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!navMenu.contains(event.target) && !mobileMenuBtn.contains(event.target)) {
                navMenu.classList.remove('active');
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    }
    
    // User menu toggle for mobile
    const userMenu = document.getElementById('userMenu');
    if (userMenu && window.innerWidth <= 768) {
        userMenu.addEventListener('click', function(e) {
            e.preventDefault();
            this.classList.toggle('active');
        });
        
        // Close other dropdowns when opening one
        document.addEventListener('click', function(event) {
            if (!userMenu.contains(event.target)) {
                userMenu.classList.remove('active');
            }
        });
    }
    
    // Dropdown menu functionality for mobile
    const dropdowns = document.querySelectorAll('.dropdown');
    if (dropdowns.length > 0 && window.innerWidth <= 768) {
        dropdowns.forEach(dropdown => {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            if (toggle) {
                toggle.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Close other dropdowns
                    dropdowns.forEach(d => {
                        if (d !== dropdown) d.classList.remove('active');
                    });
                    
                    // Toggle current dropdown
                    dropdown.classList.toggle('active');
                });
            }
        });
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', function() {
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        });
    }
    
    // Close message notifications
    const closeButtons = document.querySelectorAll('.close-message');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.parentElement.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (this.parentElement.parentNode) {
                    this.parentElement.remove();
                }
            }, 300);
        });
    });
    
    // Auto-close messages after 5 seconds
    const messages = document.querySelectorAll('.alert');
    messages.forEach(message => {
        setTimeout(() => {
            if (message.parentNode) {
                message.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => {
                    if (message.parentNode) {
                        message.remove();
                    }
                }, 300);
            }
        }, 5000);
    });
    
    // Set active nav link based on current page
    setActiveNavLink();
    
    // Add animation to social links on hover
    const socialLinks = document.querySelectorAll('.social-link');
    socialLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
        });
        
        link.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Initialize tooltips for social links
    initializeTooltips();
});

/**
 * Set active navigation link based on current URL
 */
function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
            // Remove active class from all links
            link.classList.remove('active');
            
            // Check if current path matches link href
            if (currentPath === href || currentPath.startsWith(href + '/')) {
                link.classList.add('active');
            }
            
            // Special handling for dropdown parent links
            if (link.classList.contains('dropdown-toggle')) {
                const dropdownMenu = link.nextElementSibling;
                if (dropdownMenu) {
                    const dropdownLinks = dropdownMenu.querySelectorAll('a');
                    const isActive = Array.from(dropdownLinks).some(dropdownLink => {
                        return currentPath === dropdownLink.getAttribute('href') || 
                               currentPath.startsWith(dropdownLink.getAttribute('href') + '/');
                    });
                    
                    if (isActive) {
                        link.classList.add('active');
                    }
                }
            }
        }
    });
}

/**
 * Initialize tooltips for social links
 */
function initializeTooltips() {
    const socialLinks = document.querySelectorAll('.social-link');
    socialLinks.forEach(link => {
        const platform = link.querySelector('i').className.split('fa-')[1].split('-')[0];
        link.setAttribute('title', `Follow us on ${platform.charAt(0).toUpperCase() + platform.slice(1)}`);
        
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = link.getAttribute('title');
        tooltip.style.cssText = `
            position: absolute;
            background: #333;
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            z-index: 10000;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s;
            transform: translateY(10px);
        `;
        
        link.appendChild(tooltip);
        
        // Show tooltip on hover
        link.addEventListener('mouseenter', function() {
            tooltip.style.opacity = '1';
            tooltip.style.visibility = 'visible';
            tooltip.style.transform = 'translateY(0)';
        });
        
        link.addEventListener('mouseleave', function() {
            tooltip.style.opacity = '0';
            tooltip.style.visibility = 'hidden';
            tooltip.style.transform = 'translateY(10px)';
        });
    });
}

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    
    if (navMenu && mobileMenuBtn) {
        navMenu.classList.toggle('active');
        mobileMenuBtn.innerHTML = navMenu.classList.contains('active') 
            ? '<i class="fas fa-times"></i>' 
            : '<i class="fas fa-bars"></i>';
    }
}

/**
 * Close all dropdowns
 */
function closeAllDropdowns() {
    document.querySelectorAll('.dropdown.active').forEach(dropdown => {
        dropdown.classList.remove('active');
    });
    
    document.querySelectorAll('.user-menu.active').forEach(menu => {
        menu.classList.remove('active');
    });
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        setActiveNavLink,
        toggleMobileMenu,
        closeAllDropdowns
    };
}