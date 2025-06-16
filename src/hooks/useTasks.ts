"use client";

import { useState, useEffect } from 'react';
import { Task } from '@/lib/types';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const response = await fetch('/api/tasks');
        if (response.ok) {
          const data = await response.json();
          setTasks(data);
        } else {
          throw new Error('Failed to fetch tasks');
        }
      } catch (error) {
        console.error('Failed to load tasks:', error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      if (!response.ok) throw new Error('Failed to add task');
      const newTask = await response.json();
      setTasks(prev => [...prev, newTask]);
      return newTask;
    } catch (error) {
      console.error('Failed to add task:', error);
      throw error;
    }
  };

  const updateTask = async (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!response.ok) throw new Error('Failed to update task');
      const updatedTask = await response.json();
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      return updatedTask;
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const response = await fetch(`/api/tasks?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete task');
      const result = await response.json();
      if (result.success) {
        setTasks(prev => prev.filter(t => t.id !== id));
      }
      return result.success;
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  };

  const moveTaskToUser = async (taskId: string, newUserId: string) => {
    try {
      return await updateTask(taskId, { userId: newUserId });
    } catch (error) {
      console.error('Failed to move task to user:', error);
      throw error;
    }
  };

  const archiveTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/archive`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to archive task');
      const result = await response.json();
      if (result.success) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
      }
      return result.success;
    } catch (error) {
      console.error('Failed to archive task:', error);
      throw error;
    }
  };

  const restoreTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/archive`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to restore task');
      const result = await response.json();
      // Refresh tasks after restore
      const tasksResponse = await fetch('/api/tasks');
      if (tasksResponse.ok) {
        const data = await tasksResponse.json();
        setTasks(data);
      }
      return result.success;
    } catch (error) {
      console.error('Failed to restore task:', error);
      throw error;
    }
  };

  const addCollaborator = async (taskId: string, userId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Failed to add collaborator');
      const collaborator = await response.json();
      
      // Refresh the task to get updated collaborators
      const tasksResponse = await fetch('/api/tasks');
      if (tasksResponse.ok) {
        const data = await tasksResponse.json();
        setTasks(data);
      }
      
      return collaborator;
    } catch (error) {
      console.error('Failed to add collaborator:', error);
      throw error;
    }
  };

  const removeCollaborator = async (taskId: string, userId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/collaborators?userId=${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove collaborator');
      const result = await response.json();
      
      // Refresh the task to get updated collaborators
      if (result.success) {
        const tasksResponse = await fetch('/api/tasks');
        if (tasksResponse.ok) {
          const data = await tasksResponse.json();
          setTasks(data);
        }
      }
      
      return result.success;
    } catch (error) {
      console.error('Failed to remove collaborator:', error);
      throw error;
    }
  };

  const refreshTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        throw new Error('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Failed to refresh tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    moveTaskToUser,
    archiveTask,
    restoreTask,
    addCollaborator,
    removeCollaborator,
    refreshTasks,
  };
}