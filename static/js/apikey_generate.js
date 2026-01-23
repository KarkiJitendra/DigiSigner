// static/js/apikey_generate.js

document.addEventListener('DOMContentLoaded', function() {
    initializeExpiryOptions();
    initializePickers();
    initializePermissions();
    initializeFormSubmit();
});

function initializeExpiryOptions() {
    const radioInputs = document.querySelectorAll('input[name="expiry_option"]');
    const customContainer = document.getElementById('customExpiryContainer');
    const customDate = document.getElementById('custom_date');
    const customTime = document.getElementById('custom_time');
    const previewEl = document.getElementById('expiryPreview');

    function updateState() {
        const selected = document.querySelector('input[name="expiry_option"]:checked').value;
        
        if (selected === 'custom') {
            customContainer.style.display = 'block';
            customDate.disabled = false;
            customTime.disabled = false;
            updateCustomPreview();
        } else {
            customContainer.style.display = 'none';
            customDate.disabled = true;
            customTime.disabled = true;
            calculatePreview(parseInt(selected));
        }
    }

    radioInputs.forEach(input => {
        input.addEventListener('change', updateState);
    });

    // Initial state
    updateState();

    function calculatePreview(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        previewEl.textContent = date.toLocaleString('en-US', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        });
    }

    function updateCustomPreview() {
        const dateVal = customDate.value;
        const timeVal = customTime.value;
        if (dateVal && timeVal) {
            const date = new Date(`${dateVal}T${timeVal}`);
            if (!isNaN(date)) {
                previewEl.textContent = date.toLocaleString('en-US', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                });
            } else {
                previewEl.textContent = "Invalid Date/Time";
            }
        } else {
            previewEl.textContent = "Please select date and time";
        }
    }

    // Export for picker callback
    window.updateCustomPreview = updateCustomPreview;
}

function initializePickers() {
    // trigger elements
    const dateBtn = document.getElementById('dateBtn');
    const timeBtn = document.getElementById('timeBtn');
    
    // inputs
    const dateInput = document.getElementById('custom_date');
    const timeInput = document.getElementById('custom_time');

    // Date Picker
    const fpDate = flatpickr(dateInput, {
        dateFormat: "Y-m-d",
        minDate: "today",
        onChange: function(selectedDates, dateStr, instance) {
            window.updateCustomPreview();
        }
    });

    // Time Picker
    const fpTime = flatpickr(timeInput, {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        onChange: function(selectedDates, dateStr, instance) {
            window.updateCustomPreview();
        }
    });

    // Bind buttons to open pickers
    dateBtn.addEventListener('click', () => {
        if(!dateInput.disabled) fpDate.open();
    });
    
    timeBtn.addEventListener('click', () => {
        if(!timeInput.disabled) fpTime.open();
    });
}

function initializePermissions() {
    const selectAllCheckbox = document.getElementById('selectAllPerms');
    const permCheckboxes = document.querySelectorAll('input[name="permissions"]');

    selectAllCheckbox.addEventListener('change', function() {
        permCheckboxes.forEach(cb => {
            cb.checked = this.checked;
        });
    });

    permCheckboxes.forEach(cb => {
        cb.addEventListener('change', function() {
            const allChecked = Array.from(permCheckboxes).every(c => c.checked);
            const someChecked = Array.from(permCheckboxes).some(c => c.checked);
            
            selectAllCheckbox.checked = allChecked;
            selectAllCheckbox.indeterminate = someChecked && !allChecked;
        });
    });
}

function initializeFormSubmit() {
    const form = document.getElementById('apiTokenForm');
    
    form.addEventListener('submit', function(e) {
        // Basic validation
        const desc = document.getElementById('id_description').value.trim();
        if (!desc) {
            e.preventDefault();
            Swal.fire('Error', 'Description is required', 'error');
            return;
        }

        const expiryOption = document.querySelector('input[name="expiry_option"]:checked').value;
        if (expiryOption === 'custom') {
            const date = document.getElementById('custom_date').value;
            const time = document.getElementById('custom_time').value;
            if (!date || !time) {
                e.preventDefault();
                Swal.fire('Error', 'Please select both date and time for custom expiry', 'error');
                return;
            }
        }
        
        // Show loading state
        const btn = document.getElementById('generateBtn');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        
        // Allow form to submit normally
    });
    
    // Character counter
    const textarea = document.getElementById('id_description');
    const counter = document.getElementById('charCount');
    
    textarea.addEventListener('input', function() {
        counter.textContent = this.value.length;
        if(this.value.length > 200) {
            counter.style.color = 'var(--danger)';
        } else {
            counter.style.color = 'var(--gray)';
        }
    });
}