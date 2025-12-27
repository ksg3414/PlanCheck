import React, { useState, useRef, useEffect } from 'react';
import { BusinessSchedule } from '../types';
import DraggableScheduleCard from './DraggableScheduleCard';

interface Props {
  schedules: BusinessSchedule[];
  onScheduleUpdate: (updated: BusinessSchedule) => void;
  onAddSchedule: (date: Date) => void;
  onLongPressSchedule: (schedule: BusinessSchedule) => void;
  onCardTap: (schedule: BusinessSchedule) => void;
}

const ZoomableTimeline: React.FC<Props> = ({ schedules, onScheduleUpdate, onAddSchedule, onLongPressSchedule, onCardTap }) => {
  const [hourHeight, setHourHeight] = useState(80.0);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const minHeight = 50.0;
  const maxHeight = 300.0; 

  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const timelineSchedules = schedules.filter(s => s.startTime && s.endTime);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.2;
      setHourHeight(prev => Math.min(maxHeight, Math.max(minHeight, prev + delta)));
    }
  };

  const handleCardClick = (schedule: BusinessSchedule) => {
    setFocusedId(schedule.id);
    
    // 1. Auto-zoom to show 10-minute detail
    const targetZoom = 200.0;
    setHourHeight(targetZoom);

    // 2. Smooth scroll to the focused card
    if (containerRef.current && schedule.startTime) {
      const startMinutes = schedule.startTime.getHours() * 60 + schedule.startTime.getMinutes();
      const scrollPos = (startMinutes / 60) * targetZoom - 150; 
      containerRef.current.scrollTo({
        top: scrollPos,
        behavior: 'smooth'
      });
    }

    // 3. Trigger detailed pop-up (requested feature)
    setTimeout(() => {
        onCardTap(schedule);
    }, 400); // Small delay to let scroll finish/feel better
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.schedule-card')) return;
    setFocusedId(null);

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickY = e.clientY - rect.top + (containerRef.current?.scrollTop || 0);
    
    longPressTimer.current = setTimeout(() => {
      const totalMinutes = (clickY / hourHeight) * 60;
      const hour = Math.floor(totalMinutes / 60);
      const minutes = Math.floor((totalMinutes % 60) / 10) * 10;
      const newDate = new Date();
      newDate.setHours(hour, minutes, 0, 0);
      onAddSchedule(newDate);
    }, 800);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDragEnd = (schedule: BusinessSchedule, newStart: Date) => {
    const originalDuration = schedule.endTime!.getTime() - schedule.startTime!.getTime();
    const newEnd = new Date(newStart.getTime() + originalDuration);
    onScheduleUpdate({ ...schedule, startTime: newStart, endTime: newEnd });
  };

  const handleResizeEnd = (schedule: BusinessSchedule, newDurationMinutes: number) => {
    const newEnd = new Date(schedule.startTime!.getTime() + newDurationMinutes * 60000);
    onScheduleUpdate({ ...schedule, endTime: newEnd });
  };

  useEffect(() => {
    const preventDefault = (e: WheelEvent) => { if (e.ctrlKey) e.preventDefault(); };
    const ref = containerRef.current;
    if (ref) ref.addEventListener('wheel', preventDefault, { passive: false });
    return () => { if (ref) ref.removeEventListener('wheel', preventDefault); };
  }, []);

  const show30Min = hourHeight > 100;
  const show10Min = hourHeight > 180;

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      <div className="absolute top-4 left-20 z-20 pointer-events-none">
        <h2 className="text-xl font-bold text-slate-800/20 uppercase tracking-widest">TIMELINE</h2>
      </div>

      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 shadow-sm border border-slate-100 flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
          DETAIL ZOOM: {Math.round((hourHeight / minHeight) * 100)}%
        </div>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto relative no-scrollbar"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="relative w-full"
          style={{ height: `${hourHeight * 24}px` }}
        >
          {Array.from({ length: 24 }).map((_, i) => (
            <React.Fragment key={i}>
              <div 
                className="absolute w-full border-b border-slate-200 flex items-start group"
                style={{ top: `${i * hourHeight}px`, height: `${hourHeight}px` }}
              >
                <div className="w-[60px] text-right pr-4 text-xs font-bold text-slate-400 -mt-2.5 transition-all group-hover:text-blue-500 group-hover:scale-110">
                  {i.toString().padStart(2, '0')}:00
                </div>
                
                {show10Min && [10, 20, 30, 40, 50].map(m => (
                  <div 
                    key={m}
                    className="absolute left-[60px] right-0 border-t border-slate-100/50"
                    style={{ top: `${(m / 60) * 100}%` }}
                  >
                    <span className="absolute -left-8 -top-2 text-[8px] font-medium text-slate-300">:{m}</span>
                  </div>
                ))}

                {show30Min && !show10Min && (
                  <div 
                    className="absolute left-[60px] right-0 border-t border-slate-200/50 border-dashed"
                    style={{ top: '50%' }}
                  >
                     <span className="absolute -left-8 -top-2 text-[9px] font-medium text-slate-300">:30</span>
                  </div>
                )}
              </div>
            </React.Fragment>
          ))}

          <CurrentTimeLine hourHeight={hourHeight} />

          {timelineSchedules.map(schedule => (
            <div key={schedule.id} className="schedule-card"> 
              <DraggableScheduleCard 
                schedule={schedule}
                hourHeight={hourHeight}
                isFocused={focusedId === schedule.id}
                onDragEnd={handleDragEnd}
                onResizeEnd={handleResizeEnd}
                onClick={handleCardClick}
                onLongPress={onLongPressSchedule}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CurrentTimeLine = ({ hourHeight }: { hourHeight: number }) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);
  const totalMinutes = now.getHours() * 60 + now.getMinutes();
  const top = (totalMinutes / 60) * hourHeight;
  return (
    <div className="absolute left-0 right-0 z-40 pointer-events-none flex items-center" style={{ top: `${top}px` }}>
      <div className="w-[60px] text-right pr-4 text-[10px] font-black text-red-500 bg-slate-50 shadow-sm rounded-r">
        {now.getHours()}:{now.getMinutes().toString().padStart(2, '0')}
      </div>
      <div className="flex-1 h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)] relative">
        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>
      </div>
    </div>
  );
}

export default ZoomableTimeline;