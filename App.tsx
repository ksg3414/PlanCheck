
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { BusinessSchedule } from './types';
import { NotificationService } from './services/notificationService';
import { ScheduleActionDialog } from './components/ScheduleActionDialog';
import { GlobalSettingsDialog } from './components/GlobalSettingsDialog';
import { 
  Calendar, 
  CheckCircle2, 
  Plus, 
  Clock, 
  AlertCircle, 
  ChevronRight,
  Bell,
  Settings,
  Trash2,
  Download,
  BellOff,
  CalendarOff
} from 'lucide-react';

const SwipeableScheduleItem: React.FC<{
  schedule: BusinessSchedule;
  onOpenDetail: (s: BusinessSchedule) => void;
  onDelete: (id: string) => void;
}> = ({ schedule, onOpenDetail, onDelete }) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  
  const maxSwipe = window.innerWidth / 5;
  const threshold = maxSwipe * 0.9;

  const handlePointerDown = (e: React.PointerEvent) => {
    startXRef.current = e.clientX;
    setIsDragging(true);
    if ((e.target as HTMLElement).closest('button')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const diff = e.clientX - startXRef.current;
    if (diff > 0) setOffsetX(Math.min(diff, maxSwipe));
    else setOffsetX(0);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);

    if (offsetX >= threshold) {
      setOffsetX(window.innerWidth); 
      setTimeout(() => onDelete(schedule.id), 300);
    } else {
      setOffsetX(0);
      if (Math.abs(e.clientX - startXRef.current) < 5) onOpenDetail(schedule);
    }
  };

  const progress = Math.min(offsetX / maxSwipe, 1);
  const isAtLimit = progress >= 0.95;
  const isUndecided = schedule.startTime === null;
  
  return (
    <div className="relative overflow-hidden ml-6 mb-4 select-none">
      <div 
        className="absolute inset-0 flex items-center justify-start pl-8 rounded-l-[2.5rem]"
        style={{ backgroundColor: isAtLimit ? '#ef4444' : `rgba(239, 68, 68, ${0.1 + progress * 0.8})` }}
      >
        <div 
          className="flex flex-col items-center gap-1 text-white"
          style={{ opacity: progress > 0.2 ? 1 : 0, transform: `scale(${0.7 + progress * 0.5})` }}
        >
          <Trash2 size={24} fill="currentColor" />
          <span className="text-[10px] font-black uppercase tracking-widest">Delete</span>
        </div>
      </div>

      <div 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ transform: `translateX(${offsetX}px)` }}
        className={`bg-white border-y border-l border-slate-100 p-5 pl-7 rounded-l-[2.5rem] shadow-[-8px_8px_20px_rgba(0,0,0,0.02)] transition-transform duration-100 ease-out cursor-grab active:cursor-grabbing flex items-center gap-3 relative z-10 touch-none ${isUndecided ? 'border-l-amber-200' : 'border-l-blue-100'}`}
      >
        <div className="flex flex-col items-center justify-center min-w-[65px] border-r border-slate-100 pr-3 shrink-0 pointer-events-none">
          {isUndecided ? (
            <CalendarOff size={20} className="text-amber-400" />
          ) : (
            <span className="text-sm font-black text-blue-600">
              {new Date(schedule.startTime!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
            </span>
          )}
          <span className="text-[9px] font-black text-slate-300 mt-0.5 uppercase tracking-tighter">{isUndecided ? "HOLD" : "START"}</span>
        </div>
        
        <div className="flex-1 min-w-0 pointer-events-none">
          <h3 className="text-lg font-black text-slate-800 truncate">{schedule.title || "제목 없음"}</h3>
          <div className="flex items-center gap-2.5 mt-1.5 overflow-x-hidden">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
              <Clock size={12} />
              <span>
                {isUndecided ? "시간 미정" : `${new Date(schedule.startTime!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})} - ${new Date(schedule.endTime!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}`}
              </span>
            </div>
            {schedule.isReminded && !isUndecided && (
              <div className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight shrink-0">
                <Bell size={10} /> {schedule.remindBeforeMinutes}M
              </div>
            )}
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-200" />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [schedules, setSchedules] = useState<BusinessSchedule[]>([]);
  const [notificationService] = useState(() => new NotificationService());
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isGlobalNotificationEnabled, setIsGlobalNotificationEnabled] = useState(true);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [globalSound, setGlobalSound] = useState(true);
  const [globalVibration, setGlobalVibration] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<BusinessSchedule | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (isGlobalNotificationEnabled && notificationPermission === 'granted') {
      notificationService.syncAllSchedules(schedules);
    } else {
      notificationService.syncAllSchedules([]); 
    }
  }, [schedules, isGlobalNotificationEnabled, notificationPermission, notificationService]);

  useEffect(() => {
    const initApp = async () => {
      const permission = await notificationService.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        setIsGlobalNotificationEnabled(true);
      }
    };
    initApp();

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // 초기 예시 데이터
    const today = new Date();
    setSchedules([{
      id: uuidv4(),
      title: "비즈니스 주간 리포트 미팅",
      date: today,
      startTime: new Date(new Date(today).setHours(9, 0, 0, 0)),
      endTime: new Date(new Date(today).setHours(10, 0, 0, 0)),
      isReminded: true,
      remindBeforeMinutes: 15,
      enableSound: true,
      enablePopup: true,
      enableVibration: true
    }]);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleRequestPermission = async () => {
    const permission = await notificationService.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') setIsGlobalNotificationEnabled(true);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const scheduledItems = useMemo(() => {
    return schedules
      .filter(s => s.startTime !== null)
      .sort((a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime());
  }, [schedules]);

  const undecidedItems = useMemo(() => {
    return schedules.filter(s => s.startTime === null);
  }, [schedules]);

  const handleSaveSchedule = (updated: BusinessSchedule) => {
    setSchedules(prev => {
      const exists = prev.find(s => s.id === updated.id);
      return exists ? prev.map(s => s.id === updated.id ? updated : s) : [...prev, updated];
    });
    setLastMessage(updated.startTime === null ? "보류함에 저장되었습니다." : "일정이 동기화되었습니다.");
    setTimeout(() => setLastMessage(null), 3000);
    setEditingSchedule(null);
  };

  const handleScheduleDelete = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    setLastMessage("일정이 삭제되었습니다.");
    setTimeout(() => setLastMessage(null), 3000);
    setEditingSchedule(null);
  };

  const handleAddNew = () => {
    const now = new Date();
    setEditingSchedule({
      id: uuidv4(),
      title: "",
      date: now,
      startTime: new Date(new Date(now).setMinutes(0, 0, 0)),
      endTime: new Date(new Date(now).getTime() + 60 * 60 * 1000), 
      isReminded: true,
      remindBeforeMinutes: 10,
      enableSound: globalSound,
      enablePopup: true,
      enableVibration: globalVibration
    });
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800 overflow-x-hidden">
      <header className="bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-lg shadow-blue-100">
            <Calendar size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">PlanCheck</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Professional Scheduler</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {deferredPrompt && (
            <button onClick={handleInstallClick} className="p-3 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all flex items-center gap-2">
              <Download size={18} />
              <span className="hidden md:inline text-xs font-black">앱 설치</span>
            </button>
          )}
          <button onClick={() => setIsSettingsOpen(true)} className="p-3 text-slate-400 hover:text-slate-600 rounded-xl transition-colors">
            <Settings size={22} />
          </button>
          <button 
            onClick={handleAddNew} 
            className="flex items-center justify-center gap-1.5 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-black text-sm shadow-lg shadow-slate-200 whitespace-nowrap transition-transform active:scale-95"
          >
            <Plus size={16} /> 
            <span>추가</span>
          </button>
        </div>
      </header>

      {notificationPermission === 'denied' && (
        <div className="px-6 py-3 bg-red-50 text-red-700 flex items-center justify-between gap-4 animate-fade-in border-b border-red-100">
          <div className="flex items-center gap-2 text-[11px] font-bold">
            <BellOff size={14} />
            <span>시스템 알림 권한이 차단되었습니다. 브라우저 설정에서 허용해주세요.</span>
          </div>
        </div>
      )}

      {lastMessage && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-slate-900/95 text-white px-6 py-3 rounded-full shadow-2xl z-[60] flex items-center gap-3 border border-white/10 animate-fade-in-down">
          <CheckCircle2 size={18} className="text-green-400" />
          <span className="text-sm font-bold">{lastMessage}</span>
        </div>
      )}

      <main className="flex-1 overflow-y-auto pt-8 pb-20 no-scrollbar">
        <div className="max-w-4xl mx-auto space-y-12">
          <section className="space-y-5">
            <div className="px-6 flex items-center justify-between">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={14} className="text-blue-500" /> 오늘 일정 ({scheduledItems.length})</h2>
            </div>
            <div className="flex flex-col">
              {scheduledItems.length > 0 ? (
                scheduledItems.map(s => <SwipeableScheduleItem key={s.id} schedule={s} onOpenDetail={setEditingSchedule} onDelete={handleScheduleDelete} />)
              ) : (
                <div className="px-6 py-10 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem] mx-6">
                  <p className="text-slate-300 font-bold text-sm">등록된 일정이 없습니다.</p>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-5">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-6 flex items-center gap-2"><AlertCircle size={14} className="text-amber-500" /> 보류됨 ({undecidedItems.length})</h2>
            <div className="flex flex-col">
              {undecidedItems.length > 0 ? (
                undecidedItems.map(s => <SwipeableScheduleItem key={s.id} schedule={s} onOpenDetail={setEditingSchedule} onDelete={handleScheduleDelete} />)
              ) : (
                <div className="px-6 py-10 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem] mx-6">
                  <p className="text-slate-300 font-bold text-sm">보류된 일정이 없습니다.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {editingSchedule && (
        <ScheduleActionDialog 
          schedule={editingSchedule} isOpen={!!editingSchedule} isExisting={schedules.some(s => s.id === editingSchedule.id)}
          onClose={() => setEditingSchedule(null)} onDelete={handleScheduleDelete} onUpdate={handleSaveSchedule}
        />
      )}

      <GlobalSettingsDialog 
        isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}
        soundEnabled={globalSound} vibrationEnabled={globalVibration}
        notificationEnabled={isGlobalNotificationEnabled}
        notificationPermission={notificationPermission}
        onToggleSound={() => setGlobalSound(!globalSound)} 
        onToggleVibration={() => setGlobalVibration(!globalVibration)}
        onToggleNotification={() => {
            if (notificationPermission === 'default') {
                handleRequestPermission();
            } else {
                setIsGlobalNotificationEnabled(!isGlobalNotificationEnabled);
            }
        }}
      />
    </div>
  );
};

export default App;
