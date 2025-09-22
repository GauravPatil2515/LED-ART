# LED Board Controller - LedArt Style

A modern, frontend-only LED board controller application designed for Netlify deployment. This application provides a professional interface for managing P10 LED displays with widget-based program creation, event scheduling, and real-time monitoring.

## 🚀 Features

### **📊 Dashboard**
- Real-time connection status monitoring
- Board status display with online/offline indicators
- Scheduled events counter and recent message history
- Board resolution display

### **🎨 Program Editor**
- Interactive LED canvas visualization (96x16 pixels)
- Drag-and-drop widget system supporting:
  - **Text Widgets**: Customizable text with fonts, colors, and animations
  - **Clock Widgets**: 12/24 hour formats with real-time updates
- Live widget property editing
- Program export and board communication simulation

### **📅 Scheduler**
- Interactive calendar with month navigation
- Event scheduling with date/time selection
- Birthday import from CSV files
- Recurring event support with visual calendar indicators

### **⚙️ Settings**
- Board configuration (width/height/scan group)
- API server settings (for reference)
- Dark/light theme toggle
- Connection testing

## 🛠️ Frontend-Only Architecture

This application is designed to work completely in the browser without requiring a backend server:

- **Local Storage**: All data persists locally in the browser
- **Mock API**: Simulated LED board communication for demonstration
- **Offline-First**: Works without internet connection
- **Progressive Web App**: Can be installed as a standalone app

## 📦 Netlify Deployment

### **Automatic Deployment**
1. Connect your GitHub repository to Netlify
2. Set build command: `echo 'No build required'`
3. Set publish directory: `frontend/`
4. Deploy!

### **Manual Deployment**
1. Clone/download the `frontend/` directory
2. Drag and drop the entire folder to Netlify's deploy area
3. Your site will be live instantly!

## 🔧 Configuration Files

- **`netlify.toml`**: Build configuration and headers
- **`_redirects`**: SPA routing and 404 handling
- **`ledart-index.html`**: Main application entry point
- **`ledart-style.css`**: Professional styling with themes
- **`ledart-app.js`**: Complete application logic

## 🎯 Usage

### **Quick Start**
1. Open the deployed Netlify site
2. The app works immediately - no setup required!
3. All data is stored locally in your browser

### **Creating Programs**
1. Go to "Program Editor" tab
2. Add text or clock widgets to the canvas
3. Customize properties in the right panel
4. Send to board (simulated for demo)

### **Scheduling Events**
1. Go to "Scheduler" tab
2. Click on any calendar date
3. Fill in event details
4. Import birthdays from CSV if needed

### **Settings**
1. Go to "Settings" tab
2. Configure board dimensions
3. Toggle between light/dark themes
4. Test connection (always succeeds in demo mode)

## 🌐 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 📱 Responsive Design

- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interface
- Adaptive layouts

## 🔒 Security

- No backend dependencies
- All data stored locally
- No external API calls required
- CSP-friendly (Content Security Policy)

## 🚀 Performance

- Lightweight (~200KB total)
- Fast loading times
- Optimized CSS and JavaScript
- Minimal dependencies (FontAwesome only)

## 📝 Development

To modify the application:
1. Edit `ledart-index.html` for structure
2. Modify `ledart-style.css` for styling
3. Update `ledart-app.js` for functionality
4. Test locally with any HTTP server
5. Deploy to Netlify

## 🤝 Contributing

This is a frontend-only demonstration application. For production LED board integration, you would need to:

1. Replace mock API calls with real LED board communication
2. Add proper error handling for hardware failures
3. Implement data synchronization if multi-user support is needed
4. Add authentication if required

---

**Built for Netlify • Frontend-Only • No Backend Required**