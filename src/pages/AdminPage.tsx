
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, Users, Key, Check, X, Plus, Copy } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'user';
  status: 'pending' | 'approved' | 'rejected';
  invite_code: string | null;
  created_at: string;
}

interface InviteCode {
  id: string;
  code: string;
  created_by: string;
  used_by: string | null;
  used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

const AdminPage = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newInviteCode, setNewInviteCode] = useState('');

  // Redirect non-admin users
  if (profile && profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <Card className="w-full max-w-md border-red-500/20 bg-gray-900/80">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <CardTitle className="text-red-400">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-300">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    }
  };

  const fetchInviteCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('invite_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInviteCodes(data || []);
    } catch (error) {
      console.error('Error fetching invite codes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch invite codes",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchInviteCodes()]);
      setLoading(false);
    };

    loadData();
  }, []);

  const updateUserStatus = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          status,
          approved_by: profile?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${status} successfully`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const createInviteCode = async () => {
    const code = newInviteCode || generateInviteCode();
    
    try {
      const { error } = await supabase
        .from('invite_codes')
        .insert({
          code,
          created_by: profile?.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invite code created successfully",
      });

      setNewInviteCode('');
      fetchInviteCodes();
    } catch (error) {
      console.error('Error creating invite code:', error);
      toast({
        title: "Error",
        description: "Failed to create invite code",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Invite code copied to clipboard",
    });
  };

  const deactivateInviteCode = async (codeId: string) => {
    try {
      const { error } = await supabase
        .from('invite_codes')
        .update({ is_active: false })
        .eq('id', codeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invite code deactivated",
      });

      fetchInviteCodes();
    } catch (error) {
      console.error('Error deactivating invite code:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate invite code",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800">
          <div className="text-center">
            <div className="h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-300">Loading admin panel...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 p-6">
        <div className="container mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-gray-400">Manage users and invite codes</p>
          </div>

          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 mb-6">
              <TabsTrigger value="users" className="text-white">
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="invites" className="text-white">
                <Key className="h-4 w-4 mr-2" />
                Invite Codes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Card className="border-orange-500/20 bg-gray-900/80">
                <CardHeader>
                  <CardTitle className="text-orange-400">User Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-gray-300">Email</TableHead>
                        <TableHead className="text-gray-300">Name</TableHead>
                        <TableHead className="text-gray-300">Role</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Joined</TableHead>
                        <TableHead className="text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="text-gray-300">{user.email}</TableCell>
                          <TableCell className="text-gray-300">{user.full_name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                user.status === 'approved' ? 'default' :
                                user.status === 'pending' ? 'secondary' : 'destructive'
                              }
                            >
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {user.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => updateUserStatus(user.id, 'approved')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateUserStatus(user.id, 'rejected')}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invites">
              <div className="space-y-6">
                <Card className="border-orange-500/20 bg-gray-900/80">
                  <CardHeader>
                    <CardTitle className="text-orange-400">Create Invite Code</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Custom code (optional)"
                        value={newInviteCode}
                        onChange={(e) => setNewInviteCode(e.target.value)}
                        className="bg-gray-800/50 border-gray-700"
                      />
                      <Button onClick={createInviteCode} className="bg-orange-500 hover:bg-orange-600">
                        <Plus className="h-4 w-4 mr-2" />
                        Create
                      </Button>
                    </div>
                    <p className="text-sm text-gray-400">
                      Leave empty to generate a random code
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-orange-500/20 bg-gray-900/80">
                  <CardHeader>
                    <CardTitle className="text-orange-400">Invite Codes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-gray-300">Code</TableHead>
                          <TableHead className="text-gray-300">Status</TableHead>
                          <TableHead className="text-gray-300">Used By</TableHead>
                          <TableHead className="text-gray-300">Created</TableHead>
                          <TableHead className="text-gray-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inviteCodes.map((code) => (
                          <TableRow key={code.id}>
                            <TableCell className="font-mono text-orange-400">{code.code}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  !code.is_active ? 'destructive' :
                                  code.used_by ? 'secondary' : 'default'
                                }
                              >
                                {!code.is_active ? 'Inactive' : code.used_by ? 'Used' : 'Active'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {code.used_by ? 'Yes' : '-'}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {new Date(code.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(code.code)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                {code.is_active && !code.used_by && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => deactivateInviteCode(code.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  );
};

export default AdminPage;
