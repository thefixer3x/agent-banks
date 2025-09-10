
import React from 'react';
import { AIModel, ModelConfig } from '@/services/aiModels';
import { Card, CardHeader, CardDescription, CardTitle, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Cpu, RefreshCw, Bot, Zap, Eye, Code, Brain } from 'lucide-react';

interface ModelSelectorProps {
  models: ModelConfig[];
  selectedModel: AIModel;
  onSelectModel: (modelId: AIModel) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onSelectModel,
  isLoading = false,
  onRefresh
}) => {
  const getModelIcon = (modelId: AIModel) => {
    switch (modelId) {
      case 'free': return <Bot className="h-4 w-4 text-emerald-600" />;
      case 'openai': return <Bot className="h-4 w-4 text-green-600" />;
      case 'anthropic': return <Brain className="h-4 w-4 text-violet-600" />;
      case 'perplexity': return <Zap className="h-4 w-4 text-blue-600" />;
      case 'openrouter': return <Cpu className="h-4 w-4 text-orange-600" />;
      case 'gemini': return <Eye className="h-4 w-4 text-yellow-600" />;
      case 'deepseek': return <Code className="h-4 w-4 text-indigo-600" />;
      case 'mistral': return <Cpu className="h-4 w-4 text-red-600" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getCapabilityBadges = (model: ModelConfig) => {
    const capabilities = [];
    if (model.capabilities.vision) capabilities.push({ label: 'Vision', color: 'bg-blue-100 text-blue-800' });
    if (model.capabilities.web_search) capabilities.push({ label: 'Search', color: 'bg-green-100 text-green-800' });
    if (model.capabilities.code) capabilities.push({ label: 'Code', color: 'bg-purple-100 text-purple-800' });
    if (model.capabilities.reasoning) capabilities.push({ label: 'Reasoning', color: 'bg-orange-100 text-orange-800' });
    if (model.capabilities.function_calling) capabilities.push({ label: 'Functions', color: 'bg-cyan-100 text-cyan-800' });
    
    return capabilities.slice(0, 2); // Show max 2 badges to keep it clean
  };

  return (
    <Card className="w-full mb-4 shadow-sm border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI Model Selection</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {models.filter(m => m.isAvailable).length} available
            </Badge>
            {onRefresh && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onRefresh}
                disabled={isLoading}
                className="h-8 w-8"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
        <CardDescription>Choose your AI assistant for enhanced MCP protocol interactions</CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-pulse flex flex-col items-center gap-2">
              <Cpu className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading models...</span>
            </div>
          </div>
        ) : (
          <RadioGroup 
            value={selectedModel} 
            onValueChange={(value) => onSelectModel(value as AIModel)}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {models.map((model) => (
              <div
                key={model.id}
                className={`flex flex-col space-y-2 rounded-lg border p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedModel === model.id 
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : "border-border hover:border-primary/50"
                } ${!model.isAvailable ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={model.id} 
                    id={model.id}
                    disabled={!model.isAvailable}
                  />
                  <Label htmlFor={model.id} className="flex items-center gap-2 cursor-pointer flex-1">
                    {getModelIcon(model.id)}
                    <span className="font-medium text-sm">{model.name}</span>
                  </Label>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  {model.isAvailable ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                      Ready
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                      Key Required
                    </Badge>
                  )}
                  
                  <Badge variant="secondary" className={`text-xs ${
                    model.costTier === 'low' ? 'bg-green-100 text-green-800' :
                    model.costTier === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {model.costTier}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {getCapabilityBadges(model).map((capability, idx) => (
                    <Badge 
                      key={idx}
                      variant="secondary" 
                      className={`text-xs ${capability.color}`}
                    >
                      {capability.label}
                    </Badge>
                  ))}
                </div>
                
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {model.description}
                </p>
              </div>
            ))}
          </RadioGroup>
        )}
      </CardContent>
    </Card>
  );
};

export default ModelSelector;
