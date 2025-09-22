// LED Board Controller - JavaScript Functionality

// Global Variables
let birthdays = JSON.parse(localStorage.getItem('birthdays')) || [];
let messages = JSON.parse(localStorage.getItem('messages')) || [];
let logs = JSON.parse(localStorage.getItem('logs')) || [];
let settings = JSON.parse(localStorage.getItem('settings')) || {
  ssid: 'MyWiFiNetwork',
  password: '********',
  ip: '192.168.1.100',
  port: 80,
  protocol: 'HTTP',
  brightness: 75,
  fontSize: 16,
  effect: 'scroll_left',
  aiEnabled: true,
  aiApiKey: '',
  aiModel: 'llama3-8b-8192'
};

// Enhanced Notification System
function showNotification(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas ${getNotificationIcon(type)}"></i>
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" class="notification-close">
      <i class="fas fa-times"></i>
    </button>
  `;

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => notification.classList.add('show'), 100);

  // Auto remove
  if (duration > 0) {
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  return notification;
}

function getNotificationIcon(type) {
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };
  return icons[type] || icons.info;
}

// Loading States
function showLoading(button, text = 'Loading...') {
  const originalText = button.innerHTML;
  button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
  button.disabled = true;
  button.dataset.originalText = originalText;
  return () => {
    button.innerHTML = originalText;
    button.disabled = false;
  };
}

// Enhanced Button Interactions
function addButtonEffects() {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mousedown', function() {
      this.style.transform = 'scale(0.98)';
    });

    btn.addEventListener('mouseup', function() {
      this.style.transform = '';
    });

    btn.addEventListener('mouseleave', function() {
      this.style.transform = '';
    });
  });
}

// Smooth Scrolling
function smoothScrollTo(element, duration = 500) {
  const targetPosition = element.offsetTop;
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  let startTime = null;

  function animation(currentTime) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const run = ease(timeElapsed, startPosition, distance, duration);
    window.scrollTo(0, run);
    if (timeElapsed < duration) requestAnimationFrame(animation);
  }

  function ease(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
  }

  requestAnimationFrame(animation);
}

// Enhanced Form Validation
function validateForm(formId) {
  const form = document.getElementById(formId);
  const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
  let isValid = true;

  inputs.forEach(input => {
    if (!input.value.trim()) {
      showInputError(input, 'This field is required');
      isValid = false;
    } else {
      clearInputError(input);
    }

    // Email validation
    if (input.type === 'email' && input.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.value)) {
        showInputError(input, 'Please enter a valid email address');
        isValid = false;
      }
    }

    // URL validation
    if (input.type === 'url' && input.value) {
      try {
        new URL(input.value);
      } catch {
        showInputError(input, 'Please enter a valid URL');
        isValid = false;
      }
    }
  });

  return isValid;
}

function showInputError(input, message) {
  clearInputError(input);
  input.classList.add('error');
  const errorDiv = document.createElement('div');
  errorDiv.className = 'input-error';
  errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
  input.parentNode.appendChild(errorDiv);
}

function clearInputError(input) {
  input.classList.remove('error');
  const errorDiv = input.parentNode.querySelector('.input-error');
  if (errorDiv) errorDiv.remove();
}

// Enhanced Modal System
function createModal(title, content, buttons = []) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        ${content}
      </div>
      ${buttons.length ? `
        <div class="modal-footer">
          ${buttons.map(btn => `<button class="btn ${btn.class || ''}" onclick="${btn.action}">${btn.text}</button>`).join('')}
        </div>
      ` : ''}
    </div>
  `;

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('show'), 10);

  return modal;
}

// Theme Toggle (for future dark mode)
function toggleTheme() {
  document.body.classList.toggle('dark-theme');
  const isDark = document.body.classList.contains('dark-theme');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  showNotification(`Switched to ${isDark ? 'dark' : 'light'} theme`, 'info');
}

// Load saved theme
function loadTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
  }
}

// Enhanced Statistics Animation
function animateCounter(element, target, duration = 1000) {
  const start = parseInt(element.textContent) || 0;
  const increment = target / (duration / 16);
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current);
  }, 16);
}

