import React from 'react';
import { X, Volume2, Smartphone, Bell, Settings, BellOff, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  notificationEnabled: boolean;
  notificationPermission: NotificationPermission;
  onToggleSound: () => void;
  onToggleVibration: () => void;
  onToggleNotification: () => void;
}

export const GlobalSettingsDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  soundEnabled,
  vibrationEnabled,
  notificationEnabled,
  notificationPermission,
  onToggleSound,
  onToggleVibration,
  onToggleNotification
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100">
        <div className="bg-slate-900 p-6 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Settings size={20} className="text-blue-400" />
            <h3 className="font-black text-lg">환경 설정</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">알림 기본 설정</h4>
            
            {/* Global Notification Master Toggle */}
            <div className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${notificationPermission === 'denied' ? 'bg-red-50 border-red-100 opacity-80' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${notificationEnabled && notificationPermission === 'granted' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  {notificationPermission === 'denied' ? <BellOff size={20} /> : <Bell size={20} />}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">푸시 알림 활성화</p>
                  <p className="text-[10px] font-bold text-slate-400">
                    {notificationPermission === 'denied' ? '시스템 권한이 거부됨' : 
                     notificationPermission === 'default' ? '권한 요청 필요' : '모든 일정 알림 제어'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={notificationEnabled && notificationPermission === 'granted'} 
                  onChange={onToggleNotification} 
                  disabled={notificationPermission === 'denied'}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {notificationPermission === 'denied' && (
              <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 animate-pulse">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <p className="text-[9px] font-bold leading-relaxed">
                  브라우저 설정에서 알림 권한을 허용해야 합니다. 현재 차단된 상태입니다.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                {/* Sound Toggle */}
                <button 
                  onClick={onToggleSound}
                  className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${soundEnabled ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                >
                  <Volume2 size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest">알림 소리</span>
                </button>

                {/* Vibration Toggle */}
                <button 
                  onClick={onToggleVibration}
                  className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${vibrationEnabled ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                >
                  <Smartphone size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest">진동 알림</span>
                </button>
            </div>
          </div>

          <div className="pt-4">
            <button 
              onClick={onClose}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95"
            >
              설정 저장 및 닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};