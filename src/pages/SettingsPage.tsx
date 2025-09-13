
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { User, Settings, Key, CreditCard, Shield, Save, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface APIKeyConfig {
  name: string;
  label: string;
  description: string;
  placeholder: string;
  required: boolean;
}

const API_KEY_CONFIGS: APIKeyConfig[] = [
  {
    name: 'openai_api_key',
    label: 'OpenAI API Key',
    description: 'Required for GPT models (GPT-4, GPT-3.5, etc.)',
    placeholder: 'sk-...',
    required: true
  },
  {
    name: 'claude_api_key',
    label: 'Claude API Key',
    description: 'Required for Anthropic Claude models',
    placeholder: 'sk-ant-...',
    required: true
  },
  {
    name: 'perplexity_api_key',
    label: 'Perplexity API Key',
    description: 'Required for Perplexity models',
    placeholder: 'pplx-...',
    required: false
  },
  {
    name: 'gemini_api_key',
    label: 'Google Gemini API Key',
    description: 'Required for Google Gemini models',
    placeholder: 'AI...',
    required: false
  },
  {
    name: 'deepseek_api_key',
    label: 'DeepSeek API Key',
    description: 'Required for DeepSeek models',
    placeholder: 'sk-...',
    required: false
  },
  {
    name: 'mistral_api_key',
    label: 'Mistral API Key',
    description: 'Required for Mistral models',
    placeholder: 'api-key-...',
    required: false
  }
];

const SettingsPage = () => {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAPIKeys();
  }, []);

  const loadAPIKeys = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_api_keys');
      if (error) throw error;
      
      // Properly handle the JSON response and convert to Record<string, string>
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const keysRecord: Record<string, string> = {};
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'string') {
            keysRecord[key] = value;
          } else if (value !== null && value !== undefined) {
            keysRecord[key] = String(value);
          }
        }
        setApiKeys(keysRecord);
      } else {
        setApiKeys({});
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast({
        title: 'Error',
        description: 'Failed to load API keys',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveAPIKeys = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.rpc('update_user_api_keys', {
        new_keys: apiKeys
      });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'API keys saved successfully',
      });
    } catch (error) {
      console.error('Error saving API keys:', error);
      toast({
        title: 'Error',
        description: 'Failed to save API keys',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateAPIKey = (keyName: string, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [keyName]: value
    }));
  };

  const toggleKeyVisibility = (keyName: string) => {
    setShowKeys(prev => ({
      ...prev,
      [keyName]: !prev[keyName]
    }));
  };

  const getKeyStatus = (keyName: string) => {
    const value = apiKeys[keyName];
    if (!value || value.length < 10) return 'missing';
    return 'configured';
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your profile, API keys, and preferences</p>
        </div>

        <Tabs defaultValue="api-keys" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="api-keys" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="api-keys" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Key Management
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure your API keys to enable AI models. Keys are stored securely and encrypted.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {API_KEY_CONFIGS.map((config) => {
                  const status = getKeyStatus(config.name);
                  const isVisible = showKeys[config.name];
                  
                  return (
                    <div key={config.name} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={config.name}>{config.label}</Label>
                            {config.required && (
                              <Badge variant="outline" className="text-xs">Required</Badge>
                            )}
                            <Badge 
                              variant={status === 'configured' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {status === 'configured' ? 'Configured' : 'Missing'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{config.description}</p>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <Input
                          id={config.name}
                          type={isVisible ? 'text' : 'password'}
                          placeholder={config.placeholder}
                          value={apiKeys[config.name] || ''}
                          onChange={(e) => updateAPIKey(config.name, e.target.value)}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleKeyVisibility(config.name)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                        >
                          {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  );
                })}
                
                <Separator />
                
                <div className="flex justify-end">
                  <Button onClick={saveAPIKeys} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save API Keys'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage your personal information and preferences.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="Enter your first name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Enter your last name" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Enter your email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input id="timezone" placeholder="e.g., America/New_York" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage your subscription and billing information.
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No active subscription</p>
                  <Button className="mt-4">Upgrade to Pro</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage your account security and privacy settings.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Session Timeout</Label>
                    <p className="text-sm text-muted-foreground">Automatically log out after inactivity</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;
