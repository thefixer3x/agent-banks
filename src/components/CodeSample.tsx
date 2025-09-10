
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CodeSampleProps {
  title: string;
  code: string;
  language?: string;
}

const CodeSample: React.FC<CodeSampleProps> = ({ 
  title, 
  code, 
  language = 'bash' 
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({
      title: "Copied",
      description: "Code copied to clipboard",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{title}</CardTitle>
        <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded">
          {language}
        </span>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="relative">
          <pre className="code-block overflow-x-auto whitespace-pre bg-black p-4 rounded-md">
            <code>{code}</code>
          </pre>
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-2 right-2 h-8 w-8 p-0"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CodeSample;