// Page Transition Effects
function addPageTransitions() {
  document.querySelectorAll('a[href]').forEach(link => {
    link.addEventListener('click', function(e) {
      if (this.href !== window.location.href) {
        e.preventDefault();
        document.body.style.opacity = '0';
        setTimeout(() => {
          window.location.href = this.href;
        }, 300);
      }
    });
  });
}

// Initialize enhanced features
document.addEventListener('DOMContentLoaded', function() {
  loadSettings();
  updateUI();
  initializeEventListeners();
  checkScheduledMessages();

  // Add enhanced features
  addButtonEffects();
  addPageTransitions();
  loadTheme();

  // Add loading states to forms
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function(e) {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        const restoreLoading = showLoading(submitBtn, 'Saving...');
        setTimeout(restoreLoading, 2000); // Simulate loading
      }
    });
  });
});

// Floating Action Button Functions
function toggleFabMenu() {
  const fabMenu = document.getElementById('fab-menu');
  const fab = document.getElementById('fab');
  const isOpen = fabMenu.classList.contains('show');

  if (isOpen) {
    fabMenu.classList.remove('show');
    fab.innerHTML = '<i class="fas fa-plus"></i>';
  } else {
    fabMenu.classList.add('show');
    fab.innerHTML = '<i class="fas fa-times"></i>';
  }
}

function quickSendMessage() {
  const message = prompt('Enter message to send:');
  if (message && message.trim()) {
    sendMessage(message.trim());
    showNotification('Message sent successfully!', 'success');
  }
  toggleFabMenu();
}

function quickAddBirthday() {
  const name = prompt('Enter birthday person name:');
  if (name && name.trim()) {
    const dob = prompt('Enter date of birth (YYYY-MM-DD):');
    if (dob) {
      addBirthday(name.trim(), dob);
      showNotification('Birthday added successfully!', 'success');
    }
  }
  toggleFabMenu();
}

// Close FAB menu when clicking outside
document.addEventListener('click', function(e) {
  const fab = document.getElementById('fab');
  const fabMenu = document.getElementById('fab-menu');

  if (fab && fabMenu && !fab.contains(e.target) && !fabMenu.contains(e.target)) {
    fabMenu.classList.remove('show');
    if (fab) fab.innerHTML = '<i class="fas fa-plus"></i>';
  }
});

// Settings Management
function loadSettings() {
  document.getElementById('ssid').value = settings.ssid;
  document.getElementById('password').value = settings.password;
  document.getElementById('ip').value = settings.ip;
  document.getElementById('port').value = settings.port;
  document.getElementById('protocol').value = settings.protocol;
  document.getElementById('brightness').value = settings.brightness;
  document.getElementById('font_size').value = settings.fontSize;
  document.getElementById('effect').value = settings.effect;
  document.getElementById('ai_enabled').checked = settings.aiEnabled;
  document.getElementById('ai_api_key').value = settings.aiApiKey;
  document.getElementById('ai_model').value = settings.aiModel;

  // Load theme toggle state
  const themeToggle = document.getElementById('theme_toggle');
  if (themeToggle) {
    const savedTheme = localStorage.getItem('theme');
    themeToggle.checked = savedTheme === 'dark';
  }

  updateBrightnessValue();
}

function saveSettings() {
  settings.ssid = document.getElementById('ssid').value;
  settings.password = document.getElementById('password').value;
  settings.ip = document.getElementById('ip').value;
  settings.port = document.getElementById('port').value;
  settings.protocol = document.getElementById('protocol').value;
  settings.brightness = document.getElementById('brightness').value;
  settings.fontSize = document.getElementById('font_size').value;
  settings.effect = document.getElementById('effect').value;
  settings.aiEnabled = document.getElementById('ai_enabled').checked;
  settings.aiApiKey = document.getElementById('ai_api_key').value;
  settings.aiModel = document.getElementById('ai_model').value;

  localStorage.setItem('settings', JSON.stringify(settings));
  showNotification('Settings saved successfully!', 'success');
}

