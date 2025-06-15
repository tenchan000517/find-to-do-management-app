"use client";

import { useState, useEffect } from 'react';
import { User } from '@/lib/types';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        } else {
          throw new Error('Failed to fetch users');
        }
      } catch (error) {
        console.error('Failed to load users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const addUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) throw new Error('Failed to add user');
      const newUser = await response.json();
      setUsers(prev => [...prev, newUser]);
      return newUser;
    } catch (error) {
      console.error('Failed to add user:', error);
      throw error;
    }
  };

  const updateUser = async (id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>) => {
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!response.ok) throw new Error('Failed to update user');
      const updatedUser = await response.json();
      setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
      return updatedUser;
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  };

  const getUserByLineId = async (lineId: string): Promise<User | null> => {
    try {
      const response = await fetch(`/api/users/line/${lineId}`);
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) throw new Error('Failed to get user by LINE ID');
      return await response.json();
    } catch (error) {
      console.error('Failed to get user by LINE ID:', error);
      throw error;
    }
  };

  const refreshUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to refresh users:', error);
    }
  };

  return {
    users,
    loading,
    addUser,
    updateUser,
    getUserByLineId,
    refreshUsers,
  };
}