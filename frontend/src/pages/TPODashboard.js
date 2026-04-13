import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { GraduationCap, Plus, Edit, Trash2, Users, LogOut, Briefcase, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TPODashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    jobType: 'On-Campus',
    batchEligibility: '',
    description: '',
    eligibilityCriteria: '',
    applicationLink: '',
    lastDateToApply: ''
  });

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/jobs/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(response.data);
    } catch (error) {
      toast.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/jobs`, {
        ...formData,
        batchEligibility: parseInt(formData.batchEligibility),
        lastDateToApply: new Date(formData.lastDateToApply).toISOString()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Job created successfully');
      setCreateDialogOpen(false);
      resetForm();
      fetchJobs();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create job');
    }
  };

  const handleUpdateJob = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const updateData = {};
      if (formData.title) updateData.title = formData.title;
      if (formData.company) updateData.company = formData.company;
      if (formData.jobType) updateData.jobType = formData.jobType;
      if (formData.batchEligibility) updateData.batchEligibility = parseInt(formData.batchEligibility);
      if (formData.description) updateData.description = formData.description;
      if (formData.eligibilityCriteria) updateData.eligibilityCriteria = formData.eligibilityCriteria;
      if (formData.applicationLink) updateData.applicationLink = formData.applicationLink;
      if (formData.lastDateToApply) updateData.lastDateToApply = new Date(formData.lastDateToApply).toISOString();

      await axios.put(`${API}/jobs/${selectedJob.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Job updated successfully');
      setEditDialogOpen(false);
      resetForm();
      setSelectedJob(null);
      fetchJobs();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update job');
    }
  };

  const handleDeleteJob = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/jobs/${selectedJob.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Job deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedJob(null);
      fetchJobs();
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  const openEditDialog = (job) => {
    setSelectedJob(job);
    setFormData({
      title: job.title,
      company: job.company,
      jobType: job.jobType,
      batchEligibility: job.batchEligibility.toString(),
      description: job.description || '',
      eligibilityCriteria: job.eligibilityCriteria || '',
      applicationLink: job.applicationLink || '',
      lastDateToApply: new Date(job.lastDateToApply).toISOString().split('T')[0]
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (job) => {
    setSelectedJob(job);
    setDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      company: '',
      jobType: 'On-Campus',
      batchEligibility: '',
      description: '',
      eligibilityCriteria: '',
      applicationLink: '',
      lastDateToApply: ''
    });
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
          <Button data-testid="logout-btn" variant="ghost" onClick={onLogout} className="text-gray-700 hover:text-red-600">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Job Postings</h1>
            <p className="text-gray-600">Manage campus placement opportunities</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="create-job-btn" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="w-4 h-4 mr-2" /> Create Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Job</DialogTitle>
                <DialogDescription>Post a new job opportunity for students</DialogDescription>
              </DialogHeader>
              <form data-testid="create-job-form" onSubmit={handleCreateJob} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-title">Job Title</Label>
                    <Input data-testid="create-title-input" id="create-title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-company">Company</Label>
                    <Input data-testid="create-company-input" id="create-company" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} required />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-jobType">Job Type</Label>
                    <Select data-testid="create-jobtype-select" value={formData.jobType} onValueChange={(value) => setFormData({ ...formData, jobType: value })}>
                      <SelectTrigger data-testid="create-jobtype-trigger"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem data-testid="jobtype-oncampus" value="On-Campus">On-Campus</SelectItem>
                        <SelectItem data-testid="jobtype-offcampus" value="Off-Campus">Off-Campus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-batch">Batch Eligibility</Label>
                    <Input data-testid="create-batch-input" id="create-batch" type="number" value={formData.batchEligibility} onChange={(e) => setFormData({ ...formData, batchEligibility: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-description">Description</Label>
                  <Textarea data-testid="create-description-textarea" id="create-description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-eligibility">Eligibility Criteria</Label>
                  <Textarea data-testid="create-eligibility-textarea" id="create-eligibility" value={formData.eligibilityCriteria} onChange={(e) => setFormData({ ...formData, eligibilityCriteria: e.target.value })} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-link">Application Link</Label>
                  <Input data-testid="create-link-input" id="create-link" type="url" value={formData.applicationLink} onChange={(e) => setFormData({ ...formData, applicationLink: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-date">Last Date to Apply</Label>
                  <Input data-testid="create-date-input" id="create-date" type="date" value={formData.lastDateToApply} onChange={(e) => setFormData({ ...formData, lastDateToApply: e.target.value })} required />
                </div>
                <DialogFooter>
                  <Button data-testid="create-job-submit-btn" type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Create Job</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No jobs posted yet</p>
              <Button data-testid="create-first-job-btn" onClick={() => setCreateDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Create Your First Job
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {jobs.map((job) => (
              <Card key={job.id} data-testid={`job-card-${job.id}`} className="hover:shadow-lg card-hover">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{job.title}</CardTitle>
                      <CardDescription className="text-lg">{job.company}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button data-testid={`edit-job-btn-${job.id}`} variant="outline" size="sm" onClick={() => openEditDialog(job)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button data-testid={`delete-job-btn-${job.id}`} variant="outline" size="sm" onClick={() => openDeleteDialog(job)} className="hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">{job.jobType}</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Batch {job.batchEligibility}</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {formatDate(job.lastDateToApply)}
                    </span>
                    <span data-testid={`applicants-count-${job.id}`} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                      <Users className="w-3 h-3" /> {job.applicants?.length || 0} Applicants
                    </span>
                  </div>
                  {job.description && <p className="text-gray-600 mb-4">{job.description}</p>}
                  {job.eligibilityCriteria && (
                    <div className="mb-4">
                      <span className="font-semibold text-gray-700">Eligibility: </span>
                      <span className="text-gray-600">{job.eligibilityCriteria}</span>
                    </div>
                  )}
                  <Button data-testid={`view-applicants-btn-${job.id}`} onClick={() => navigate(`/tpo/jobs/${job.id}/applicants`)} variant="outline" className="hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200">
                    <Users className="w-4 h-4 mr-2" /> View Applicants
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Job</DialogTitle>
            <DialogDescription>Update job details</DialogDescription>
          </DialogHeader>
          <form data-testid="edit-job-form" onSubmit={handleUpdateJob} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Job Title</Label>
                <Input data-testid="edit-title-input" id="edit-title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-company">Company</Label>
                <Input data-testid="edit-company-input" id="edit-company" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-jobType">Job Type</Label>
                <Select data-testid="edit-jobtype-select" value={formData.jobType} onValueChange={(value) => setFormData({ ...formData, jobType: value })}>
                  <SelectTrigger data-testid="edit-jobtype-trigger"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="On-Campus">On-Campus</SelectItem>
                    <SelectItem value="Off-Campus">Off-Campus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-batch">Batch Eligibility</Label>
                <Input data-testid="edit-batch-input" id="edit-batch" type="number" value={formData.batchEligibility} onChange={(e) => setFormData({ ...formData, batchEligibility: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea data-testid="edit-description-textarea" id="edit-description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-eligibility">Eligibility Criteria</Label>
              <Textarea data-testid="edit-eligibility-textarea" id="edit-eligibility" value={formData.eligibilityCriteria} onChange={(e) => setFormData({ ...formData, eligibilityCriteria: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-link">Application Link</Label>
              <Input data-testid="edit-link-input" id="edit-link" type="url" value={formData.applicationLink} onChange={(e) => setFormData({ ...formData, applicationLink: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-date">Last Date to Apply</Label>
              <Input data-testid="edit-date-input" id="edit-date" type="date" value={formData.lastDateToApply} onChange={(e) => setFormData({ ...formData, lastDateToApply: e.target.value })} />
            </div>
            <DialogFooter>
              <Button data-testid="edit-job-submit-btn" type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Update Job</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job</DialogTitle>
            <DialogDescription>Are you sure you want to delete this job posting? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button data-testid="cancel-delete-btn" variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button data-testid="confirm-delete-btn" variant="destructive" onClick={handleDeleteJob}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TPODashboard;