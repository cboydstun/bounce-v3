<<<<<<< HEAD
import { useEffect, useCallback } from "react";
import { useWebSocket } from "./useWebSocket";
import { useQueryClient } from "@tanstack/react-query";
import { Task } from "../../types/task.types";
=======
import { useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { useQueryClient } from '@tanstack/react-query';
import { Task } from '../../types/task.types';
>>>>>>> 5772b46b8 (notifications)

export interface UseTaskEventsOptions {
  onNewTask?: (task: Task) => void;
  onTaskAssigned?: (task: Task) => void;
  onTaskUpdated?: (task: Task) => void;
  onTaskClaimed?: (task: Task) => void;
  onTaskCompleted?: (task: Task) => void;
  onTaskCancelled?: (task: Task) => void;
  autoRefreshQueries?: boolean;
}

export interface UseTaskEventsReturn {
  isConnected: boolean;
  subscribe: (eventType: string, handler: (data: any) => void) => () => void;
}

/**
 * Hook for handling real-time task events
 */
<<<<<<< HEAD
export const useTaskEvents = (
  options: UseTaskEventsOptions = {},
): UseTaskEventsReturn => {
=======
export const useTaskEvents = (options: UseTaskEventsOptions = {}): UseTaskEventsReturn => {
>>>>>>> 5772b46b8 (notifications)
  const {
    onNewTask,
    onTaskAssigned,
    onTaskUpdated,
    onTaskClaimed,
    onTaskCompleted,
    onTaskCancelled,
    autoRefreshQueries = true,
  } = options;

  const { isConnected, subscribe } = useWebSocket();
  const queryClient = useQueryClient();

  // Invalidate relevant queries when tasks change
  const invalidateTaskQueries = useCallback(() => {
    if (autoRefreshQueries) {
<<<<<<< HEAD
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["myTasks"] });
      queryClient.invalidateQueries({ queryKey: ["nearbyTasks"] });
      queryClient.invalidateQueries({ queryKey: ["taskStats"] });
=======
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      queryClient.invalidateQueries({ queryKey: ['nearbyTasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskStats'] });
>>>>>>> 5772b46b8 (notifications)
    }
  }, [queryClient, autoRefreshQueries]);

  // Handle new task events
  useEffect(() => {
<<<<<<< HEAD
    const unsubscribe = subscribe("task:new", (event) => {
      const task = event.payload;
      console.log("📋 New task available:", task);

      if (onNewTask) {
        onNewTask(task);
      }

=======
    const unsubscribe = subscribe('task:new', (event) => {
      const task = event.payload;
      console.log('📋 New task available:', task);
      
      if (onNewTask) {
        onNewTask(task);
      }
      
>>>>>>> 5772b46b8 (notifications)
      invalidateTaskQueries();
    });

    return unsubscribe;
  }, [subscribe, onNewTask, invalidateTaskQueries]);

  // Handle task assigned events
  useEffect(() => {
<<<<<<< HEAD
    const unsubscribe = subscribe("task:assigned", (event) => {
      const task = event.payload;
      console.log("✅ Task assigned:", task);

      if (onTaskAssigned) {
        onTaskAssigned(task);
      }

=======
    const unsubscribe = subscribe('task:assigned', (event) => {
      const task = event.payload;
      console.log('✅ Task assigned:', task);
      
      if (onTaskAssigned) {
        onTaskAssigned(task);
      }
      
>>>>>>> 5772b46b8 (notifications)
      invalidateTaskQueries();
    });

    return unsubscribe;
  }, [subscribe, onTaskAssigned, invalidateTaskQueries]);

  // Handle task updated events
  useEffect(() => {
<<<<<<< HEAD
    const unsubscribe = subscribe("task:updated", (event) => {
      const task = event.payload;
      console.log("🔄 Task updated:", task);

      if (onTaskUpdated) {
        onTaskUpdated(task);
      }

      // Update specific task in cache
      if (autoRefreshQueries && task.id) {
        queryClient.setQueryData(["task", task.id], task);
      }

=======
    const unsubscribe = subscribe('task:updated', (event) => {
      const task = event.payload;
      console.log('🔄 Task updated:', task);
      
      if (onTaskUpdated) {
        onTaskUpdated(task);
      }
      
      // Update specific task in cache
      if (autoRefreshQueries && task.id) {
        queryClient.setQueryData(['task', task.id], task);
      }
      
>>>>>>> 5772b46b8 (notifications)
      invalidateTaskQueries();
    });

    return unsubscribe;
<<<<<<< HEAD
  }, [
    subscribe,
    onTaskUpdated,
    invalidateTaskQueries,
    queryClient,
    autoRefreshQueries,
  ]);

  // Handle task claimed events
  useEffect(() => {
    const unsubscribe = subscribe("task:claimed", (event) => {
      const task = event.payload;
      console.log("🤝 Task claimed:", task);

      if (onTaskClaimed) {
        onTaskClaimed(task);
      }

=======
  }, [subscribe, onTaskUpdated, invalidateTaskQueries, queryClient, autoRefreshQueries]);

  // Handle task claimed events
  useEffect(() => {
    const unsubscribe = subscribe('task:claimed', (event) => {
      const task = event.payload;
      console.log('🤝 Task claimed:', task);
      
      if (onTaskClaimed) {
        onTaskClaimed(task);
      }
      
>>>>>>> 5772b46b8 (notifications)
      invalidateTaskQueries();
    });

    return unsubscribe;
  }, [subscribe, onTaskClaimed, invalidateTaskQueries]);

  // Handle task completed events
  useEffect(() => {
<<<<<<< HEAD
    const unsubscribe = subscribe("task:completed", (event) => {
      const task = event.payload;
      console.log("🎉 Task completed:", task);

      if (onTaskCompleted) {
        onTaskCompleted(task);
      }

=======
    const unsubscribe = subscribe('task:completed', (event) => {
      const task = event.payload;
      console.log('🎉 Task completed:', task);
      
      if (onTaskCompleted) {
        onTaskCompleted(task);
      }
      
>>>>>>> 5772b46b8 (notifications)
      invalidateTaskQueries();
    });

    return unsubscribe;
  }, [subscribe, onTaskCompleted, invalidateTaskQueries]);

  // Handle task cancelled events
  useEffect(() => {
<<<<<<< HEAD
    const unsubscribe = subscribe("task:cancelled", (event) => {
      const task = event.payload;
      console.log("❌ Task cancelled:", task);

      if (onTaskCancelled) {
        onTaskCancelled(task);
      }

=======
    const unsubscribe = subscribe('task:cancelled', (event) => {
      const task = event.payload;
      console.log('❌ Task cancelled:', task);
      
      if (onTaskCancelled) {
        onTaskCancelled(task);
      }
      
>>>>>>> 5772b46b8 (notifications)
      invalidateTaskQueries();
    });

    return unsubscribe;
  }, [subscribe, onTaskCancelled, invalidateTaskQueries]);

  return {
    isConnected,
    subscribe,
  };
};
