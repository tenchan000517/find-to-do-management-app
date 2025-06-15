"use client";

import { useState, useEffect } from 'react';
import { Connection } from '@/lib/types';

export function useConnections() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConnections = async () => {
      try {
        const response = await fetch('/api/connections');
        if (response.ok) {
          const data = await response.json();
          setConnections(data);
        } else {
          throw new Error('Failed to fetch connections');
        }
      } catch (error) {
        console.error('Failed to load connections:', error);
        setConnections([]);
      } finally {
        setLoading(false);
      }
    };

    loadConnections();
  }, []);

  const addConnection = async (connectionData: Omit<Connection, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connectionData),
      });
      if (!response.ok) throw new Error('Failed to add connection');
      const newConnection = await response.json();
      setConnections(prev => [...prev, newConnection]);
      return newConnection;
    } catch (error) {
      console.error('Failed to add connection:', error);
      throw error;
    }
  };

  const updateConnection = async (id: string, updates: Partial<Omit<Connection, 'id' | 'createdAt'>>) => {
    try {
      const response = await fetch('/api/connections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!response.ok) throw new Error('Failed to update connection');
      const updatedConnection = await response.json();
      setConnections(prev => prev.map(c => c.id === id ? updatedConnection : c));
      return updatedConnection;
    } catch (error) {
      console.error('Failed to update connection:', error);
      throw error;
    }
  };

  const deleteConnection = async (id: string) => {
    try {
      const response = await fetch(`/api/connections?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete connection');
      const result = await response.json();
      if (result.success) {
        setConnections(prev => prev.filter(c => c.id !== id));
      }
      return result.success;
    } catch (error) {
      console.error('Failed to delete connection:', error);
      throw error;
    }
  };

  return {
    connections,
    loading,
    addConnection,
    updateConnection,
    deleteConnection,
  };
}