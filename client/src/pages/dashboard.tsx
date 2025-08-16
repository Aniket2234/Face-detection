import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Smile, Users, CheckCircle, ChevronRight } from 'lucide-react';
import type { User } from '@shared/schema';

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: stats } = useQuery<{totalScans: number; successRate: number; activeToday: number}>({
    queryKey: ['/api/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const handleRegisterFace = () => {
    setLocation('/camera/register');
  };

  const handleAuthenticate = () => {
    setLocation('/camera/authenticate');
  };

  const handleProfiles = () => {
    setLocation('/profiles');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-4 sm:py-6 safe-area-inset-top safe-area-inset-bottom">
      <div className="max-w-sm sm:max-w-lg mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2" data-testid="dashboard-title">
            FaceSecure Dashboard
          </h1>
          <p className="text-sm sm:text-base text-slate-600" data-testid="dashboard-subtitle">
            Choose an action to continue
          </p>
        </div>

        {/* Status Card */}
        <Card className="mb-4 sm:mb-6" data-testid="status-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 text-sm sm:text-base">System Ready</h3>
                <p className="text-xs sm:text-sm text-slate-600">All systems operational</p>
              </div>
              <div className="flex-shrink-0">
                <span className="px-2 py-1 sm:px-3 sm:py-1 bg-success/10 text-success text-xs sm:text-sm font-medium rounded-full">
                  Active
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Actions */}
        <div className="space-y-3 sm:space-y-4">
          
          {/* Register Face */}
          <Card className="hover:shadow-md transition-all duration-200 touch-manipulation" data-testid="card-register">
            <CardContent className="p-0">
              <Button
                variant="ghost"
                onClick={handleRegisterFace}
                className="w-full p-4 sm:p-6 h-auto justify-start hover:bg-slate-50 transition-colors duration-200 touch-manipulation"
                data-testid="button-register-face"
              >
                <div className="flex items-center space-x-3 sm:space-x-4 w-full">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                    <UserPlus className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">Register Face</h3>
                    <p className="text-sm sm:text-base text-slate-600">Add a new face to the system</p>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* Authenticate */}
          <Card className="hover:shadow-md transition-all duration-200 touch-manipulation" data-testid="card-authenticate">
            <CardContent className="p-0">
              <Button
                variant="ghost"
                onClick={handleAuthenticate}
                className="w-full p-4 sm:p-6 h-auto justify-start hover:bg-slate-50 transition-colors duration-200 touch-manipulation"
                data-testid="button-authenticate"
              >
                <div className="flex items-center space-x-3 sm:space-x-4 w-full">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-success/10 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Smile className="w-6 h-6 sm:w-8 sm:h-8 text-success" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">Authenticate</h3>
                    <p className="text-sm sm:text-base text-slate-600">Verify your identity with face scan</p>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* Profiles */}
          <Card className="hover:shadow-md transition-all duration-200 touch-manipulation" data-testid="card-profiles">
            <CardContent className="p-0">
              <Button
                variant="ghost"
                onClick={handleProfiles}
                className="w-full p-4 sm:p-6 h-auto justify-start hover:bg-slate-50 transition-colors duration-200 touch-manipulation"
                data-testid="button-manage-profiles"
              >
                <div className="flex items-center space-x-3 sm:space-x-4 w-full">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-secondary/10 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 sm:w-8 sm:h-8 text-secondary" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">Manage Profiles</h3>
                    <p className="text-sm sm:text-base text-slate-600">View and manage registered users</p>
                  </div>
                  <div className="text-right mr-2 sm:mr-4 flex-shrink-0">
                    <span className="text-xl sm:text-2xl font-bold text-slate-900" data-testid="text-user-count">
                      {users.length}
                    </span>
                    <p className="text-xs sm:text-sm text-slate-600">Users</p>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-4" data-testid="stats-grid">
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-primary" data-testid="text-total-scans">
                {stats?.totalScans || 0}
              </div>
              <div className="text-xs sm:text-sm text-slate-600">Total Scans</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-success" data-testid="text-success-rate">
                {stats?.successRate || 0}%
              </div>
              <div className="text-xs sm:text-sm text-slate-600">Success Rate</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
