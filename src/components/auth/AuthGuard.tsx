
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Clock, Shield, Mail, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AuthGuardProps {
  children: React.ReactNode;
  requireApproval?: boolean;
}

// Get admin emails from environment with fallback
const getDefaultAdminEmails = (): string[] => {
  const envEmails = import.meta.env.VITE_DEFAULT_ADMIN_EMAILS || 'seftecofficiail@gmail.com,arras-humane-0v@icloud.com,info@lanonasis.com';
  return envEmails.split(',').map(email => email.trim());
};

const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireApproval = true }) => {
  const { 
    user, 
    profile, 
    loading, 
    authError, 
    isDefaultAdmin,
    sessionTimeoutWarning,
    signOut, 
    recoverSession,
    dismissTimeoutWarning 
  } = useAuth();
  const navigate = useNavigate();
  
  const defaultAdminEmails = getDefaultAdminEmails();
  const enableAdminBypass = import.meta.env.VITE_ENABLE_ADMIN_BYPASS !== 'false';
  
  // Handle session timeout warning
  useEffect(() => {
    if (sessionTimeoutWarning) {
      toast({
        title: 'Session Expiring Soon',
        description: 'Your session will expire in 5 minutes. Click to extend.',
        action: (
          <Button 
            size="sm" 
            onClick={async () => {
              const recovered = await recoverSession();
              if (recovered) {
                dismissTimeoutWarning();
                toast({ title: 'Session Extended', description: 'Your session has been refreshed.' });
              }
            }}
          >
            Extend
          </Button>
        ),
      });
    }
  }, [sessionTimeoutWarning, recoverSession, dismissTimeoutWarning]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth error with recovery option
  if (authError && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <Card className="w-full max-w-md border-orange-500/20 bg-gray-900/80">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
            <CardTitle className="text-orange-400">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-300">{authError}</p>
            <div className="space-y-2">
              <Button 
                onClick={async () => {
                  const recovered = await recoverSession();
                  if (!recovered) {
                    navigate('/auth');
                  }
                }}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Recovery
              </Button>
              <Button onClick={() => navigate('/auth')} variant="outline" className="w-full">
                Sign In Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user && !loading) {
    navigate('/auth');
    return null;
  }

  // Enhanced profile error handling with admin bypass
  if (!profile && user && !loading) {
    // Allow default admins to proceed even if profile fails to load
    const userIsDefaultAdmin = enableAdminBypass && user.email && defaultAdminEmails.includes(user.email);
    
    if (userIsDefaultAdmin) {
      console.log('Default admin bypassing profile requirement:', user.email);
      return <>{children}</>;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <Card className="w-full max-w-md border-orange-500/20 bg-gray-900/80">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-orange-400 mx-auto mb-4" />
            <CardTitle className="text-orange-400">Profile Loading</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-300">
              Unable to load your profile. This might be a temporary issue.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={async () => {
                  const recovered = await recoverSession();
                  if (!recovered) {
                    toast({ title: 'Recovery failed', description: 'Please try signing in again.' });
                  }
                }}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button onClick={signOut} variant="outline" className="w-full">
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Enhanced approval logic with environment-based admin bypass
  const userIsDefaultAdmin = enableAdminBypass && isDefaultAdmin;
  
  if (requireApproval && profile && profile.status === 'pending' && !userIsDefaultAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <Card className="w-full max-w-md border-orange-500/20 bg-gray-900/80">
          <CardHeader className="text-center">
            <Clock className="h-12 w-12 text-orange-400 mx-auto mb-4" />
            <CardTitle className="text-orange-400">Approval Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="space-y-2">
              <p className="text-gray-300">
                Your account is awaiting admin approval.
              </p>
              <p className="text-sm text-gray-400">
                You'll receive access once an administrator reviews your request.
              </p>
            </div>
            
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Mail className="h-4 w-4" />
                <span>{profile?.email || user?.email}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Registered: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Recently'}
              </p>
              {userIsDefaultAdmin && (
                <p className="text-xs text-green-400 mt-1">
                  ✓ Default Admin Access
                </p>
              )}
            </div>

            <Button onClick={signOut} variant="outline" className="w-full">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requireApproval && profile && profile.status === 'rejected' && !userIsDefaultAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <Card className="w-full max-w-md border-red-500/20 bg-gray-900/80">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <CardTitle className="text-red-400">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-300">
              Your account access has been denied by an administrator.
            </p>
            <Button onClick={signOut} variant="outline" className="w-full">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
