import React, { useRef, useState, useEffect } from 'react';
import { BusinessSchedule } from '../types';
import { GripVertical, Clock } from 'lucide-react';

interface Props {
  schedule: BusinessSchedule;
  hourHeight: number;
  isFocused: boolean;
  onDragEnd: (schedule: BusinessSchedule, newStart: Date) => void;
  onResizeEnd: (schedule: BusinessSchedule, newDurationMinutes: number) => void;
  onClick: (schedule: BusinessSchedule) => void;
  onLongPress: (schedule: BusinessSchedule) => void;
}

const DraggableScheduleCard: React.FC<Props> = ({
  schedule,
  hourHeight,
  isFocused,
  onDragEnd,
  onResizeEnd,
  onClick,
  onLongPress
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const [currentTop, setCurrentTop] = useState(0);
  const [currentHeight, setCurrentHeight] = useState(0);

  const startYRef = useRef<number>(0);
  const startXRef = useRef<number>(0);
  const startTopRef = useRef<number>(0);
  const startHeightRef = useRef<number>(0);

  const snapToMinutes = (pixels: number): number => {
    const rawMinutes = (pixels / hourHeight) * 60;
    // Snap to 10 minutes as requested for detail
    return Math.round(rawMinutes / 10) * 10;
  };

  useEffect(() => {
    if (!schedule.startTime || !schedule.endTime) return;
    const startMinutes = schedule.startTime.getHours() * 60 + schedule.startTime.getMinutes();
    const durationMinutes = (schedule.endTime.getTime() - schedule.startTime.getTime()) / (1000 * 60);
    setCurrentTop((startMinutes / 60) * hourHeight);
    setCurrentHeight((durationMinutes / 60) * hourHeight);
  }, [schedule, hourHeight]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    startYRef.current = e.clientY;
    startXRef.current = e.clientX;
    startTopRef.current = currentTop;
    
    let isDragStarted = false;
    let longPressTriggered = false;

    const timer = setTimeout(() => {
      if (!isDragStarted) {
        longPressTriggered = true;
        onLongPress(schedule);
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
      }
    }, 600);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const moveY = moveEvent.clientY;
      const moveX = moveEvent.clientX;
      
      if (!isDragStarted) {
        const dist = Math.sqrt(Math.pow(moveX - startXRef.current, 2) + Math.pow(moveY - startYRef.current, 2));
        if (dist > 8) {
          isDragStarted = true;
          clearTimeout(timer);
          setIsDragging(true);
        }
      }

      if (isDragStarted) {
        const deltaY = moveY - startYRef.current;
        setCurrentTop(startTopRef.current + deltaY);
      }
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      clearTimeout(timer);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      
      if (isDragStarted) {
        setIsDragging(false);
        const deltaY = upEvent.clientY - startYRef.current;
        const finalRawTop = startTopRef.current + deltaY;
        const totalMinutes = snapToMinutes(finalRawTop);
        const newHour = Math.floor(totalMinutes / 60);
        const newMinute = totalMinutes % 60;
        const newStart = new Date(schedule.startTime!);
        newStart.setHours(newHour, newMinute, 0, 0);
        onDragEnd(schedule, newStart);
      } else if (!longPressTriggered) {
        if (onClick) onClick(schedule);
      }
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    startYRef.current = e.clientY;
    startHeightRef.current = currentHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startYRef.current;
      setCurrentHeight(Math.max(20, startHeightRef.current + deltaY)); 
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setIsResizing(false);
      const deltaY = upEvent.clientY - startYRef.current;
      const finalRawHeight = startHeightRef.current + deltaY;
      const durationMinutes = snapToMinutes(finalRawHeight);
      onResizeEnd(schedule, Math.max(10, durationMinutes)); 
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (!schedule.startTime) return null;

  return (
    <div
      style={{
        top: `${currentTop}px`,
        height: `${currentHeight}px`,
        left: '70px',
        right: '12px',
        touchAction: 'none'
      }}
      className={`absolute rounded-xl border shadow-lg select-none transition-all duration-300 
        ${isDragging ? 'z-50 scale-105 opacity-90 cursor-grabbing bg-blue-50 border-blue-500 ring-4 ring-blue-500/20' : 'z-10 bg-white border-slate-200'}
        ${isFocused ? 'ring-2 ring-blue-400 border-blue-400 shadow-blue-100' : 'hover:border-blue-300'}
        ${isResizing ? 'cursor-ns-resize' : ''}
      `}
    >
      <div 
        className="h-full w-full p-3 flex flex-col relative group cursor-grab active:cursor-grabbing overflow-hidden"
        onPointerDown={handlePointerDown}
      >
        <div className="flex items-start gap-3 pointer-events-none">
          <div className={`w-1.5 h-full min-h-[2rem] rounded-full transition-colors ${isFocused ? 'bg-blue-600' : 'bg-blue-400'}`}></div>
          <div className="flex flex-col flex-1 overflow-hidden">
            <h3 className={`font-bold text-slate-800 transition-all ${isFocused ? 'text-lg leading-tight' : 'text-base leading-snug'} truncate`}>
              {schedule.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-slate-500">
              <Clock size={12} className={isFocused ? 'text-blue-500' : ''} />
              <span className={`font-medium ${isFocused ? 'text-xs' : 'text-[10px]'}`}>
                {schedule.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})} - 
                {schedule.endTime?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
              </span>
            </div>
          </div>
        </div>
        
        {/* Resize Handle */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-6 cursor-ns-resize flex justify-center items-end pb-1.5 hover:bg-slate-50/80 opacity-0 group-hover:opacity-100 transition-opacity"
          onMouseDown={handleResizeStart}
        >
          <GripVertical size={16} className="text-slate-300 rotate-90" />
        </div>
      </div>
    </div>
  );
};

export default DraggableScheduleCard;