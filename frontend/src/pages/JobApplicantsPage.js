import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { GraduationCap, ArrowLeft, Download, Users, Mail, Award, BookOpen, TrendingUp } from 'lucide-react';

const JobApplicantsPage = ({ onLogout }) => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/jobs/${jobId}/applicants`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setApplicants(response.data);
        
        // Fetch job title
        const jobsResponse = await axios.get(`${API}/jobs/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const job = jobsResponse.data.find(j => j.id === jobId);
        if (job) setJobTitle(`${job.title} at ${job.company}`);
      } catch (error) {
        toast.error('Failed to fetch applicants');
      } finally {
        setLoading(false);
      }
    };

    fetchApplicants();
  }, [jobId]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/jobs/${jobId}/applicants/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `applicants_${jobId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      toast.error('Failed to download file');
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="SRITW Placement Connect" className="w-8 h-8 rounded" />
            <span className="text-2xl font-bold text-gray-900">TPO <span className="text-indigo-600">Dashboard</span></span>
          </div>
          <Button data-testid="back-to-dashboard-btn" variant="ghost" onClick={() => navigate('/tpo/dashboard')} className="text-gray-700 hover:text-indigo-600">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Applicants</h1>
            <p className="text-gray-600">{jobTitle}</p>
            <p className="text-gray-500 mt-1">{applicants.length} total applicants</p>
          </div>
          <Button 
            data-testid="download-excel-btn"
            onClick={handleDownload}
            disabled={downloading || applicants.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" /> 
            {downloading ? 'Downloading...' : 'Download Excel'}
          </Button>
        </div>

        {/* Applicants List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading applicants...</p>
          </div>
        ) : applicants.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No applicants yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {applicants.map((applicant, index) => (
              <Card key={applicant.id || index} data-testid={`applicant-card-${index}`} className="hover:shadow-lg card-hover">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{applicant.profile?.fullName}</CardTitle>
                      <p className="text-gray-600 mt-1">Applied on {formatDate(applicant.appliedDate)}</p>
                    </div>
                    {applicant.profile?.resumeURL && (
                      <Button data-testid={`resume-btn-${index}`} variant="outline" onClick={() => window.open(applicant.profile.resumeURL, '_blank')} className="hover:bg-indigo-50 hover:text-indigo-600">
                        View Resume
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Roll Number</p>
                        <p data-testid={`roll-no-${index}`} className="font-semibold text-gray-900">{applicant.profile?.rollNo}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p data-testid={`email-${index}`} className="font-semibold text-gray-900 break-all">{applicant.profile?.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Award className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">GPA</p>
                        <p data-testid={`gpa-${index}`} className="font-semibold text-gray-900">{applicant.profile?.gpa} / 10</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Branch</p>
                        <p data-testid={`branch-${index}`} className="font-semibold text-gray-900">{applicant.profile?.branch}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Batch</p>
                        <p data-testid={`batch-${index}`} className="font-semibold text-gray-900">{applicant.profile?.batch}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 ${applicant.profile?.backlogsCount > 0 ? 'bg-red-100' : 'bg-green-100'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <span className={`text-sm font-bold ${applicant.profile?.backlogsCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {applicant.profile?.backlogsCount}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Backlogs</p>
                        <p data-testid={`backlogs-${index}`} className="font-semibold text-gray-900">{applicant.profile?.backlogsCount || 0}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobApplicantsPage;