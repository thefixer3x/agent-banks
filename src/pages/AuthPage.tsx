
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, LogIn, UserPlus, KeyRound, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AuthPage = () => {
  const { signIn, signUp, user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    inviteCode: '',
  });

  // Redirect if user is already authenticated and approved
  React.useEffect(() => {
    if (user && profile) {
      if (profile.status === 'approved' || profile.role === 'admin') {
        navigate('/');
      }
    }
  }, [user, profile, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getErrorMessage = (error: any) => {
    if (!error) return '';
    
    const message = error.message || error.toString();
    
    // Common error messages and user-friendly replacements
    if (message.includes('Invalid login credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (message.includes('Email not confirmed')) {
      return 'Please check your email and click the confirmation link before signing in.';
    }
    if (message.includes('User already registered')) {
      return 'An account with this email already exists. Try signing in instead.';
    }
    if (message.includes('Password should be at least')) {
      return 'Password must be at least 6 characters long.';
    }
    if (message.includes('Unable to validate email address')) {
      return 'Please enter a valid email address.';
    }
    if (message.includes('Database error')) {
      return 'Service temporarily unavailable. Please try again in a few moments.';
    }
    
    return message;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        const friendlyMessage = getErrorMessage(error);
        toast({
          title: "Sign In Failed",
          description: friendlyMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        navigate('/');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      const { error } = await signUp(
        formData.email,
        formData.password,
        formData.fullName || undefined,
        formData.inviteCode || undefined
      );
      
      if (error) {
        const friendlyMessage = getErrorMessage(error);
        toast({
          title: "Sign Up Failed",
          description: friendlyMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account Created!",
          description: "Please check your email to verify your account.",
        });
        // Reset form after successful signup
        setFormData({
          email: '',
          password: '',
          fullName: '',
          inviteCode: '',
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/sd-logo.svg" 
            alt="Ghost Protocol Avatar"
            className="h-16 w-16 rounded-full object-cover opacity-90 shadow-2xl border-2 border-orange-500/50 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-white mb-2">Ghost Protocol</h1>
          <p className="text-gray-400">Secure access to your AI nexus</p>
        </div>

        <Card className="border-orange-500/20 bg-gray-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center text-orange-400">Authentication</CardTitle>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800/50">
                <TabsTrigger value="signin" className="text-white">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="text-white">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-gray-300">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="bg-gray-800/50 border-gray-700"
                      placeholder="Enter your email"
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-gray-300">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleInputChange}
                        className="bg-gray-800/50 border-gray-700 pr-10"
                        placeholder="Enter your password"
                        required
                        autoComplete="current-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <LogIn className="h-4 w-4 mr-2" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-gray-300">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="bg-gray-800/50 border-gray-700"
                      placeholder="Enter your email"
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-fullname" className="text-gray-300">Full Name (Optional)</Label>
                    <Input
                      id="signup-fullname"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="bg-gray-800/50 border-gray-700"
                      placeholder="Enter your full name"
                      autoComplete="name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-gray-300">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleInputChange}
                        className="bg-gray-800/50 border-gray-700 pr-10"
                        placeholder="Enter your password (min 6 characters)"
                        required
                        minLength={6}
                        autoComplete="new-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-invitecode" className="text-gray-300 flex items-center gap-2">
                      <KeyRound className="h-4 w-4" />
                      Invite Code (Optional)
                    </Label>
                    <Input
                      id="signup-invitecode"
                      name="inviteCode"
                      type="text"
                      value={formData.inviteCode}
                      onChange={handleInputChange}
                      className="bg-gray-800/50 border-gray-700"
                      placeholder="Enter invite code for instant access"
                    />
                  </div>

                  <Alert className="border-orange-500/20 bg-orange-500/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-orange-300 text-sm">
                      Without an invite code, your account will require admin approval before you can access the platform.
                    </AlertDescription>
                  </Alert>

                  <Button 
                    type="submit" 
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Sign Up
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
