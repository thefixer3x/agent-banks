
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'user';
  status: 'pending' | 'approved' | 'rejected';
  invite_code: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  isDefaultAdmin: boolean;
  sessionTimeoutWarning: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName?: string, inviteCode?: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  recoverSession: () => Promise<boolean>;
  dismissTimeoutWarning: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Get admin emails from environment with fallback
const getDefaultAdminEmails = (): string[] => {
  const envEmails = import.meta.env.VITE_DEFAULT_ADMIN_EMAILS || 'seftecofficiail@gmail.com,arras-humane-0v@icloud.com,info@lanonasis.com';
  return envEmails.split(',').map(email => email.trim());
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sessionTimeoutWarning, setSessionTimeoutWarning] = useState(false);
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  
  const defaultAdminEmails = getDefaultAdminEmails();
  const isDefaultAdmin = user?.email ? defaultAdminEmails.includes(user.email) : false;

  const fetchProfile = async (userId: string, retryCount = 0): Promise<UserProfile | null> => {
    try {
      console.log('Fetching profile for user ID:', userId, retryCount > 0 ? `(retry ${retryCount})` : '');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        setAuthError(`Profile fetch failed: ${error.message}`);
        
        // Retry mechanism for network issues
        if (retryCount < 3 && (error.message.includes('network') || error.message.includes('timeout'))) {
          console.log('Retrying profile fetch...');
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return fetchProfile(userId, retryCount + 1);
        }
        
        return null;
      }

      console.log('Profile data received:', data);
      setAuthError(null); // Clear any previous errors
      return data as UserProfile;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setAuthError(`Profile fetch error: ${error}`);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await fetchProfile(user.id);
      setProfile(userProfile);
    }
  };

  // Session recovery mechanism
  const recoverSession = useCallback(async (): Promise<boolean> => {
    try {
      console.log('Attempting session recovery...');
      setLoading(true);
      
      // Try to refresh the session
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session recovery failed:', error);
        setAuthError('Session expired. Please sign in again.');
        return false;
      }
      
      if (data.session) {
        console.log('Session recovered successfully');
        setSession(data.session);
        setUser(data.session.user);
        
        // Fetch profile with the recovered session
        if (data.session.user) {
          const userProfile = await fetchProfile(data.session.user.id);
          setProfile(userProfile);
        }
        
        setAuthError(null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Session recovery error:', error);
      setAuthError('Failed to recover session');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup session timeout warning
  const setupSessionTimeout = useCallback((session: Session) => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    
    const warningTime = import.meta.env.VITE_SESSION_TIMEOUT_WARNING || '300000'; // 5 minutes before expiry
    const expiresAt = session.expires_at ? session.expires_at * 1000 : Date.now() + 86400000; // 24h fallback
    const warningAt = expiresAt - parseInt(warningTime);
    const timeUntilWarning = warningAt - Date.now();
    
    if (timeUntilWarning > 0) {
      sessionTimeoutRef.current = setTimeout(() => {
        setSessionTimeoutWarning(true);
        toast({
          title: 'Session Expiring Soon',
          description: 'Your session will expire in 5 minutes. Save your work.',
          variant: 'destructive',
        });
      }, timeUntilWarning);
    }
  }, []);

  const dismissTimeoutWarning = useCallback(() => {
    setSessionTimeoutWarning(false);
  }, []);

  useEffect(() => {
    console.log('Setting up enhanced auth state listener...');
    
    // Set up auth state listener with error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email || 'no user');
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Clear any previous auth errors on successful auth
        if (session?.user) {
          setAuthError(null);
          
          // Setup session timeout warning
          setupSessionTimeout(session);
          
          // Fetch user profile with retry mechanism
          try {
            const userProfile = await fetchProfile(session.user.id);
            setProfile(userProfile);
            
            // Setup auto-save if enabled
            const autoSaveInterval = import.meta.env.VITE_AUTO_SAVE_INTERVAL || '30000';
            if (autoSaveRef.current) clearInterval(autoSaveRef.current);
            autoSaveRef.current = setInterval(() => {
              // Trigger auto-save for chat sessions
              const event = new CustomEvent('auth-auto-save');
              window.dispatchEvent(event);
            }, parseInt(autoSaveInterval));
            
          } catch (error) {
            console.error('Failed to setup user session:', error);
            setAuthError('Failed to load user data');
          }
        } else {
          // Clear user data and timers on sign out
          setProfile(null);
          setAuthError(null);
          setSessionTimeoutWarning(false);
          
          if (sessionTimeoutRef.current) {
            clearTimeout(sessionTimeoutRef.current);
            sessionTimeoutRef.current = null;
          }
          
          if (autoSaveRef.current) {
            clearInterval(autoSaveRef.current);
            autoSaveRef.current = null;
          }
        }
        
        setLoading(false);
      }
    );

    // Enhanced initial session check with recovery
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setAuthError('Failed to initialize session');
          
          // Attempt session recovery if enabled
          const enableRecovery = import.meta.env.VITE_ENABLE_SESSION_RECOVERY === 'true';
          if (enableRecovery) {
            const recovered = await recoverSession();
            if (!recovered) {
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
          return;
        }
        
        console.log('Initial session check:', session?.user?.email || 'no session');
        
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          setupSessionTimeout(session);
          
          const userProfile = await fetchProfile(session.user.id);
          setProfile(userProfile);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthError('Authentication system error');
        setLoading(false);
      }
    };
    
    initializeAuth();

    // Cleanup function
    return () => {
      subscription.unsubscribe();
      if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [recoverSession, setupSessionTimeout]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error);
      } else {
        console.log('Sign in successful for:', email);
      }
      
      return { data, error };
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      return { data: null, error };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string, inviteCode?: string) => {
    try {
      console.log('Attempting sign up for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName,
            invite_code: inviteCode,
          },
        },
      });
      
      if (error) {
        console.error('Sign up error:', error);
      } else {
        console.log('Sign up successful for:', email);
      }
      
      return { data, error };
    } catch (error) {
      console.error('Unexpected sign up error:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out...');
      
      // Clear all timers
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }
      
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
        autoSaveRef.current = null;
      }
      
      // Trigger session cleanup event
      const event = new CustomEvent('auth-session-cleanup');
      window.dispatchEvent(event);
      
      // Clear local state
      setSessionTimeoutWarning(false);
      setAuthError(null);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        setAuthError('Sign out failed');
      } else {
        console.log('Successfully signed out');
      }
    } catch (error) {
      console.error('Unexpected sign out error:', error);
      setAuthError('Sign out error');
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    authError,
    isDefaultAdmin,
    sessionTimeoutWarning,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    recoverSession,
    dismissTimeoutWarning,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
