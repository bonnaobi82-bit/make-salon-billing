# Salon Billing Software - PRD

## Original Problem Statement
Create a salon billing software with full suite features: Billing + Customers + Services + Appointments + Staff management + Inventory. Multi-user system with roles. SMS/Email notifications. Reports and analytics. Elegant and premium design.

## Salon Details
- Name: Ma-ke Salon Unisex Hair & Skin
- Address: Thangmeiband Sanakeithel Road, Ma-ke Salon 2nd Floor, Manipur, Imphal -795001
- Phone: 6909902650
- Email: makesalon123@gmail.com

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI + Recharts
- **Backend**: FastAPI + Motor (async MongoDB)
- **Database**: MongoDB
- **PDF**: ReportLab for invoice PDF generation
- **Storage**: Emergent Object Storage for logo upload
- **Auth**: JWT tokens with bcrypt
- **Notifications**: Resend (email), Twilio (SMS) - configurable

## What's Been Implemented (April 12, 2026)
- [x] Authentication (login/register) with JWT
- [x] Dashboard with analytics
- [x] Customer CRUD with search
- [x] Service catalog with categories
- [x] **Monthly Calendar View** for appointments (calendar/list toggle, month nav, today highlight)
- [x] Appointment detail dialog with status management
- [x] **Email/SMS Reminder** sending from appointment detail
- [x] Staff management with commission tracking
- [x] Inventory tracking with low stock alerts
- [x] Invoice creation with itemized services
- [x] **Salon Profile** management (name, address, phone, email, GST)
- [x] **Salon Logo Upload** via Emergent Object Storage
- [x] **Logo on Invoices** (PDF and detail view)
- [x] **Invoice PDF** generation with salon branding + logo
- [x] **Invoice Print** functionality
- [x] Premium UI design (Playfair Display + Manrope, forest green + gold)

## Backlog
### P1
- Resend API key integration (user needs to provide key)
- Twilio credentials integration (user needs to provide credentials)
### P2
- Customer loyalty/membership programs
- Expense tracking
- Daily/monthly/yearly report exports
- Staff scheduling & availability

## Test Credentials
- Admin: admin@salon.com / admin123
- Staff: staff@salon.com / staff123
