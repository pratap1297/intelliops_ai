import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../lib/auth-service';
import {
  Server,
  Shield,
  Zap,
  Cloud,
  Terminal,
  AlertCircle,
  RefreshCw,
  Search,
  CheckCircle,
  ArrowRight,
  MessageSquare,
  Users,
  FileText,
  BarChart3,
  DollarSign
} from 'lucide-react';
import { UserProfileDropdown } from '../components/UserProfileDropdown';

// Helper Components defined BEFORE LandingPage uses them

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
      <span className="text-gray-700">{text}</span>
    </div>
  );
}

function Step({ number, title, description, icon: Icon }: {
  number: string;
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="text-center relative z-10 bg-white p-6 rounded-lg shadow-sm">
      <div className="relative mb-4 inline-block">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <Icon className="w-8 h-8 text-blue-600" />
        </div>
        <span className="absolute -top-2 -right-2 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
          {number}
        </span>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function TeamIntegrationCard({ icon: Icon, bgColor, iconColor, title, features }: {
  icon: React.ElementType;
  bgColor: string;
  iconColor: string;
  title: string;
  features: { icon: React.ElementType; text: string }[];
}) {
  return (
    <div className={`p-6 rounded-lg border ${bgColor.replace('bg-', 'border-').replace('-100', '-200')} ${bgColor}`}>
      <div className={`w-10 h-10 ${bgColor.replace('100', '200')} rounded-lg flex items-center justify-center mb-4`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}</h3>
      <div className="space-y-2">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-2">
            <feature.icon className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1" />
            <span className="text-sm text-gray-600">{feature.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BenefitCard({ icon: Icon, title, description }: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}

export function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status from authService
    const isAuth = authService.isAuthenticated();
    console.log('LandingPage - Auth status from authService:', isAuth);
    setIsAuthenticated(isAuth);
    
    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthStateChange((user) => {
      setIsAuthenticated(!!user);
      console.log('LandingPage - Auth state changed:', !!user);
    });
    
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Cloud className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                AI Force IntelliOps
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                // Show UserProfileDropdown if authenticated
                <UserProfileDropdown />
              ) : (
                // Show Login/Get Started if not authenticated
                <>
                  <Link to="/login" className="text-gray-600 hover:text-gray-900">Login</Link>
                  <Link
                    to="/register"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-24 pb-16 px-4 sm:pt-32">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 tracking-tight">
            Welcome to <span className="text-blue-600">AI Force IntelliOps</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Intelligent Operations Platform powered by AI for your entire hybrid cloud infrastructure.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              // If logged in, show link to the app
              <Link
                to="/chat" // Link to the main chat interface
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
              >
                Go to App
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            ) : (
              // If not logged in, show Watch Demo button that links to app after login
              <Link
                to="/login?redirect=/chat" // Redirect to chat after login
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
              >
                Watch Demo
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            )}
            <a
              href="#footer"
              className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-200 transition-colors inline-flex items-center justify-center"
            >
              Contact Us
              <ArrowRight className="ml-2 w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      {/* Comprehensive Cloud Management */}
      <div id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">
              Comprehensive Cloud Management
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Manage your AWS, Azure, GCP, and On-Premises infrastructure efficiently from a single platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Smart Provisioning */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-100">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
                <Server className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Smart Provisioning
              </h3>
              <div className="space-y-3">
                <Feature text="On-click AWS Cloud resource deployment" />
                <Feature text="Automated resource configuration" />
                <Feature text="Infrastructure as code generation" />
                <Feature text="Multi-region deployment support" />
                <Feature text="FinOps: Cloud cost optimization suggestions" />
              </div>
            </div>

            {/* Intelligent Patching */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl border border-green-100">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-6">
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Intelligent Patching
              </h3>
              <div className="space-y-3">
                <Feature text="Automated security updates" />
                <Feature text="Scheduled maintenance windows" />
                <Feature text="Compliance reporting integration" />
                <Feature text="Zero-downtime patching options" />
                <Feature text="Vulnerability assessment links" />
              </div>
            </div>

            {/* Auto-Healing System */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl border border-purple-100">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Auto-Healing System
              </h3>
              <div className="space-y-3">
                <Feature text="Real-time log monitoring & analysis" />
                <Feature text="Automatic issue detection and alerts" />
                <Feature text="Self-healing procedures execution" />
                <Feature text="Incident response automation" />
                <Feature text="Security threat detection display" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Microsoft Teams Integration Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">
              Microsoft Teams Integration
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Seamless collaboration and automated workflows through Microsoft Teams integration
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TeamIntegrationCard
              icon={AlertCircle}
              bgColor="bg-blue-100"
              iconColor="text-blue-600"
              title="Real-time Monitoring & Alerts"
              features={[
                { icon: Zap, text: "Instant Notifications: Get notified about healing actions and provisioning status" },
                { icon: RefreshCw, text: "Patching Updates: Real-time updates on patching progress and completion" }
              ]}
            />
            <TeamIntegrationCard
              icon={FileText}
              bgColor="bg-indigo-100"
              iconColor="text-indigo-600"
              title="Single Source of Truth"
              features={[
                { icon: Server, text: "Stack Documentation: Share stack documents and architecture diagrams directly" },
                { icon: Terminal, text: "Provisioning Logs: Access and share provisioning logs in real-time" }
              ]}
            />
            <TeamIntegrationCard
              icon={Users}
              bgColor="bg-purple-100"
              iconColor="text-purple-600"
              title="Enhanced Collaboration"
              features={[
                { icon: CheckCircle, text: "Quick Approvals: Faster decision-making with automated workflows" },
                { icon: BarChart3, text: "Process Visibility: End-to-end visibility of automation workflow" }
              ]}
            />
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">
              How It Works
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Simplify your cloud operations in three easy steps
            </p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 transform -translate-y-1/2"></div>
            <div className="hidden md:flex justify-between items-center w-full absolute top-1/2 transform -translate-y-1/2 px-16 lg:px-24">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="w-3 h-3 bg-blue-600 rounded-full z-10"></div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              <Step
                number="1"
                title="Connect"
                description="Connect your cloud infrastructure with our secure integration. Supports AWS, Azure, GCP, and On-Prem."
                icon={Cloud}
              />
              <Step
                number="2"
                title="Monitor"
                description="Our AI continuously monitors your systems for optimization opportunities, security threats, and compliance status."
                icon={Search}
              />
              <Step
                number="3"
                title="Automate"
                description="Let our platform handle routine tasks like provisioning, patching, incident response, and reporting."
                icon={Zap}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Key Benefits Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Key Benefits</h2>
            <p className="mt-4 text-xl text-gray-600">
              Transform your cloud operations with intelligent automation
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <BenefitCard
              icon={Server}
              title="Faster AWS Resource Provisioning"
              description="Smart Stack Provisioning with automated workflows and validations."
            />
            <BenefitCard
              icon={CheckCircle}
              title="Reduced Incident Tickets"
              description="Agentic Automation for proactive issue resolution and management."
            />
            <BenefitCard
              icon={MessageSquare}
              title="Seamless MS Teams Integration"
              description="Execute AWS tasks through natural language commands in Microsoft Teams."
            />
            <BenefitCard
              icon={DollarSign}
              title="Lower Operational Costs"
              description="Automated Configurations reducing manual intervention and errors."
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer id="footer" className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Cloud className="h-8 w-8 text-blue-400 mr-2" />
                <span className="text-xl font-semibold">AI Force IntelliOps</span>
              </div>
              <p className="text-gray-400">
                Intelligent operations platform powered by AI
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Privacy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Terms</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Security</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>&copy; 2025 AI Force IntelliOps. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
