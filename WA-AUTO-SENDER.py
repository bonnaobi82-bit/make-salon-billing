"""
Ma-Ke Salon - WhatsApp Auto-Sender (Background Service)
Watches the message queue and auto-sends via WhatsApp Web

HOW TO USE:
1. Login to WhatsApp Web in your browser (web.whatsapp.com)
2. Double-click WA-AUTO-SENDER.bat
3. Keep this running in background
4. When you create invoices or send messages from the salon software,
   they will be automatically sent via WhatsApp!
"""
import time
import os
import sys
import json
import subprocess
from pathlib import Path
from urllib.parse import quote

# Install dependencies if needed
def ensure_deps():
    try:
        import pyautogui
    except ImportError:
        print("Installing pyautogui...")
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'pyautogui', '--quiet', '--no-warn-script-location'])
        print("Done!")

ensure_deps()
import pyautogui
pyautogui.FAILSAFE = True
pyautogui.PAUSE = 0.3

# Queue directory - check both Docker and portable paths
QUEUE_PATHS = [
    Path("C:/make-salon-billing/wa_queue"),
    Path(os.path.dirname(os.path.abspath(__file__))) / ".." / "wa_queue",
    Path("/app/wa_queue"),
]

def find_queue_dir():
    for p in QUEUE_PATHS:
        p = p.resolve()
        if p.exists():
            return p
    # Create default
    default = Path("C:/make-salon-billing/wa_queue")
    default.mkdir(parents=True, exist_ok=True)
    return default

def send_message(phone, message, delay=10):
    """Open WhatsApp Web, wait for load, press Enter to send"""
    import webbrowser
    url = f"https://web.whatsapp.com/send?phone={phone}&text={quote(message)}"
    
    webbrowser.open(url)
    time.sleep(delay)  # Wait for page to load
    
    pyautogui.press('enter')  # Auto-send
    time.sleep(2)
    pyautogui.hotkey('ctrl', 'w')  # Close tab
    time.sleep(1)

def process_queue(queue_dir):
    """Check for pending messages and send them"""
    queue_files = sorted(queue_dir.glob("*.json"))
    
    for f in queue_files:
        try:
            data = json.loads(f.read_text())
            if data.get("status") == "pending":
                phone = data["phone"]
                message = data["message"]
                
                print(f"\n  Sending to {phone}...")
                send_message(phone, message)
                
                # Remove the file after sending
                f.unlink()
                print(f"  Sent and removed from queue!")
                
        except Exception as e:
            print(f"  Error processing {f.name}: {e}")

def main():
    os.system('color 0A')
    print("=" * 55)
    print("  Ma-Ke Salon - WhatsApp Auto-Sender")
    print("=" * 55)
    print()
    print("  IMPORTANT:")
    print("  1. Login to WhatsApp Web in your browser FIRST")
    print("     (Open web.whatsapp.com and scan QR code)")
    print("  2. Keep this window open while using salon software")
    print("  3. Messages will be sent automatically!")
    print()
    
    queue_dir = find_queue_dir()
    print(f"  Watching queue: {queue_dir}")
    print()
    print("  Waiting for messages...")
    print("-" * 55)
    
    while True:
        try:
            process_queue(queue_dir)
            time.sleep(3)  # Check every 3 seconds
        except KeyboardInterrupt:
            print("\n\nStopping auto-sender...")
            break
        except Exception as e:
            print(f"  Error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    main()
