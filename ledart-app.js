/**
 * LED Board Controller Application
 * LedArt-style frontend for P10 LED display control
 * Communicates with local Python server for board control
 */

// Application State
const AppState = {
    currentPage: 'dashboard',
    settings: {
        apiHost: 'localhost',
        apiPort: 5000,
        boardWidth: 96,
        boardHeight: 16,
        scanGroup: '1/16',
        darkMode: false
    },
    widgets: [],
    selectedWidget: null,
    scheduledEvents: [],
    currentDate: new Date(),
    // Local storage keys
    STORAGE_KEYS: {
        SETTINGS: 'ledboard_settings',
        EVENTS: 'ledboard_events',
        WIDGETS: 'ledboard_widgets',
        MESSAGES: 'ledboard_messages'
    }
};

// Mock LED Board API (Frontend-only simulation)
class LEDboardAPI {
    constructor() {
        this.baseUrl = 'mock://local'; // Mock URL for frontend-only
    }

    updateBaseUrl() {
        // No-op for frontend-only
    }

    async testConnection() {
        // Simulate connection test - always return true for demo
        return new Promise(resolve => {
            setTimeout(() => resolve(true), 500);
        });
    }

    async sendQuickMessage(message) {
        // Simulate sending message to LED board
        console.log('Mock: Sending message to LED board:', message);

        // Store message locally
        const messages = JSON.parse(localStorage.getItem(AppState.STORAGE_KEYS.MESSAGES) || '[]');
        messages.push({
            id: Date.now(),
            message: message,
            timestamp: new Date().toISOString(),
            type: 'quick_message',
            status: 'sent'
        });

        // Keep only last 100 messages
        if (messages.length > 100) {
            messages.splice(0, messages.length - 100);
        }

        localStorage.setItem(AppState.STORAGE_KEYS.MESSAGES, JSON.stringify(messages));

        return true;
    }

    async sendProgram(programData) {
        console.log('Mock: Sending program to LED board:', programData);

        // Store program locally
        const messages = JSON.parse(localStorage.getItem(AppState.STORAGE_KEYS.MESSAGES) || '[]');
        messages.push({
            id: Date.now(),
            message: `Program: ${programData.widgets.length} widget(s)`,
            timestamp: new Date().toISOString(),
            type: 'program',
            status: 'sent',
            programData: programData
        });

        // Keep only last 100 messages
        if (messages.length > 100) {
            messages.splice(0, messages.length - 100);
        }

        localStorage.setItem(AppState.STORAGE_KEYS.MESSAGES, JSON.stringify(messages));

        return true;
    }

    async getBoardStatus() {
        // Simulate board status - always online for demo
        return {
            online: true,
            ip: '127.0.0.1',
            port: '8080',
            status: 'Mock LED Board Online'
        };
    }
}

// Initialize API instance
const api = new LEDboardAPI();

// Application Initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadSettings();
    showPage('dashboard');
    updateConnectionStatus();
    generateLEDCanvas();
    generateCalendar();
});

function initializeApp() {
    console.log('LED Board Controller App Initializing...');

    // Set initial theme
    if (AppState.settings.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Load all data from localStorage
    loadSettings();
    loadWidgets();
    loadScheduledEvents();

    updateScheduledCount();
    updateMessageHistory();
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const page = tab.dataset.page;
            showPage(page);
        });
    });

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('darkModeToggle').addEventListener('change', toggleTheme);

    // Quick message modal
    document.getElementById('quickMessageBtn').addEventListener('click', () => {
        showModal('quickMessageModal');
    });

    // Modal controls
    setupModalControls();

    // Connection test (now just shows mock status)
    document.getElementById('testConnectionBtn').addEventListener('click', testConnection);

    // Widget buttons
    document.querySelectorAll('.widget-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const widgetType = btn.dataset.widget;
            addWidget(widgetType);
        });
    });

    // Editor actions
    document.getElementById('clearCanvasBtn').addEventListener('click', clearCanvas);
    document.getElementById('sendToBoardBtn').addEventListener('click', sendProgramToBoard);

    // Settings forms
    document.getElementById('apiSettingsForm').addEventListener('submit', saveAPISettings);
    document.getElementById('boardSettingsForm').addEventListener('submit', saveBoardSettings);

    // Quick message form
    document.getElementById('quickMessageForm').addEventListener('submit', sendQuickMessage);

    // AI Generate button
    document.getElementById('aiGenerateBtn').addEventListener('click', generateAIMessage);

    // Calendar navigation
    document.getElementById('prevMonth').addEventListener('click', () => navigateMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => navigateMonth(1));

    // Event scheduling
    document.getElementById('addEventBtn').addEventListener('click', () => showModal('eventModal'));
    document.getElementById('eventForm').addEventListener('submit', scheduleEvent);

    // Birthday file upload
    document.getElementById('birthdayFile').addEventListener('change', handleBirthdayUpload);

    // Stop program button
    document.getElementById('stopProgramBtn').addEventListener('click', stopProgram);
}