// Form Validation
function validateForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return true;

  const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
  let isValid = true;

  inputs.forEach(input => {
    if (!input.value.trim()) {
      input.style.borderColor = '#dc3545';
      isValid = false;
    } else {
      input.style.borderColor = '#dee2e6';
    }
  });

  if (!isValid) {
    showNotification('Please fill in all required fields', 'error');
  }

  return isValid;
}

// Message Functions
function sendMessage() {
  if (!validateForm('message-form')) return;

  const message = document.getElementById('message').value;
  const timestamp = new Date().toISOString();

  // Simulate sending to board
  showNotification('Sending message to LED board...', 'info');

  setTimeout(() => {
    // Add to logs
    const logEntry = {
      id: Date.now(),
      message: message,
      timestamp: timestamp,
      type: 'Manual',
      status: 'Sent'
    };
    logs.unshift(logEntry);
    localStorage.setItem('logs', JSON.stringify(logs));

    showNotification('Message sent successfully!', 'success');
    document.getElementById('message').value = '';
    updateUI();
  }, 1500);
}

function scheduleMessage() {
  if (!validateForm('schedule-form')) return;

  const message = document.getElementById('schedule-message').value;
  const time = document.getElementById('schedule-time').value;
  const timestamp = new Date().toISOString();

  if (!time) {
    showNotification('Please select a time', 'error');
    return;
  }

  const scheduledTime = new Date();
  const [hours, minutes] = time.split(':');
  scheduledTime.setHours(hours, minutes, 0, 0);

  if (scheduledTime <= new Date()) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const scheduledMessage = {
    id: Date.now(),
    message: message,
    scheduledTime: scheduledTime.toISOString(),
    timestamp: timestamp,
    type: 'Scheduled',
    status: 'Scheduled'
  };

  messages.push(scheduledMessage);
  localStorage.setItem('messages', JSON.stringify(messages));

  showNotification(`Message scheduled for ${scheduledTime.toLocaleString()}`, 'success');
  document.getElementById('schedule-message').value = '';
  document.getElementById('schedule-time').value = '';
  updateUI();
}

function generateAIMessage() {
  const prompt = document.getElementById('ai-prompt').value;
  if (!prompt) {
    showNotification('Please enter a prompt', 'error');
    return;
  }

  if (!settings.aiEnabled) {
    showNotification('AI features are disabled', 'error');
    return;
  }

  showNotification('Generating message with AI...', 'info');

  // Simulate AI response
  setTimeout(() => {
    const aiMessages = [
      "Happy Birthday! May your day be filled with joy and celebration!",
      "Congratulations on your special day! Wishing you all the best!",
      "Welcome to our team! We're excited to have you on board!",
      "Thank you for your hard work and dedication!",
      "Happy Holidays! May your season be filled with warmth and joy!"
    ];

    const randomMessage = aiMessages[Math.floor(Math.random() * aiMessages.length)];

    document.getElementById('ai-message').textContent = randomMessage;
    document.getElementById('ai-result').style.display = 'block';
    showNotification('Message generated successfully!', 'success');
  }, 2000);
}

function useAIMessage() {
  const message = document.getElementById('ai-message').textContent;
  document.getElementById('message').value = message;
  showNotification('Message copied to form', 'success');
}

// Birthday Functions
function handleFileUpload(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const csv = e.target.result;
    const lines = csv.split('\n');
    const headers = lines[0].split(',');

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length >= 2) {
        const birthday = {
          id: Date.now() + i,
          name: values[0].trim(),
          dob: values[1].trim()
        };
        birthdays.push(birthday);
      }
    }

    localStorage.setItem('birthdays', JSON.stringify(birthdays));
    showNotification('Birthdays uploaded successfully!', 'success');
    updateUI();
  };
  reader.readAsText(file);
}

function sendBirthdayMessage(name) {
  const message = `Happy Birthday ${name}! Wishing you a fantastic year ahead!`;
  document.getElementById('message').value = message;
  showNotification('Birthday message ready to send', 'info');
}

// Log Functions
function clearLogs() {
  if (confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
    logs = [];
    localStorage.setItem('logs', JSON.stringify(logs));
    showNotification('Logs cleared successfully!', 'success');
    updateUI();
  }
}

