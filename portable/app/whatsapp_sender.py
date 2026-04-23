"""
WhatsApp Web Auto-Sender for Ma-Ke Salon
Runs in background and auto-sends messages opened via WhatsApp Web
Uses pyautogui to detect and press Enter on WhatsApp Web tabs
"""
import time
import subprocess
import sys
import os

def install_deps():
    """Install required packages"""
    try:
        import pyautogui
        import pyperclip
    except ImportError:
        print("Installing required packages...")
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'pyautogui', 'pyperclip', '--quiet', '--no-warn-script-location'])
        print("Packages installed!")

install_deps()

import pyautogui
import pyperclip

# Safety: disable pyautogui fail-safe (move mouse to corner to stop)
pyautogui.FAILSAFE = True
pyautogui.PAUSE = 0.5

def send_whatsapp_message(phone, message, delay=8):
    """
    Opens WhatsApp Web with pre-filled message and auto-sends it
    
    Args:
        phone: Phone number with country code (e.g., 916909902650)
        message: Text message to send
        delay: Seconds to wait for WhatsApp Web to load (default 8)
    """
    import webbrowser
    
    # URL encode the message
    from urllib.parse import quote
    url = f"https://web.whatsapp.com/send?phone={phone}&text={quote(message)}"
    
    print(f"  Opening WhatsApp for {phone}...")
    webbrowser.open(url)
    
    # Wait for WhatsApp Web to load
    print(f"  Waiting {delay}s for WhatsApp Web to load...")
    time.sleep(delay)
    
    # Press Enter to send
    print(f"  Sending message...")
    pyautogui.press('enter')
    
    # Wait a moment then close tab
    time.sleep(2)
    pyautogui.hotkey('ctrl', 'w')  # Close the tab
    
    print(f"  Message sent to {phone}!")
    time.sleep(1)  # Brief pause between messages

def format_phone(phone):
    """Format phone number for WhatsApp"""
    digits = ''.join(c for c in phone if c.isdigit())
    if digits.startswith('0'):
        digits = '91' + digits[1:]
    if not digits.startswith('91') and len(digits) == 10:
        digits = '91' + digits
    return digits

def send_invoice_message(customer_name, customer_phone, invoice_number, services_text, total, payment_method, staff_name="", salon_name="Ma-ke Salon Unisex Hair & Skin", salon_phone="6909902650"):
    """Send an invoice via WhatsApp auto-send"""
    phone = format_phone(customer_phone)
    
    message = f"*{salon_name}*\n"
    message += f"Invoice: *{invoice_number}*\n"
    message += f"Date: {time.strftime('%d %b %Y')}\n\n"
    message += f"Dear *{customer_name}*,\n\n"
    message += f"Thank you for visiting us! Here's your bill:\n\n"
    message += f"*Services:*\n{services_text}\n\n"
    message += f"*Total: Rs.{total}*\n"
    message += f"Payment: {payment_method.upper()}\n"
    if staff_name:
        message += f"Served by: {staff_name}\n"
    message += f"\nWe look forward to seeing you again!\nCall us: {salon_phone}"
    
    send_whatsapp_message(phone, message)

def send_welcome_message(customer_name, customer_phone, salon_name="Ma-ke Salon Unisex Hair & Skin", salon_phone="6909902650", salon_address="Thangmeiband Sanakeithel Road, Ma-ke Salon 2nd Floor, Manipur, Imphal -795001"):
    """Send a welcome message via WhatsApp auto-send"""
    phone = format_phone(customer_phone)
    
    message = f"Hello *{customer_name}*! Welcome to *{salon_name}*\n\n"
    message += f"We're thrilled to have you as our valued customer!\n\n"
    message += f"As a member, you'll enjoy:\n"
    message += f"- Loyalty points on every visit (1 pt per Rs.10)\n"
    message += f"- Exclusive tier upgrades (Bronze > Silver > Gold > Platinum)\n"
    message += f"- Redeem points for discounts\n\n"
    message += f"Visit us at:\n{salon_address}\n\n"
    message += f"Book appointments: {salon_phone}\n\n"
    message += f"Thank you for choosing us!"
    
    send_whatsapp_message(phone, message)

def send_bulk_offer(customers, message_template, salon_name="Ma-ke Salon Unisex Hair & Skin", salon_phone="6909902650", salon_address="Thangmeiband Sanakeithel Road, Ma-ke Salon 2nd Floor, Manipur, Imphal -795001"):
    """
    Send offer to multiple customers
    
    Args:
        customers: List of dicts with 'name' and 'phone'
        message_template: Message with {name}, {salon}, {phone}, {address} placeholders
    """
    print(f"\n{'='*50}")
    print(f"  Sending to {len(customers)} customers...")
    print(f"{'='*50}\n")
    
    for i, customer in enumerate(customers):
        phone = format_phone(customer['phone'])
        message = message_template.replace('{name}', customer['name'])
        message = message.replace('{salon}', salon_name)
        message = message.replace('{phone}', salon_phone)
        message = message.replace('{address}', salon_address)
        
        print(f"[{i+1}/{len(customers)}] {customer['name']} ({phone})")
        send_whatsapp_message(phone, message, delay=10)
        print()
    
    print(f"\n{'='*50}")
    print(f"  Done! Sent to {len(customers)} customers.")
    print(f"{'='*50}\n")


if __name__ == "__main__":
    print("="*50)
    print("  Ma-Ke Salon WhatsApp Auto-Sender")
    print("="*50)
    print()
    print("IMPORTANT: Make sure you are logged into")
    print("WhatsApp Web (web.whatsapp.com) in your browser!")
    print()
    print("Options:")
    print("  1. Test send (send a test message to yourself)")
    print("  2. Exit")
    print()
    
    choice = input("Enter choice (1/2): ").strip()
    
    if choice == "1":
        phone = input("Enter your phone number (e.g., 6909902650): ").strip()
        print("\nSending test message...")
        send_whatsapp_message(
            format_phone(phone),
            "Hello! This is a test message from Ma-Ke Salon Auto-Sender. If you received this, the auto-send is working!",
            delay=10
        )
        print("\nTest complete! Check your WhatsApp.")
    
    print("\nExiting...")
