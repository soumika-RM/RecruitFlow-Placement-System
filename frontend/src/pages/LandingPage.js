import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap, Briefcase, TrendingUp, ChevronRight, Users, Building2 } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="SRITW Placement Connect" className="w-8 h-8 rounded-lg" />
            <span className="text-2xl font-bold text-gray-900">SRITW <span className="text-indigo-600">Placement Connect</span></span>
          </div>
          <div className="flex gap-3">
            <Button data-testid="nav-login-btn" variant="ghost" onClick={() => navigate('/login')} className="text-gray-700 hover:text-indigo-600">
              Login
            </Button>
            <Button data-testid="nav-register-btn" onClick={() => navigate('/register')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <div className="inline-block">
              <span className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium">
                Trusted by 500+ Colleges
              </span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Bridge The Gap Between
              <span className="text-indigo-600"> Campus & Career</span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Comprehensive placement management platform designed to connect students with their dream careers. 
              Manage placements, track applications, and prepare for interviews—all in one place.
            </p>
            <div className="flex gap-4">
              <Button data-testid="hero-get-started-btn" onClick={() => navigate('/register')} size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg">
                Get Started <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <Button data-testid="hero-learn-more-btn" variant="outline" size="lg" className="border-2 border-gray-300 px-8 py-6 text-lg hover:border-indigo-600 hover:text-indigo-600">
                Learn More
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-3xl blur-3xl opacity-20"></div>
            <img 
              src="https://images.unsplash.com/photo-1521656958087-ed26dfcf5a30?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHxncmFkdWF0aW9uJTIwc3VjY2Vzc3xlbnwwfHx8fDE3NjA2OTE2OTN8MA&ixlib=rb-4.1.0&q=85" 
              alt="Graduate success" 
              className="relative rounded-3xl shadow-2xl w-full h-[500px] object-cover"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need For Success</h2>
            <p className="text-lg text-gray-600">Powerful tools for students and placement officers</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-100 card-hover">
              <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <Briefcase className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Job Management</h3>
              <p className="text-gray-600 leading-relaxed">Post opportunities, track applications, and manage the entire placement cycle efficiently.</p>
            </div>
            <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 card-hover">
              <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Student Portal</h3>
              <p className="text-gray-600 leading-relaxed">Discover jobs, apply seamlessly, and get AI-powered preparation roadmaps.</p>
            </div>
            <div className="p-8 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 card-hover">
              <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">AI Career Advisor</h3>
              <p className="text-gray-600 leading-relaxed">Get personalized roadmaps and career guidance powered by advanced AI.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">500+</div>
              <div className="text-indigo-100 text-lg">Partner Colleges</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">50K+</div>
              <div className="text-indigo-100 text-lg">Students Placed</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">1000+</div>
              <div className="text-indigo-100 text-lg">Recruiting Companies</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl p-12 border border-indigo-100">
            <Building2 className="w-16 h-16 text-indigo-600 mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready to Transform Your Campus Placements?</h2>
            <p className="text-lg text-gray-600 mb-8">Join thousands of colleges already using SRITW Placement Connect</p>
            <Button data-testid="cta-register-btn" onClick={() => navigate('/register')} size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-6 text-lg">
              Start Free Today <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/logo.jpg" alt="SRITW Placement Connect" className="w-6 h-6 rounded" />
            <span className="text-xl font-bold text-white">SRITW Placement Connect</span>
          </div>
          <p>© 2025 SRITW Placement Connect. Empowering students to achieve their career goals.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;