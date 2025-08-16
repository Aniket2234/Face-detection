import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Smile, UserPlus, Lock, Shield } from 'lucide-react';

export default function Onboarding() {
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 pt-16 pb-8 px-6 text-center">
        <div className="w-20 h-20 mx-auto bg-primary rounded-full flex items-center justify-center mb-6">
          <Smile className="w-8 h-8 text-white" data-testid="header-icon" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3" data-testid="welcome-title">
          Welcome to FaceSecure
        </h1>
        <p className="text-lg text-slate-600 max-w-sm mx-auto" data-testid="welcome-subtitle">
          Secure, fast, and reliable face authentication powered by AI
        </p>
      </div>

      {/* Feature Cards */}
      <div className="flex-1 px-6 space-y-6">
        {/* Feature 1 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100" data-testid="feature-registration">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-6 h-6 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Easy Registration</h3>
              <p className="text-slate-600">Register your face in seconds with our advanced AI technology</p>
            </div>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100" data-testid="feature-authentication">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Secure Authentication</h3>
              <p className="text-slate-600">Lightning-fast face recognition with enterprise-grade security</p>
            </div>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100" data-testid="feature-protection">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Anti-Spoof Protection</h3>
              <p className="text-slate-600">Advanced liveness detection prevents photo and video attacks</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="flex-shrink-0 p-6">
        <Button 
          onClick={handleGetStarted}
          className="w-full bg-primary text-white py-4 rounded-2xl font-semibold text-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all duration-200 transform hover:scale-[1.02] h-auto"
          data-testid="button-get-started"
        >
          Get Started
          <span className="ml-2">→</span>
        </Button>
      </div>
    </div>
  );
}
