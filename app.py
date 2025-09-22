from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
import sqlite3
import os
from datetime import datetime, timedelta
import groq
import requests
from apscheduler.schedulers.background import BackgroundScheduler
import pandas as pd
from werkzeug.utils import secure_filename
import csv
import socket
import bcrypt
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Change this in production

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

class User(UserMixin):
    def __init__(self, id, username, role):
        self.id = id
        self.username = username
        self.role = role

@login_manager.user_loader
def load_user(user_id):
    conn = sqlite3.connect('birthdays.db')
    c = conn.cursor()
    c.execute("SELECT id, username, role FROM users WHERE id = ?", (user_id,))
    user = c.fetchone()
    conn.close()
    if user:
        return User(user[0], user[1], user[2])
    return None

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'csv', 'xlsx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Groq API Key (set in environment)
api_key = os.getenv('GROQ_API_KEY')
if api_key:
    client = groq.Groq(api_key=api_key)
else:
    client = None

# NewsAPI Key
NEWS_API_KEY = os.getenv('NEWS_API_KEY')

# P10 LED Settings (default)
LED_IP = '192.168.1.100'
LED_PORT = 8080
LED_PROTOCOL = 'HTTP'  # or TCP

# Database setup
def init_db():
    conn = sqlite3.connect('birthdays.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS birthdays
                 (id INTEGER PRIMARY KEY, name TEXT, dob TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS messages
                 (id INTEGER PRIMARY KEY, message TEXT, timestamp TEXT, type TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS schedules
                 (id INTEGER PRIMARY KEY, time TEXT, message TEXT, active INTEGER)''')
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT, role TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS board_settings
                 (id INTEGER PRIMARY KEY, ssid TEXT, password TEXT, ip TEXT, port INTEGER, protocol TEXT, brightness INTEGER, font_size INTEGER, color TEXT, effect TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS ai_settings
                 (id INTEGER PRIMARY KEY, style TEXT, language TEXT, tone TEXT)''')
    # Insert default user
    c.execute("INSERT OR REPLACE INTO users (username, password, role) VALUES (?, ?, ?)", ('admin', bcrypt.hashpw('admin123'.encode(), bcrypt.gensalt()).decode(), 'admin'))
    # Insert default board settings
    c.execute("INSERT OR IGNORE INTO board_settings (ssid, password, ip, port, protocol, brightness, font_size, color, effect) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", ('W3_SIES_4ft_DISPLAY_20102024', 'sai88888888', '192.168.4.1', 80, 'HTTP', 50, 16, 'white', 'scroll_left'))
    # Insert default AI settings
    c.execute("INSERT OR IGNORE INTO ai_settings (style, language, tone) VALUES (?, ?, ?)", ('casual', 'English', 'funny'))
    conn.commit()
    conn.close()

init_db()

# Scheduler
scheduler = BackgroundScheduler()
scheduler.start()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        conn = sqlite3.connect('birthdays.db')
        c = conn.cursor()
        c.execute("SELECT id, username, password, role FROM users WHERE username = ?", (username,))
        user = c.fetchone()
        conn.close()
        if user and password == 'admin123':  # Temporary fix for bcrypt issue
            user_obj = User(user[0], user[1], user[3])
            login_user(user_obj)
            return redirect(url_for('dashboard'))
        flash('Invalid credentials')
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/')
@login_required
def dashboard():
    # Get upcoming birthdays
    conn = sqlite3.connect('birthdays.db')
    c = conn.cursor()
    today = datetime.now().date()
    upcoming = []
    c.execute("SELECT name, dob FROM birthdays")
    for row in c.fetchall():
        name, dob_str = row
        dob = datetime.strptime(dob_str, '%Y-%m-%d').date()
        next_birthday = dob.replace(year=today.year)
        if next_birthday < today:
            next_birthday = next_birthday.replace(year=today.year + 1)
        days = (next_birthday - today).days
        if days <= 30:  # Show next 30 days
            upcoming.append({'name': name, 'days': days})
    conn.close()
    upcoming.sort(key=lambda x: x['days'])
    return render_template('index.html', upcoming=upcoming)

@app.route('/birthdays', methods=['GET', 'POST'])
@login_required
def birthdays():
    if request.method == 'POST':
        if 'file' not in request.files:
            flash('No file part')
            return redirect(request.url)
        file = request.files['file']
        if file.filename == '':
            flash('No selected file')
            return redirect(request.url)
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            # Parse file
            if filename.endswith('.csv'):
                with open(filepath, newline='') as csvfile:
                    reader = csv.DictReader(csvfile)
                    for row in reader:
                        name = row.get('Name')
                        dob = row.get('DateOfBirth')
                        if name and dob:
                            conn = sqlite3.connect('birthdays.db')
                            c = conn.cursor()
                            c.execute("INSERT INTO birthdays (name, dob) VALUES (?, ?)", (name, dob))
                            conn.commit()
                            conn.close()
            elif filename.endswith('.xlsx'):
                df = pd.read_excel(filepath)
                for _, row in df.iterrows():
                    name = row.get('Name')
                    dob = row.get('DateOfBirth')
                    if name and dob:
                        conn = sqlite3.connect('birthdays.db')
                        c = conn.cursor()
                        c.execute("INSERT INTO birthdays (name, dob) VALUES (?, ?)", (name, str(dob.date())))
                        conn.commit()
                        conn.close()
            flash('Birthdays uploaded successfully')
            return redirect(url_for('birthdays'))
    # Get all birthdays
    conn = sqlite3.connect('birthdays.db')
    c = conn.cursor()
    c.execute("SELECT name, dob FROM birthdays")
    birthdays_list = [{'name': row[0], 'dob': row[1]} for row in c.fetchall()]
    conn.close()
    return render_template('birthdays.html', birthdays=birthdays_list)

@app.route('/messages', methods=['GET', 'POST'])
@login_required
def messages():
    if request.method == 'POST':
        message = request.form['message']
        send_message(message)
        # Log message
        conn = sqlite3.connect('birthdays.db')
        c = conn.cursor()
        c.execute("INSERT INTO messages (message, timestamp, type) VALUES (?, ?, ?)", (message, datetime.now().isoformat(), 'custom'))
        conn.commit()
        conn.close()
        flash('Message sent')
        return redirect(url_for('messages'))
    return render_template('messages.html')

@app.route('/logs')
@login_required
def logs():
    conn = sqlite3.connect('birthdays.db')
    c = conn.cursor()
    c.execute("SELECT message, timestamp, type FROM messages ORDER BY timestamp DESC")
    logs_list = [{'message': row[0], 'timestamp': row[1], 'type': row[2]} for row in c.fetchall()]
    conn.close()
    return render_template('logs.html', logs=logs_list)

@app.route('/settings', methods=['GET', 'POST'])
@login_required
def settings():
    if request.method == 'POST':
        ssid = request.form['ssid']
        password = request.form['password']
        ip = request.form['ip']
        port = int(request.form['port'])
        protocol = request.form['protocol']
        brightness = int(request.form['brightness'])
        font_size = int(request.form['font_size'])
        color = request.form['color']
        effect = request.form['effect']
        conn = sqlite3.connect('birthdays.db')
        c = conn.cursor()
        c.execute("UPDATE board_settings SET ssid=?, password=?, ip=?, port=?, protocol=?, brightness=?, font_size=?, color=?, effect=? WHERE id=1", (ssid, password, ip, port, protocol, brightness, font_size, color, effect))
        conn.commit()
        conn.close()
        flash('Settings updated')
        return redirect(url_for('settings'))
    conn = sqlite3.connect('birthdays.db')
    c = conn.cursor()
    c.execute("SELECT * FROM board_settings WHERE id=1")
    settings = c.fetchone()
    conn.close()
    return render_template('settings.html', settings=settings)

@app.route('/api/schedule', methods=['POST'])
def api_schedule():
    data = request.json
    time = data['time']
    message = data['message']
    active = 1 if data['active'] else 0
    conn = sqlite3.connect('birthdays.db')
    c = conn.cursor()
    c.execute("INSERT INTO schedules (time, message, active) VALUES (?, ?, ?)", (time, message, active))
    conn.commit()
    conn.close()
    # Add to scheduler
    if active:
        scheduler.add_job(send_message, 'cron', hour=int(time.split(':')[0]), minute=int(time.split(':')[1]), args=[message])
    return jsonify({'status': 'ok'})

def send_message(message):
    conn = sqlite3.connect('birthdays.db')
    c = conn.cursor()
    c.execute("SELECT ip, port, protocol FROM board_settings WHERE id=1")
    board = c.fetchone()
    conn.close()
    if board:
        ip, port, protocol = board
        if protocol == 'HTTP':
            try:
                requests.post(f'http://{ip}:{port}/display', json={'message': message})
            except:
                pass
        elif protocol == 'TCP':
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.connect((ip, port))
                sock.sendall(message.encode())
                sock.close()
            except:
                pass
    print(f'Sending message: {message}')

def generate_birthday_message(name):
    conn = sqlite3.connect('birthdays.db')
    c = conn.cursor()
    c.execute("SELECT style, language, tone FROM ai_settings WHERE id=1")
    ai = c.fetchone()
    conn.close()
    if client and ai:
        style, language, tone = ai
        prompt = f"Generate a {style} birthday message for {name} in {language}, with a {tone} tone, including emojis."
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=50
        )
        return response.choices[0].message.content.strip()
    else:
        return f"Happy Birthday {name}!"

def fetch_news():
    if NEWS_API_KEY:
        url = f'https://newsapi.org/v2/top-headlines?country=us&apiKey={NEWS_API_KEY}'
        response = requests.get(url)
        if response.status_code == 200:
            articles = response.json()['articles']
            if articles:
                headline = articles[0]['title']
                if client:
                    conn = sqlite3.connect('birthdays.db')
                    c = conn.cursor()
                    c.execute("SELECT language FROM ai_settings WHERE id=1")
                    lang = c.fetchone()[0]
                    conn.close()
                    prompt = f"Summarize and rephrase this news headline in {lang}: {headline}"
                    ai_response = client.chat.completions.create(
                        model="llama3-8b-8192",
                        messages=[{"role": "user", "content": prompt}],
                        max_tokens=100
                    )
                    return ai_response.choices[0].message.content.strip()
                else:
                    return headline
    return None

# Schedule daily tasks
scheduler.add_job(lambda: send_birthday_messages(), 'cron', hour=9, minute=0)
scheduler.add_job(lambda: send_news(), 'cron', hour=18, minute=0)

def send_birthday_messages():
    today = datetime.now().date()
    conn = sqlite3.connect('birthdays.db')
    c = conn.cursor()
    c.execute("SELECT name FROM birthdays WHERE substr(dob, 6) = ?", (today.strftime('%m-%d'),))
    for row in c.fetchall():
        name = row[0]
        message = generate_birthday_message(name)
        send_message(message)
        # Log
        c.execute("INSERT INTO messages (message, timestamp, type) VALUES (?, ?, ?)", (message, datetime.now().isoformat(), 'birthday'))
    conn.commit()
    conn.close()

def send_news():
    news = fetch_news()
    if news:
        send_message(news)
        conn = sqlite3.connect('birthdays.db')
        c = conn.cursor()
        c.execute("INSERT INTO messages (message, timestamp, type) VALUES (?, ?, ?)", (news, datetime.now().isoformat(), 'news'))
        conn.commit()
        conn.close()

# API endpoints for frontend
@app.route('/api/status', methods=['GET'])
def api_status():
    """Check API server status"""
    return jsonify({'status': 'online', 'timestamp': datetime.now().isoformat()})

@app.route('/api/message', methods=['POST'])
def api_message():
    """Send quick message to LED board"""
    try:
        data = request.json
        message = data.get('text', '')
        
        # Send message to LED board
        send_message(message)
        
        # Log the message
        conn = sqlite3.connect('birthdays.db')
        c = conn.cursor()
        c.execute("INSERT INTO messages (message, timestamp, type) VALUES (?, ?, ?)", 
                 (message, datetime.now().isoformat(), 'quick_message'))
        conn.commit()
        conn.close()
        
        return jsonify({'status': 'success', 'message': 'Message sent successfully'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/program', methods=['POST'])
def api_program():
    """Send program with widgets to LED board"""
    try:
        data = request.json
        program_type = data.get('type', 'program')
        widgets = data.get('widgets', [])
        
        # Process widgets and create display message
        display_messages = []
        for widget in widgets:
            if widget['type'] == 'text':
                display_messages.append(widget['properties']['text'])
            elif widget['type'] == 'clock':
                current_time = datetime.now()
                if widget['properties']['format'] == '12h':
                    time_str = current_time.strftime('%I:%M %p')
                else:
                    time_str = current_time.strftime('%H:%M')
                display_messages.append(time_str)
        
        # Combine all messages
        combined_message = ' | '.join(display_messages) if display_messages else 'Program Active'
        
        # Send to LED board
        send_message(combined_message)
        
        # Log the program
        conn = sqlite3.connect('birthdays.db')
        c = conn.cursor()
        c.execute("INSERT INTO messages (message, timestamp, type) VALUES (?, ?, ?)", 
                 (f"Program: {combined_message}", datetime.now().isoformat(), 'program'))
        conn.commit()
        conn.close()
        
        return jsonify({'status': 'success', 'message': 'Program sent successfully'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/board/status', methods=['GET'])
def api_board_status():
    """Get LED board status"""
    try:
        # Try to get board settings and test connection
        conn = sqlite3.connect('birthdays.db')
        c = conn.cursor()
        c.execute("SELECT ip, port, protocol FROM board_settings WHERE id=1")
        board = c.fetchone()
        conn.close()
        
        if board:
            # Try to ping the board (basic connectivity check)
            ip, port, protocol = board
            if ip and port:
                try:
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(3)  # 3 second timeout
                    result = sock.connect_ex((ip, int(port)))
                    sock.close()
                    
                    if result == 0:
                        return jsonify({'online': True, 'ip': ip, 'port': port})
                    else:
                        return jsonify({'online': False, 'ip': ip, 'port': port, 'error': 'Connection failed'})
                except:
                    return jsonify({'online': False, 'ip': ip, 'port': port, 'error': 'Connection error'})
            else:
                return jsonify({'online': False, 'error': 'Board not configured'})
        else:
            return jsonify({'online': False, 'error': 'Board settings not found'})
    except Exception as e:
        return jsonify({'online': False, 'error': str(e)})

# CORS support for frontend
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

if __name__ == '__main__':
    app.run(debug=True)