function viewLogDetails(logId) {
  const log = logs.find(l => l.id == logId);
  if (log) {
    document.getElementById('log-details').innerHTML = `
      <div class="log-detail-item">
        <strong>Message:</strong> ${log.message}
      </div>
      <div class="log-detail-item">
        <strong>Timestamp:</strong> ${new Date(log.timestamp).toLocaleString()}
      </div>
      <div class="log-detail-item">
        <strong>Type:</strong> ${log.type}
      </div>
      <div class="log-detail-item">
        <strong>Status:</strong> ${log.status}
      </div>
    `;
    document.getElementById('log-modal').style.display = 'block';
  }
}

function closeModal() {
  document.getElementById('log-modal').style.display = 'none';
}

function filterLogs() {
  const typeFilter = document.getElementById('filter-type').value;
  const dateFrom = document.getElementById('filter-date-from').value;
  const dateTo = document.getElementById('filter-date-to').value;

  const rows = document.querySelectorAll('#logs-table-body tr');

  rows.forEach(row => {
    let show = true;

    if (typeFilter !== 'all') {
      const typeCell = row.cells[2].textContent.toLowerCase();
      if (!typeCell.includes(typeFilter)) {
        show = false;
      }
    }

    if (dateFrom || dateTo) {
      const dateCell = row.cells[1].textContent;
      const rowDate = new Date(dateCell);

      if (dateFrom && rowDate < new Date(dateFrom)) {
        show = false;
      }
      if (dateTo && rowDate > new Date(dateTo + 'T23:59:59')) {
        show = false;
      }
    }

    row.style.display = show ? '' : 'none';
  });
}

function resetFilters() {
  document.getElementById('filter-type').value = 'all';
  document.getElementById('filter-date-from').value = '';
  document.getElementById('filter-date-to').value = '';
  filterLogs();
}

// Utility Functions
function updateBrightnessValue() {
  const brightness = document.getElementById('brightness').value;
  document.getElementById('brightness-value').textContent = brightness + '%';
}

function testConnection() {
  showNotification('Testing board connection...', 'info');
  setTimeout(() => {
    showNotification('Connection successful!', 'success');
  }, 2000);
}

function previewSettings() {
  const brightness = document.getElementById('brightness').value;
  const fontSize = document.getElementById('font_size').value;
  const effect = document.getElementById('effect').value;

  showNotification(`Preview: ${brightness}% brightness, ${fontSize}px font, ${effect} effect`, 'info');
}

function restartSystem() {
  showNotification('Restarting system...', 'info');
  setTimeout(() => {
    showNotification('System restarted successfully!', 'success');
  }, 3000);
}

function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
    settings = {
      ssid: 'MyWiFiNetwork',
      password: '********',
      ip: '192.168.1.100',
      port: 80,
      protocol: 'HTTP',
      brightness: 75,
      fontSize: 16,
      effect: 'scroll_left',
      aiEnabled: true,
      aiApiKey: '',
      aiModel: 'llama3-8b-8192'
    };
    localStorage.setItem('settings', JSON.stringify(settings));
    loadSettings();
    showNotification('Settings reset to defaults!', 'success');
  }
}

