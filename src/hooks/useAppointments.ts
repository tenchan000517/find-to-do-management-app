"use client";

import { useState, useEffect } from 'react';
// Removed dataService import - using API calls instead
import { Appointment } from '@/lib/types';

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/appointments');
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      } else {
        throw new Error('Failed to fetch appointments');
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const addAppointment = async (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData),
      });
      if (!response.ok) throw new Error('Failed to add appointment');
      const newAppointment = await response.json();
      setAppointments(prev => [newAppointment, ...prev]);
      return newAppointment;
    } catch (error) {
      console.error('Failed to add appointment:', error);
      throw error;
    }
  };

  const updateAppointment = async (id: string, updates: Partial<Omit<Appointment, 'id' | 'createdAt'>>) => {
    try {
      console.log('🔄 useAppointments.updateAppointment 開始:', { id, updates });
      const response = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      console.log('🔄 API レスポンス:', response.status, response.statusText);
      
      if (!response.ok) throw new Error('Failed to update appointment');
      const updatedAppointment = await response.json();
      console.log('🔄 更新されたアポイントメント:', updatedAppointment);
      
      setAppointments(prev => 
        prev.map(appointment => 
          appointment.id === id ? updatedAppointment : appointment
        )
      );
      console.log('🔄 状態更新完了');
      return updatedAppointment;
    } catch (error) {
      console.error('🔄 updateAppointment エラー:', error);
      throw error;
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      const response = await fetch(`/api/appointments?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete appointment');
      const result = await response.json();
      if (result.success) {
        setAppointments(prev => prev.filter(appointment => appointment.id !== id));
      }
      return result.success;
    } catch (error) {
      console.error('Failed to delete appointment:', error);
      throw error;
    }
  };

  return {
    appointments,
    loading,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    reload: loadAppointments
  };
}