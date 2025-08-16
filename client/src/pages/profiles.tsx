import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, CheckCircle } from 'lucide-react';
import type { User } from '@shared/schema';

export default function Profiles() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: stats } = useQuery<{totalScans: number; successRate: number; activeToday: number}>({
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

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<User> }) => {
      const response = await apiRequest('PATCH', `/api/users/${userId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      toast({
        title: "Profile Updated",
        description: "User profile has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update user profile",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter((user: User) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProfile = () => {
    setLocation('/camera/register');
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to delete ${userName}?`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingUser || !editName.trim()) return;
    
    updateUserMutation.mutate({
      userId: editingUser.id,
      updates: { name: editName.trim() }
    });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-4 sm:py-6 safe-area-inset-top safe-area-inset-bottom">
      <div className="max-w-sm sm:max-w-lg mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900" data-testid="profiles-title">
              Registered Profiles
            </h1>
            <p className="text-sm sm:text-base text-slate-600" data-testid="profiles-subtitle">
              Manage face recognition profiles
            </p>
          </div>
          <Button
            onClick={handleAddProfile}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-lg sm:rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 touch-manipulation flex-shrink-0"
            data-testid="button-add-profile"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4 sm:mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
          </div>
          <Input
            type="text"
            placeholder="Search profiles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200 text-sm sm:text-base"
            data-testid="input-search"
          />
        </div>

        {/* Profile List */}
        <div className="space-y-3 sm:space-y-4" data-testid="profiles-list">
          {isLoading ? (
            <div className="space-y-3 sm:space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-200 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="h-3 sm:h-4 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-2 sm:h-3 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="text-slate-400 mb-2 text-sm sm:text-base">
                  {searchQuery ? 'No profiles found matching your search' : 'No profiles registered yet'}
                </div>
                {!searchQuery && (
                  <Button onClick={handleAddProfile} className="mt-4 touch-manipulation" data-testid="button-add-first-profile">
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
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    {/* Profile Avatar */}
                    <div className="relative flex-shrink-0">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={`${user.name} profile`}
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-slate-200"
                          data-testid={`img-avatar-${user.id}`}
                        />
                      ) : (
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-200 border-2 border-slate-200 flex items-center justify-center">
                          <span className="text-slate-600 font-semibold text-sm sm:text-lg">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      
                      {user.isActive && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-success rounded-full border-2 border-white flex items-center justify-center">
                          <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* Profile Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 text-sm sm:text-base truncate" data-testid={`text-name-${user.id}`}>
                        {user.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500" data-testid={`text-last-seen-${user.id}`}>
                        Last seen: {formatLastSeen(user.lastSeen)}
                      </p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditUser(user)}
                        className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-lg sm:rounded-xl hover:bg-slate-200 transition-colors duration-200 touch-manipulation"
                        data-testid={`button-edit-${user.id}`}
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        disabled={deleteUserMutation.isPending}
                        className="w-8 h-8 sm:w-10 sm:h-10 bg-error/10 rounded-lg sm:rounded-xl hover:bg-error/20 transition-colors duration-200 touch-manipulation"
                        data-testid={`button-delete-${user.id}`}
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-error" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Analytics Card */}
        <Card className="mt-6 sm:mt-8" data-testid="analytics-card">
          <CardContent className="p-4 sm:p-6">
            <h3 className="font-semibold text-slate-900 mb-3 sm:mb-4 text-sm sm:text-base">Profile Statistics</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-primary" data-testid="text-total-profiles">
                  {users.length}
                </div>
                <div className="text-xs sm:text-sm text-slate-600">Total Profiles</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-success" data-testid="text-active-today">
                  {stats?.activeToday || 0}
                </div>
                <div className="text-xs sm:text-sm text-slate-600">Active Today</div>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-slate-600">Recognition Accuracy</span>
                <span className="font-semibold text-success" data-testid="text-accuracy">
                  {stats?.successRate || 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Profile Button */}
        <div className="mt-4 sm:mt-6">
          <Button
            onClick={handleAddProfile}
            className="w-full bg-primary text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all duration-200 transform hover:scale-[1.02] h-auto touch-manipulation"
            data-testid="button-add-new-profile"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Add New Profile
          </Button>
        </div>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter user name"
                  className="mt-1"
                />
              </div>
              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={() => setIsEditDialogOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={!editName.trim() || updateUserMutation.isPending}
                  className="flex-1"
                >
                  {updateUserMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
