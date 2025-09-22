// Mobile sidebar toggle
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('show');
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.querySelector('.mobile-menu-toggle');

    if (!sidebar.contains(event.target) && !toggleBtn.contains(event.target)) {
        sidebar.classList.remove('show');
    }
});

// Send test message
function sendTestMessage() {
    showNotification('Sending test message...', 'info');

    fetch('/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'message=Hello from LED Controller Dashboard!'
    })
    .then(response => {
        if (response.ok) {
            showNotification('Test message sent successfully!', 'success');
        } else {
            showNotification('Failed to send message', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error sending message', 'error');
    });
}

// Check board status
function checkBoardStatus() {
    showNotification('Checking board connection...', 'info');

    // Simulate board status check
    setTimeout(() => {
        showNotification('Board is online and ready!', 'success');
    }, 2000);
}

// Schedule message
function scheduleMessage() {
    const time = document.getElementById('schedule-time').value;
    const message = document.getElementById('schedule-message').value;
    const active = document.getElementById('schedule-active').checked;

    if (!time || !message) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    fetch('/api/schedule', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ time, message, active })
    })
    .then(response => {
        if (response.ok) {
            showNotification('Message scheduled successfully!', 'success');
            document.getElementById('schedule-time').value = '';
            document.getElementById('schedule-message').value = '';
            document.getElementById('schedule-active').checked = false;
        } else {
            showNotification('Failed to schedule message', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error scheduling message', 'error');
    });
}

// Export logs
function exportLogs() {
    const table = document.querySelector('table');
    if (!table) {
        showNotification('No logs to export', 'error');
        return;
    }

    let csv = 'Message,Timestamp,Type\n';
    const rows = table.querySelectorAll('tr');
    for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll('td');
        csv += `"${cells[0].textContent}","${cells[1].textContent}","${cells[2].textContent}"\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showNotification('Logs exported successfully!', 'success');
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Form validation
function validateForm(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');

    for (let input of inputs) {
        if (!input.value.trim()) {
            showNotification(`Please fill in ${input.name || 'all required fields'}`, 'error');
            input.focus();
            return false;
        }
    }

    return true;
}

// Loading states
function showLoading(button) {
    const originalText = button.textContent;
    button.textContent = 'Loading...';
    button.disabled = true;

    return () => {
        button.textContent = originalText;
        button.disabled = false;
    };
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add fade-in animation to cards
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in');
    });

    // Highlight active nav link
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

// File upload preview
function handleFileUpload(input) {
    const file = input.files[0];
    if (file) {
        const fileName = file.name;
        const fileSize = (file.size / 1024 / 1024).toFixed(2) + ' MB';

        showNotification(`File selected: ${fileName} (${fileSize})`, 'success');
    }
}

// Confirm actions
function confirmAction(message, action) {
    if (confirm(message)) {
        action();
    }
}
