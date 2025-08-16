import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, CheckCircle } from 'lucide-react';
import type { User } from '@shared/schema';

export default function Profiles() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/users'],
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('DELETE', `/api/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "User Deleted",
        description: "User profile has been deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete user profile",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter((user: User) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProfile = () => {
    setLocation('/camera/register');
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to delete ${userName}?`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const formatLastSeen = (lastSeen: string | Date | null) => {
    if (!lastSeen) return 'Never';
    
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-6">
      <div className="max-w-lg mx-auto px-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900" data-testid="profiles-title">
              Registered Profiles
            </h1>
            <p className="text-slate-600" data-testid="profiles-subtitle">
              Manage face recognition profiles
            </p>
          </div>
          <Button
            onClick={handleAddProfile}
            className="w-12 h-12 bg-primary rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90"
            data-testid="button-add-profile"
          >
            <Plus className="w-5 h-5 text-white" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
            <Search className="w-5 h-5 text-slate-400" />
          </div>
          <Input
            type="text"
            placeholder="Search profiles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
            data-testid="input-search"
          />
        </div>

        {/* Profile List */}
        <div className="space-y-4" data-testid="profiles-list">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-slate-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-slate-400 mb-2">
                  {searchQuery ? 'No profiles found matching your search' : 'No profiles registered yet'}
                </div>
                {!searchQuery && (
                  <Button onClick={handleAddProfile} className="mt-4" data-testid="button-add-first-profile">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Profile
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map((user: User) => (
              <Card 
                key={user.id} 
                className="hover:shadow-md transition-all duration-200"
                data-testid={`profile-card-${user.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    {/* Profile Avatar */}
                    <div className="relative">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={`${user.name} profile`}
                          className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
                          data-testid={`img-avatar-${user.id}`}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-slate-200 border-2 border-slate-200 flex items-center justify-center">
                          <span className="text-slate-600 font-semibold text-lg">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      
                      {user.isActive && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success rounded-full border-2 border-white flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* Profile Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900" data-testid={`text-name-${user.id}`}>
                        {user.name}
                      </h3>
                      <p className="text-sm text-slate-600" data-testid={`text-role-${user.id}`}>
                        {user.role}
                      </p>
                      <p className="text-xs text-slate-500" data-testid={`text-last-seen-${user.id}`}>
                        Last seen: {formatLastSeen(user.lastSeen)}
                      </p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-10 h-10 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors duration-200"
                        data-testid={`button-edit-${user.id}`}
                      >
                        <Edit className="w-4 h-4 text-slate-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        disabled={deleteUserMutation.isPending}
                        className="w-10 h-10 bg-error/10 rounded-xl hover:bg-error/20 transition-colors duration-200"
                        data-testid={`button-delete-${user.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-error" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Analytics Card */}
        <Card className="mt-8" data-testid="analytics-card">
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Profile Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary" data-testid="text-total-profiles">
                  {users.length}
                </div>
                <div className="text-sm text-slate-600">Total Profiles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success" data-testid="text-active-today">
                  {stats?.activeToday || 0}
                </div>
                <div className="text-sm text-slate-600">Active Today</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Recognition Accuracy</span>
                <span className="font-semibold text-success" data-testid="text-accuracy">
                  {stats?.successRate || 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Profile Button */}
        <div className="mt-6">
          <Button
            onClick={handleAddProfile}
            className="w-full bg-primary text-white py-4 rounded-2xl font-semibold text-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all duration-200 transform hover:scale-[1.02] h-auto"
            data-testid="button-add-new-profile"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
