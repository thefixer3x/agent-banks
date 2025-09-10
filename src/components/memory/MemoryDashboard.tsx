
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Search, Filter, MoreVertical, Brain, Folder, MessageCircle, Code, Book, Sparkles, Wifi, TestTube } from "lucide-react";
import { useMemoryManagement } from "@/hooks/useMemoryManagement";
import { MemoryTopicManager } from "./MemoryTopicManager";
import { MemoryEntryManager } from "./MemoryEntryManager";
import { MemorySearchInterface } from "./MemorySearchInterface";
import { AIMemoryAssistant } from "./AIMemoryAssistant";
import { RealtimeMemoryDashboard } from "./RealtimeMemoryDashboard";
import MCPMemoryTest from "./MCPMemoryTest";

const iconMap = {
  brain: Brain,
  folder: Folder,
  'message-circle': MessageCircle,
  code: Code,
  book: Book,
};

export function MemoryDashboard() {
  const {
    topics,
    memories,
    searchResults,
    loading,
    loadMemories,
    searchMemories,
  } = useMemoryManagement();

  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [triggerAddMemory, setTriggerAddMemory] = useState(false);

  const handleTopicFilter = (topicId: string) => {
    setSelectedTopic(topicId);
    loadMemories(topicId === 'all' ? undefined : topicId, selectedProject === 'all' ? undefined : selectedProject);
  };

  const handleProjectFilter = (projectRef: string) => {
    setSelectedProject(projectRef);
    loadMemories(selectedTopic === 'all' ? undefined : selectedTopic, projectRef === 'all' ? undefined : projectRef);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchMemories(
        searchQuery,
        selectedTopic === 'all' ? undefined : selectedTopic,
        selectedProject === 'all' ? undefined : selectedProject
      );
      setActiveTab('search');
    }
  };

  const handleAddMemory = () => {
    setActiveTab('memories');
    setTriggerAddMemory(true);
  };

  const systemTopics = topics.filter(t => t.is_system);
  const userTopics = topics.filter(t => !t.is_system);
  const projectRefs = [...new Set(memories.map(m => m.project_ref))];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Memory Management</h1>
            <p className="text-muted-foreground">
              Organize and manage your AI memory topics and entries
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={handleAddMemory}>
              <Plus className="h-4 w-4 mr-2" />
              Add Memory
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search memories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={!searchQuery.trim()}>
                Search
              </Button>
              <select
                value={selectedTopic}
                onChange={(e) => handleTopicFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Topics</option>
                {systemTopics.map(topic => (
                  <option key={topic.id} value={topic.id}>{topic.name}</option>
                ))}
                {userTopics.length > 0 && (
                  <optgroup label="Custom Topics">
                    {userTopics.map(topic => (
                      <option key={topic.id} value={topic.id}>{topic.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              <select
                value={selectedProject}
                onChange={(e) => handleProjectFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Projects</option>
                {projectRefs.map(ref => (
                  <option key={ref} value={ref}>{ref}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ai-assistant">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="topics">Topics</TabsTrigger>
            <TabsTrigger value="memories">Memories</TabsTrigger>
            <TabsTrigger value="search">Search Results</TabsTrigger>
            <TabsTrigger value="realtime">
              <Wifi className="h-4 w-4 mr-2" />
              Real-time
            </TabsTrigger>
            <TabsTrigger value="test">
              <TestTube className="h-4 w-4 mr-2" />
              MCP Test
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stats Cards */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Memories</CardTitle>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{memories.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Active memory entries
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Topics</CardTitle>
                  <Folder className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{topics.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {systemTopics.length} system + {userTopics.length} custom
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Projects</CardTitle>
                  <Code className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{projectRefs.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Active projects
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Memories */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Memories</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {memories.slice(0, 10).map((memory) => {
                      const IconComponent = memory.topic?.icon ? iconMap[memory.topic.icon as keyof typeof iconMap] : Brain;
                      return (
                        <div key={memory.id} className="flex items-start gap-3 p-3 border rounded-lg">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: memory.topic?.color || '#6366F1' }}
                          >
                            <IconComponent className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{memory.title}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {memory.content}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {memory.memory_type}
                              </Badge>
                              {memory.topic && (
                                <Badge variant="outline" className="text-xs">
                                  {memory.topic.name}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {new Date(memory.updated_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-assistant">
            <AIMemoryAssistant />
          </TabsContent>

          <TabsContent value="topics">
            <MemoryTopicManager />
          </TabsContent>

          <TabsContent value="memories">
            <MemoryEntryManager 
              triggerAdd={triggerAddMemory} 
              onAddTriggered={() => setTriggerAddMemory(false)} 
            />
          </TabsContent>

          <TabsContent value="search">
            <MemorySearchInterface searchResults={searchResults} />
          </TabsContent>

          <TabsContent value="realtime">
            <RealtimeMemoryDashboard />
          </TabsContent>

          <TabsContent value="test">
            <MCPMemoryTest />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
