import subprocess
import requests
import time

# Board credentials
SSID = "W3_SIES_4ft_DISPLAY_20102024"
PASSWORD = "sai88888888"
BOARD_IP = "192.168.4.1"
BOARD_PORT = 80

def get_current_ssid():
    try:
        result = subprocess.run(["netsh", "wlan", "show", "interfaces"], capture_output=True, text=True)
        for line in result.stdout.split('\n'):
            if "SSID" in line and "BSSID" not in line:
                ssid = line.split(":")[1].strip()
                return ssid
    except Exception as e:
        print(f"Error getting SSID: {e}")
    return None

def connect_to_wifi():
    try:
        # Add profile if not exists
        profile_xml = f'''<?xml version="1.0"?>
<WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1">
    <name>{SSID}</name>
    <SSIDConfig>
        <SSID>
            <name>{SSID}</name>
        </SSID>
    </SSIDConfig>
    <connectionType>ESS</connectionType>
    <connectionMode>auto</connectionMode>
    <MSM>
        <security>
            <authEncryption>
                <authentication>WPA2PSK</authentication>
                <encryption>AES</encryption>
                <useOneX>false</useOneX>
            </authEncryption>
            <sharedKey>
                <keyType>passPhrase</keyType>
                <protected>false</protected>
                <keyMaterial>{PASSWORD}</keyMaterial>
            </sharedKey>
        </security>
    </MSM>
</WLANProfile>'''
        with open("wifi_profile.xml", "w") as f:
            f.write(profile_xml)
        subprocess.run(["netsh", "wlan", "add", "profile", "filename=wifi_profile.xml"], check=True)
        subprocess.run(["netsh", "wlan", "connect", "name=" + SSID], check=True)
        print(f"Connecting to {SSID}...")
        time.sleep(10)  # Wait for connection
    except subprocess.CalledProcessError as e:
        print(f"Failed to connect: {e}")

def test_board_connectivity():
    try:
        response = requests.get(f"http://{BOARD_IP}:{BOARD_PORT}/", timeout=5)
        if response.status_code == 200:
            print("Board is reachable! HTTP response OK.")
            return True
        else:
            print(f"Board responded with status: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"Failed to connect to board: {e}")
        return False

def send_message_to_board(message, brightness=50, font_size=16, color="white", effect="scroll_left"):
    # Send message with display settings
    payload = {
        "message": message,
        "brightness": brightness,
        "font_size": font_size,
        "color": color,
        "effect": effect
    }
    try:
        response = requests.post(f"http://{BOARD_IP}:{BOARD_PORT}/display", json=payload, timeout=5)
        if response.status_code == 200:
            print(f"Message '{message}' with settings sent successfully!")
        else:
            print(f"Failed to send: {response.status_code}")
    except Exception as e:
        print(f"Error: {e}")

def main():
    # Store original SSID
    original_ssid = get_current_ssid()
    print(f"Original Wi-Fi: {original_ssid}")

    # Option 1: If board is on same network (STA mode)
    print("Attempting to send message assuming board is on same network...")
    send_message_to_board("Hello World", brightness=80, font_size=20, color="red", effect="blink")

    # Option 2: Switch to board Wi-Fi, send, switch back
    current_ssid = get_current_ssid()
    if current_ssid != SSID:
        print(f"Switching to board Wi-Fi: {SSID}")
        connect_to_wifi()
        time.sleep(5)  # Wait for connection
        send_message_to_board("Hello World", brightness=80, font_size=20, color="red", effect="blink")
        # Switch back to original Wi-Fi
        if original_ssid:
            subprocess.run(["netsh", "wlan", "connect", f"name={original_ssid}"], check=True)
            print(f"Switched back to {original_ssid}")
    else:
        print(f"Already connected to {SSID}, sending message...")
        send_message_to_board("Hello World", brightness=80, font_size=20, color="red", effect="blink")

if __name__ == "__main__":
    main()