function exportSettings() {
  const dataStr = JSON.stringify(settings, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

  const exportFileDefaultName = 'led-board-settings.json';

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();

  showNotification('Settings exported successfully!', 'success');
}

function confirmAction(message, action) {
  if (confirm(message)) {
    action();
  }
}

// UI Update Functions
function updateUI() {
  updateDashboard();
  updateBirthdays();
  updateLogs();
}

function updateDashboard() {
  // Update stats
  document.getElementById('total-messages').textContent = logs.length;
  document.getElementById('manual-messages').textContent = logs.filter(l => l.type === 'Manual').length;
  document.getElementById('birthday-messages').textContent = logs.filter(l => l.type === 'Birthday').length;
  document.getElementById('scheduled-messages').textContent = logs.filter(l => l.type === 'Scheduled').length;

  // Update recent activity
  const recentLogs = logs.slice(0, 3);
  const activityContainer = document.getElementById('recent-activity');
  if (activityContainer) {
    activityContainer.innerHTML = recentLogs.map(log => `
      <div class="activity-item">
        <div class="activity-icon">
          <i class="fas fa-paper-plane"></i>
        </div>
        <div class="activity-content">
          <p class="activity-text">${log.message.substring(0, 50)}${log.message.length > 50 ? '...' : ''}</p>
          <span class="activity-time">${new Date(log.timestamp).toLocaleString()}</span>
        </div>
      </div>
    `).join('');
  }
}

function updateBirthdays() {
  const birthdayList = document.getElementById('birthday-list');
  if (birthdayList) {
    if (birthdays.length > 0) {
      birthdayList.innerHTML = birthdays.map(birthday => `
        <div class="birthday-item">
          <div class="birthday-info">
            <strong>${birthday.name}</strong>
            <span>${birthday.dob}</span>
          </div>
          <div class="birthday-actions">
            <button class="btn btn-sm btn-outline" onclick="sendBirthdayMessage('${birthday.name}')">
              <i class="fas fa-paper-plane"></i> Send Message
            </button>
          </div>
        </div>
      `).join('');
    } else {
      birthdayList.innerHTML = '<p class="no-data">No birthdays uploaded yet. Upload a file to get started!</p>';
    }
  }
}

function updateLogs() {
  const logsTableBody = document.getElementById('logs-table-body');
  if (logsTableBody) {
    logsTableBody.innerHTML = logs.map(log => `
      <tr>
        <td class="message-cell">${log.message}</td>
        <td>${new Date(log.timestamp).toLocaleString()}</td>
        <td><span class="badge badge-${log.type.toLowerCase()}">${log.type}</span></td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="viewLogDetails(${log.id})">
            <i class="fas fa-eye"></i> View
          </button>
        </td>
      </tr>
    `).join('');
  }
}

// Notification System
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Event Listeners
function initializeEventListeners() {
  // Form submissions
  const messageForm = document.getElementById('message-form');
  if (messageForm) {
    messageForm.addEventListener('submit', function(e) {
      e.preventDefault();
      sendMessage();
    });
  }

  const scheduleForm = document.getElementById('schedule-form');
  if (scheduleForm) {
    scheduleForm.addEventListener('submit', function(e) {
      e.preventDefault();
      scheduleMessage();
    });
  }

  const connectionForm = document.getElementById('connection-form');
  if (connectionForm) {
    connectionForm.addEventListener('submit', function(e) {
      e.preventDefault();
      saveSettings();
    });
  }

  const displayForm = document.getElementById('display-form');
  if (displayForm) {
    displayForm.addEventListener('submit', function(e) {
      e.preventDefault();
      saveSettings();
    });
  }

  const aiForm = document.getElementById('ai-form');
  if (aiForm) {
    aiForm.addEventListener('submit', function(e) {
      e.preventDefault();
      saveSettings();
    });
  }

  // Modal close
  window.onclick = function(event) {
    const modal = document.getElementById('log-modal');
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
}

// Scheduled Messages Check
function checkScheduledMessages() {
  const now = new Date();

  messages.forEach((msg, index) => {
    const scheduledTime = new Date(msg.scheduledTime);
    if (scheduledTime <= now && msg.status === 'Scheduled') {
      // Send the message
      const logEntry = {
        id: Date.now(),
        message: msg.message,
        timestamp: now.toISOString(),
        type: 'Scheduled',
        status: 'Sent'
      };
      logs.unshift(logEntry);

      // Remove from scheduled messages
      messages.splice(index, 1);

      localStorage.setItem('logs', JSON.stringify(logs));
      localStorage.setItem('messages', JSON.stringify(messages));

      showNotification('Scheduled message sent!', 'success');
      updateUI();
    }
  });

  // Check again in 1 minute
  setTimeout(checkScheduledMessages, 60000);
}

// Quick Actions
function sendTestMessage() {
  document.getElementById('message').value = 'Test Message - LED Board is working!';
  showNotification('Test message ready to send', 'info');
}

function checkBoardStatus() {
  showNotification('Board status: Online', 'success');
}
