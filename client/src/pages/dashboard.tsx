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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-6">
      <div className="max-w-lg mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2" data-testid="dashboard-title">
            FaceSecure Dashboard
          </h1>
          <p className="text-slate-600" data-testid="dashboard-subtitle">
            Choose an action to continue
          </p>
        </div>

        {/* Status Card */}
        <Card className="mb-6" data-testid="status-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">System Ready</h3>
                <p className="text-sm text-slate-600">All systems operational</p>
              </div>
              <div className="ml-auto">
                <span className="px-3 py-1 bg-success/10 text-success text-sm font-medium rounded-full">
                  Active
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Actions */}
        <div className="space-y-4">
          
          {/* Register Face */}
          <Card className="hover:shadow-md transition-all duration-200" data-testid="card-register">
            <CardContent className="p-0">
              <Button
                variant="ghost"
                onClick={handleRegisterFace}
                className="w-full p-6 h-auto justify-start hover:bg-slate-50 transition-colors duration-200"
                data-testid="button-register-face"
              >
                <div className="flex items-center space-x-4 w-full">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <UserPlus className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">Register Face</h3>
                    <p className="text-slate-600">Add a new face to the system</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* Authenticate */}
          <Card className="hover:shadow-md transition-all duration-200" data-testid="card-authenticate">
            <CardContent className="p-0">
              <Button
                variant="ghost"
                onClick={handleAuthenticate}
                className="w-full p-6 h-auto justify-start hover:bg-slate-50 transition-colors duration-200"
                data-testid="button-authenticate"
              >
                <div className="flex items-center space-x-4 w-full">
                  <div className="w-14 h-14 bg-success/10 rounded-2xl flex items-center justify-center">
                    <Smile className="w-8 h-8 text-success" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">Authenticate</h3>
                    <p className="text-slate-600">Verify your identity with face scan</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* Profiles */}
          <Card className="hover:shadow-md transition-all duration-200" data-testid="card-profiles">
            <CardContent className="p-0">
              <Button
                variant="ghost"
                onClick={handleProfiles}
                className="w-full p-6 h-auto justify-start hover:bg-slate-50 transition-colors duration-200"
                data-testid="button-manage-profiles"
              >
                <div className="flex items-center space-x-4 w-full">
                  <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center">
                    <Users className="w-8 h-8 text-secondary" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">Manage Profiles</h3>
                    <p className="text-slate-600">View and manage registered users</p>
                  </div>
                  <div className="text-right mr-4">
                    <span className="text-2xl font-bold text-slate-900" data-testid="text-user-count">
                      {users.length}
                    </span>
                    <p className="text-sm text-slate-600">Users</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4" data-testid="stats-grid">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary" data-testid="text-total-scans">
                {stats?.totalScans || 0}
              </div>
              <div className="text-sm text-slate-600">Total Scans</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-success" data-testid="text-success-rate">
                {stats?.successRate || 0}%
              </div>
              <div className="text-sm text-slate-600">Success Rate</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
