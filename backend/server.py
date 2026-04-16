from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Query, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import resend
import asyncio
from fastapi.responses import StreamingResponse, Response
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'

# Resend API Configuration
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# Twilio Configuration
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER', '')
twilio_client = None
if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    try:
        from twilio.rest import Client as TwilioClient
        twilio_client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    except Exception:
        pass

# Local File Storage Configuration
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ============= MODELS =============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = 'staff'  # owner, staff

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    full_name: str
    role: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    notes: Optional[str] = None

class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    email: Optional[str] = None
    notes: Optional[str] = None
    total_visits: int = 0
    total_spent: float = 0.0
    loyalty_points: int = 0
    membership_tier: str = 'bronze'  # bronze, silver, gold, platinum
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    duration_minutes: int
    price: float
    category: str  # haircut, coloring, spa, nails, etc

class Service(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    duration_minutes: int
    price: float
    category: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AppointmentCreate(BaseModel):
    customer_id: str
    service_ids: List[str]
    staff_id: str
    appointment_date: str  # ISO format
    notes: Optional[str] = None

class Appointment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    service_ids: List[str]
    staff_id: str
    appointment_date: datetime
    status: str = 'scheduled'  # scheduled, completed, cancelled, no-show
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StaffCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    specialization: Optional[str] = None
    commission_rate: float = 0.0

class Staff(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    email: Optional[str] = None
    specialization: Optional[str] = None
    commission_rate: float
    is_active: bool = True
    total_services: int = 0
    total_revenue: float = 0.0
    incentive_balance: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InventoryCreate(BaseModel):
    product_name: str
    category: str
    quantity: int
    unit_price: float
    supplier: Optional[str] = None
    reorder_level: int = 10

class Inventory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_name: str
    category: str
    quantity: int
    unit_price: float
    supplier: Optional[str] = None
    reorder_level: int
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InvoiceItemCreate(BaseModel):
    service_id: str
    quantity: int
    price: float

class InvoiceCreate(BaseModel):
    customer_id: str
    staff_id: Optional[str] = None
    items: List[InvoiceItemCreate]
    discount: float = 0.0
    payment_method: str = 'cash'  # cash, card, upi
    notes: Optional[str] = None

class Invoice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_number: str
    customer_id: str
    staff_id: Optional[str] = None
    items: List[dict]
    subtotal: float
    discount: float
    tax: float
    total: float
    payment_method: str
    status: str = 'paid'
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SalonProfileUpdate(BaseModel):
    salon_name: str
    address: str
    phone: str
    email: Optional[str] = None
    gst_number: Optional[str] = None

class SalonProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    salon_name: str
    address: str
    phone: str
    email: Optional[str] = None
    gst_number: Optional[str] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============= AUTH HELPERS =============

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

# ============= AUTH ROUTES =============

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        role=user_data.role
    )
    doc = user.model_dump()
    doc['password'] = hash_password(user_data.password)
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    token = create_token(user.id, user.email, user.role)
    
    return {"user": user, "token": token}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if isinstance(user['created_at'], str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    user_obj = User(**{k: v for k, v in user.items() if k != 'password'})
    token = create_token(user_obj.id, user_obj.email, user_obj.role)
    
    return {"user": user_obj, "token": token}

@api_router.get("/auth/me")
async def get_me(current_user = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user['user_id']}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    return user

# ============= CUSTOMER ROUTES =============

@api_router.post("/customers", response_model=Customer)
async def create_customer(customer: CustomerCreate, current_user = Depends(get_current_user)):
    customer_obj = Customer(**customer.model_dump())
    doc = customer_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.customers.insert_one(doc)
    return customer_obj

@api_router.get("/customers", response_model=List[Customer])
async def get_customers(current_user = Depends(get_current_user)):
    customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
    for c in customers:
        if isinstance(c['created_at'], str):
            c['created_at'] = datetime.fromisoformat(c['created_at'])
    return customers

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str, current_user = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if isinstance(customer['created_at'], str):
        customer['created_at'] = datetime.fromisoformat(customer['created_at'])
    return customer

@api_router.put("/customers/{customer_id}")
async def update_customer(customer_id: str, customer: CustomerCreate, current_user = Depends(get_current_user)):
    result = await db.customers.update_one(
        {"id": customer_id},
        {"$set": customer.model_dump()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer updated"}

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str, current_user = Depends(get_current_user)):
    result = await db.customers.delete_one({"id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted"}

# ============= LOYALTY ROUTES =============

class RedeemPointsRequest(BaseModel):
    customer_id: str
    points_to_redeem: int

@api_router.post("/loyalty/redeem")
async def redeem_loyalty_points(data: RedeemPointsRequest, current_user = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": data.customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    current_points = customer.get('loyalty_points', 0)
    if data.points_to_redeem > current_points:
        raise HTTPException(status_code=400, detail=f"Not enough points. Available: {current_points}")
    if data.points_to_redeem < 100:
        raise HTTPException(status_code=400, detail="Minimum 100 points required to redeem")
    
    # 100 points = Rs.50 discount
    discount_value = (data.points_to_redeem / 100) * 50
    
    await db.customers.update_one(
        {"id": data.customer_id},
        {"$inc": {"loyalty_points": -data.points_to_redeem}}
    )
    
    # Log redemption
    await db.loyalty_history.insert_one({
        "id": str(uuid.uuid4()),
        "customer_id": data.customer_id,
        "type": "redeemed",
        "points": -data.points_to_redeem,
        "discount_value": discount_value,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "message": f"Redeemed {data.points_to_redeem} points for Rs.{discount_value:.0f} discount",
        "discount_value": discount_value,
        "remaining_points": current_points - data.points_to_redeem
    }

@api_router.get("/loyalty/history/{customer_id}")
async def get_loyalty_history(customer_id: str, current_user = Depends(get_current_user)):
    history = await db.loyalty_history.find(
        {"customer_id": customer_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return history

class StaffIncentivePayoutRequest(BaseModel):
    staff_id: str
    amount: float
    notes: Optional[str] = None

@api_router.post("/staff/payout-incentive")
async def payout_staff_incentive(data: StaffIncentivePayoutRequest, current_user = Depends(get_current_user)):
    staff_doc = await db.staff.find_one({"id": data.staff_id}, {"_id": 0})
    if not staff_doc:
        raise HTTPException(status_code=404, detail="Staff not found")
    
    balance = staff_doc.get('incentive_balance', 0)
    if data.amount > balance:
        raise HTTPException(status_code=400, detail=f"Amount exceeds balance. Available: Rs.{balance:.2f}")
    
    await db.staff.update_one(
        {"id": data.staff_id},
        {"$inc": {"incentive_balance": -data.amount}}
    )
    
    await db.incentive_history.insert_one({
        "id": str(uuid.uuid4()),
        "staff_id": data.staff_id,
        "type": "payout",
        "amount": data.amount,
        "notes": data.notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": f"Paid out Rs.{data.amount:.2f}", "remaining_balance": balance - data.amount}

@api_router.get("/staff/incentive-history/{staff_id}")
async def get_incentive_history(staff_id: str, current_user = Depends(get_current_user)):
    history = await db.incentive_history.find(
        {"staff_id": staff_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return history

# ============= SERVICE ROUTES =============

@api_router.post("/services", response_model=Service)
async def create_service(service: ServiceCreate, current_user = Depends(get_current_user)):
    service_obj = Service(**service.model_dump())
    doc = service_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.services.insert_one(doc)
    return service_obj

@api_router.get("/services", response_model=List[Service])
async def get_services(current_user = Depends(get_current_user)):
    services = await db.services.find({}, {"_id": 0}).to_list(1000)
    for s in services:
        if isinstance(s['created_at'], str):
            s['created_at'] = datetime.fromisoformat(s['created_at'])
    return services

@api_router.put("/services/{service_id}")
async def update_service(service_id: str, service: ServiceCreate, current_user = Depends(get_current_user)):
    result = await db.services.update_one(
        {"id": service_id},
        {"$set": service.model_dump()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service updated"}

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str, current_user = Depends(get_current_user)):
    result = await db.services.update_one(
        {"id": service_id},
        {"$set": {"is_active": False}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service deactivated"}

# ============= APPOINTMENT ROUTES =============

@api_router.post("/appointments", response_model=Appointment)
async def create_appointment(appt: AppointmentCreate, current_user = Depends(get_current_user)):
    appointment_obj = Appointment(
        **{k: v for k, v in appt.model_dump().items() if k != 'appointment_date'},
        appointment_date=datetime.fromisoformat(appt.appointment_date)
    )
    doc = appointment_obj.model_dump()
    doc['appointment_date'] = doc['appointment_date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.appointments.insert_one(doc)
    return appointment_obj

@api_router.get("/appointments", response_model=List[Appointment])
async def get_appointments(current_user = Depends(get_current_user)):
    appointments = await db.appointments.find({}, {"_id": 0}).to_list(1000)
    for a in appointments:
        if isinstance(a['appointment_date'], str):
            a['appointment_date'] = datetime.fromisoformat(a['appointment_date'])
        if isinstance(a['created_at'], str):
            a['created_at'] = datetime.fromisoformat(a['created_at'])
    return appointments

@api_router.put("/appointments/{appointment_id}")
async def update_appointment(appointment_id: str, status: str, current_user = Depends(get_current_user)):
    result = await db.appointments.update_one(
        {"id": appointment_id},
        {"$set": {"status": status}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"message": "Appointment updated"}

# ============= STAFF ROUTES =============

@api_router.post("/staff", response_model=Staff)
async def create_staff(staff: StaffCreate, current_user = Depends(get_current_user)):
    staff_obj = Staff(**staff.model_dump())
    doc = staff_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.staff.insert_one(doc)
    return staff_obj

@api_router.get("/staff", response_model=List[Staff])
async def get_staff(current_user = Depends(get_current_user)):
    staff = await db.staff.find({}, {"_id": 0}).to_list(1000)
    for s in staff:
        if isinstance(s['created_at'], str):
            s['created_at'] = datetime.fromisoformat(s['created_at'])
    return staff

@api_router.put("/staff/{staff_id}")
async def update_staff(staff_id: str, staff: StaffCreate, current_user = Depends(get_current_user)):
    result = await db.staff.update_one(
        {"id": staff_id},
        {"$set": staff.model_dump()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Staff not found")
    return {"message": "Staff updated"}

# ============= INVENTORY ROUTES =============

@api_router.post("/inventory", response_model=Inventory)
async def create_inventory(item: InventoryCreate, current_user = Depends(get_current_user)):
    inventory_obj = Inventory(**item.model_dump())
    doc = inventory_obj.model_dump()
    doc['last_updated'] = doc['last_updated'].isoformat()
    await db.inventory.insert_one(doc)
    return inventory_obj

@api_router.get("/inventory", response_model=List[Inventory])
async def get_inventory(current_user = Depends(get_current_user)):
    inventory = await db.inventory.find({}, {"_id": 0}).to_list(1000)
    for i in inventory:
        if isinstance(i['last_updated'], str):
            i['last_updated'] = datetime.fromisoformat(i['last_updated'])
    return inventory

@api_router.put("/inventory/{item_id}")
async def update_inventory(item_id: str, item: InventoryCreate, current_user = Depends(get_current_user)):
    doc = item.model_dump()
    doc['last_updated'] = datetime.now(timezone.utc).isoformat()
    result = await db.inventory.update_one(
        {"id": item_id},
        {"$set": doc}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Inventory updated"}

# ============= INVOICE ROUTES =============

@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(invoice: InvoiceCreate, current_user = Depends(get_current_user)):
    # Calculate totals
    subtotal = sum(item.price * item.quantity for item in invoice.items)
    discount = invoice.discount
    tax = (subtotal - discount) * 0.18  # 18% tax
    total = subtotal - discount + tax
    
    # Generate invoice number
    count = await db.invoices.count_documents({})
    invoice_number = f"INV-{count + 1:05d}"
    
    invoice_obj = Invoice(
        invoice_number=invoice_number,
        customer_id=invoice.customer_id,
        staff_id=invoice.staff_id,
        items=[item.model_dump() for item in invoice.items],
        subtotal=subtotal,
        discount=discount,
        tax=tax,
        total=total,
        payment_method=invoice.payment_method,
        notes=invoice.notes
    )
    
    doc = invoice_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.invoices.insert_one(doc)
    
    # Update customer stats and loyalty points (1 point per Rs.10 spent)
    points_earned = int(total / 10)
    customer_doc = await db.customers.find_one({"id": invoice.customer_id}, {"_id": 0})
    new_total_spent = (customer_doc.get('total_spent', 0) if customer_doc else 0) + total
    new_points = (customer_doc.get('loyalty_points', 0) if customer_doc else 0) + points_earned

    # Determine tier based on total spent
    if new_total_spent >= 50000:
        tier = 'platinum'
    elif new_total_spent >= 20000:
        tier = 'gold'
    elif new_total_spent >= 5000:
        tier = 'silver'
    else:
        tier = 'bronze'

    await db.customers.update_one(
        {"id": invoice.customer_id},
        {
            "$inc": {"total_visits": 1, "total_spent": total, "loyalty_points": points_earned},
            "$set": {"membership_tier": tier}
        }
    )

    # Update staff stats if staff assigned
    if invoice.staff_id:
        staff_doc = await db.staff.find_one({"id": invoice.staff_id}, {"_id": 0})
        commission_rate = staff_doc.get('commission_rate', 0) if staff_doc else 0
        incentive = total * (commission_rate / 100)
        await db.staff.update_one(
            {"id": invoice.staff_id},
            {
                "$inc": {
                    "total_services": len(invoice.items),
                    "total_revenue": total,
                    "incentive_balance": incentive
                }
            }
        )
    
    return invoice_obj

@api_router.get("/invoices", response_model=List[Invoice])
async def get_invoices(current_user = Depends(get_current_user)):
    invoices = await db.invoices.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for inv in invoices:
        if isinstance(inv['created_at'], str):
            inv['created_at'] = datetime.fromisoformat(inv['created_at'])
    return invoices

@api_router.get("/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: str, current_user = Depends(get_current_user)):
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if isinstance(invoice['created_at'], str):
        invoice['created_at'] = datetime.fromisoformat(invoice['created_at'])
    return invoice

# ============= SALON PROFILE ROUTES =============

@api_router.get("/salon-profile")
async def get_salon_profile(current_user = Depends(get_current_user)):
    profile = await db.salon_profile.find_one({}, {"_id": 0})
    if not profile:
        # Return default profile
        return {
            "id": "default",
            "salon_name": "Ma-ke Salon Unisex Hair & Skin",
            "address": "Thangmeiband Sanakeithel Road, Ma-ke Salon 2nd Floor, Manipur, Imphal -795001",
            "phone": "6909902650",
            "email": "makesalon123@gmail.com",
            "gst_number": ""
        }
    return profile

@api_router.put("/salon-profile")
async def update_salon_profile(profile: SalonProfileUpdate, current_user = Depends(get_current_user)):
    existing = await db.salon_profile.find_one({}, {"_id": 0})
    doc = profile.model_dump()
    doc['updated_at'] = datetime.now(timezone.utc).isoformat()
    if existing:
        await db.salon_profile.update_one({}, {"$set": doc})
    else:
        doc['id'] = str(uuid.uuid4())
        await db.salon_profile.insert_one(doc)
    return {"message": "Salon profile updated"}

# ============= LOGO UPLOAD ROUTES =============

@api_router.post("/salon-profile/logo")
async def upload_logo(file: UploadFile = File(...), current_user = Depends(get_current_user)):
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP, GIF images allowed")

    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 5MB")

    ext = file.filename.split(".")[-1] if "." in file.filename else "png"
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = UPLOAD_DIR / filename

    with open(file_path, "wb") as f:
        f.write(data)

    storage_path = f"uploads/{filename}"

    # Store file reference
    file_id = str(uuid.uuid4())
    await db.files.insert_one({
        "id": file_id,
        "storage_path": storage_path,
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": len(data),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    # Update salon profile with logo path
    await db.salon_profile.update_one({}, {"$set": {"logo_path": storage_path}})

    return {"message": "Logo uploaded", "logo_path": storage_path, "file_id": file_id}

@api_router.get("/files/{path:path}")
async def serve_file(path: str, auth: str = Query(None), authorization: str = Header(None)):
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
    elif auth:
        token = auth

    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")

    # Read from local storage
    filename = path.replace("uploads/", "")
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    with open(file_path, "rb") as f:
        data = f.read()

    return Response(content=data, media_type=record.get("content_type", "image/png"))

# ============= NOTIFICATION ROUTES (ENHANCED) =============

class AppointmentNotification(BaseModel):
    appointment_id: str
    notification_type: str = "email"  # email or sms

@api_router.post("/notifications/appointment-reminder")
async def send_appointment_notification(data: AppointmentNotification, current_user = Depends(get_current_user)):
    # Fetch appointment details
    appointment = await db.appointments.find_one({"id": data.appointment_id}, {"_id": 0})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    customer = await db.customers.find_one({"id": appointment['customer_id']}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    service_ids = appointment.get('service_ids', [])
    services_list = await db.services.find({"id": {"$in": service_ids}}, {"_id": 0}).to_list(100)
    service_names = [s['name'] for s in services_list]

    staff_member = await db.staff.find_one({"id": appointment.get('staff_id')}, {"_id": 0})
    staff_name = staff_member['name'] if staff_member else 'Our team'

    salon = await db.salon_profile.find_one({}, {"_id": 0})
    salon_name = salon['salon_name'] if salon else 'Ma-ke Salon Unisex Hair & Skin'
    salon_phone = salon.get('phone', '6909902650') if salon else '6909902650'

    appt_date = appointment['appointment_date']
    if isinstance(appt_date, str):
        appt_date = datetime.fromisoformat(appt_date)
    formatted_date = appt_date.strftime('%B %d, %Y at %I:%M %p')

    if data.notification_type == "email":
        if not RESEND_API_KEY:
            raise HTTPException(status_code=400, detail="Email service not configured. Add RESEND_API_KEY to .env")
        if not customer.get('email'):
            raise HTTPException(status_code=400, detail="Customer has no email address")

        html = f"""
        <div style="font-family: 'Manrope', sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #FBFBF9;">
            <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #D4AF37; margin-bottom: 20px;">
                <h1 style="font-family: serif; color: #1B3B36; font-size: 22px; margin: 0;">{salon_name}</h1>
            </div>
            <h2 style="color: #1B3B36; font-size: 18px;">Appointment Reminder</h2>
            <p style="color: #6B726C; font-size: 14px;">Dear {customer['name']},</p>
            <p style="color: #6B726C; font-size: 14px;">This is a reminder for your upcoming appointment:</p>
            <div style="background: white; border: 1px solid #E8EAE6; border-radius: 12px; padding: 20px; margin: 15px 0;">
                <p style="color: #1B3B36; margin: 5px 0;"><strong>Date:</strong> {formatted_date}</p>
                <p style="color: #1B3B36; margin: 5px 0;"><strong>Services:</strong> {', '.join(service_names)}</p>
                <p style="color: #1B3B36; margin: 5px 0;"><strong>Stylist:</strong> {staff_name}</p>
            </div>
            <p style="color: #6B726C; font-size: 14px;">If you need to reschedule, call us at {salon_phone}.</p>
            <p style="color: #6B726C; font-size: 14px;">We look forward to seeing you!</p>
            <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #E8EAE6;">
                <p style="color: #6B726C; font-size: 11px;">Thank you for choosing {salon_name}</p>
            </div>
        </div>
        """
        params = {
            "from": SENDER_EMAIL,
            "to": [customer['email']],
            "subject": f"Appointment Reminder - {salon_name}",
            "html": html
        }
        try:
            email = await asyncio.to_thread(resend.Emails.send, params)
            return {"status": "success", "type": "email", "message": f"Reminder sent to {customer['email']}", "email_id": email.get("id")}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

    elif data.notification_type == "sms":
        if not twilio_client:
            raise HTTPException(status_code=400, detail="SMS service not configured. Add TWILIO credentials to .env")
        if not customer.get('phone'):
            raise HTTPException(status_code=400, detail="Customer has no phone number")

        sms_body = (
            f"Hi {customer['name']}, reminder for your appointment at {salon_name} "
            f"on {formatted_date}. "
            f"Services: {', '.join(service_names)}. "
            f"Stylist: {staff_name}. "
            f"Call {salon_phone} to reschedule."
        )
        try:
            message = await asyncio.to_thread(
                twilio_client.messages.create,
                body=sms_body,
                from_=TWILIO_PHONE_NUMBER,
                to=customer['phone']
            )
            return {"status": "success", "type": "sms", "message": f"SMS sent to {customer['phone']}", "sid": message.sid}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to send SMS: {str(e)}")

    raise HTTPException(status_code=400, detail="Invalid notification type. Use 'email' or 'sms'.")

@api_router.get("/invoices/{invoice_id}/pdf")
async def generate_invoice_pdf(invoice_id: str, current_user = Depends(get_current_user)):
    # Fetch invoice
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Fetch customer
    customer = await db.customers.find_one({"id": invoice['customer_id']}, {"_id": 0})
    customer_name = customer['name'] if customer else 'Unknown'
    customer_phone = customer.get('phone', '') if customer else ''
    customer_email = customer.get('email', '') if customer else ''

    # Fetch salon profile
    salon = await db.salon_profile.find_one({}, {"_id": 0})
    if not salon:
        salon = {
            "salon_name": "Ma-ke Salon Unisex Hair & Skin",
            "address": "Thangmeiband Sanakeithel Road, Ma-ke Salon 2nd Floor, Manipur, Imphal -795001",
            "phone": "6909902650",
            "email": "makesalon123@gmail.com",
            "gst_number": ""
        }

    # Fetch service names for items
    service_ids = [item['service_id'] for item in invoice['items']]
    services_list = await db.services.find({"id": {"$in": service_ids}}, {"_id": 0}).to_list(100)
    service_map = {s['id']: s['name'] for s in services_list}

    # Generate PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, leftMargin=20*mm, rightMargin=20*mm, topMargin=20*mm, bottomMargin=20*mm)
    elements = []

    # Colors
    primary_color = HexColor('#1B3B36')
    accent_color = HexColor('#D4AF37')
    light_bg = HexColor('#F3F4F1')
    border_color = HexColor('#E8EAE6')
    muted_text = HexColor('#6B726C')

    # Styles
    styles = getSampleStyleSheet()
    salon_name_style = ParagraphStyle('SalonName', parent=styles['Title'], fontSize=18, textColor=primary_color, alignment=TA_CENTER, spaceAfter=2*mm, fontName='Helvetica-Bold')
    salon_detail_style = ParagraphStyle('SalonDetail', parent=styles['Normal'], fontSize=9, textColor=muted_text, alignment=TA_CENTER, leading=13)
    heading_style = ParagraphStyle('SectionHeading', parent=styles['Normal'], fontSize=11, textColor=primary_color, fontName='Helvetica-Bold', spaceAfter=3*mm, spaceBefore=5*mm)
    normal_style = ParagraphStyle('NormalText', parent=styles['Normal'], fontSize=9, textColor=muted_text, leading=13)
    bold_style = ParagraphStyle('BoldText', parent=styles['Normal'], fontSize=9, textColor=primary_color, fontName='Helvetica-Bold', leading=13)

    # ---- Salon Header ----
    # Try to add logo
    logo_path = salon.get('logo_path')
    if logo_path:
        try:
            filename = logo_path.replace("uploads/", "")
            local_path = UPLOAD_DIR / filename
            if local_path.exists():
                from PIL import Image as PILImage
                pil_img = PILImage.open(str(local_path))
                if pil_img.mode in ('RGBA', 'LA', 'P'):
                    pil_img = pil_img.convert('RGB')
                clean_buffer = io.BytesIO()
                pil_img.save(clean_buffer, format='PNG')
                clean_buffer.seek(0)
                logo_img = RLImage(clean_buffer, width=35*mm, height=35*mm, kind='proportional')
                logo_img.hAlign = 'CENTER'
                elements.append(logo_img)
                elements.append(Spacer(1, 2*mm))
        except Exception as e:
            logging.warning(f"Failed to add logo to PDF: {e}")
    elements.append(Paragraph(salon['salon_name'], salon_name_style))
    elements.append(Paragraph(salon['address'], salon_detail_style))
    detail_parts = []
    if salon.get('phone'):
        detail_parts.append(f"Phone: {salon['phone']}")
    if salon.get('email'):
        detail_parts.append(f"Email: {salon['email']}")
    if salon.get('gst_number'):
        detail_parts.append(f"GST: {salon['gst_number']}")
    if detail_parts:
        elements.append(Paragraph(' | '.join(detail_parts), salon_detail_style))
    elements.append(Spacer(1, 5*mm))

    # Separator line
    sep_data = [['', '']]
    sep_table = Table(sep_data, colWidths=[doc.width])
    sep_table.setStyle(TableStyle([
        ('LINEBELOW', (0, 0), (-1, 0), 1, accent_color),
    ]))
    elements.append(sep_table)
    elements.append(Spacer(1, 5*mm))

    # ---- Invoice Info and Customer Info side by side ----
    created_at_str = invoice['created_at'] if isinstance(invoice['created_at'], str) else invoice['created_at'].isoformat()
    try:
        inv_date = datetime.fromisoformat(created_at_str).strftime('%B %d, %Y')
    except Exception:
        inv_date = created_at_str

    # Fetch staff name
    staff_name_pdf = ''
    if invoice.get('staff_id'):
        staff_doc = await db.staff.find_one({"id": invoice['staff_id']}, {"_id": 0})
        if staff_doc:
            staff_name_pdf = staff_doc['name']

    inv_info_text = f"<b>Invoice #:</b> {invoice['invoice_number']}<br/><b>Date:</b> {inv_date}<br/><b>Payment:</b> {invoice.get('payment_method', 'cash').upper()}<br/><b>Status:</b> {invoice.get('status', 'paid').upper()}"
    if staff_name_pdf:
        inv_info_text += f"<br/><b>Staff:</b> {staff_name_pdf}"
    cust_info_text = f"<b>Bill To:</b><br/>{customer_name}"
    if customer_phone:
        cust_info_text += f"<br/>Phone: {customer_phone}"
    if customer_email:
        cust_info_text += f"<br/>Email: {customer_email}"

    inv_para_style = ParagraphStyle('InvPara', parent=styles['Normal'], fontSize=9, textColor=muted_text, leading=14)

    info_data = [[Paragraph(inv_info_text, inv_para_style), Paragraph(cust_info_text, inv_para_style)]]
    info_table = Table(info_data, colWidths=[doc.width * 0.5, doc.width * 0.5])
    info_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 8*mm))

    # ---- Items Table ----
    elements.append(Paragraph("Services", heading_style))

    table_data = [['#', 'Service', 'Qty', 'Unit Price', 'Amount']]
    for idx, item in enumerate(invoice['items'], 1):
        svc_name = service_map.get(item['service_id'], 'Unknown Service')
        qty = item.get('quantity', 1)
        price = item.get('price', 0)
        amount = qty * price
        table_data.append([str(idx), svc_name, str(qty), f"Rs.{price:,.2f}", f"Rs.{amount:,.2f}"])

    item_table = Table(table_data, colWidths=[doc.width * 0.06, doc.width * 0.40, doc.width * 0.10, doc.width * 0.22, doc.width * 0.22])
    item_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), light_bg),
        ('TEXTCOLOR', (0, 0), (-1, 0), primary_color),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 1), (-1, -1), muted_text),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('ALIGN', (0, 0), (1, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('LINEBELOW', (0, 0), (-1, 0), 1, border_color),
        ('LINEBELOW', (0, -1), (-1, -1), 1, border_color),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(item_table)
    elements.append(Spacer(1, 5*mm))

    # ---- Totals ----
    totals_data = [
        ['', 'Subtotal:', f"Rs.{invoice['subtotal']:,.2f}"],
        ['', 'Discount:', f"- Rs.{invoice['discount']:,.2f}"],
        ['', 'Tax (18%):', f"Rs.{invoice['tax']:,.2f}"],
    ]

    totals_table = Table(totals_data, colWidths=[doc.width * 0.56, doc.width * 0.22, doc.width * 0.22])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (-1, -1), muted_text),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(totals_table)

    # Grand total
    grand_data = [['', 'TOTAL:', f"Rs.{invoice['total']:,.2f}"]]
    grand_table = Table(grand_data, colWidths=[doc.width * 0.56, doc.width * 0.22, doc.width * 0.22])
    grand_table.setStyle(TableStyle([
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (1, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (1, 0), (-1, -1), 12),
        ('TEXTCOLOR', (1, 0), (-1, -1), primary_color),
        ('LINEABOVE', (1, 0), (-1, 0), 2, accent_color),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(grand_table)

    # Notes
    if invoice.get('notes'):
        elements.append(Spacer(1, 8*mm))
        elements.append(Paragraph("Notes", heading_style))
        elements.append(Paragraph(invoice['notes'], normal_style))

    # Footer
    elements.append(Spacer(1, 15*mm))
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=muted_text, alignment=TA_CENTER, leading=12)
    elements.append(Paragraph("Thank you for choosing " + salon['salon_name'] + "!", footer_style))
    elements.append(Paragraph("We look forward to seeing you again.", footer_style))

    doc.build(elements)
    buffer.seek(0)

    filename = f"{invoice['invoice_number']}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ============= ANALYTICS ROUTES =============

@api_router.get("/analytics/dashboard")
async def get_dashboard_analytics(current_user = Depends(get_current_user)):
    # Get current month data
    now = datetime.now(timezone.utc)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Total customers
    total_customers = await db.customers.count_documents({})
    
    # Monthly revenue
    invoices = await db.invoices.find({}, {"_id": 0}).to_list(10000)
    monthly_revenue = sum(
        inv['total'] for inv in invoices
        if datetime.fromisoformat(inv['created_at']) >= start_of_month
    )
    
    # Total appointments
    total_appointments = await db.appointments.count_documents({})
    
    # Upcoming appointments
    upcoming_appointments = await db.appointments.count_documents({
        "status": "scheduled"
    })
    
    # Low stock items
    low_stock = await db.inventory.find(
        {"$expr": {"$lte": ["$quantity", "$reorder_level"]}},
        {"_id": 0}
    ).to_list(100)
    
    # Revenue trend (last 7 days)
    revenue_trend = []
    for i in range(7):
        day = now - timedelta(days=6-i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        day_revenue = sum(
            inv['total'] for inv in invoices
            if day_start <= datetime.fromisoformat(inv['created_at']) < day_end
        )
        revenue_trend.append({
            "date": day.strftime("%Y-%m-%d"),
            "revenue": day_revenue
        })
    
    return {
        "total_customers": total_customers,
        "monthly_revenue": monthly_revenue,
        "total_appointments": total_appointments,
        "upcoming_appointments": upcoming_appointments,
        "low_stock_items": len(low_stock),
        "revenue_trend": revenue_trend
    }

# ============= NOTIFICATION ROUTES =============

class EmailNotification(BaseModel):
    recipient_email: str
    subject: str
    html_content: str

@api_router.post("/notifications/send-email")
async def send_email(email_data: EmailNotification, current_user = Depends(get_current_user)):
    if not RESEND_API_KEY:
        raise HTTPException(status_code=400, detail="Email service not configured")
    
    params = {
        "from": SENDER_EMAIL,
        "to": [email_data.recipient_email],
        "subject": email_data.subject,
        "html": email_data.html_content
    }
    
    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        return {"status": "success", "message": "Email sent", "email_id": email.get("id")}
    except Exception as e:
        logging.error(f"Failed to send email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    logger.info("Server started, upload directory ready")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()