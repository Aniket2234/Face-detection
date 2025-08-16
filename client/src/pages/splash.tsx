import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Shield } from 'lucide-react';

export default function Splash() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocation('/onboarding');
    }, 3000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary via-secondary to-purple-600 text-white px-6">
      <div className="text-center space-y-8">
        {/* App Logo */}
        <div className="relative">
          <div className="w-32 h-32 mx-auto bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-pulse">
            <Shield className="w-16 h-16 text-white" data-testid="logo-icon" />
          </div>
          <div 
            className="absolute inset-0 w-32 h-32 mx-auto rounded-full border-4 border-white/30 animate-spin" 
            style={{ animationDuration: '3s' }}
            data-testid="loading-ring"
          />
        </div>
        
        {/* App Name */}
        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tight" data-testid="app-title">
            FaceSecure
          </h1>
          <p className="text-xl text-white/80 font-light" data-testid="app-subtitle">
            AI Powered Face Recognition
          </p>
        </div>
        
        {/* Loading Animation */}
        <div className="flex justify-center" data-testid="loading-dots">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
