
import { BusinessSchedule } from '../types';

export class NotificationService {
  private activeTimers: Map<string, number> = new Map();

  constructor() {
    // 생성 시점에서는 권한 확인만 수행
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
    if (permission === 'granted') {
      console.log('Notification permission granted.');
    }
    return permission;
  }

  /**
   * 모든 일정의 리마인드를 재설정합니다.
   */
  syncAllSchedules(schedules: BusinessSchedule[]) {
    // 기존 타이머 클리어
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

    // 이미 지난 시간은 예약하지 않음
    if (delay > 0) {
      const timerId = window.setTimeout(() => {
        this.triggerNotification(schedule);
      }, delay);
      this.activeTimers.set(schedule.id, timerId);
    }
  }

  private async triggerNotification(schedule: BusinessSchedule) {
    if (Notification.permission !== 'granted') {
      console.warn("Notification permission not granted. Cannot show alert.");
      return;
    }

    const title = `[Do-Schedule] ${schedule.title}`;
    // Using any type to bypass strict NotificationOptions check for modern properties like vibrate, badge, and silent.
    // This fixes the error: Object literal may only specify known properties, and 'vibrate' does not exist in type 'NotificationOptions'.
    const options: any = {
      body: `${schedule.remindBeforeMinutes}분 후 일정이 시작됩니다.`,
      icon: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png',
      badge: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png',
      vibrate: schedule.enableVibration ? [200, 100, 200] : undefined,
      silent: !schedule.enableSound,
      tag: schedule.id, // 중복 알림 방지
      requireInteraction: true // 사용자가 닫을 때까지 유지
    };

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, options);
      } else {
        new Notification(title, options);
      }

      if (schedule.enableSound) {
        this.playAlertSound();
      }
    } catch (error) {
      console.error("Failed to trigger notification", error);
    }
  }

  private playAlertSound() {
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    audio.play().catch(e => console.warn("Audio play blocked by browser policy.", e));
  }
}
