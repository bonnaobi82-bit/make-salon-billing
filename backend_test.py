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