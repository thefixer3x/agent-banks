
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, Check, Copy, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ConfigPanelProps {
  onSaveConfig: (config: { accessToken: string; projectRef: string }) => void;
  isConnecting: boolean;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ onSaveConfig, isConnecting }) => {
  const [accessToken, setAccessToken] = useState('');
  const [projectRef, setProjectRef] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [formErrors, setFormErrors] = useState({ accessToken: '', projectRef: '' });
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    const errors = { accessToken: '', projectRef: '' };
    
    if (!accessToken) {
      errors.accessToken = 'Personal Access Token is required';
    }
    
    if (!projectRef) {
      errors.projectRef = 'Project Reference ID is required';
    }
    
    if (errors.accessToken || errors.projectRef) {
      setFormErrors(errors);
      return;
    }
    
    // Clear errors and submit
    setFormErrors({ accessToken: '', projectRef: '' });
    onSaveConfig({ accessToken, projectRef });
  };

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${description} copied to clipboard`,
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto border border-border bg-card animate-fade-in">
      <CardHeader>
        <CardTitle className="text-tech-cyan">Supabase Configuration</CardTitle>
        <CardDescription>Enter your Supabase credentials to connect</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="access-token" className="flex items-center justify-between">
              <span>Personal Access Token (PAT)</span>
              {formErrors.accessToken && (
                <span className="text-xs text-destructive flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" /> {formErrors.accessToken}
                </span>
              )}
            </Label>
            <div className="relative">
              <Input
                id="access-token"
                type={showToken ? "text" : "password"}
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className={cn(
                  "pr-16",
                  formErrors.accessToken && "border-destructive"
                )}
                placeholder="sbp_1234..."
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => copyToClipboard(accessToken, "Access token")}
                  disabled={!accessToken}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-ref" className="flex items-center justify-between">
              <span>Project Reference ID</span>
              {formErrors.projectRef && (
                <span className="text-xs text-destructive flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" /> {formErrors.projectRef}
                </span>
              )}
            </Label>
            <div className="relative">
              <Input
                id="project-ref"
                type="text"
                value={projectRef}
                onChange={(e) => setProjectRef(e.target.value)}
                className={cn(
                  "pr-9",
                  formErrors.projectRef && "border-destructive"
                )}
                placeholder="abcdefg-hijk-lmno-pqrs"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => copyToClipboard(projectRef, "Project reference")}
                disabled={!projectRef}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full bg-tech-blue hover:bg-tech-blue/90" 
          onClick={handleSubmit}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin" />
              Connecting...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Connect
            </span>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ConfigPanel;
