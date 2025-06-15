"use client";

import { useState, useEffect } from 'react';
// Removed dataService import - using API calls instead
import { KnowledgeItem } from '@/lib/types';

export function useKnowledge() {
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKnowledge();
  }, []);

  const loadKnowledge = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/knowledge');
      if (response.ok) {
        const data = await response.json();
        setKnowledge(data);
      } else {
        throw new Error('Failed to fetch knowledge');
      }
    } catch (error) {
      console.error('Failed to load knowledge:', error);
      setKnowledge([]);
    } finally {
      setLoading(false);
    }
  };

  const addKnowledge = async (knowledgeData: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt' | 'likes'>) => {
    try {
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(knowledgeData),
      });
      if (!response.ok) throw new Error('Failed to add knowledge');
      const newKnowledge = await response.json();
      setKnowledge(prev => [newKnowledge, ...prev]);
      return newKnowledge;
    } catch (error) {
      console.error('Failed to add knowledge:', error);
      throw error;
    }
  };

  const updateKnowledge = async (id: string, updates: Partial<Omit<KnowledgeItem, 'id' | 'createdAt'>>) => {
    try {
      const response = await fetch('/api/knowledge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!response.ok) throw new Error('Failed to update knowledge');
      const updatedKnowledge = await response.json();
      setKnowledge(prev => 
        prev.map(item => 
          item.id === id ? updatedKnowledge : item
        )
      );
      return updatedKnowledge;
    } catch (error) {
      console.error('Failed to update knowledge:', error);
      throw error;
    }
  };

  const deleteKnowledge = async (id: string) => {
    try {
      const response = await fetch(`/api/knowledge?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete knowledge');
      const result = await response.json();
      if (result.success) {
        setKnowledge(prev => prev.filter(item => item.id !== id));
      }
      return result.success;
    } catch (error) {
      console.error('Failed to delete knowledge:', error);
      throw error;
    }
  };

  return {
    knowledge,
    loading,
    addKnowledge,
    updateKnowledge,
    deleteKnowledge,
    reload: loadKnowledge
  };
}