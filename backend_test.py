import requests
import sys
from datetime import datetime

class SalonAPITester:
    def __init__(self, base_url="https://beauty-billing-4.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                self.test_results.append({"test": name, "status": "PASSED", "details": f"Status: {response.status_code}"})
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                    self.test_results.append({"test": name, "status": "FAILED", "details": f"Expected {expected_status}, got {response.status_code}. Error: {error_detail}"})
                except:
                    print(f"   Response: {response.text}")
                    self.test_results.append({"test": name, "status": "FAILED", "details": f"Expected {expected_status}, got {response.status_code}. Response: {response.text}"})
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({"test": name, "status": "FAILED", "details": f"Exception: {str(e)}"})
            return False, {}

    def test_login(self, email, password):
        """Test login and get token"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'token' in response:
            self.token = response['token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_get_salon_profile(self):
        """Test getting salon profile"""
        success, response = self.run_test(
            "Get Salon Profile",
            "GET",
            "salon-profile",
            200
        )
        if success:
            print(f"   Salon Name: {response.get('salon_name', 'N/A')}")
            print(f"   Address: {response.get('address', 'N/A')}")
            print(f"   Phone: {response.get('phone', 'N/A')}")
            print(f"   Email: {response.get('email', 'N/A')}")
        return success, response

    def test_update_salon_profile(self):
        """Test updating salon profile"""
        test_data = {
            "salon_name": "Ma-ke Salon Unisex Hair & Skin - Updated",
            "address": "Thangmeiband Sanakeithel Road, Ma-ke Salon 2nd Floor, Manipur, Imphal -795001",
            "phone": "6909902650",
            "email": "makesalon123@gmail.com",
            "gst_number": "22AAAAA0000A1Z5"
        }
        success, response = self.run_test(
            "Update Salon Profile",
            "PUT",
            "salon-profile",
            200,
            data=test_data
        )
        return success

    def test_get_invoices(self):
        """Test getting invoices list"""
        success, response = self.run_test(
            "Get Invoices List",
            "GET",
            "invoices",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} invoices")
            if len(response) > 0:
                print(f"   First invoice: {response[0].get('invoice_number', 'N/A')}")
                return success, response[0].get('id')  # Return first invoice ID for PDF test
        return success, None

    def test_invoice_pdf(self, invoice_id):
        """Test invoice PDF generation"""
        if not invoice_id:
            print("❌ No invoice ID available for PDF test")
            self.test_results.append({"test": "Invoice PDF Generation", "status": "SKIPPED", "details": "No invoice ID available"})
            return False
            
        success, _ = self.run_test(
            "Invoice PDF Generation",
            "GET",
            f"invoices/{invoice_id}/pdf",
            200,
            headers={'Accept': 'application/pdf'}
        )
        return success

    def test_get_customers(self):
        """Test getting customers"""
        success, response = self.run_test(
            "Get Customers",
            "GET",
            "customers",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} customers")
        return success

    def test_get_services(self):
        """Test getting services"""
        success, response = self.run_test(
            "Get Services",
            "GET",
            "services",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} services")
        return success

    def test_logo_upload(self):
        """Test logo upload functionality"""
        # Create a simple test image (1x1 PNG)
        import base64
        # Minimal PNG data for a 1x1 transparent pixel
        png_data = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77yQAAAABJRU5ErkJggg==')
        
        try:
            url = f"{self.base_url}/salon-profile/logo"
            headers = {'Authorization': f'Bearer {self.token}'}
            files = {'file': ('test_logo.png', png_data, 'image/png')}
            
            print(f"\n🔍 Testing Logo Upload...")
            response = requests.post(url, headers=headers, files=files)
            
            self.tests_run += 1
            if response.status_code == 200:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                result = response.json()
                logo_path = result.get('logo_path')
                print(f"   Logo uploaded to: {logo_path}")
                self.test_results.append({"test": "Logo Upload", "status": "PASSED", "details": f"Logo path: {logo_path}"})
                return True, logo_path
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                    self.test_results.append({"test": "Logo Upload", "status": "FAILED", "details": f"Status {response.status_code}: {error_detail}"})
                except:
                    print(f"   Response: {response.text}")
                    self.test_results.append({"test": "Logo Upload", "status": "FAILED", "details": f"Status {response.status_code}: {response.text}"})
                return False, None
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({"test": "Logo Upload", "status": "FAILED", "details": f"Exception: {str(e)}"})
            return False, None

    def test_file_serving(self, logo_path):
        """Test file serving with authentication"""
        if not logo_path:
            print("❌ No logo path available for file serving test")
            self.test_results.append({"test": "File Serving", "status": "SKIPPED", "details": "No logo path available"})
            return False
            
        try:
            url = f"{self.base_url}/files/{logo_path}?auth={self.token}"
            print(f"\n🔍 Testing File Serving...")
            response = requests.get(url)
            
            self.tests_run += 1
            if response.status_code == 200:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                print(f"   Content-Type: {response.headers.get('content-type', 'N/A')}")
                print(f"   Content-Length: {len(response.content)} bytes")
                self.test_results.append({"test": "File Serving", "status": "PASSED", "details": f"Content-Type: {response.headers.get('content-type')}"})
                return True
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                self.test_results.append({"test": "File Serving", "status": "FAILED", "details": f"Status {response.status_code}"})
                return False
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({"test": "File Serving", "status": "FAILED", "details": f"Exception: {str(e)}"})
            return False

    def test_appointment_reminder_notification(self):
        """Test appointment reminder notification (should fail due to missing config)"""
        # First get appointments to find one to test with
        success, appointments = self.run_test(
            "Get Appointments for Notification Test",
            "GET", 
            "appointments",
            200
        )
        
        if not success or not appointments:
            print("❌ No appointments available for notification test")
            self.test_results.append({"test": "Appointment Reminder", "status": "SKIPPED", "details": "No appointments available"})
            return False
            
        appointment_id = appointments[0].get('id') if appointments else None
        if not appointment_id:
            print("❌ No valid appointment ID for notification test")
            self.test_results.append({"test": "Appointment Reminder", "status": "SKIPPED", "details": "No valid appointment ID"})
            return False
            
        # Test email reminder (should fail with config error)
        print(f"\n🔍 Testing Email Reminder (expecting config error)...")
        success, response = self.run_test(
            "Email Reminder (Config Error Expected)",
            "POST",
            "notifications/appointment-reminder",
            400,  # Expecting 400 due to missing email config
            data={"appointment_id": appointment_id, "notification_type": "email"}
        )
        
        if success:
            print("✅ Email reminder correctly returned config error")
        
        # Test SMS reminder (should fail with config error)  
        print(f"\n🔍 Testing SMS Reminder (expecting config error)...")
        success, response = self.run_test(
            "SMS Reminder (Config Error Expected)",
            "POST",
            "notifications/appointment-reminder",
            400,  # Expecting 400 due to missing SMS config
            data={"appointment_id": appointment_id, "notification_type": "sms"}
        )
        
        if success:
            print("✅ SMS reminder correctly returned config error")
            
        return True

    def test_get_appointments(self):
        """Test getting appointments"""
        success, response = self.run_test(
            "Get Appointments",
            "GET",
            "appointments",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} appointments")
        return success, response

def main():
    print("🧪 Starting Salon Billing Software API Tests")
    print("=" * 50)
    
    # Setup
    tester = SalonAPITester()
    
    # Test login
    if not tester.test_login("admin@salon.com", "admin123"):
        print("❌ Login failed, stopping tests")
        return 1

    # Test salon profile endpoints
    profile_success, profile_data = tester.test_get_salon_profile()
    if profile_success:
        # Verify the pre-seeded salon data
        expected_salon_name = "Ma-ke Salon Unisex Hair & Skin"
        if profile_data.get('salon_name') == expected_salon_name:
            print(f"✅ Salon profile has correct pre-seeded data")
        else:
            print(f"⚠️  Salon name mismatch. Expected: {expected_salon_name}, Got: {profile_data.get('salon_name')}")

    # Test logo upload functionality
    logo_upload_success, logo_path = tester.test_logo_upload()
    
    # Test file serving if logo upload succeeded
    if logo_upload_success and logo_path:
        tester.test_file_serving(logo_path)
        
        # Test salon profile again to verify logo_path field is returned
        print(f"\n🔍 Verifying salon profile returns logo_path after upload...")
        profile_success_after, profile_data_after = tester.test_get_salon_profile()
        if profile_success_after and profile_data_after.get('logo_path'):
            print(f"✅ Salon profile now includes logo_path: {profile_data_after.get('logo_path')}")
            tester.test_results.append({"test": "Salon Profile Logo Path", "status": "PASSED", "details": f"Logo path returned: {profile_data_after.get('logo_path')}"})
        else:
            print(f"❌ Salon profile does not include logo_path field")
            tester.test_results.append({"test": "Salon Profile Logo Path", "status": "FAILED", "details": "logo_path field not returned"})

    # Test salon profile update
    tester.test_update_salon_profile()

    # Test invoice-related endpoints
    invoice_success, first_invoice_id = tester.test_get_invoices()
    
    # Test PDF generation if we have an invoice
    if first_invoice_id:
        tester.test_invoice_pdf(first_invoice_id)

    # Test other endpoints
    tester.test_get_customers()
    tester.test_get_services()
    
    # Test appointments and notifications
    tester.test_get_appointments()
    tester.test_appointment_reminder_notification()

    # Print results summary
    print("\n" + "=" * 50)
    print(f"📊 Test Results Summary")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    print(f"\n📋 Detailed Results:")
    for result in tester.test_results:
        status_icon = "✅" if result["status"] == "PASSED" else "❌" if result["status"] == "FAILED" else "⏭️"
        print(f"{status_icon} {result['test']}: {result['status']}")
        if result["status"] != "PASSED":
            print(f"   Details: {result['details']}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())