function setupModalControls() {
    // Quick Message Modal
    document.getElementById('quickMessageClose').addEventListener('click', () => hideModal('quickMessageModal'));
    document.getElementById('quickMessageCancel').addEventListener('click', () => hideModal('quickMessageModal'));

    // Event Modal
    document.getElementById('eventModalClose').addEventListener('click', () => hideModal('eventModal'));
    document.getElementById('eventModalCancel').addEventListener('click', () => hideModal('eventModal'));

    // Click outside to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal(modal.id);
            }
        });
    });
}

// Page Navigation
function showPage(pageId) {
    // Update navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.page === pageId) {
            tab.classList.add('active');
        }
    });

    // Update page visibility
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    document.getElementById(`${pageId}-page`).classList.add('active');
    AppState.currentPage = pageId;

    // Page-specific initialization
    if (pageId === 'editor') {
        generateLEDCanvas();
    } else if (pageId === 'scheduler') {
        generateCalendar();
        updateEventsList();
    } else if (pageId === 'settings') {
        loadSettingsForm();
    } else if (pageId === 'dashboard') {
        updateDashboard();
    }
}

// Settings Management
function loadSettings() {
    const savedSettings = localStorage.getItem(AppState.STORAGE_KEYS.SETTINGS);
    if (savedSettings) {
        AppState.settings = { ...AppState.settings, ...JSON.parse(savedSettings) };
    }

    if (AppState.settings.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        const toggle = document.getElementById('darkModeToggle');
        if (toggle) toggle.checked = true;
    }
}

function loadWidgets() {
    const savedWidgets = localStorage.getItem(AppState.STORAGE_KEYS.WIDGETS);
    if (savedWidgets) {
        AppState.widgets = JSON.parse(savedWidgets);
    }
}

function loadScheduledEvents() {
    const savedEvents = localStorage.getItem(AppState.STORAGE_KEYS.EVENTS);
    if (savedEvents) {
        AppState.scheduledEvents = JSON.parse(savedEvents);
    }
}

function saveSettings() {
    localStorage.setItem(AppState.STORAGE_KEYS.SETTINGS, JSON.stringify(AppState.settings));
}

function saveWidgets() {
    localStorage.setItem(AppState.STORAGE_KEYS.WIDGETS, JSON.stringify(AppState.widgets));
}

function saveScheduledEvents() {
    localStorage.setItem(AppState.STORAGE_KEYS.EVENTS, JSON.stringify(AppState.scheduledEvents));
}

function loadSettingsForm() {
    document.getElementById('apiHost').value = AppState.settings.apiHost;
    document.getElementById('apiPort').value = AppState.settings.apiPort;
    document.getElementById('boardWidth').value = AppState.settings.boardWidth;
    document.getElementById('boardHeight').value = AppState.settings.boardHeight;
    document.getElementById('scanGroup').value = AppState.settings.scanGroup;
    document.getElementById('darkModeToggle').checked = AppState.settings.darkMode;
}

function saveAPISettings(e) {
    e.preventDefault();

    // For frontend-only, API settings are just for display/reference
    AppState.settings.apiHost = document.getElementById('apiHost').value;
    AppState.settings.apiPort = parseInt(document.getElementById('apiPort').value);

    saveSettings();
    showNotification('Settings saved successfully (Frontend-only mode)', 'success');
    updateConnectionStatus();
}

