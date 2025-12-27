
import React, { useState, useEffect } from 'react';
import { BusinessSchedule } from '../types';
import { X, Trash2, Save, Clock, Calendar as CalendarIcon, Bell, Volume2, Smartphone, Monitor, AlertTriangle, PauseCircle, CalendarOff } from 'lucide-react';

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
  const [isUndecided, setIsUndecided] = useState(false);

  useEffect(() => {
    if (isOpen && schedule) {
      setForm({ ...schedule });
      setIsUndecided(schedule.startTime === null);
      setError(null);
    }
  }, [isOpen, schedule]);

  if (!isOpen || !schedule || !form) return null;

  const handleSave = () => {
    const finalForm = { ...form };
    if (isUndecided) {
      finalForm.startTime = null;
      finalForm.endTime = null;
      finalForm.isReminded = false; // 보류 상태에서는 알림 비활성화
    } else {
      if (finalForm.startTime && finalForm.endTime && finalForm.startTime >= finalForm.endTime) {
        setError("종료 시간은 시작 시간보다 늦어야 합니다.");
        return;
      }
      if (!finalForm.startTime) {
        setError("시작 시간을 설정하거나 '보류'를 선택해주세요.");
        return;
      }
    }
    onUpdate(finalForm);
  };

  const updateField = (field: keyof BusinessSchedule, value: any) => {
    setForm(prev => prev ? { ...prev, [field]: value } : null);
    if (error) setError(null);
  };

  const getTimeString = (d: Date | null) => {
    if (!d) return "09:00";
    return new Date(d).toTimeString().slice(0, 5);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 flex flex-col">
        <div className="h-2 w-full bg-blue-600"></div>
        <div className="p-8 flex flex-col gap-6">
          <div className="space-y-2 text-center">
            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-widest">일정 정보</span>
            <input 
              type="text" 
              value={form.title}
              placeholder="일정 제목을 입력하세요"
              onChange={e => updateField('title', e.target.value)}
              className="w-full text-center text-2xl font-black text-slate-800 focus:outline-none placeholder:text-slate-200 border-b-2 border-transparent focus:border-blue-100 pb-2"
            />
          </div>

          {/* 보류(시간 미정) 토글 */}
          <div className="flex items-center justify-between p-4 bg-amber-50/50 border border-amber-100 rounded-2xl transition-all">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isUndecided ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                <CalendarOff size={18} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-800">시간 미정 (보류)</p>
                <p className="text-[9px] font-bold text-slate-400">시간 설정 없이 목록에 저장</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={isUndecided} onChange={e => setIsUndecided(e.target.checked)} className="sr-only peer" />
              <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-amber-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>

          <div className={`space-y-4 transition-all duration-300 ${isUndecided ? 'opacity-30 pointer-events-none scale-95' : 'opacity-100'}`}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock size={12} className="text-blue-500" /> 시작
                </label>
                <input 
                  type="time"
                  disabled={isUndecided}
                  value={getTimeString(form.startTime)}
                  onChange={e => {
                    const [h, m] = e.target.value.split(':').map(Number);
                    const nt = new Date(form.date); nt.setHours(h, m, 0, 0);
                    updateField('startTime', nt);
                  }}
                  className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock size={12} className="text-blue-500" /> 종료
                </label>
                <input 
                  type="time"
                  disabled={isUndecided}
                  value={getTimeString(form.endTime)}
                  onChange={e => {
                    const [h, m] = e.target.value.split(':').map(Number);
                    const nt = new Date(form.date); nt.setHours(h, m, 0, 0);
                    updateField('endTime', nt);
                  }}
                  className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
            </div>
            {error && <div className="text-red-500 text-[10px] font-black bg-red-50 p-2 rounded-lg text-center animate-shake">{error}</div>}
            
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

              {form.isReminded && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock size={12} className="text-orange-500" /> 알림 시간 (분 전)
                  </label>
                  <input 
                    type="number"
                    min="1"
                    max="1440"
                    value={form.remindBeforeMinutes}
                    onChange={e => {
                      const value = parseInt(e.target.value, 10);
                      if (!isNaN(value) && value > 0) {
                        updateField('remindBeforeMinutes', Math.min(1440, Math.max(1, value)));
                      }
                    }}
                    className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-orange-100 outline-none"
                    placeholder="10"
                  />
                  <p className="text-[9px] font-bold text-slate-400 px-1">일정 시작 전 몇 분에 알림을 받을지 설정하세요.</p>
                </div>
              )}

              <div className="flex items-center gap-2 justify-center py-1">
                <button onClick={() => updateField('enableSound', !form.enableSound)} className={`px-3 py-2 rounded-full border text-[9px] font-black uppercase flex items-center gap-1.5 transition-all ${form.enableSound ? 'border-green-200 bg-green-50 text-green-700' : 'border-slate-100 bg-slate-50 text-slate-300'}`}>
                  <Volume2 size={10}/> 기기 기본음
                </button>
                <button onClick={() => updateField('enableVibration', !form.enableVibration)} className={`px-3 py-2 rounded-full border text-[9px] font-black uppercase flex items-center gap-1.5 transition-all ${form.enableVibration ? 'border-purple-200 bg-purple-50 text-purple-700' : 'border-slate-100 bg-slate-50 text-slate-300'}`}>
                  <Smartphone size={10}/> 진동
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button onClick={handleSave} className={`w-full flex items-center justify-center gap-2 p-5 text-white rounded-[1.8rem] font-black shadow-xl transition-all active:scale-95 ${isUndecided ? 'bg-amber-500 shadow-amber-100' : 'bg-blue-600 shadow-blue-100'}`}>
              {isUndecided ? '보류 일정으로 저장' : '저장하기'}
            </button>
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 p-4 bg-slate-100 text-slate-500 rounded-2xl font-bold transition-colors hover:bg-slate-200">닫기</button>
              {isExisting && <button onClick={() => onDelete(form.id)} className="p-4 bg-red-50 text-red-500 rounded-2xl transition-colors hover:bg-red-100"><Trash2 size={20}/></button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
