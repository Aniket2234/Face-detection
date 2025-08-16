import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, User, Calendar, Clock, ArrowLeft } from 'lucide-react';

interface WelcomeProps {
  user?: {
    id: string;
    name: string;
    profileImage?: string;
    lastLogin?: string;
  };
}

export default function Welcome() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<WelcomeProps['user'] | null>(null);

  useEffect(() => {
    // Get user data from sessionStorage (set during authentication)
    const userData = sessionStorage.getItem('welcomeUser');
    if (userData) {
      setUser(JSON.parse(userData));
      // Don't clear the data immediately to allow back navigation
    } else {
      // If no user data, redirect to dashboard
      setTimeout(() => setLocation('/dashboard'), 1000);
    }
  }, [setLocation]);

  const handleContinue = () => {
    setLocation('/dashboard');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-blue-50 dark:from-green-950 dark:via-background dark:to-blue-950 flex items-center justify-center p-4 relative">
      {/* Back Button */}
      <Button
        onClick={() => setLocation('/dashboard')}
        variant="ghost"
        size="sm"
        className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>
      
      <Card className="w-full max-w-md shadow-lg border-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          {/* Success Icon */}
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <div className="absolute inset-0 w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full mx-auto animate-ping opacity-20"></div>
          </div>

          {/* Welcome Message */}
          <div className="space-y-4 mb-6">
            <h1 className="text-3xl font-bold text-foreground">
              Welcome Back!
            </h1>
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2 text-lg">
                <User className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">{user.name}</span>
              </div>
              <p className="text-muted-foreground">
                Face recognition successful
              </p>
            </div>
          </div>

          {/* User Profile Image */}
          {user.profileImage && (
            <div className="mb-6">
              <div className="w-16 h-16 rounded-full overflow-hidden mx-auto border-4 border-green-200 dark:border-green-800">
                <img 
                  src={user.profileImage} 
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Login Info */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6 space-y-2">
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Logged in on {new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Continue Button */}
          <Button 
            onClick={handleContinue}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            Continue to Dashboard
          </Button>

          {/* Auto-redirect info */}
          <p className="text-xs text-muted-foreground mt-4">
            Click "Continue to Dashboard" to proceed or use the back button to return
          </p>
        </CardContent>
      </Card>
    </div>
  );
}