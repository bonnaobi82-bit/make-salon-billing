# Salon Billing Software - PRD

## Original Problem Statement
Create a salon billing software with full suite features: Billing + Customers + Services + Appointments + Staff management + Inventory. Multi-user system with roles. SMS/Email notifications. Reports and analytics. Elegant and premium design.

## User Personas
- **Salon Owner**: Full access to all features, manages staff, views reports
- **Staff Member**: Access to appointments, customers, basic billing

## Core Requirements
- Multi-user authentication (owner/staff roles)
- Customer management with visit tracking
- Service catalog with categories and pricing
- Appointment scheduling and status management
- Staff management with commission tracking
- Inventory tracking with low stock alerts
- Billing & invoice generation
- Reports & analytics dashboard
- Email/SMS notification capability (configurable)
- Salon profile management (name, address, phone, email, GST)
- Invoice PDF generation and printing

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI + Recharts
- **Backend**: FastAPI + Motor (async MongoDB)
- **Database**: MongoDB
- **PDF**: ReportLab for invoice PDF generation
- **Auth**: JWT tokens with bcrypt password hashing

## What's Been Implemented (April 12, 2026)
- [x] Authentication (login/register) with JWT
- [x] Dashboard with analytics (customers, revenue, appointments, low stock, revenue chart)
- [x] Customer CRUD with search
- [x] Service catalog with categories
- [x] Appointment scheduling with status management
- [x] Staff management with commission tracking
- [x] Inventory tracking with low stock alerts
- [x] Invoice creation with multiple services, discount, tax calculation
- [x] **Salon Profile** management (Settings page) - pre-filled with Ma-ke Salon details
- [x] **Invoice PDF** generation with salon branding (ReportLab)
- [x] **Invoice detail modal** with salon info, customer info, itemized services
- [x] **Print invoice** functionality
- [x] **Download PDF** button on invoice table and detail view
- [x] Premium UI design (Playfair Display + Manrope fonts, forest green + gold theme)
- [x] Seed data with sample customers, services, staff, inventory

## Salon Details
- Name: Ma-ke Salon Unisex Hair & Skin
- Address: Thangmeiband Sanakeithel Road, Ma-ke Salon 2nd Floor, Manipur, Imphal -795001
- Phone: 6909902650
- Email: makesalon123@gmail.com

## Backlog
### P0 (Critical)
- None remaining

### P1 (Important)
- Email/SMS notifications integration (requires API keys: Resend, Twilio)
- Logo upload for salon profile (shown on invoices)

### P2 (Nice to Have)
- Customer loyalty/membership programs
- Expense tracking
- Daily/monthly/yearly report exports
- Appointment calendar view (day/week/month)
- Staff scheduling & availability
- Barcode/QR code on invoices

## Test Credentials
- Admin: admin@salon.com / admin123
- Staff: staff@salon.com / staff123
