
import React, { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Wifi, WifiOff, Users, Activity } from "lucide-react";
import { useMemoryRealtime } from "@/hooks/useMemoryRealtime";
import { useMemoryManagement } from "@/hooks/useMemoryManagement";

export function RealtimeMemoryDashboard() {
  const {
    isConnected,
    onlineUsers,
    subscribeToMemoryUpdates,
    subscribeToTopicUpdates,
    trackUserPresence,
    subscribeToCollaboration,
    cleanup
  } = useMemoryRealtime();

  const { loadMemories, loadTopics } = useMemoryManagement();
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const channels: any[] = [];

    // Subscribe to memory updates
    const memoryChannel = subscribeToMemoryUpdates(
      (payload) => {
        loadMemories();
        setRecentActivity(prev => [{
          id: Date.now(),
          type: 'memory_created',
          data: payload.new,
          timestamp: new Date().toISOString()
        }, ...prev.slice(0, 9)]);
      },
      (payload) => {
        loadMemories();
        setRecentActivity(prev => [{
          id: Date.now(),
          type: 'memory_updated',
          data: payload.new,
          timestamp: new Date().toISOString()
        }, ...prev.slice(0, 9)]);
      },
      (payload) => {
        loadMemories();
        setRecentActivity(prev => [{
          id: Date.now(),
          type: 'memory_deleted',
          data: payload.old,
          timestamp: new Date().toISOString()
        }, ...prev.slice(0, 9)]);
      }
    );
    channels.push(memoryChannel);

    // Subscribe to topic updates
    const topicChannel = subscribeToTopicUpdates(
      () => loadTopics(),
      () => loadTopics(),
      () => loadTopics()
    );
    channels.push(topicChannel);

    // Track user presence
    const presenceChannel = trackUserPresence('current-user', {
      name: 'Current User',
      avatar_url: null
    });
    channels.push(presenceChannel);

    // Subscribe to collaboration events
    const collabChannel = subscribeToCollaboration((payload) => {
      setRecentActivity(prev => [{
        id: Date.now(),
        type: 'collaboration',
        data: payload,
        timestamp: new Date().toISOString()
      }, ...prev.slice(0, 9)]);
    });
    channels.push(collabChannel);

    return () => cleanup(channels);
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'memory_created':
        return '✨';
      case 'memory_updated':
        return '📝';
      case 'memory_deleted':
        return '🗑️';
      case 'collaboration':
        return '👥';
      default:
        return '📋';
    }
  };

  const getActivityMessage = (activity: any) => {
    switch (activity.type) {
      case 'memory_created':
        return `New memory "${activity.data.title}" created`;
      case 'memory_updated':
        return `Memory "${activity.data.title}" updated`;
      case 'memory_deleted':
        return `Memory deleted`;
      case 'collaboration':
        return `User ${activity.data.action} on memory`;
      default:
        return 'Unknown activity';
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="h-5 w-5 text-green-500" />
                <span>Real-time Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-red-500" />
                <span>Real-time Disconnected</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Live Updates Active" : "Offline Mode"}
            </Badge>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">
                {onlineUsers.length} user{onlineUsers.length !== 1 ? 's' : ''} online
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Online Users */}
      {onlineUsers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Online Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {onlineUsers.map((user, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>
                      {user.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{user.name || 'Anonymous'}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <span className="text-lg">{getActivityIcon(activity.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {getActivityMessage(activity)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent activity
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