function saveBoardSettings(e) {
    e.preventDefault();

    AppState.settings.boardWidth = parseInt(document.getElementById('boardWidth').value);
    AppState.settings.boardHeight = parseInt(document.getElementById('boardHeight').value);
    AppState.settings.scanGroup = document.getElementById('scanGroup').value;

    saveSettings();
    updateCanvasSize();
    showNotification('Board settings saved successfully', 'success');
}

function toggleTheme() {
    AppState.settings.darkMode = !AppState.settings.darkMode;
    
    if (AppState.settings.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.documentElement.removeAttribute('data-theme');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    // Sync both toggles
    document.getElementById('darkModeToggle').checked = AppState.settings.darkMode;
    
    saveSettings();
}

// Connection Management (Mock for frontend-only)
async function updateConnectionStatus() {
    const isConnected = await api.testConnection();
    const statusElements = document.querySelectorAll('#connectionStatus, #apiStatus');

    statusElements.forEach(element => {
        const dot = element.querySelector('.status-dot');
        const text = element.querySelector('.status-text') || element.querySelector('span:last-child');

        if (isConnected) {
            dot.className = 'status-dot online';
            text.textContent = 'Frontend Mode';
        } else {
            dot.className = 'status-dot offline';
            text.textContent = 'Offline';
        }
    });

    // Update board status (always mock online)
    updateBoardStatus();
}

async function updateBoardStatus() {
    const boardStatus = await api.getBoardStatus();
    const boardStatusElement = document.getElementById('boardStatus');
    const dot = boardStatusElement.querySelector('.status-dot');
    const text = boardStatusElement.querySelector('span:last-child');

    if (boardStatus && boardStatus.online) {
        dot.className = 'status-dot online';
        text.textContent = 'Mock Online';
    } else {
        dot.className = 'status-dot offline';
        text.textContent = 'Mock Offline';
    }
}

async function testConnection() {
    const button = document.getElementById('testConnectionBtn');
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';

    const isConnected = await api.testConnection();

    setTimeout(() => {
        button.disabled = false;
        button.innerHTML = 'Test Connection';

        if (isConnected) {
            showNotification('Frontend mode active - No backend required!', 'success');
        } else {
            showNotification('Frontend mode - Mock connection test', 'info');
        }

        updateConnectionStatus();
    }, 1000);
}

// Dashboard Functions
function updateDashboard() {
    updateConnectionStatus();
    updateScheduledCount();
    updateBoardResolution();
    updateMessageHistory();
}

function updateBoardResolution() {
    document.getElementById('boardResolution').textContent =
        `${AppState.settings.boardWidth}x${AppState.settings.boardHeight}`;
}

function updateScheduledCount() {
    const count = AppState.scheduledEvents.length;
    document.getElementById('scheduledCount').textContent =
        `${count} event${count !== 1 ? 's' : ''}`;
}

function updateMessageHistory() {
    const messages = JSON.parse(localStorage.getItem(AppState.STORAGE_KEYS.MESSAGES) || '[]');
    const recentMessages = messages.slice(-5).reverse(); // Last 5 messages, most recent first

    const messageHistoryElement = document.getElementById('messageHistory');
    if (!messageHistoryElement) return;

    if (recentMessages.length === 0) {
        messageHistoryElement.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">No messages sent yet</p>';
        return;
    }

    messageHistoryElement.innerHTML = recentMessages.map(msg => `
        <div class="message-item">
            <div class="message-content">${msg.message}</div>
            <div class="message-meta">${formatMessageTime(msg.timestamp)} • ${msg.type.replace('_', ' ')}</div>
        </div>
    `).join('');
}

function formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
}

// Quick Message Functions
async function sendQuickMessage(e) {
    e.preventDefault();
    
    const messageText = document.getElementById('quickMessageText').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    
    const success = await api.sendQuickMessage(messageText);
    
    setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Send Message';
        
        if (success) {
            showNotification('Message sent successfully!', 'success');
            hideModal('quickMessageModal');
            document.getElementById('quickMessageText').value = '';
        } else {
            showNotification('Failed to send message. Check connection.', 'error');
        }
    }, 1000);
}

