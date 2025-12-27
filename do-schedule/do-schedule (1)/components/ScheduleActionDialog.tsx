
import React, { useState, useEffect } from 'react';
import { BusinessSchedule } from '../types';
import { X, Trash2, Save, Clock, Calendar as CalendarIcon, Bell, Volume2, Smartphone, Monitor, AlertTriangle, PauseCircle } from 'lucide-react';

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

  const updateField = (field: keyof BusinessSchedule, value: any) => {
    setForm(prev => prev ? { ...prev, [field]: value } : null);
    if (error) setError(null);
  };

  const getDateString = (d: Date) => {
    try { return new Date(d).toISOString().split('T')[0]; } 
    catch (e) { return new Date().toISOString().split('T')[0]; }
  };

  const getTimeString = (d: Date | null) => {
    if (!d) return "09:00";
    return new Date(d).toTimeString().slice(0, 5);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 flex flex-col">
        <div className="h-2 w-full bg-blue-600"></div>
        <div className="p-8 flex flex-col gap-8">
          <div className="space-y-2 text-center">
            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-widest">일정 정보</span>
            <input 
              type="text" 
              value={form.title}
              onChange={e => updateField('title', e.target.value)}
              className="w-full text-center text-2xl font-black text-slate-800 focus:outline-none placeholder:text-slate-200 border-b-2 border-transparent focus:border-blue-100 pb-2"
            />
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock size={12} className="text-blue-500" /> 시작
                </label>
                <input 
                  type="time"
                  value={getTimeString(form.startTime)}
                  onChange={e => {
                    const [h, m] = e.target.value.split(':').map(Number);
                    const nt = new Date(form.date); nt.setHours(h, m, 0, 0);
                    updateField('startTime', nt);
                  }}
                  className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock size={12} className="text-blue-500" /> 종료
                </label>
                <input 
                  type="time"
                  value={getTimeString(form.endTime)}
                  onChange={e => {
                    const [h, m] = e.target.value.split(':').map(Number);
                    const nt = new Date(form.date); nt.setHours(h, m, 0, 0);
                    updateField('endTime', nt);
                  }}
                  className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold"
                />
              </div>
            </div>
            {error && <div className="text-red-500 text-[10px] font-black bg-red-50 p-2 rounded-lg">{error}</div>}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100/50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${form.isReminded ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-400'}`}>
                  <Bell size={18} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800">시스템 알림</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.isReminded} onChange={e => updateField('isReminded', e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-orange-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>

            <div className="flex items-center gap-2 justify-center py-1">
              <button onClick={() => updateField('enableSound', !form.enableSound)} className={`px-3 py-2 rounded-full border text-[9px] font-black uppercase flex items-center gap-1.5 transition-all ${form.enableSound ? 'border-green-200 bg-green-50 text-green-700' : 'border-slate-100 bg-slate-50 text-slate-300'}`}>
                <Volume2 size={10}/> 기기 기본음
              </button>
              <button onClick={() => updateField('enableVibration', !form.enableVibration)} className={`px-3 py-2 rounded-full border text-[9px] font-black uppercase flex items-center gap-1.5 transition-all ${form.enableVibration ? 'border-purple-200 bg-purple-50 text-purple-700' : 'border-slate-100 bg-slate-50 text-slate-300'}`}>
                <Smartphone size={10}/> 진동
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 p-5 bg-blue-600 text-white rounded-[1.8rem] font-black shadow-xl shadow-blue-100 transition-transform active:scale-95">
              저장하기
            </button>
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 p-4 bg-slate-100 text-slate-500 rounded-2xl font-bold">닫기</button>
              {isExisting && <button onClick={() => onDelete(form.id)} className="p-4 bg-red-50 text-red-500 rounded-2xl"><Trash2 size={20}/></button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
