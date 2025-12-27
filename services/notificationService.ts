
import { BusinessSchedule } from '../types';

export class NotificationService {
  private activeTimers: Map<string, number> = new Map();

  constructor() {
    this.checkStatus();
  }

  async checkStatus() {
    if (!('Notification' in window)) {
      console.warn("This browser does not support notifications.");
      return 'unsupported';
    }
    return Notification.permission;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) return 'denied';
    const permission = await Notification.requestPermission();
    return permission;
  }

  syncAllSchedules(schedules: BusinessSchedule[]) {
    this.activeTimers.forEach(timerId => clearTimeout(timerId));
    this.activeTimers.clear();

    schedules.forEach(schedule => {
      if (schedule.isReminded && schedule.startTime) {
        this.scheduleNotification(schedule);
      }
    });
  }

  private scheduleNotification(schedule: BusinessSchedule) {
    if (!schedule.startTime) return;

    const now = new Date().getTime();
    const startTime = new Date(schedule.startTime).getTime();
    const remindTime = startTime - (schedule.remindBeforeMinutes * 60 * 1000);
    const delay = remindTime - now;

    if (delay > 0) {
      const timerId = window.setTimeout(() => {
        this.triggerNotification(schedule);
      }, delay);
      this.activeTimers.set(schedule.id, timerId);
    }
  }

  private async triggerNotification(schedule: BusinessSchedule) {
    if (Notification.permission !== 'granted') return;

    const title = `[PlanCheck] ${schedule.title}`;
    const options: any = {
      body: `${schedule.remindBeforeMinutes}분 후 일정이 시작됩니다.`,
      icon: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png',
      badge: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png',
      vibrate: schedule.enableVibration ? [200, 100, 200] : undefined,
      
      // 기기(OS)에 내장된 알림음을 사용하려면 silent를 false로 설정해야 합니다.
      // 사용자가 기기 설정에서 무음 모드가 아닐 경우 기기 기본음이 출력됩니다.
      silent: !schedule.enableSound, 
      
      tag: schedule.id,
      requireInteraction: true
    };

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, options);
      } else {
        new Notification(title, options);
      }
    } catch (error) {
      console.error("Failed to trigger notification", error);
    }
  }
}
