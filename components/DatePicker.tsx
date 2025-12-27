import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export const DatePicker: React.FC<Props> = ({ selectedDate, onDateChange }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isToday = selectedDate.toDateString() === today.toDateString();

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date(today));
  };

  const formatDate = (date: Date): string => {
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];
    return `${month}월 ${day}일 (${weekday})`;
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputDate = new Date(e.target.value);
    if (!isNaN(inputDate.getTime())) {
      inputDate.setHours(0, 0, 0, 0);
      onDateChange(inputDate);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
      <button
        onClick={goToPreviousDay}
        className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
        aria-label="이전 날짜"
      >
        <ChevronLeft size={18} className="text-slate-600" />
      </button>

      <div className="flex-1 flex items-center gap-2">
        <Calendar size={18} className="text-blue-500" />
        <div className="flex flex-col">
          <span className="text-sm font-black text-slate-800">
            {formatDate(selectedDate)}
          </span>
          {isToday && (
            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">
              오늘
            </span>
          )}
        </div>
      </div>

      <input
        type="date"
        value={selectedDate.toISOString().split('T')[0]}
        onChange={handleDateInputChange}
        className="hidden"
        id="date-picker-input"
      />
      <label
        htmlFor="date-picker-input"
        className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        title="날짜 선택"
      >
        <Calendar size={18} className="text-slate-400" />
      </label>

      <button
        onClick={goToNextDay}
        className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
        aria-label="다음 날짜"
      >
        <ChevronRight size={18} className="text-slate-600" />
      </button>

      {!isToday && (
        <button
          onClick={goToToday}
          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-black hover:bg-blue-100 transition-colors"
        >
          오늘
        </button>
      )}
    </div>
  );
};

