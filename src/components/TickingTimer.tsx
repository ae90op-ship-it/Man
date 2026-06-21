import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Timer, Infinity, Play, Square, AlertTriangle } from 'lucide-react';
import { playTickSound } from '../utils';

interface TickingTimerProps {
  secondsRemaining: number;
  maxSeconds: number; // 0 means unlimited / count-up mode
  isActive: boolean;
  onTimeUp: () => void;
  isMuted: boolean;
}

export default function TickingTimer({
  secondsRemaining,
  maxSeconds,
  isActive,
  onTimeUp,
  isMuted
}: TickingTimerProps) {
  const previousSeconds = useRef(secondsRemaining);

  useEffect(() => {
    // If the timer is active and counting down, tick if time remaining changes
    if (isActive && maxSeconds > 0) {
      if (secondsRemaining !== previousSeconds.current) {
        // Ticking audio logic
        if (!isMuted) {
          // Play tick every second when time is low (< 10 seconds) or play quieter plop
          if (secondsRemaining <= 10 && secondsRemaining > 0) {
            playTickSound();
          }
        }
        previousSeconds.current = secondsRemaining;
      }

      if (secondsRemaining <= 0) {
        onTimeUp();
      }
    }
  }, [secondsRemaining, isActive, maxSeconds, onTimeUp, isMuted]);

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isTimeLow = maxSeconds > 0 && secondsRemaining <= 10;
  const progressPercent = maxSeconds > 0 ? (secondsRemaining / maxSeconds) * 100 : 100;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 flex items-center justify-between gap-4 shadow-md" dir="rtl">
      {/* Icon and label */}
      <div className="flex items-center gap-2.5">
        <div className={`p-2.5 rounded-xl ${
          isTimeLow 
            ? 'bg-rose-500/10 text-rose-500 animate-pulse' 
            : 'bg-amber-500/10 text-amber-500'
        }`}>
          <Timer className="h-5 w-5 stroke-[2.2]" />
        </div>
        <div>
          <span className="text-[10px] text-zinc-400 font-mono block font-black uppercase">وقت التحدي الحالي</span>
          <span className="text-xs font-bold text-zinc-705 dark:text-zinc-300">
            {maxSeconds === 0 ? 'عداد الوقت المفتوح' : `مؤقت تنازلي عازل`}
          </span>
        </div>
      </div>

      {/* Circular/Text Progress Display */}
      <div className="flex items-center gap-3">
        {isTimeLow && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="flex items-center gap-1 text-[11px] font-black text-rose-500 bg-rose-500/10 py-1 px-2.5 rounded-lg"
          >
            <AlertTriangle className="h-3 w-3" />
            <span>أسرع! الوقت ينفد!</span>
          </motion.div>
        )}

        <div className="relative flex items-center justify-center">
          {/* Circular progress bar SVG representation */}
          <svg className="w-12 h-12 transform -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              className="stroke-zinc-100 dark:stroke-zinc-800"
              strokeWidth="3.5"
              fill="transparent"
            />
            {maxSeconds > 0 && <circle
              cx="24"
              cy="24"
              r="20"
              className={`transition-all duration-1000 ${
                isTimeLow ? 'stroke-rose-500' : 'stroke-amber-500'
              }`}
              strokeWidth="3.5"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 20}
              strokeDashoffset={2 * Math.PI * 20 * (1 - progressPercent / 100)}
              strokeLinecap="round"
            />}
          </svg>
          <div className={`absolute text-xs font-mono font-black ${
            isTimeLow ? 'text-rose-500 animate-bounce' : 'text-zinc-800 dark:text-zinc-200'
          }`}>
            {formatTime(secondsRemaining)}
          </div>
        </div>
      </div>
    </div>
  );
}
