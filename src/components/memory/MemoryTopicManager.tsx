
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Brain, Folder, MessageCircle, Code, Book, Palette } from "lucide-react";
import { useMemoryManagement } from "@/hooks/useMemoryManagement";
import { MemoryTopic } from "@/types/memory";

const iconOptions = [
  { value: 'brain', icon: Brain, label: 'Brain' },
  { value: 'folder', icon: Folder, label: 'Folder' },
  { value: 'message-circle', icon: MessageCircle, label: 'Message' },
  { value: 'code', icon: Code, label: 'Code' },
  { value: 'book', icon: Book, label: 'Book' },
];

const colorOptions = [
  '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6B7280'
];

export function MemoryTopicManager() {
  const { topics, createTopic, updateTopic, deleteTopic } = useMemoryManagement();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<MemoryTopic | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366F1',
    icon: 'brain',
    parent_topic_id: ''
  });

  const systemTopics = topics.filter(t => t.is_system);
  const userTopics = topics.filter(t => !t.is_system);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#6366F1',
      icon: 'brain',
      parent_topic_id: ''
    });
    setEditingTopic(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTopic) {
        await updateTopic(editingTopic.id, formData);
      } else {
        await createTopic(formData);
      }
      
      resetForm();
      setIsCreateOpen(false);
    } catch (error) {
      console.error('Error saving topic:', error);
    }
  };

  const handleEdit = (topic: MemoryTopic) => {
    setFormData({
      name: topic.name,
      description: topic.description || '',
      color: topic.color,
      icon: topic.icon,
      parent_topic_id: topic.parent_topic_id || ''
    });
    setEditingTopic(topic);
    setIsCreateOpen(true);
  };

  const handleDelete = async (topic: MemoryTopic) => {
    if (topic.is_system) return;
    
    if (confirm(`Are you sure you want to delete "${topic.name}"?`)) {
      await deleteTopic(topic.id);
    }
  };

  const TopicCard = ({ topic }: { topic: MemoryTopic }) => {
    const IconComponent = iconOptions.find(opt => opt.value === topic.icon)?.icon || Brain;
    
    return (
      <Card className="relative group">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: topic.color }}
            >
              <IconComponent className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{topic.name}</h3>
              {topic.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {topic.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                {topic.is_system && (
                  <Badge variant="secondary" className="text-xs">System</Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {new Date(topic.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          {!topic.is_system && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit(topic)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(topic)}
                  className="h-8 w-8 p-0 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Memory Topics</h2>
          <p className="text-muted-foreground">Organize your memories into topics</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Topic
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTopic ? 'Edit Topic' : 'Create New Topic'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Icon</label>
                  <Select value={formData.icon} onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map(option => {
                        const IconComponent = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              {option.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Color</label>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {colorOptions.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-md border-2 ${
                          formData.color === color ? 'border-foreground' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Parent Topic (Optional)</label>
                <Select 
                  value={formData.parent_topic_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, parent_topic_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {topics.filter(t => t.id !== editingTopic?.id).map(topic => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingTopic ? 'Update' : 'Create'} Topic
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

      {/* System Topics */}
      {systemTopics.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">System Topics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemTopics.map(topic => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        </div>
      )}

      {/* User Topics */}
      <div>
        <h3 className="text-lg font-semibold mb-3">
          Custom Topics {userTopics.length > 0 && `(${userTopics.length})`}
        </h3>
        {userTopics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userTopics.map(topic => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Custom Topics</h3>
              <p className="text-muted-foreground mb-4">
                Create your first custom topic to organize memories
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Topic
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
