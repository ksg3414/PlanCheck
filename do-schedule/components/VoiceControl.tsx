import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { VoiceCommandParser } from '../services/voiceService';
import { BusinessSchedule, CommandType } from '../types';

interface Props {
  onCommandParsed: (result: { schedule?: BusinessSchedule, type: CommandType, message: string }) => void;
}

const VoiceControl: React.FC<Props> = ({ onCommandParsed }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parser] = useState(new VoiceCommandParser("자비스"));

  // Check browser support for Web Speech API
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  useEffect(() => {
    if (!SpeechRecognition) {
      console.warn("Web Speech API not supported in this browser.");
    }
  }, [SpeechRecognition]);

  const toggleListening = () => {
    if (!SpeechRecognition) return alert("이 브라우저는 음성 인식을 지원하지 않습니다.");

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.continuous = false;
    recognition.interimResults = false;

    setIsListening(true);
    setTranscript("듣고 있습니다...");

    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(`"${text}"`);
      
      // Simulate processing delay for "High Intelligence" feel
      setTimeout(async () => {
        const result = await parser.parseAndExecute(text, new Date().getFullYear());
        if (result) {
            onCommandParsed(result);
        } else {
            setTranscript("호출어 '자비스'를 먼저 말해주세요.");
        }
        setIsListening(false);
      }, 1000);
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
      setTranscript("오류가 발생했습니다. 다시 시도해주세요.");
    };

    recognition.onend = () => {
      // Logic handled in onresult or onerror
    };

    recognition.start();
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 border-b bg-white">
      <div className="flex items-center gap-4 w-full max-w-md bg-slate-100 rounded-full p-2 pl-6 shadow-inner">
        <span className="flex-1 text-sm text-slate-600 truncate">
          {transcript || "예: 자비스 12월 25일 14시 회의 추가"}
        </span>
        <button
          onClick={toggleListening}
          className={`
            p-3 rounded-full transition-all duration-300 shadow-md flex items-center justify-center
            ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-600 text-white hover:bg-blue-700'}
          `}
        >
          {isListening ? <Loader2 className="animate-spin" size={20} /> : <Mic size={20} />}
        </button>
      </div>
    </div>
  );
};

export default VoiceControl;