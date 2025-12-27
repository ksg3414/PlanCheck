import React, { useState, useEffect } from 'react';
import { BusinessSchedule } from '../types';
import { X, Trash2, Edit3, Save, Clock, Calendar as CalendarIcon, Bell, Volume2, Smartphone, Monitor, ChevronRight, PauseCircle, AlertTriangle } from 'lucide-react';

interface Props {
  schedule: BusinessSchedule | null;
  isOpen: boolean;
  isExisting: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (schedule: BusinessSchedule) => void;
}

export const ScheduleActionDialog: React.FC<Props> = ({
  schedule,
  isOpen,
  isExisting,
  onClose,
  onDelete,
  onUpdate,
}) => {
  const [form, setForm] = useState<BusinessSchedule | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && schedule) {
      setForm({ ...schedule });
      setError(null);
    }
  }, [isOpen, schedule]);

  if (!isOpen || !schedule || !form) return null;

  const handleSave = () => {
    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      setError("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }
    onUpdate(form);
  };

  const handleHold = () => {
    const updatedForm = { ...form, startTime: null, endTime: null };
    onUpdate(updatedForm);
  };

  const updateField = (field: keyof BusinessSchedule, value: any) => {
    setForm(prev => prev ? { ...prev, [field]: value } : null);
    if (error) setError(null);
  };

  const getDateString = (d: Date) => {
    try {
      return new Date(d).toISOString().split('T')[0];
    } catch (e) {
      return new Date().toISOString().split('T')[0];
    }
  };

  const getTimeString = (d: Date | null) => {
    if (!d) return "09:00";
    const date = new Date(d);
    return date.toTimeString().slice(0, 5);
  };

  /**
   * 종료 시간의 최소 선택 가능 시간을 반환합니다.
   * 시작 시간의 1분 후를 반환하여 시작 시간을 포함한 이전 시간이 시계에서 터치되지 않게 합니다.
   */
  const getMinEndTimeLimit = () => {
    if (!form.startTime) return "00:01";
    const minEnd = new Date(form.startTime.getTime() + 60000); // 시작 1분 후
    return minEnd.toTimeString().slice(0, 5);
  };

  const handleTimeChange = (type: 'start' | 'end', timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const newTime = new Date(form.date);
    newTime.setHours(h, m, 0, 0);

    if (type === 'start') {
      let newEnd = form.endTime ? new Date(form.endTime) : null;
      // 시작 시간 변경 시 종료 시간이 그 이전이면 강제로 +1시간 조정
      if (!newEnd || newTime >= newEnd) {
        newEnd = new Date(newTime.getTime() + 60 * 60 * 1000); 
      }
      setForm(prev => prev ? { ...prev, startTime: newTime, endTime: newEnd } : null);
      setError(null);
    } else {
      // min 속성으로 1차 방어하지만, 로직으로도 한 번 더 검증
      if (form.startTime && newTime <= form.startTime) {
        setError("종료 시간은 시작 시간 이후여야 합니다.");
      } else {
        setError(null);
      }
      updateField('endTime', newTime);
    }
  };

  const handleDateChange = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const newDate = new Date(y, m - 1, d);
    
    const updates: any = { date: newDate };
    if (form.startTime) {
      const ns = new Date(newDate);
      ns.setHours(form.startTime.getHours(), form.startTime.getMinutes());
      updates.startTime = ns;
    }
    if (form.endTime) {
      const ne = new Date(newDate);
      ne.setHours(form.endTime.getHours(), form.endTime.getMinutes());
      updates.endTime = ne;
    }
    setForm(prev => prev ? { ...prev, ...updates } : null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 flex flex-col">
        <div className="h-2 w-full bg-blue-600"></div>

        <div className="p-8 flex flex-col gap-8">
          <div className="space-y-2 text-center">
            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-widest">일정 정보 설정</span>
            <input 
              type="text" 
              value={form.title}
              onChange={e => updateField('title', e.target.value)}
              placeholder="일정 제목을 입력하세요"
              className="w-full text-center text-2xl font-black text-slate-800 focus:outline-none placeholder:text-slate-200 border-b-2 border-transparent focus:border-blue-100 pb-2"
            />
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <CalendarIcon size={12} className="text-blue-500" /> 날짜
              </label>
              <input 
                type="date"
                value={getDateString(form.date)}
                onChange={e => handleDateChange(e.target.value)}
                className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <Clock size={12} className="text-blue-500" /> 시작
                </label>
                <input 
                  type="time"
                  value={getTimeString(form.startTime)}
                  onChange={e => handleTimeChange('start', e.target.value)}
                  className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <Clock size={12} className="text-blue-500" /> 종료
                </label>
                <input 
                  type="time"
                  min={getMinEndTimeLimit()} // 핵심 요구사항: 시작 시간 포함 이전 시간 비활성화
                  value={getTimeString(form.endTime)}
                  onChange={e => handleTimeChange('end', e.target.value)}
                  className={`w-full bg-slate-50 p-4 rounded-2xl border text-sm font-bold outline-none transition-colors ${error ? 'border-red-300 bg-red-50 text-red-600' : 'border-slate-200 focus:border-blue-400'}`}
                />
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl animate-pulse">
                <AlertTriangle size={14} />
                <span className="text-[11px] font-black">{error}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100/50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-colors ${form.isReminded ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-400'}`}>
                  <Bell size={18} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800">리마인드</p>
                  {form.isReminded && (
                    <select 
                      value={form.remindBeforeMinutes}
                      onChange={e => updateField('remindBeforeMinutes', Number(e.target.value))}
                      className="text-[10px] font-bold text-slate-400 bg-transparent outline-none"
                    >
                      <option value={5}>5분 전</option>
                      <option value={10}>10분 전</option>
                      <option value={15}>15분 전</option>
                      <option value={30}>30분 전</option>
                      <option value={60}>1시간 전</option>
                    </select>
                  )}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.isReminded} onChange={e => updateField('isReminded', e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-orange-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>

            <div className="flex items-center gap-2 justify-center py-1">
              <button onClick={() => updateField('enableSound', !form.enableSound)} className={`px-3 py-2 rounded-full border text-[9px] font-black uppercase flex items-center gap-1.5 transition-all ${form.enableSound ? 'border-green-200 bg-green-50 text-green-700' : 'border-slate-100 bg-slate-50 text-slate-300'}`}><Volume2 size={10}/> Sound</button>
              <button onClick={() => updateField('enableVibration', !form.enableVibration)} className={`px-3 py-2 rounded-full border text-[9px] font-black uppercase flex items-center gap-1.5 transition-all ${form.enableVibration ? 'border-purple-200 bg-purple-50 text-purple-700' : 'border-slate-100 bg-slate-50 text-slate-300'}`}><Smartphone size={10}/> Vibrate</button>
              <button onClick={() => updateField('enablePopup', !form.enablePopup)} className={`px-3 py-2 rounded-full border text-[9px] font-black uppercase flex items-center gap-1.5 transition-all ${form.enablePopup ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-300'}`}><Monitor size={10}/> Popup</button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button onClick={handleHold} className="flex-1 flex items-center justify-center gap-2 p-5 bg-amber-50 text-amber-600 rounded-[1.8rem] font-black border border-amber-100 transition-colors active:bg-amber-100">
                <PauseCircle size={18} />
                <span>보류</span>
              </button>
              <button onClick={handleSave} className="flex-[2] flex items-center justify-center gap-2 p-5 bg-blue-600 text-white rounded-[1.8rem] font-black shadow-xl shadow-blue-100 transition-transform active:scale-95">
                <Save size={18} />
                <span>저장</span>
              </button>
            </div>
            
            <div className="flex gap-3">
              <button onClick={onClose} className={`p-5 bg-slate-50 text-slate-500 rounded-[1.8rem] font-bold text-sm transition-colors active:bg-slate-100 ${isExisting ? 'flex-1' : 'w-full'}`}>
                닫기
              </button>
              {isExisting && (
                <button onClick={() => onDelete(form.id)} className="flex items-center justify-center w-16 bg-red-50 text-red-600 rounded-[1.8rem] border border-red-100 transition-colors active:bg-red-100">
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};