async function generateAIMessage() {
    const promptType = document.getElementById('aiPromptType').value;
    const textArea = document.getElementById('quickMessageText');
    const button = document.getElementById('aiGenerateBtn');
    
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    
    // Simulate AI generation (replace with actual API call)
    const aiMessages = {
        greeting: ['Good morning! Have a wonderful day!', 'Hello there! Hope you\'re doing great!', 'Welcome! Nice to see you today!'],
        announcement: ['Important update coming soon!', 'New features available now!', 'Please check the latest information!'],
        motivational: ['Believe in yourself!', 'You can achieve anything!', 'Today is full of possibilities!'],
        weather: ['It\'s a beautiful day outside!', 'Perfect weather today!', 'Enjoy the sunshine!']
    };
    
    setTimeout(() => {
        const messages = aiMessages[promptType] || aiMessages.greeting;
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        textArea.value = randomMessage;
        
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-magic"></i> AI Generate';
    }, 1500);
}

// LED Canvas Functions
function generateLEDCanvas() {
    const canvas = document.getElementById('ledCanvas');
    const { boardWidth, boardHeight } = AppState.settings;
    
    // Update canvas size display
    document.getElementById('canvasSize').textContent = `${boardWidth} x ${boardHeight}`;
    
    // Create LED grid
    const ledGrid = document.createElement('div');
    ledGrid.className = 'led-grid';
    ledGrid.style.gridTemplateColumns = `repeat(${boardWidth}, 1fr)`;
    
    // Generate LED pixels
    for (let i = 0; i < boardWidth * boardHeight; i++) {
        const pixel = document.createElement('div');
        pixel.className = 'led-pixel';
        pixel.dataset.index = i;
        ledGrid.appendChild(pixel);
    }
    
    canvas.innerHTML = '';
    canvas.appendChild(ledGrid);
    
    // Render existing widgets
    AppState.widgets.forEach(widget => renderWidget(widget));
}

function updateCanvasSize() {
    generateLEDCanvas();
}

// Widget Management
function addWidget(type) {
    const widget = createWidget(type);
    AppState.widgets.push(widget);
    saveWidgets();
    renderWidget(widget);
    selectWidget(widget.id);
}

function createWidget(type) {
    const id = `widget_${Date.now()}`;
    const baseWidget = {
        id,
        type,
        x: 10,
        y: 10,
        width: type === 'clock' ? 64 : 80,
        height: 16
    };

    if (type === 'text') {
        return {
            ...baseWidget,
            properties: {
                text: 'Sample Text',
                fontSize: 12,
                color: '#FF0000',
                bold: false,
                italic: false,
                animation: 'scrollLeft',
                speed: 50
            }
        };
    } else if (type === 'clock') {
        return {
            ...baseWidget,
            properties: {
                format: '24h',
                syncTime: true
            }
        };
    }
}

function renderWidget(widget) {
    const canvas = document.getElementById('ledCanvas');
    const widgetElement = document.createElement('div');
    
    widgetElement.className = `widget ${widget.type}-widget`;
    widgetElement.dataset.widgetId = widget.id;
    widgetElement.style.left = `${widget.x}px`;
    widgetElement.style.top = `${widget.y}px`;
    widgetElement.style.width = `${widget.width}px`;
    widgetElement.style.height = `${widget.height}px`;
    
    if (widget.type === 'text') {
        widgetElement.textContent = widget.properties.text;
        widgetElement.style.fontSize = `${widget.properties.fontSize}px`;
        widgetElement.style.color = widget.properties.color;
        widgetElement.style.fontWeight = widget.properties.bold ? 'bold' : 'normal';
        widgetElement.style.fontStyle = widget.properties.italic ? 'italic' : 'normal';
    } else if (widget.type === 'clock') {
        updateClockWidget(widgetElement, widget);
        // Update clock every second
        setInterval(() => updateClockWidget(widgetElement, widget), 1000);
    }
    
    // Make widget draggable and selectable
    makeWidgetInteractive(widgetElement, widget);
    
    canvas.appendChild(widgetElement);
}

