import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, ExternalLink, Tag, Calendar, Eye } from "lucide-react";
import { useMemoryManagement } from "@/hooks/useMemoryManagement";
import { MemoryEntry } from "@/types/memory";

const memoryTypeOptions = [
  { value: 'knowledge' as const, label: 'Knowledge' },
  { value: 'conversation' as const, label: 'Conversation' },
  { value: 'project' as const, label: 'Project' },
  { value: 'context' as const, label: 'Context' },
  { value: 'reference' as const, label: 'Reference' }
];

type MemoryType = 'conversation' | 'knowledge' | 'project' | 'context' | 'reference';

interface MemoryEntryManagerProps {
  triggerAdd?: boolean;
  onAddTriggered?: () => void;
}

export function MemoryEntryManager({ triggerAdd, onAddTriggered }: MemoryEntryManagerProps) {
  const { topics, memories, createMemory, updateMemory, deleteMemory } = useMemoryManagement();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<MemoryEntry | null>(null);
  const [viewingMemory, setViewingMemory] = useState<MemoryEntry | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    memory_type: 'knowledge' as MemoryType,
    topic_id: 'no-topic',
    source_url: '',
    source_type: '',
    tags: [] as string[],
    project_ref: 'general'
  });
  const [newTag, setNewTag] = useState('');

  // Handle external trigger to add memory
  useEffect(() => {
    if (triggerAdd) {
      resetForm();
      setIsCreateOpen(true);
      onAddTriggered?.();
    }
  }, [triggerAdd, onAddTriggered]);

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      summary: '',
      memory_type: 'knowledge',
      topic_id: 'no-topic',
      source_url: '',
      source_type: '',
      tags: [],
      project_ref: 'general'
    });
    setEditingMemory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        topic_id: formData.topic_id === 'no-topic' ? '' : formData.topic_id
      };
      
      if (editingMemory) {
        await updateMemory(editingMemory.id, submitData);
      } else {
        await createMemory(submitData);
      }
      
      resetForm();
      setIsCreateOpen(false);
    } catch (error) {
      console.error('Error saving memory:', error);
    }
  };

  const handleEdit = (memory: MemoryEntry) => {
    setFormData({
      title: memory.title,
      content: memory.content,
      summary: memory.summary || '',
      memory_type: memory.memory_type,
      topic_id: memory.topic_id || 'no-topic',
      source_url: memory.source_url || '',
      source_type: memory.source_type || '',
      tags: memory.tags || [],
      project_ref: memory.project_ref
    });
    setEditingMemory(memory);
    setIsCreateOpen(true);
  };

  const handleDelete = async (memory: MemoryEntry) => {
    if (confirm(`Are you sure you want to delete "${memory.title}"?`)) {
      await deleteMemory(memory.id);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const MemoryCard = ({ memory }: { memory: MemoryEntry }) => {
    const memoryType = memoryTypeOptions.find(opt => opt.value === memory.memory_type);
    
    return (
      <Card className="relative group">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold line-clamp-2 flex-1">{memory.title}</h3>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setViewingMemory(memory)}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit(memory)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(memory)}
                  className="h-8 w-8 p-0 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-3">
              {memory.content}
            </p>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{memoryType?.label}</Badge>
              {memory.topic && (
                <Badge variant="outline">{memory.topic.name}</Badge>
              )}
              {memory.project_ref !== 'general' && (
                <Badge variant="outline">{memory.project_ref}</Badge>
              )}
            </div>
            
            {memory.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {memory.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
                {memory.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{memory.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(memory.updated_at).toLocaleDateString()}
              </div>
              {memory.source_url && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={() => window.open(memory.source_url, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Source
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Memory Entries</h2>
          <p className="text-muted-foreground">Manage your knowledge and information</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Memory
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMemory ? 'Edit Memory' : 'Add New Memory'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Summary (Optional)</label>
                <Textarea
                  value={formData.summary}
                  onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select 
                    value={formData.memory_type} 
                    onValueChange={(value: MemoryType) => setFormData(prev => ({ ...prev, memory_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {memoryTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Topic</label>
                  <Select 
                    value={formData.topic_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, topic_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-topic">No topic</SelectItem>
                      {topics.map(topic => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Project Reference</label>
                  <Input
                    value={formData.project_ref}
                    onChange={(e) => setFormData(prev => ({ ...prev, project_ref: e.target.value }))}
                    placeholder="general"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Source Type</label>
                  <Input
                    value={formData.source_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, source_type: e.target.value }))}
                    placeholder="manual, import, etc."
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Source URL (Optional)</label>
                <Input
                  value={formData.source_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, source_url: e.target.value }))}
                  type="url"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Tags</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} size="sm">Add</Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingMemory ? 'Update' : 'Create'} Memory
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Memory Grid */}
      {memories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {memories.map(memory => (
            <MemoryCard key={memory.id} memory={memory} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No Memories Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start building your knowledge base by adding your first memory
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Memory
            </Button>
          </CardContent>
        </Card>
      )}

      {/* View Memory Dialog */}
      <Dialog open={!!viewingMemory} onOpenChange={() => setViewingMemory(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingMemory?.title}</DialogTitle>
          </DialogHeader>
          
          {viewingMemory && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {memoryTypeOptions.find(opt => opt.value === viewingMemory.memory_type)?.label}
                </Badge>
                {viewingMemory.topic && (
                  <Badge variant="outline">{viewingMemory.topic.name}</Badge>
                )}
                {viewingMemory.project_ref !== 'general' && (
                  <Badge variant="outline">{viewingMemory.project_ref}</Badge>
                )}
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Content</h4>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">{viewingMemory.content}</p>
                </div>
              </div>
              
              {viewingMemory.summary && (
                <div>
                  <h4 className="font-medium mb-2">Summary</h4>
                  <p className="text-muted-foreground">{viewingMemory.summary}</p>
                </div>
              )}
              
              {viewingMemory.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {viewingMemory.tags.map(tag => (
                      <Badge key={tag} variant="secondary">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
                <div>Created: {new Date(viewingMemory.created_at).toLocaleString()}</div>
                <div>Updated: {new Date(viewingMemory.updated_at).toLocaleString()}</div>
                <div>Accessed: {viewingMemory.access_count} times</div>
                {viewingMemory.source_url && (
                  <div>
                    Source: <a href={viewingMemory.source_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {viewingMemory.source_url}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
