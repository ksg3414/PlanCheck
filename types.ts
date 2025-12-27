
export enum ScheduleStatus {
  SpecificTime = 'SpecificTime',
  Undecided = 'Undecided'
}

export interface BusinessSchedule {
  id: string;
  title: string;
  date: Date;
  startTime: Date | null; 
  endTime: Date | null;
  isReminded: boolean;
  remindBeforeMinutes: number;
  
  // Notification Settings
  enableVibration: boolean;
  enableSound: boolean; // true일 경우 시스템 기본 알림음 재생
  enablePopup: boolean;
}
