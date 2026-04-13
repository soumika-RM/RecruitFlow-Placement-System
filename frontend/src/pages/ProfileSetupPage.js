import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { GraduationCap } from 'lucide-react';

const ProfileSetupPage = ({ onComplete }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    rollNo: '',
    email: '',
    gpa: '',
    branch: '',
    batch: '',
    backlogsCount: 0,
    resumeURL: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/auth/profile-setup`, {
        ...formData,
        gpa: parseFloat(formData.gpa),
        batch: parseInt(formData.batch),
        backlogsCount: parseInt(formData.backlogsCount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Profile setup complete!');
      onComplete();
      navigate('/student/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Profile setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src="/logo.jpg" alt="SRITW Placement Connect" className="w-10 h-10 rounded" />
            <span className="text-3xl font-bold text-gray-900">SRITW Placement Connect</span>
          </div>
          <p className="text-gray-600">Complete your student profile</p>
        </div>

        <Card data-testid="profile-setup-card" className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Student Profile Setup</CardTitle>
            <CardDescription>Please fill in your details to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form data-testid="profile-setup-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    data-testid="full-name-input"
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rollNo">Roll Number</Label>
                  <Input
                    data-testid="roll-no-input"
                    id="rollNo"
                    type="text"
                    placeholder="CS2024001"
                    value={formData.rollNo}
                    onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  data-testid="email-input"
                  id="email"
                  type="email"
                  placeholder="john@college.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-11"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gpa">GPA (0-10)</Label>
                  <Input
                    data-testid="gpa-input"
                    id="gpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="8.5"
                    value={formData.gpa}
                    onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Input
                    data-testid="branch-input"
                    id="branch"
                    type="text"
                    placeholder="Computer Science"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batch">Batch Year</Label>
                  <Input
                    data-testid="batch-input"
                    id="batch"
                    type="number"
                    min="2020"
                    max="2030"
                    placeholder="2024"
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backlogsCount">Backlogs Count</Label>
                  <Input
                    data-testid="backlogs-input"
                    id="backlogsCount"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.backlogsCount}
                    onChange={(e) => setFormData({ ...formData, backlogsCount: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resumeURL">Resume URL (Optional)</Label>
                <Input
                  data-testid="resume-url-input"
                  id="resumeURL"
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={formData.resumeURL}
                  onChange={(e) => setFormData({ ...formData, resumeURL: e.target.value })}
                  className="h-11"
                />
              </div>

              <Button data-testid="profile-submit-btn" type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={loading}>
                {loading ? 'Saving Profile...' : 'Complete Setup'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetupPage;