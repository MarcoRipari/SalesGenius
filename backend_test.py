import requests
import sys
import json
from datetime import datetime

class SalesGeniusAPITester:
    def __init__(self, base_url="https://condescending-poitras-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_result(self, test_name, passed, message="", response_data=None):
        """Log test result"""
        self.tests_run += 1
        if passed:
            self.tests_passed += 1
            print(f"✅ {test_name}: PASSED")
        else:
            print(f"❌ {test_name}: FAILED - {message}")
        
        self.test_results.append({
            "test": test_name,
            "passed": passed,
            "message": message,
            "response": response_data
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for file uploads
                    headers.pop('Content-Type', None)
                    response = requests.post(url, headers=headers, files=files, data=data, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            response_data = None
            
            try:
                response_data = response.json() if response.text else {}
                if success:
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                else:
                    print(f"   Error Response: {response_data}")
            except:
                response_data = {"raw_text": response.text[:200]}

            self.log_result(name, success, 
                          f"Expected {expected_status}, got {response.status_code}" if not success else "",
                          response_data)

            return success, response_data

        except Exception as e:
            print(f"   Exception: {str(e)}")
            self.log_result(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n" + "="*50)
        print("TESTING AUTHENTICATION ENDPOINTS")
        print("="*50)

        # Test login with existing user
        success, response = self.run_test(
            "User Login (Existing User)",
            "POST",
            "auth/login",
            200,
            data={"email": "test@demo.com", "password": "test123"}
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_data = response.get('user', {})
            print(f"   Logged in as: {self.user_data.get('email', 'Unknown')}")
            print(f"   Widget Key: {self.user_data.get('widget_key', 'No key')}")

        # Test getting current user info
        if self.token:
            self.run_test(
                "Get Current User Info",
                "GET", 
                "auth/me",
                200
            )

        # Test registration with new user (will likely fail if user exists)
        test_email = f"test_user_{datetime.now().strftime('%H%M%S')}@demo.com"
        self.run_test(
            "User Registration (New User)",
            "POST",
            "auth/register", 
            200,
            data={
                "email": test_email,
                "password": "test123",
                "company_name": "Test Company"
            }
        )

        # Test invalid login
        self.run_test(
            "Invalid Login",
            "POST",
            "auth/login",
            401,
            data={"email": "invalid@test.com", "password": "wrongpass"}
        )

    def test_knowledge_endpoints(self):
        """Test knowledge base endpoints"""
        print("\n" + "="*50)
        print("TESTING KNOWLEDGE BASE ENDPOINTS")
        print("="*50)

        if not self.token:
            print("❌ Skipping knowledge tests - no auth token")
            return

        # Get knowledge sources
        self.run_test(
            "Get Knowledge Sources",
            "GET",
            "knowledge",
            200
        )

        # Add URL source
        success, response = self.run_test(
            "Add URL Source",
            "POST",
            "knowledge/url",
            200,
            data={
                "type": "url",
                "name": "Test Homepage",
                "url": "https://example.com"
            }
        )

        source_id = None
        if success and 'id' in response:
            source_id = response['id']

        # Test adding invalid URL
        self.run_test(
            "Add Invalid URL Source",
            "POST",
            "knowledge/url",
            400,
            data={
                "type": "url", 
                "name": "Invalid URL"
                # Missing url field
            }
        )

        # Delete the created source if we have an ID
        if source_id:
            self.run_test(
                "Delete Knowledge Source",
                "DELETE",
                f"knowledge/{source_id}",
                200
            )

    def test_widget_endpoints(self):
        """Test widget configuration endpoints"""
        print("\n" + "="*50)
        print("TESTING WIDGET CONFIGURATION ENDPOINTS")
        print("="*50)

        if not self.token:
            print("❌ Skipping widget tests - no auth token")
            return

        # Get current widget config
        success, config_data = self.run_test(
            "Get Widget Config",
            "GET",
            "widget/config",
            200
        )

        # Update widget config
        if success:
            updated_config = {
                "bot_name": "Test Bot",
                "welcome_message": "Hello from test!",
                "primary_color": "#FF5722",
                "position": "bottom-left"
            }
            
            self.run_test(
                "Update Widget Config",
                "PUT",
                "widget/config",
                200,
                data=updated_config
            )

            # Restore original config
            original_config = {
                "bot_name": config_data.get("bot_name", "SalesGenius"),
                "welcome_message": config_data.get("welcome_message", "Ciao! Come posso aiutarti oggi?"),
                "primary_color": config_data.get("primary_color", "#F97316"),
                "position": config_data.get("position", "bottom-right")
            }
            
            self.run_test(
                "Restore Original Widget Config",
                "PUT",
                "widget/config", 
                200,
                data=original_config
            )

        # Test public widget config
        if self.user_data and 'widget_key' in self.user_data:
            widget_key = self.user_data['widget_key']
            self.run_test(
                "Get Public Widget Config",
                "GET",
                f"widget/public/{widget_key}",
                200
            )

    def test_analytics_endpoints(self):
        """Test analytics endpoints"""
        print("\n" + "="*50)
        print("TESTING ANALYTICS ENDPOINTS")
        print("="*50)

        if not self.token:
            print("❌ Skipping analytics tests - no auth token")
            return

        # Get analytics overview
        self.run_test(
            "Get Analytics Overview",
            "GET",
            "analytics/overview",
            200
        )

        # Get daily analytics
        self.run_test(
            "Get Daily Analytics",
            "GET", 
            "analytics/daily",
            200
        )

    def test_conversations_endpoints(self):
        """Test conversation endpoints"""
        print("\n" + "="*50)
        print("TESTING CONVERSATIONS ENDPOINTS")
        print("="*50)

        if not self.token:
            print("❌ Skipping conversations tests - no auth token")
            return

        # Get conversations
        self.run_test(
            "Get Conversations",
            "GET",
            "conversations", 
            200
        )

    def test_leads_endpoints(self):
        """Test leads endpoints"""
        print("\n" + "="*50)
        print("TESTING LEADS ENDPOINTS") 
        print("="*50)

        if not self.token:
            print("❌ Skipping leads tests - no auth token")
            return

        # Get leads
        self.run_test(
            "Get Leads",
            "GET",
            "leads",
            200
        )

    def test_pricing_endpoint(self):
        """Test pricing endpoint (public)"""
        print("\n" + "="*50)
        print("TESTING PRICING ENDPOINT")
        print("="*50)

        self.run_test(
            "Get Pricing Estimate",
            "GET",
            "pricing/estimate",
            200
        )

    def test_chat_endpoints(self):
        """Test chat endpoints (public)"""
        print("\n" + "="*50)
        print("TESTING CHAT ENDPOINTS") 
        print("="*50)

        if not self.user_data or 'widget_key' not in self.user_data:
            print("❌ Skipping chat tests - no widget key")
            return

        widget_key = self.user_data['widget_key']
        session_id = f"test_session_{datetime.now().strftime('%H%M%S')}"

        # Send chat message
        success, response = self.run_test(
            "Send Chat Message",
            "POST",
            "chat/message",
            200,
            data={
                "session_id": session_id,
                "message": "Hello, this is a test message",
                "widget_key": widget_key
            }
        )

        # Get chat history
        if success:
            self.run_test(
                "Get Chat History",
                "GET",
                f"chat/history/{session_id}",
                200
            )

    def test_team_management_endpoints(self):
        """Test team management endpoints"""
        print("\n" + "="*50)
        print("TESTING TEAM MANAGEMENT ENDPOINTS")
        print("="*50)

        if not self.token:
            print("❌ Skipping team tests - no auth token")
            return

        # Get team members
        success, members_data = self.run_test(
            "Get Team Members",
            "GET",
            "team/members",
            200
        )

        # Invite team member
        test_email = f"team_member_{datetime.now().strftime('%H%M%S')}@demo.com"
        success, invite_response = self.run_test(
            "Invite Team Member",
            "POST",
            "team/invite",
            200,
            data={
                "email": test_email,
                "role": "member"
            }
        )

        member_id = None
        if success and 'member' in invite_response:
            member_id = invite_response['member'].get('id')

        # Update team member role (if we have a member)
        if member_id:
            self.run_test(
                "Update Team Member Role",
                "PUT",
                f"team/members/{member_id}",
                200,
                data={"role": "viewer"}
            )

            # Remove team member
            self.run_test(
                "Remove Team Member",
                "DELETE",
                f"team/members/{member_id}",
                200
            )

        # Test invalid invite
        self.run_test(
            "Invalid Team Invite (Missing Email)",
            "POST",
            "team/invite",
            422,  # FastAPI validation error
            data={"role": "member"}
        )

    def test_admin_settings_endpoints(self):
        """Test admin settings endpoints"""
        print("\n" + "="*50)
        print("TESTING ADMIN SETTINGS ENDPOINTS")
        print("="*50)

        if not self.token:
            print("❌ Skipping admin tests - no auth token")
            return

        # Get admin settings
        success, settings_data = self.run_test(
            "Get Admin Settings",
            "GET",
            "admin/settings",
            200
        )

        # Update admin settings
        if success:
            updated_settings = {
                "company_name": "Test Updated Company",
                "support_email": "test-support@demo.com",
                "timezone": "Europe/London",
                "language": "en",
                "notification_new_lead": False,
                "notification_new_conversation": True,
                "ai_model": "gemini-2.5-flash",
                "max_tokens_per_response": 800
            }
            
            self.run_test(
                "Update Admin Settings",
                "PUT",
                "admin/settings",
                200,
                data=updated_settings
            )

        # Get API config
        self.run_test(
            "Get Admin API Config",
            "GET",
            "admin/api-config",
            200
        )

    def test_product_endpoints(self):
        """Test product management endpoints (Required functionality)"""
        print("\n" + "="*50)
        print("TESTING PRODUCT ENDPOINTS (REQUIRED FUNCTIONALITY)")
        print("="*50)

        # Get all products
        success, products = self.run_test(
            "Get All Products",
            "GET", 
            "products",
            200
        )
        
        if success:
            print(f"   Found {len(products)} existing products")

        # Search products
        self.run_test(
            "Search Products",
            "GET",
            "products/search?q=scarpa+da+bambina+rosa",
            200
        )

        # Create a new product manually
        test_product = {
            "name": "Test Scarpa da Bambina Rosa",
            "description": "Scarpa rosa per bambina, perfetta per ogni occasione",
            "price": "€ 45,90",
            "price_value": 45.90,
            "image_url": "https://example.com/scarpa-rosa.jpg",
            "product_url": "https://example.com/scarpa-rosa", 
            "category": "Scarpe Bambina",
            "in_stock": True
        }

        success, response = self.run_test(
            "Create Product (Manual)",
            "POST",
            "products",
            200,
            data=test_product
        )

        created_product_id = None
        if success and 'id' in response:
            created_product_id = response['id']
            print(f"   Created product ID: {created_product_id}")

            # Test update product
            updated_product = test_product.copy()
            updated_product['name'] = "Updated Scarpa da Bambina Rosa"
            updated_product['price'] = "€ 49,90"
            
            self.run_test(
                "Update Product",
                "PUT",
                f"products/{created_product_id}",
                200,
                data=updated_product
            )

        # Test cart functionality
        print(f"\n--- Testing Cart Integration ---")
        
        if created_product_id and self.user_data:
            widget_key = self.user_data.get('widget_key')
            session_id = f"test_cart_session_{int(datetime.now().timestamp())}"
            
            if widget_key:
                # Add to cart
                cart_url = f"cart/add?product_id={created_product_id}&session_id={session_id}&widget_key={widget_key}"
                success, cart_response = self.run_test(
                    "Add Product to Cart",
                    "POST",
                    cart_url,
                    200
                )

                # Get cart contents  
                get_cart_url = f"cart/{session_id}?widget_key={widget_key}"
                success, cart_data = self.run_test(
                    "Get Cart Contents",
                    "GET", 
                    get_cart_url,
                    200
                )
                
                if success:
                    print(f"   Cart items: {len(cart_data.get('items', []))}")
                    print(f"   Cart total: €{cart_data.get('total', 0)}")

                # Remove from cart
                self.run_test(
                    "Remove Product from Cart",
                    "DELETE",
                    f"cart/{session_id}/{created_product_id}",
                    200
                )

        # Test product search with AI (simulate bot query for products)
        if self.user_data:
            widget_key = self.user_data.get('widget_key')
            session_id = f"test_product_search_{int(datetime.now().timestamp())}"
            
            if widget_key:
                chat_request = {
                    "session_id": session_id,
                    "message": "scarpa da bambina rosa",
                    "widget_key": widget_key
                }
                
                success, response = self.run_test(
                    "AI Product Search via Chat",
                    "POST",
                    "chat/message",
                    200,
                    data=chat_request
                )
                
                if success:
                    products_found = response.get('products', [])
                    print(f"   AI found {len(products_found) if products_found else 0} products")
                    if products_found:
                        for i, product in enumerate(products_found[:3]):
                            print(f"     {i+1}. {product.get('name', 'Unknown')} - {product.get('price', 'N/A')}")

        # Clean up - delete test product
        if created_product_id:
            self.run_test(
                "Delete Test Product",
                "DELETE",
                f"products/{created_product_id}",
                200
            )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting SalesGenius API Tests")
        print(f"   Base URL: {self.base_url}")
        print(f"   Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Run all test suites
        self.test_auth_endpoints()
        self.test_knowledge_endpoints()
        self.test_product_endpoints()  # Added product tests
        self.test_widget_endpoints() 
        self.test_analytics_endpoints()
        self.test_conversations_endpoints()
        self.test_leads_endpoints()
        self.test_pricing_endpoint()
        self.test_chat_endpoints()
        self.test_team_management_endpoints()
        self.test_admin_settings_endpoints()
        
        # Print final results
        print("\n" + "="*60)
        print("FINAL RESULTS")
        print("="*60)
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📊 Total Tests: {self.tests_run}")
        print(f"🎯 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Show failed tests
        failed_tests = [r for r in self.test_results if not r['passed']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['message']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = SalesGeniusAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())