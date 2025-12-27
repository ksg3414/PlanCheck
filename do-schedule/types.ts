
export enum ScheduleStatus {
  SpecificTime = 'SpecificTime',
  Undecided = 'Undecided'
}

// Added CommandType enum to resolve errors in services/voiceService.ts and components/VoiceControl.tsx
export enum CommandType {
  Add = 'Add',
  Delete = 'Delete',
  Modify = 'Modify'
}

export interface BusinessSchedule {
  id: string;
  title: string;
  date: Date;
  startTime: Date | null; // null if Undecided
  endTime: Date | null;
  isReminded: boolean;
  remindBeforeMinutes: number;
  
  // Notification Settings
  enableVibration: boolean;
  enableSound: boolean;
  enablePopup: boolean;
  soundFileName: string;
}
