# Ma-Ke Salon - Portable Version (Pendrive)

## No Installation Required! Just 3 Steps:

### FIRST TIME ONLY (needs internet):
1. Copy this entire folder to your Pendrive or PC
2. Double-click **SETUP-FIRST-TIME.bat**
3. Wait 5-10 minutes (downloads Python + MongoDB ~200MB)

### EVERY TIME YOU WANT TO USE:
1. Double-click **START-SALON.bat**
2. Browser opens automatically at http://localhost:3000
3. Login: **admin@salon.com** / **admin123**

### TO STOP:
- Press any key in the black window, OR
- Double-click **STOP-SALON.bat**

---

## Folder Structure:
```
MaKeSalon/
├── START-SALON.bat          ← Double-click to START
├── STOP-SALON.bat           ← Double-click to STOP  
├── SETUP-FIRST-TIME.bat     ← Run ONCE (downloads runtime)
├── app/                     ← Application code
│   ├── backend/             ← Server code
│   └── frontend/build/      ← Website files
├── data/db/                 ← Your salon data (DO NOT DELETE)
├── runtime/                 ← Python + MongoDB (created by setup)
└── logs/                    ← Log files
```

## Important Notes:
- **data/db/** folder contains ALL your salon data. Never delete it!
- Works on Windows 10 and Windows 11
- Can be copied to any pendrive (16GB+ recommended)
- Works on any PC - no admin rights needed
- First setup needs internet, after that works OFFLINE

## Access from Other Devices on Same WiFi:
1. On the PC running the software, open CMD and type: `ipconfig`
2. Note the IPv4 address (e.g., 192.168.1.100)
3. On other device browser: http://192.168.1.100:3000

---
Created by Kbon Moirang