function updateClockWidget(element, widget) {
    const now = new Date();
    let timeString;
    
    if (widget.properties.format === '12h') {
        timeString = now.toLocaleTimeString('en-US', { 
            hour12: true, 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    } else {
        timeString = now.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    element.textContent = timeString;
}

function makeWidgetInteractive(element, widget) {
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    
    element.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selectWidget(widget.id);
        
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = widget.x;
        startTop = widget.y;
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
    
    function onMouseMove(e) {
        if (!isDragging) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        widget.x = Math.max(0, startLeft + deltaX);
        widget.y = Math.max(0, startTop + deltaY);
        
        element.style.left = `${widget.x}px`;
        element.style.top = `${widget.y}px`;
    }
    
    function onMouseUp() {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }
}

function selectWidget(widgetId) {
    // Remove previous selection
    document.querySelectorAll('.widget').forEach(w => w.classList.remove('selected'));
    
    // Select new widget
    const widgetElement = document.querySelector(`[data-widget-id="${widgetId}"]`);
    if (widgetElement) {
        widgetElement.classList.add('selected');
    }
    
    AppState.selectedWidget = widgetId;
    showWidgetProperties(widgetId);
}

function showWidgetProperties(widgetId) {
    const widget = AppState.widgets.find(w => w.id === widgetId);
    if (!widget) return;
    
    const propertiesPanel = document.getElementById('widgetProperties');
    
    if (widget.type === 'text') {
        propertiesPanel.innerHTML = `
            <h4>Text Widget Properties</h4>
            <div class="form-group">
                <label>Text:</label>
                <input type="text" id="widgetText" value="${widget.properties.text}">
            </div>
            <div class="form-group">
                <label>Font Size:</label>
                <input type="number" id="widgetFontSize" value="${widget.properties.fontSize}" min="8" max="32">
            </div>
            <div class="form-group">
                <label>Color:</label>
                <input type="color" id="widgetColor" value="${widget.properties.color}">
            </div>
            <div class="form-group">
                <label>Animation:</label>
                <select id="widgetAnimation">
                    <option value="static" ${widget.properties.animation === 'static' ? 'selected' : ''}>Static</option>
                    <option value="scrollLeft" ${widget.properties.animation === 'scrollLeft' ? 'selected' : ''}>Scroll Left</option>
                    <option value="scrollRight" ${widget.properties.animation === 'scrollRight' ? 'selected' : ''}>Scroll Right</option>
                    <option value="flash" ${widget.properties.animation === 'flash' ? 'selected' : ''}>Flash</option>
                </select>
            </div>
            <div class="form-group">
                <label>Speed:</label>
                <input type="range" id="widgetSpeed" min="10" max="100" value="${widget.properties.speed}">
                <span>${widget.properties.speed}</span>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="widgetBold" ${widget.properties.bold ? 'checked' : ''}>
                    Bold
                </label>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="widgetItalic" ${widget.properties.italic ? 'checked' : ''}>
                    Italic
                </label>
            </div>
            <button class="btn btn-sm btn-outline" onclick="deleteWidget('${widget.id}')">
                <i class="fas fa-trash"></i> Delete Widget
            </button>
        `;
        
        // Add event listeners for property changes
        propertiesPanel.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('change', () => updateWidgetProperties(widget.id));
        });
        
    } else if (widget.type === 'clock') {
        propertiesPanel.innerHTML = `
            <h4>Clock Widget Properties</h4>
            <div class="form-group">
                <label>Format:</label>
                <select id="clockFormat">
                    <option value="24h" ${widget.properties.format === '24h' ? 'selected' : ''}>24 Hour</option>
                    <option value="12h" ${widget.properties.format === '12h' ? 'selected' : ''}>12 Hour</option>
                </select>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="clockSync" ${widget.properties.syncTime ? 'checked' : ''}>
                    Sync Time
                </label>
            </div>
            <button class="btn btn-sm btn-outline" onclick="deleteWidget('${widget.id}')">
                <i class="fas fa-trash"></i> Delete Widget
            </button>
        `;
        
        propertiesPanel.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('change', () => updateClockProperties(widget.id));
        });
    }
}

