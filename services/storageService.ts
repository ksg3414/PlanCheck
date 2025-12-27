import { BusinessSchedule } from '../types';

const STORAGE_KEY = 'plancheck_schedules';
const STORAGE_VERSION = 1;

interface StoredData {
  version: number;
  schedules: BusinessSchedule[];
  lastModified: string;
}

export class StorageService {
  private static instance: StorageService;

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Save schedules to localStorage
   */
  saveSchedules(schedules: BusinessSchedule[]): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const data: StoredData = {
          version: STORAGE_VERSION,
          schedules: this.serializeSchedules(schedules),
          lastModified: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        resolve();
      } catch (error) {
        console.error('Failed to save schedules:', error);
        reject(error);
      }
    });
  }

  /**
   * Load schedules from localStorage
   */
  loadSchedules(): Promise<BusinessSchedule[]> {
    return new Promise((resolve, reject) => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
          resolve([]);
          return;
        }

        const data: StoredData = JSON.parse(stored);
        
        // Handle version migration if needed
        if (data.version !== STORAGE_VERSION) {
          console.warn('Storage version mismatch, migrating...');
          // Future: Add migration logic here
        }

        const schedules = this.deserializeSchedules(data.schedules);
        resolve(schedules);
      } catch (error) {
        console.error('Failed to load schedules:', error);
        reject(error);
      }
    });
  }

  /**
   * Clear all schedules from storage
   */
  clearSchedules(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        localStorage.removeItem(STORAGE_KEY);
        resolve();
      } catch (error) {
        console.error('Failed to clear schedules:', error);
        reject(error);
      }
    });
  }

  /**
   * Serialize schedules (convert Date objects to ISO strings)
   */
  private serializeSchedules(schedules: BusinessSchedule[]): any[] {
    return schedules.map(schedule => ({
      ...schedule,
      date: schedule.date instanceof Date ? schedule.date.toISOString() : schedule.date,
      startTime: schedule.startTime instanceof Date ? schedule.startTime.toISOString() : schedule.startTime,
      endTime: schedule.endTime instanceof Date ? schedule.endTime.toISOString() : schedule.endTime
    }));
  }

  /**
   * Deserialize schedules (convert ISO strings back to Date objects)
   */
  private deserializeSchedules(schedules: any[]): BusinessSchedule[] {
    return schedules.map(schedule => ({
      ...schedule,
      date: schedule.date ? new Date(schedule.date) : new Date(),
      startTime: schedule.startTime ? new Date(schedule.startTime) : null,
      endTime: schedule.endTime ? new Date(schedule.endTime) : null
    }));
  }

  /**
   * Export schedules as JSON string
   */
  exportSchedules(schedules: BusinessSchedule[]): string {
    return JSON.stringify(this.serializeSchedules(schedules), null, 2);
  }

  /**
   * Import schedules from JSON string
   */
  importSchedules(jsonString: string): BusinessSchedule[] {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        return this.deserializeSchedules(parsed);
      }
      throw new Error('Invalid format: expected array');
    } catch (error) {
      console.error('Failed to import schedules:', error);
      throw error;
    }
  }
}

