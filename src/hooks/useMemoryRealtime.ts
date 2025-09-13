
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MemoryEntry, MemoryTopic } from '@/types/memory';
import { toast } from '@/hooks/use-toast';

export function useMemoryRealtime() {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  // Real-time memory entry updates
  const subscribeToMemoryUpdates = (
    onInsert?: (payload: any) => void,
    onUpdate?: (payload: any) => void,
    onDelete?: (payload: any) => void
  ) => {
    const channel = supabase
      .channel('memory-entries-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'memory_entries'
        },
        (payload) => {
          console.log('Memory entry inserted:', payload);
          if (onInsert) onInsert(payload);
          toast({
            title: "New Memory Created",
            description: "A new memory entry has been added",
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'memory_entries'
        },
        (payload) => {
          console.log('Memory entry updated:', payload);
          if (onUpdate) onUpdate(payload);
          toast({
            title: "Memory Updated",
            description: "A memory entry has been modified",
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'memory_entries'
        },
        (payload) => {
          console.log('Memory entry deleted:', payload);
          if (onDelete) onDelete(payload);
          toast({
            title: "Memory Deleted",
            description: "A memory entry has been removed",
          });
        }
      )
      .subscribe((status) => {
        console.log('Memory updates subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return channel;
  };

  // Real-time topic updates
  const subscribeToTopicUpdates = (
    onInsert?: (payload: any) => void,
    onUpdate?: (payload: any) => void,
    onDelete?: (payload: any) => void
  ) => {
    const channel = supabase
      .channel('memory-topics-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'memory_topics'
        },
        (payload) => {
          console.log('Topic inserted:', payload);
          if (onInsert) onInsert(payload);
          toast({
            title: "New Topic Created",
            description: "A new memory topic has been added",
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'memory_topics'
        },
        (payload) => {
          console.log('Topic updated:', payload);
          if (onUpdate) onUpdate(payload);
          toast({
            title: "Topic Updated",
            description: "A memory topic has been modified",
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'memory_topics'
        },
        (payload) => {
          console.log('Topic deleted:', payload);
          if (onDelete) onDelete(payload);
          toast({
            title: "Topic Deleted",
            description: "A memory topic has been removed",
          });
        }
      )
      .subscribe((status) => {
        console.log('Topic updates subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return channel;
  };

  // User presence tracking
  const trackUserPresence = (userId: string, userData: any) => {
    const channel = supabase.channel('memory-dashboard-presence');

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const users = Object.values(newState).flat();
        setOnlineUsers(users);
        console.log('Presence sync:', users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
        toast({
          title: "User Joined",
          description: `${newPresences[0]?.name || 'Someone'} joined the memory dashboard`,
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
        toast({
          title: "User Left",
          description: `${leftPresences[0]?.name || 'Someone'} left the memory dashboard`,
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const presenceTrackStatus = await channel.track({
            user_id: userId,
            name: userData.name || 'Anonymous',
            avatar_url: userData.avatar_url,
            online_at: new Date().toISOString(),
          });
          console.log('Presence track status:', presenceTrackStatus);
        }
      });

    return channel;
  };

  // Collaborative editing notifications
  const notifyMemoryEdit = async (memoryId: string, userId: string, action: string) => {
    const channel = supabase.channel('memory-collaboration');
    
    await channel.send({
      type: 'broadcast',
      event: 'memory-edit',
      payload: {
        memory_id: memoryId,
        user_id: userId,
        action,
        timestamp: new Date().toISOString(),
      },
    });
  };

  // Listen for collaborative editing events
  const subscribeToCollaboration = (onMemoryEdit: (payload: any) => void) => {
    const channel = supabase
      .channel('memory-collaboration')
      .on('broadcast', { event: 'memory-edit' }, (payload) => {
        console.log('Collaborative edit:', payload);
        onMemoryEdit(payload.payload);
      })
      .subscribe();

    return channel;
  };

  // Cleanup function
  const cleanup = (channels: any[]) => {
    channels.forEach(channel => {
      supabase.removeChannel(channel);
    });
    setIsConnected(false);
    setOnlineUsers([]);
  };

  return {
    isConnected,
    onlineUsers,
    subscribeToMemoryUpdates,
    subscribeToTopicUpdates,
    trackUserPresence,
    notifyMemoryEdit,
    subscribeToCollaboration,
    cleanup
  };
}