function updateWidgetProperties(widgetId) {
    const widget = AppState.widgets.find(w => w.id === widgetId);
    if (!widget || widget.type !== 'text') return;

    widget.properties.text = document.getElementById('widgetText').value;
    widget.properties.fontSize = parseInt(document.getElementById('widgetFontSize').value);
    widget.properties.color = document.getElementById('widgetColor').value;
    widget.properties.animation = document.getElementById('widgetAnimation').value;
    widget.properties.speed = parseInt(document.getElementById('widgetSpeed').value);
    widget.properties.bold = document.getElementById('widgetBold').checked;
    widget.properties.italic = document.getElementById('widgetItalic').checked;

    // Update speed display
    const speedSpan = document.querySelector('#widgetSpeed + span');
    if (speedSpan) speedSpan.textContent = widget.properties.speed;

    // Re-render widget
    const widgetElement = document.querySelector(`[data-widget-id="${widgetId}"]`);
    if (widgetElement) {
        widgetElement.textContent = widget.properties.text;
        widgetElement.style.fontSize = `${widget.properties.fontSize}px`;
        widgetElement.style.color = widget.properties.color;
        widgetElement.style.fontWeight = widget.properties.bold ? 'bold' : 'normal';
        widgetElement.style.fontStyle = widget.properties.italic ? 'italic' : 'normal';
    }

    saveWidgets();
}

function updateClockProperties(widgetId) {
    const widget = AppState.widgets.find(w => w.id === widgetId);
    if (!widget || widget.type !== 'clock') return;

    widget.properties.format = document.getElementById('clockFormat').value;
    widget.properties.syncTime = document.getElementById('clockSync').checked;

    // Update clock display
    const widgetElement = document.querySelector(`[data-widget-id="${widgetId}"]`);
    if (widgetElement) {
        updateClockWidget(widgetElement, widget);
    }

    saveWidgets();
}

function deleteWidget(widgetId) {
    AppState.widgets = AppState.widgets.filter(w => w.id !== widgetId);
    const widgetElement = document.querySelector(`[data-widget-id="${widgetId}"]`);
    if (widgetElement) {
        widgetElement.remove();
    }

    // Clear properties panel
    document.getElementById('widgetProperties').innerHTML = '<h4>Widget Properties</h4><p>Select a widget to edit properties</p>';
    AppState.selectedWidget = null;

    saveWidgets();
}

function clearCanvas() {
    if (confirm('Are you sure you want to clear all widgets?')) {
        AppState.widgets = [];
        document.querySelectorAll('.widget').forEach(w => w.remove());
        document.getElementById('widgetProperties').innerHTML = '<h4>Widget Properties</h4><p>Select a widget to edit properties</p>';
        AppState.selectedWidget = null;
        saveWidgets();
    }
}

async function sendProgramToBoard() {
    if (AppState.widgets.length === 0) {
        showNotification('No widgets to send. Add some widgets first.', 'warning');
        return;
    }
    
    const programData = {
        type: 'program',
        boardWidth: AppState.settings.boardWidth,
        boardHeight: AppState.settings.boardHeight,
        widgets: AppState.widgets,
        timestamp: new Date().toISOString()
    };
    
    const button = document.getElementById('sendToBoardBtn');
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    
    const success = await api.sendProgram(programData);
    
    setTimeout(() => {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-upload"></i> Send to Board';
        
        if (success) {
            showNotification('Program sent successfully!', 'success');
            updateCurrentProgram(`${AppState.widgets.length} widget(s)`);
        } else {
            showNotification('Failed to send program. Check connection.', 'error');
        }
    }, 1000);
}

function updateCurrentProgram(programName) {
    document.getElementById('currentProgram').innerHTML = `<span>${programName}</span>`;
}

async function stopProgram() {
    const success = await api.sendQuickMessage(''); // Send empty message to stop
    
    if (success) {
        showNotification('Program stopped', 'success');
        updateCurrentProgram('No program running');
    } else {
        showNotification('Failed to stop program', 'error');
    }
}

// Calendar Functions
function generateCalendar() {
    const calendar = document.getElementById('calendarGrid');
    const currentMonthElement = document.getElementById('currentMonth');
    
    const year = AppState.currentDate.getFullYear();
    const month = AppState.currentDate.getMonth();
    
    // Update month display
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    currentMonthElement.textContent = `${monthNames[month]} ${year}`;
    
    // Clear calendar
    calendar.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        dayHeader.style.fontWeight = 'bold';
        dayHeader.style.textAlign = 'center';
        dayHeader.style.padding = '8px';
        dayHeader.style.background = 'var(--bg-tertiary)';
        calendar.appendChild(dayHeader);
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendar.appendChild(emptyDay);
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        const currentDate = new Date(year, month, day);
        const dateString = currentDate.toISOString().split('T')[0];
        
        // Check if it's today
        if (currentDate.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        // Check for events on this day
        const hasEvent = AppState.scheduledEvents.some(event => 
            event.date === dateString
        );
        
        if (hasEvent) {
            dayElement.classList.add('has-event');
        }
        
        // Add click handler
        dayElement.addEventListener('click', () => selectCalendarDay(dateString));
        
        calendar.appendChild(dayElement);
    }
}

