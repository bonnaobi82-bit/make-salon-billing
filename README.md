# Ma-Ke Salon - Billing & Management Software

## Run on Your Windows 10 PC (Free, No Fees)

### Step 1: Install Docker Desktop (One Time)
1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop/
2. Install it and restart your PC
3. Open Docker Desktop and wait until it says "Docker is running"

### Step 2: Download This Project
1. Download/export this entire project folder to your PC
2. Place it somewhere like `C:\MaKeSalon\`

### Step 3: Start the Software
1. Open **Command Prompt** or **PowerShell**
2. Navigate to the project folder:
   ```
   cd C:\MaKeSalon
   ```
3. Run:
   ```
   docker-compose up -d
   ```
4. Wait 2-3 minutes for everything to start

### Step 4: Open the App
- Open your browser (Chrome/Edge) and go to: **http://localhost:3000**
- Login with: **admin@salon.com** / **admin123**

### Step 5: Install as Desktop App (Optional)
- In Chrome/Edge, click the install icon in the address bar
- Click "Install" — the app will appear on your Desktop and Taskbar
- It will look and feel like a native Windows application!

---

## Daily Usage

### Start the software:
```
docker-compose up -d
```

### Stop the software:
```
docker-compose down
```

### Your data is safe:
All data is stored in a Docker volume (`mongo_data`). It persists even after stopping/restarting.

---

## Access from Other Devices on Same WiFi

If you want other devices (phone, tablet, another PC) at your salon to use the software:
1. Find your PC's local IP address:
   ```
   ipconfig
   ```
   Look for `IPv4 Address` (e.g., `192.168.1.100`)
2. On other devices, open browser and go to: `http://192.168.1.100:3000`

---

## Features
- Customer Management with Loyalty Points & Tiers
- Service Catalog with Categories & Pricing
- Monthly Calendar Appointments
- Staff Management with Commission & Incentive Tracking
- Inventory Tracking with Low Stock Alerts
- Invoice/Billing with PDF, Print & WhatsApp Share
- Salon Profile with Logo
- Dashboard with Revenue Analytics
- Multi-user Login (Owner & Staff roles)

---

## Login Credentials
- **Owner**: admin@salon.com / admin123
- **Staff**: staff@salon.com / staff123

---

## Troubleshooting

**Docker not starting?**
- Make sure Docker Desktop is running (check system tray)
- Restart Docker Desktop

**Cannot access localhost:3000?**
- Wait 2-3 minutes after `docker-compose up`
- Check status: `docker-compose ps` (all should be "Up")

**Want to reset all data?**
```
docker-compose down -v
docker-compose up -d
```

---

Created by **Kbon Moirang**
