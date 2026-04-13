import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { GraduationCap, LogOut, Briefcase, Calendar, Building2, MapPin, Send, Sparkles, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const StudentDashboard = ({ onLogout }) => {
  const [jobs, setJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [roadmapDialog, setRoadmapDialog] = useState({ open: false, job: null });
  const [roadmap, setRoadmap] = useState('');
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/jobs/my-batch`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(response.data);
      
      // Track already applied jobs
      const applied = new Set();
      const userResponse = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userId = userResponse.data.id;
      
      response.data.forEach(job => {
        if (job.applicants?.some(app => app.studentId === userId)) {
          applied.add(job.id);
        }
      });
      setAppliedJobs(applied);
    } catch (error) {
      toast.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleApply = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/jobs/${jobId}/apply`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Successfully applied to job!');
      setAppliedJobs(prev => new Set([...prev, jobId]));
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to apply');
    }
  };

  const handleGenerateRoadmap = async () => {
    setRoadmapLoading(true);
    setRoadmap('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/ai/roadmap`, {
        companyName: roadmapDialog.job.company,
        jobRole: roadmapDialog.job.title
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoadmap(response.data.roadmap);
    } catch (error) {
      toast.error('Failed to generate roadmap');
    } finally {
      setRoadmapLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setChatLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/ai/chat`, {
        query: userMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      toast.error('Failed to get response');
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const openRoadmapDialog = (job) => {
    setRoadmapDialog({ open: true, job });
    setRoadmap('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="SRITW Placement Connect" className="w-8 h-8 rounded" />
            <span className="text-2xl font-bold text-gray-900">Student <span className="text-indigo-600">Dashboard</span></span>
          </div>
          <Button data-testid="logout-btn" variant="ghost" onClick={onLogout} className="text-gray-700 hover:text-red-600">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="jobs" className="w-full">
          <TabsList data-testid="dashboard-tabs" className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger data-testid="jobs-tab" value="jobs" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Jobs
            </TabsTrigger>
            <TabsTrigger data-testid="ai-advisor-tab" value="ai" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> AI Advisor
            </TabsTrigger>
          </TabsList>

          {/* Jobs Tab */}
          <TabsContent value="jobs">
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Available Opportunities</h1>
              <p className="text-gray-600">Jobs matching your batch eligibility</p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading jobs...</p>
              </div>
            ) : jobs.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No jobs available for your batch</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {jobs.map((job) => {
                  const isApplied = appliedJobs.has(job.id);
                  return (
                    <Card key={job.id} data-testid={`job-card-${job.id}`} className="hover:shadow-lg card-hover">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-2xl mb-2">{job.title}</CardTitle>
                            <CardDescription className="text-lg flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              {job.company}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              data-testid={`apply-btn-${job.id}`}
                              onClick={() => handleApply(job.id)}
                              disabled={isApplied}
                              className={isApplied ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}
                            >
                              {isApplied ? 'Applied' : 'Apply Now'}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-3 mb-4">
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {job.jobType}
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Apply by {formatDate(job.lastDateToApply)}
                          </span>
                        </div>
                        {job.description && <p className="text-gray-600 mb-4">{job.description}</p>}
                        {job.eligibilityCriteria && (
                          <div className="mb-4">
                            <span className="font-semibold text-gray-700">Eligibility: </span>
                            <span className="text-gray-600">{job.eligibilityCriteria}</span>
                          </div>
                        )}
                        <div className="flex gap-3">
                          {job.applicationLink && (
                            <Button data-testid={`external-link-btn-${job.id}`} variant="outline" onClick={() => window.open(job.applicationLink, '_blank')} className="hover:bg-blue-50 hover:text-blue-600">
                              External Link
                            </Button>
                          )}
                          <Button data-testid={`roadmap-btn-${job.id}`} variant="outline" onClick={() => openRoadmapDialog(job)} className="hover:bg-purple-50 hover:text-purple-600">
                            <Sparkles className="w-4 h-4 mr-2" /> AI Roadmap
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* AI Advisor Tab */}
          <TabsContent value="ai">
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Career Advisor</h1>
              <p className="text-gray-600">Get personalized career guidance and advice</p>
            </div>

            <Card data-testid="ai-chat-card" className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-indigo-600" />
                  Career Guidance Chat
                </CardTitle>
                <CardDescription>Ask me anything about career planning, interview prep, or job search</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Chat Messages */}
                  <div data-testid="chat-messages" className="h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50 space-y-4">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-gray-500 py-12">
                        <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p>Start a conversation! Ask me about career advice, interview tips, or job search strategies.</p>
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => (
                        <div key={idx} data-testid={`chat-message-${idx}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-lg px-4 py-3 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-900'}`}>
                            {msg.role === 'assistant' ? (
                              <div className="prose prose-sm max-w-none">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                            ) : (
                              <p>{msg.content}</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                          <p className="text-gray-600">Thinking...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="flex gap-2">
                    <Textarea
                      data-testid="chat-input"
                      placeholder="Ask your career question..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendChat();
                        }
                      }}
                      rows={3}
                      disabled={chatLoading}
                      className="flex-1"
                    />
                    <Button data-testid="send-chat-btn" onClick={handleSendChat} disabled={chatLoading || !chatInput.trim()} className="bg-indigo-600 hover:bg-indigo-700 h-auto">
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Roadmap Dialog */}
      <Dialog open={roadmapDialog.open} onOpenChange={(open) => setRoadmapDialog({ open, job: roadmapDialog.job })}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              AI Preparation Roadmap
            </DialogTitle>
            <DialogDescription>
              {roadmapDialog.job?.title} at {roadmapDialog.job?.company}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!roadmap && !roadmapLoading && (
              <div className="text-center py-8">
                <Button data-testid="generate-roadmap-btn" onClick={handleGenerateRoadmap} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Sparkles className="w-4 h-4 mr-2" /> Generate Roadmap
                </Button>
              </div>
            )}
            {roadmapLoading && (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-600">Generating your personalized roadmap...</p>
              </div>
            )}
            {roadmap && (
              <div data-testid="roadmap-content" className="prose prose-sm max-w-none bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6">
                <ReactMarkdown>{roadmap.replace(/\n/g, '  \n')}</ReactMarkdown>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentDashboard;