
import React from 'react';
import { Check, Zap, Eye, Search, Code, Brain, Layers, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ModelConfig, AIModel } from '@/services/aiModels';

interface EnhancedModelSelectorProps {
  models: ModelConfig[];
  selectedModel: AIModel;
  onModelSelect: (model: AIModel) => void;
  taskType?: string;
}

const capabilityIcons = {
  text: Zap,
  vision: Eye,
  web_search: Search,
  code: Code,
  reasoning: Brain,
  multimodal: Layers,
  function_calling: Code,
  real_time: Clock
};

const capabilityLabels = {
  text: 'Text',
  vision: 'Vision',
  web_search: 'Web Search',
  code: 'Code',
  reasoning: 'Reasoning',
  multimodal: 'Multimodal',
  function_calling: 'Functions',
  real_time: 'Real-time'
};

const costTierColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
};

const EnhancedModelSelector: React.FC<EnhancedModelSelectorProps> = ({
  models,
  selectedModel,
  onModelSelect,
  taskType
}) => {
  const getRecommendedForTask = (model: ModelConfig): boolean => {
    if (!taskType) return false;
    
    switch (taskType) {
      case 'code':
        return model.capabilities.code || false;
      case 'search':
        return model.capabilities.web_search || false;
      case 'vision':
        return model.capabilities.vision || false;
      case 'reasoning':
        return model.capabilities.reasoning || false;
      default:
        return false;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {models.map((model) => {
        const isSelected = model.id === selectedModel;
        const isRecommended = getRecommendedForTask(model);
        
        return (
          <Card 
            key={model.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              isSelected ? 'ring-2 ring-blue-500' : ''
            } ${isRecommended ? 'ring-1 ring-green-400' : ''}`}
            onClick={() => model.isAvailable && onModelSelect(model.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {model.name}
                  {isSelected && <Check className="h-4 w-4 text-blue-500" />}
                  {isRecommended && <Badge variant="outline" className="text-xs">Recommended</Badge>}
                </CardTitle>
                <Badge className={costTierColors[model.costTier]}>
                  {model.costTier}
                </Badge>
              </div>
              <CardDescription className="text-sm">
                {model.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {Object.entries(model.capabilities).map(([capability, enabled]) => {
                    if (!enabled) return null;
                    
                    const Icon = capabilityIcons[capability as keyof typeof capabilityIcons];
                    const label = capabilityLabels[capability as keyof typeof capabilityLabels];
                    
                    return (
                      <Badge 
                        key={capability} 
                        variant="secondary" 
                        className="text-xs flex items-center gap-1"
                      >
                        {Icon && <Icon className="h-3 w-3" />}
                        {label}
                      </Badge>
                    );
                  })}
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Max tokens: {model.maxTokens.toLocaleString()}</span>
                  <span className={model.isAvailable ? 'text-green-600' : 'text-red-500'}>
                    {model.isAvailable ? 'Available' : 'Key Required'}
                  </span>
                </div>
                
                {!model.isAvailable && (
                  <Button variant="outline" size="sm" className="w-full" disabled>
                    Add {model.apiKeyName}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default EnhancedModelSelector;