function navigateMonth(direction) {
    AppState.currentDate.setMonth(AppState.currentDate.getMonth() + direction);
    generateCalendar();
}

function selectCalendarDay(dateString) {
    document.getElementById('eventDate').value = dateString;
    showModal('eventModal');
}

// Event Scheduling
function scheduleEvent(e) {
    e.preventDefault();
    
    const event = {
        id: `event_${Date.now()}`,
        title: document.getElementById('eventTitle').value,
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        message: document.getElementById('eventMessage').value,
        repeat: document.getElementById('eventRepeat').checked
    };
    
    AppState.scheduledEvents.push(event);
    saveEvents();
    updateEventsList();
    updateScheduledCount();
    generateCalendar(); // Refresh calendar to show new event
    
    showNotification('Event scheduled successfully!', 'success');
    hideModal('eventModal');
    
    // Reset form
    document.getElementById('eventForm').reset();
}

function saveEvents() {
    localStorage.setItem('ledboard_events', JSON.stringify(AppState.scheduledEvents));
}

function updateEventsList() {
    const eventsList = document.getElementById('eventsList');
    
    if (AppState.scheduledEvents.length === 0) {
        eventsList.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No scheduled events</p>';
        return;
    }
    
    const sortedEvents = AppState.scheduledEvents.sort((a, b) => 
        new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time)
    );
    
    eventsList.innerHTML = sortedEvents.map(event => `
        <div class="event-item">
            <div class="event-title">${event.title}</div>
            <div class="event-datetime">${formatEventDateTime(event.date, event.time)}</div>
            <div class="event-message">${event.message}</div>
            <button class="btn btn-sm btn-outline" onclick="deleteEvent('${event.id}')" style="margin-top: 8px;">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `).join('');
}

function formatEventDateTime(date, time) {
    const eventDate = new Date(date + ' ' + time);
    return eventDate.toLocaleDateString('en-US', { 
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function deleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this event?')) {
        AppState.scheduledEvents = AppState.scheduledEvents.filter(e => e.id !== eventId);
        saveEvents();
        updateEventsList();
        updateScheduledCount();
        generateCalendar();
        showNotification('Event deleted', 'success');
    }
}

// Birthday Import
function handleBirthdayUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const csv = event.target.result;
        const lines = csv.split('\n');
        let importCount = 0;
        
        lines.forEach((line, index) => {
            if (index === 0 || !line.trim()) return; // Skip header and empty lines
            
            const [name, date] = line.split(',').map(s => s.trim());
            if (name && date) {
                const event = {
                    id: `birthday_${Date.now()}_${index}`,
                    title: `🎂 ${name}'s Birthday`,
                    date: date,
                    time: '09:00',
                    message: `Happy Birthday ${name}! 🎉`,
                    repeat: true
                };
                
                AppState.scheduledEvents.push(event);
                importCount++;
            }
        });
        
        if (importCount > 0) {
            saveEvents();
            updateEventsList();
            updateScheduledCount();
            generateCalendar();
            showNotification(`Imported ${importCount} birthdays successfully!`, 'success');
        } else {
            showNotification('No valid birthdays found in CSV', 'warning');
        }
    };
    
    reader.readAsText(file);
}

// Modal Functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
    modal.style.display = 'flex';
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 2000;
        display: flex;
        align-items: center;
        gap: 8px;
        max-width: 300px;
        animation: slideIn 0.3s ease;
        background: ${getNotificationColor(type)};
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
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

function getNotificationColor(type) {
    const colors = {
        success: '#059669',
        error: '#dc2626',
        warning: '#d97706',
        info: '#0891b2'
    };
    return colors[type] || colors.info;
}

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
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
document.head.appendChild(notificationStyles);