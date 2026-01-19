#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class DefensePMTester:
    def __init__(self, base_url="https://defense-project-mgr.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.user_id = None

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED: {details}")
            self.failed_tests.append({"test": test_name, "error": details})

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            return success, response.json() if response.content else {}, response.status_code
        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}, 0
        except json.JSONDecodeError:
            return False, {"error": "Invalid JSON response"}, response.status_code

    def test_health_check(self):
        """Test health endpoint"""
        success, response, status = self.make_request('GET', 'health')
        self.log_result("Health Check", success and response.get('status') == 'healthy')
        return success

    def test_seed_data(self):
        """Test seeding demo data"""
        success, response, status = self.make_request('POST', 'seed', expected_status=200)
        self.log_result("Seed Demo Data", success and 'message' in response)
        return success

    def test_login(self):
        """Test login with demo credentials"""
        login_data = {
            "email": "admin@defense.gov",
            "password": "admin123"
        }
        success, response, status = self.make_request('POST', 'auth/login', login_data)
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            self.log_result("Demo Login", True)
            return True
        else:
            self.log_result("Demo Login", False, f"Status: {status}, Response: {response}")
            return False

    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        success, response, status = self.make_request('GET', 'dashboard/stats')
        
        if success and 'counts' in response:
            counts = response['counts']
            has_data = (counts.get('programs', 0) > 0 and 
                       counts.get('projects', 0) > 0 and 
                       counts.get('tasks', 0) > 0)
            self.log_result("Dashboard Stats", has_data, 
                          f"Programs: {counts.get('programs')}, Projects: {counts.get('projects')}, Tasks: {counts.get('tasks')}")
            return has_data
        else:
            self.log_result("Dashboard Stats", False, f"Status: {status}")
            return False

    def test_programs_crud(self):
        """Test programs CRUD operations"""
        # Get programs
        success, programs, status = self.make_request('GET', 'programs')
        if not success:
            self.log_result("Get Programs", False, f"Status: {status}")
            return False
        
        self.log_result("Get Programs", len(programs) > 0, f"Found {len(programs)} programs")
        
        if len(programs) > 0:
            # Get specific program
            program_id = programs[0]['id']
            success, program, status = self.make_request('GET', f'programs/{program_id}')
            self.log_result("Get Single Program", success and 'name' in program)
            return success
        return True

    def test_projects_crud(self):
        """Test projects CRUD operations"""
        # Get projects
        success, projects, status = self.make_request('GET', 'projects')
        if not success:
            self.log_result("Get Projects", False, f"Status: {status}")
            return False
        
        self.log_result("Get Projects", len(projects) > 0, f"Found {len(projects)} projects")
        
        if len(projects) > 0:
            # Get specific project
            project_id = projects[0]['id']
            success, project, status = self.make_request('GET', f'projects/{project_id}')
            self.log_result("Get Single Project", success and 'name' in project)
            
            # Test project creation
            new_project = {
                "program_id": projects[0]['program_id'],
                "name": "Test Project API",
                "code": "TEST-001",
                "description": "API test project",
                "template": "IT",
                "start_date": "2024-01-01",
                "end_date": "2024-12-31",
                "budget_allocated": 1000000
            }
            success, created, status = self.make_request('POST', 'projects', new_project, 200)
            self.log_result("Create Project", success and 'id' in created, f"Status: {status}, Response: {created}")
            
            if success and 'id' in created:
                # Test project update
                update_data = {"name": "Updated Test Project"}
                success, updated, status = self.make_request('PUT', f'projects/{created["id"]}', update_data)
                self.log_result("Update Project", success and updated.get('name') == "Updated Test Project")
                
                # Test project deletion
                success, deleted, status = self.make_request('DELETE', f'projects/{created["id"]}', expected_status=200)
                self.log_result("Delete Project", success)
            
            return True
        return True

    def test_tasks_crud(self):
        """Test tasks CRUD operations"""
        # Get tasks
        success, tasks, status = self.make_request('GET', 'tasks')
        if not success:
            self.log_result("Get Tasks", False, f"Status: {status}")
            return False
        
        self.log_result("Get Tasks", len(tasks) > 0, f"Found {len(tasks)} tasks")
        
        if len(tasks) > 0:
            # Get specific task
            task_id = tasks[0]['id']
            success, task, status = self.make_request('GET', f'tasks/{task_id}')
            self.log_result("Get Single Task", success and 'name' in task)
            return success
        return True

    def test_resources(self):
        """Test resources endpoint"""
        success, resources, status = self.make_request('GET', 'resources')
        self.log_result("Get Resources", success and len(resources) > 0, f"Found {len(resources)} resources")
        return success

    def test_budget(self):
        """Test budget endpoint"""
        success, budget, status = self.make_request('GET', 'budget')
        self.log_result("Get Budget", success, f"Status: {status}")
        return success

    def test_risks_crud(self):
        """Test risks CRUD operations"""
        # Get risks
        success, risks, status = self.make_request('GET', 'risks')
        if not success:
            self.log_result("Get Risks", False, f"Status: {status}")
            return False
        
        self.log_result("Get Risks", len(risks) > 0, f"Found {len(risks)} risks")
        
        # Test risk creation
        if len(risks) > 0:
            new_risk = {
                "project_id": risks[0]['project_id'],
                "title": "Test API Risk",
                "description": "API testing risk",
                "category": "Technical",
                "probability": 3,
                "impact": 3,
                "mitigation_plan": "Test mitigation"
            }
            success, created, status = self.make_request('POST', 'risks', new_risk, 200)
            self.log_result("Create Risk", success and 'id' in created, f"Status: {status}, Response: {created}")
            return success
        return True

    def test_vendors(self):
        """Test vendors endpoint"""
        success, vendors, status = self.make_request('GET', 'vendors')
        self.log_result("Get Vendors", success and len(vendors) > 0, f"Found {len(vendors)} vendors")
        return success

    def test_approvals(self):
        """Test approvals endpoint"""
        success, approvals, status = self.make_request('GET', 'approvals')
        self.log_result("Get Approvals", success, f"Status: {status}")
        return success

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Defense PM System Backend Tests")
        print("=" * 50)
        
        # Core system tests
        if not self.test_health_check():
            print("❌ Health check failed - stopping tests")
            return False
        
        if not self.test_seed_data():
            print("⚠️  Seed data failed - continuing with existing data")
        
        if not self.test_login():
            print("❌ Login failed - cannot continue with authenticated tests")
            return False
        
        # Data access tests
        self.test_dashboard_stats()
        self.test_programs_crud()
        self.test_projects_crud()
        self.test_tasks_crud()
        self.test_resources()
        self.test_budget()
        self.test_risks_crud()
        self.test_vendors()
        self.test_approvals()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"  - {failure['test']}: {failure['error']}")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"✅ Success Rate: {success_rate:.1f}%")
        
        return success_rate >= 80

def main():
    tester = DefensePMTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())