"""
Portable server wrapper for Ma-Ke Salon
Serves both API and frontend static files from a single server
"""
import os
import sys

# Set environment from bat file (already set) or defaults
os.environ.setdefault('MONGO_URL', 'mongodb://localhost:27017')
os.environ.setdefault('DB_NAME', 'salon_billing_db')
os.environ.setdefault('CORS_ORIGINS', '*')
os.environ.setdefault('JWT_SECRET', 'salon-billing-secret-key-change-in-production')

# Import the main server app
from server import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
