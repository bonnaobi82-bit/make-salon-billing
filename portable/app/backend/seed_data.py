import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import bcrypt
from datetime import datetime, timezone

async def seed_database():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'salon_billing_db')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Check if already seeded
    existing_users = await db.users.count_documents({})
    if existing_users > 0:
        print("Database already seeded. Skipping.")
        client.close()
        return
    
    print("Seeding database...")
    
    def hash_password(password):
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    # Users
    await db.users.insert_many([
        {
            'id': 'admin-001', 'email': 'admin@salon.com',
            'password': hash_password('admin123'),
            'full_name': 'Admin User', 'role': 'owner',
            'created_at': datetime.now(timezone.utc).isoformat()
        },
        {
            'id': 'staff-001', 'email': 'staff@salon.com',
            'password': hash_password('staff123'),
            'full_name': 'Staff User', 'role': 'staff',
            'created_at': datetime.now(timezone.utc).isoformat()
        }
    ])
    
    # Salon Profile
    await db.salon_profile.insert_one({
        'id': 'salon-001',
        'salon_name': 'Ma-ke Salon Unisex Hair & Skin',
        'address': 'Thangmeiband Sanakeithel Road, Ma-ke Salon 2nd Floor, Manipur, Imphal -795001',
        'phone': '6909902650',
        'email': 'makesalon123@gmail.com',
        'gst_number': '',
        'updated_at': datetime.now(timezone.utc).isoformat()
    })
    
    # Sample Customers
    await db.customers.insert_many([
        {'id': 'cust-001', 'name': 'Priya Sharma', 'phone': '+91-9876543210', 'email': 'priya@example.com', 'notes': 'Prefers organic products', 'total_visits': 5, 'total_spent': 7500.0, 'loyalty_points': 0, 'membership_tier': 'silver', 'created_at': datetime.now(timezone.utc).isoformat()},
        {'id': 'cust-002', 'name': 'Rahul Verma', 'phone': '+91-9876543211', 'email': 'rahul@example.com', 'notes': '', 'total_visits': 3, 'total_spent': 4500.0, 'loyalty_points': 0, 'membership_tier': 'bronze', 'created_at': datetime.now(timezone.utc).isoformat()},
        {'id': 'cust-003', 'name': 'Anjali Patel', 'phone': '+91-9876543212', 'email': 'anjali@example.com', 'notes': 'Allergic to certain hair colors', 'total_visits': 8, 'total_spent': 12000.0, 'loyalty_points': 0, 'membership_tier': 'silver', 'created_at': datetime.now(timezone.utc).isoformat()}
    ])
    
    # Sample Services
    await db.services.insert_many([
        {'id': 'serv-001', 'name': 'Haircut - Men', 'description': 'Professional haircut for men', 'duration_minutes': 30, 'price': 500.0, 'category': 'haircut', 'is_active': True, 'created_at': datetime.now(timezone.utc).isoformat()},
        {'id': 'serv-002', 'name': 'Haircut - Women', 'description': 'Professional haircut and styling for women', 'duration_minutes': 45, 'price': 800.0, 'category': 'haircut', 'is_active': True, 'created_at': datetime.now(timezone.utc).isoformat()},
        {'id': 'serv-003', 'name': 'Hair Coloring', 'description': 'Full hair coloring service', 'duration_minutes': 120, 'price': 3500.0, 'category': 'coloring', 'is_active': True, 'created_at': datetime.now(timezone.utc).isoformat()},
        {'id': 'serv-004', 'name': 'Facial Treatment', 'description': 'Deep cleansing facial', 'duration_minutes': 60, 'price': 1500.0, 'category': 'facial', 'is_active': True, 'created_at': datetime.now(timezone.utc).isoformat()},
        {'id': 'serv-005', 'name': 'Manicure & Pedicure', 'description': 'Complete nail care service', 'duration_minutes': 60, 'price': 1200.0, 'category': 'nails', 'is_active': True, 'created_at': datetime.now(timezone.utc).isoformat()}
    ])
    
    # Sample Staff
    await db.staff.insert_many([
        {'id': 'staff-001', 'name': 'Meera Singh', 'phone': '+91-9876543220', 'email': 'meera@salon.com', 'specialization': 'Hair Stylist', 'commission_rate': 15.0, 'is_active': True, 'total_services': 0, 'total_revenue': 0, 'incentive_balance': 0, 'created_at': datetime.now(timezone.utc).isoformat()},
        {'id': 'staff-002', 'name': 'Kavita Reddy', 'phone': '+91-9876543221', 'email': 'kavita@salon.com', 'specialization': 'Nail Artist', 'commission_rate': 12.0, 'is_active': True, 'total_services': 0, 'total_revenue': 0, 'incentive_balance': 0, 'created_at': datetime.now(timezone.utc).isoformat()},
        {'id': 'staff-003', 'name': 'Neha Gupta', 'phone': '+91-9876543222', 'email': 'neha@salon.com', 'specialization': 'Facial Specialist', 'commission_rate': 10.0, 'is_active': True, 'total_services': 0, 'total_revenue': 0, 'incentive_balance': 0, 'created_at': datetime.now(timezone.utc).isoformat()}
    ])
    
    # Sample Inventory
    await db.inventory.insert_many([
        {'id': 'inv-001', 'product_name': 'Premium Shampoo', 'category': 'hair_care', 'quantity': 25, 'unit_price': 450.0, 'supplier': "L'Oreal Professional", 'reorder_level': 10, 'last_updated': datetime.now(timezone.utc).isoformat()},
        {'id': 'inv-002', 'product_name': 'Hair Color - Black', 'category': 'hair_care', 'quantity': 8, 'unit_price': 850.0, 'supplier': 'Schwarzkopf', 'reorder_level': 10, 'last_updated': datetime.now(timezone.utc).isoformat()},
        {'id': 'inv-003', 'product_name': 'Facial Mask', 'category': 'skin_care', 'quantity': 15, 'unit_price': 350.0, 'supplier': 'The Body Shop', 'reorder_level': 5, 'last_updated': datetime.now(timezone.utc).isoformat()},
        {'id': 'inv-004', 'product_name': 'Nail Polish Set', 'category': 'nail_care', 'quantity': 3, 'unit_price': 1200.0, 'supplier': 'OPI', 'reorder_level': 5, 'last_updated': datetime.now(timezone.utc).isoformat()}
    ])
    
    print("Database seeded successfully!")
    print("Login: admin@salon.com / admin123")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
