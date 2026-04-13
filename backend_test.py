import requests
import sys
import json
from datetime import datetime, timedelta
import time

class CollegePlacementAPITester:
    def __init__(self, base_url="https://campus-careers-5.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tpo_token = None
        self.student_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_job_id = None
        self.student_user_id = None

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "status": "PASSED" if success else "FAILED",
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for file uploads
                    default_headers.pop('Content-Type', None)
                    response = requests.post(url, data=data, files=files, headers=default_headers)
                else:
                    response = requests.post(url, json=data, headers=default_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                try:
                    error_data = response.json()
                    details += f", Response: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                return False, details

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, str(e)

    def test_tpo_registration(self):
        """Test TPO user registration"""
        test_data = {
            "username": "tpo_test1",
            "password": "test123456",
            "role": "TPO"
        }
        
        success, response = self.run_test(
            "TPO Registration",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        
        if success and isinstance(response, dict) and 'token' in response:
            self.tpo_token = response['token']
            return True
        return False

    def test_student_registration(self):
        """Test Student user registration"""
        test_data = {
            "username": "student_test1",
            "password": "test123456",
            "role": "Student"
        }
        
        success, response = self.run_test(
            "Student Registration",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        
        if success and isinstance(response, dict) and 'token' in response:
            self.student_token = response['token']
            return True
        return False

    def test_tpo_login(self):
        """Test TPO login"""
        test_data = {
            "username": "tpo_test1",
            "password": "test123456"
        }
        
        success, response = self.run_test(
            "TPO Login",
            "POST",
            "auth/login",
            200,
            data=test_data
        )
        
        if success and isinstance(response, dict) and 'token' in response:
            self.tpo_token = response['token']
            return True
        return False

    def test_student_login(self):
        """Test Student login"""
        test_data = {
            "username": "student_test1",
            "password": "test123456"
        }
        
        success, response = self.run_test(
            "Student Login",
            "POST",
            "auth/login",
            200,
            data=test_data
        )
        
        if success and isinstance(response, dict) and 'token' in response:
            self.student_token = response['token']
            return True
        return False

    def test_student_profile_setup(self):
        """Test student profile setup"""
        if not self.student_token:
            self.log_test("Student Profile Setup", False, "No student token available")
            return False

        profile_data = {
            "fullName": "Test Student",
            "rollNo": "CS2024001",
            "email": "test.student@college.edu",
            "gpa": 8.5,
            "branch": "Computer Science",
            "batch": 2024,
            "backlogsCount": 0,
            "resumeURL": "https://example.com/resume.pdf"
        }
        
        headers = {"Authorization": f"Bearer {self.student_token}"}
        
        success, response = self.run_test(
            "Student Profile Setup",
            "POST",
            "auth/profile-setup",
            200,
            data=profile_data,
            headers=headers
        )
        
        return success

    def test_get_current_user(self):
        """Test get current user endpoint"""
        if not self.student_token:
            self.log_test("Get Current User", False, "No student token available")
            return False

        headers = {"Authorization": f"Bearer {self.student_token}"}
        
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200,
            headers=headers
        )
        
        if success and isinstance(response, dict) and 'id' in response:
            self.student_user_id = response['id']
            return True
        return False

    def test_create_job(self):
        """Test job creation by TPO"""
        if not self.tpo_token:
            self.log_test("Create Job", False, "No TPO token available")
            return False

        job_data = {
            "title": "Software Engineer",
            "company": "Tech Corp",
            "jobType": "On-Campus",
            "batchEligibility": 2024,
            "description": "Exciting software engineering role",
            "eligibilityCriteria": "GPA > 7.0",
            "applicationLink": "https://techcorp.com/apply",
            "lastDateToApply": (datetime.now() + timedelta(days=30)).isoformat()
        }
        
        headers = {"Authorization": f"Bearer {self.tpo_token}"}
        
        success, response = self.run_test(
            "Create Job",
            "POST",
            "jobs",
            200,
            data=job_data,
            headers=headers
        )
        
        if success and isinstance(response, dict) and 'id' in response:
            self.created_job_id = response['id']
            return True
        return False

    def test_get_all_jobs_tpo(self):
        """Test getting all jobs for TPO"""
        if not self.tpo_token:
            self.log_test("Get All Jobs (TPO)", False, "No TPO token available")
            return False

        headers = {"Authorization": f"Bearer {self.tpo_token}"}
        
        success, response = self.run_test(
            "Get All Jobs (TPO)",
            "GET",
            "jobs/all",
            200,
            headers=headers
        )
        
        return success

    def test_update_job(self):
        """Test job update by TPO"""
        if not self.tpo_token or not self.created_job_id:
            self.log_test("Update Job", False, "No TPO token or job ID available")
            return False

        update_data = {
            "title": "Senior Software Engineer",
            "description": "Updated job description"
        }
        
        headers = {"Authorization": f"Bearer {self.tpo_token}"}
        
        success, response = self.run_test(
            "Update Job",
            "PUT",
            f"jobs/{self.created_job_id}",
            200,
            data=update_data,
            headers=headers
        )
        
        return success

    def test_get_student_jobs(self):
        """Test getting jobs for student batch"""
        if not self.student_token:
            self.log_test("Get Student Jobs", False, "No student token available")
            return False

        headers = {"Authorization": f"Bearer {self.student_token}"}
        
        success, response = self.run_test(
            "Get Student Jobs",
            "GET",
            "jobs/my-batch",
            200,
            headers=headers
        )
        
        return success

    def test_apply_to_job(self):
        """Test student applying to job"""
        if not self.student_token or not self.created_job_id:
            self.log_test("Apply to Job", False, "No student token or job ID available")
            return False

        headers = {"Authorization": f"Bearer {self.student_token}"}
        
        success, response = self.run_test(
            "Apply to Job",
            "POST",
            f"jobs/{self.created_job_id}/apply",
            200,
            headers=headers
        )
        
        return success

    def test_duplicate_application(self):
        """Test preventing duplicate job application"""
        if not self.student_token or not self.created_job_id:
            self.log_test("Prevent Duplicate Application", False, "No student token or job ID available")
            return False

        headers = {"Authorization": f"Bearer {self.student_token}"}
        
        success, response = self.run_test(
            "Prevent Duplicate Application",
            "POST",
            f"jobs/{self.created_job_id}/apply",
            400,  # Should fail with 400
            headers=headers
        )
        
        return success

    def test_get_job_applicants(self):
        """Test getting job applicants for TPO"""
        if not self.tpo_token or not self.created_job_id:
            self.log_test("Get Job Applicants", False, "No TPO token or job ID available")
            return False

        headers = {"Authorization": f"Bearer {self.tpo_token}"}
        
        success, response = self.run_test(
            "Get Job Applicants",
            "GET",
            f"jobs/{self.created_job_id}/applicants",
            200,
            headers=headers
        )
        
        return success

    def test_download_applicants_excel(self):
        """Test downloading applicants as Excel"""
        if not self.tpo_token or not self.created_job_id:
            self.log_test("Download Applicants Excel", False, "No TPO token or job ID available")
            return False

        headers = {"Authorization": f"Bearer {self.tpo_token}"}
        
        try:
            url = f"{self.api_url}/jobs/{self.created_job_id}/applicants/download"
            response = requests.get(url, headers=headers)
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                # Check if response is Excel file
                content_type = response.headers.get('content-type', '')
                if 'spreadsheet' in content_type or 'excel' in content_type:
                    details += ", Excel file received"
                else:
                    details += f", Content-Type: {content_type}"
            
            self.log_test("Download Applicants Excel", success, details)
            return success
            
        except Exception as e:
            self.log_test("Download Applicants Excel", False, f"Exception: {str(e)}")
            return False

    def test_ai_roadmap_generation(self):
        """Test AI roadmap generation"""
        if not self.student_token:
            self.log_test("AI Roadmap Generation", False, "No student token available")
            return False

        roadmap_data = {
            "companyName": "Tech Corp",
            "jobRole": "Software Engineer"
        }
        
        headers = {"Authorization": f"Bearer {self.student_token}"}
        
        success, response = self.run_test(
            "AI Roadmap Generation",
            "POST",
            "ai/roadmap",
            200,
            data=roadmap_data,
            headers=headers
        )
        
        return success

    def test_ai_chat(self):
        """Test AI career advisor chat"""
        if not self.student_token:
            self.log_test("AI Career Chat", False, "No student token available")
            return False

        chat_data = {
            "query": "What skills should I focus on for a software engineering career?"
        }
        
        headers = {"Authorization": f"Bearer {self.student_token}"}
        
        success, response = self.run_test(
            "AI Career Chat",
            "POST",
            "ai/chat",
            200,
            data=chat_data,
            headers=headers
        )
        
        return success

    def test_delete_job(self):
        """Test job deletion by TPO"""
        if not self.tpo_token or not self.created_job_id:
            self.log_test("Delete Job", False, "No TPO token or job ID available")
            return False

        headers = {"Authorization": f"Bearer {self.tpo_token}"}
        
        success, response = self.run_test(
            "Delete Job",
            "DELETE",
            f"jobs/{self.created_job_id}",
            200,
            headers=headers
        )
        
        return success

    def test_role_based_access_control(self):
        """Test role-based access control"""
        if not self.student_token or not self.tpo_token:
            self.log_test("Role-Based Access Control", False, "Missing tokens")
            return False

        # Test student trying to access TPO endpoint
        headers = {"Authorization": f"Bearer {self.student_token}"}
        
        success, response = self.run_test(
            "Student Access to TPO Endpoint (Should Fail)",
            "GET",
            "jobs/all",
            403,  # Should fail with 403
            headers=headers
        )
        
        return success

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting College Placement Portal API Tests")
        print("=" * 60)
        
        # Authentication Tests
        print("\n📝 Authentication Tests")
        self.test_tpo_registration()
        self.test_student_registration()
        self.test_tpo_login()
        self.test_student_login()
        
        # Profile Tests
        print("\n👤 Profile Tests")
        self.test_student_profile_setup()
        self.test_get_current_user()
        
        # Job Management Tests (TPO)
        print("\n💼 Job Management Tests")
        self.test_create_job()
        self.test_get_all_jobs_tpo()
        self.test_update_job()
        
        # Student Job Tests
        print("\n🎓 Student Job Tests")
        self.test_get_student_jobs()
        self.test_apply_to_job()
        self.test_duplicate_application()
        
        # Applicant Management Tests
        print("\n📊 Applicant Management Tests")
        self.test_get_job_applicants()
        self.test_download_applicants_excel()
        
        # AI Features Tests
        print("\n🤖 AI Features Tests")
        self.test_ai_roadmap_generation()
        self.test_ai_chat()
        
        # Security Tests
        print("\n🔒 Security Tests")
        self.test_role_based_access_control()
        
        # Cleanup
        print("\n🧹 Cleanup Tests")
        self.test_delete_job()
        
        # Print Results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("❌ Some tests failed!")
            print("\nFailed Tests:")
            for result in self.test_results:
                if result["status"] == "FAILED":
                    print(f"  - {result['test']}: {result['details']}")
            return 1

def main():
    tester = CollegePlacementAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())