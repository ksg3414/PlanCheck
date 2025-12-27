import { useState, useEffect, useCallback } from 'react';
import { BusinessSchedule } from '../types';
import { StorageService } from '../services/storageService';

export const useSchedules = () => {
  const [schedules, setSchedules] = useState<BusinessSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const storageService = StorageService.getInstance();

  // Load schedules on mount
  useEffect(() => {
    const loadSchedules = async () => {
      try {
        setIsLoading(true);
        const loaded = await storageService.loadSchedules();
        setSchedules(loaded);
        setError(null);
      } catch (err) {
        console.error('Failed to load schedules:', err);
        setError(err instanceof Error ? err : new Error('Failed to load schedules'));
      } finally {
        setIsLoading(false);
      }
    };

    loadSchedules();
  }, []);

  // Save schedules whenever they change
  useEffect(() => {
    if (!isLoading) {
      storageService.saveSchedules(schedules).catch(err => {
        console.error('Failed to save schedules:', err);
        setError(err instanceof Error ? err : new Error('Failed to save schedules'));
      });
    }
  }, [schedules, isLoading]);

  const addSchedule = useCallback((schedule: BusinessSchedule) => {
    setSchedules(prev => [...prev, schedule]);
  }, []);

  const updateSchedule = useCallback((updated: BusinessSchedule) => {
    setSchedules(prev => 
      prev.map(s => s.id === updated.id ? updated : s)
    );
  }, []);

  const deleteSchedule = useCallback((id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  }, []);

  const clearAllSchedules = useCallback(async () => {
    try {
      await storageService.clearSchedules();
      setSchedules([]);
    } catch (err) {
      console.error('Failed to clear schedules:', err);
      setError(err instanceof Error ? err : new Error('Failed to clear schedules'));
    }
  }, []);

  return {
    schedules,
    isLoading,
    error,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    clearAllSchedules,
    setSchedules
  };
};

