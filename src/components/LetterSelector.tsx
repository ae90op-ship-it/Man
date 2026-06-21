import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Dices, AlertCircle } from 'lucide-react';
import { ARABIC_LETTERS } from '../types';
import { playTickSound, playSpinSound } from '../utils';

interface LetterSelectorProps {
  onLetterSelected: (letter: string) => void;
  disabled?: boolean;
}

export default function LetterSelector({ onLetterSelected, disabled = false }: LetterSelectorProps) {
  const [spinning, setSpinning] = useState(false);
  const [currentLetter, setCurrentLetter] = useState('أ');
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startSpin = () => {
    if (disabled || spinning) return;
    setSpinning(true);
    playSpinSound();

    let duration = 1800; // total spin time in ms
    let interval = 45;   // starting interval
    let elapsed = 0;

    const cycle = () => {
      const randomIndex = Math.floor(Math.random() * ARABIC_LETTERS.length);
      setCurrentLetter(ARABIC_LETTERS[randomIndex]);
      setHighlightedIndex(randomIndex);
      playTickSound();

      elapsed += interval;
      // Exponentially slow down the spin
      if (elapsed < duration) {
        interval = Math.min(250, interval * 1.15);
        timerRef.current = setTimeout(cycle, interval);
      } else {
        // Stopped!
        const finalIndex = Math.floor(Math.random() * ARABIC_LETTERS.length);
        const finalLetter = ARABIC_LETTERS[finalIndex];
        setCurrentLetter(finalLetter);
        setHighlightedIndex(finalIndex);
        setSpinning(false);
        onLetterSelected(finalLetter);
      }
    };

    timerRef.current = setTimeout(cycle, interval);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const selectManualLetter = (letter: string, index: number) => {
    if (disabled || spinning) return;
    setCurrentLetter(letter);
    setHighlightedIndex(index);
    playTickSound();
    onLetterSelected(letter);
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-5 md:p-6" dir="rtl">
      <div className="flex flex-col items-center text-center">
        {/* Title */}
        <div className="flex items-center gap-2 mb-4">
          <Dices className="h-5 w-5 text-amber-500 animate-spin" style={{ animationDuration: spinning ? '0.5s' : '3s' }} />
          <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100">اختيار حرف الجولة</h3>
        </div>

        {/* Big Spinner Target Screen */}
        <div className="relative flex items-center justify-center w-36 h-36 rounded-full border-4 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-2xl p-4 overflow-hidden mb-5">
          <div className="absolute inset-0 bg-radial from-transparent to-amber-500/10" />
          
          <AnimatePresence mode="popLayout">
            <motion.span
              key={currentLetter}
              initial={{ y: spinning ? -40 : -10, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: spinning ? 40 : 10, opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className={`text-6xl font-black ${
                spinning ? 'text-amber-500' : 'text-zinc-900 dark:text-white'
              }`}
            >
              {currentLetter}
            </motion.span>
          </AnimatePresence>

          {/* Sparkles Overlay when done */}
          {!spinning && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute pointer-events-none -top-1 -right-1 text-yellow-500"
            >
              <Sparkles className="h-5 w-5" />
            </motion.div>
          )}
        </div>

        {/* Spin Trigger Button */}
        <button
          onClick={startSpin}
          disabled={disabled || spinning}
          className={`w-full py-3.5 px-6 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98 ${
            spinning
              ? 'bg-zinc-200 dark:bg-zinc-850 text-zinc-400 cursor-not-allowed shadow-none'
              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20 hover:shadow-amber-500/30'
          }`}
        >
          <Dices className="h-4.5 w-4.5" />
          <span>{spinning ? 'جاري تدوير عجلة الحروف...' : 'ابدأ دوران عجلة الحروف 🎲'}</span>
        </button>

        {/* Manual selection divider */}
        <div className="w-full flex items-center gap-3 my-5">
          <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-grow" />
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">أو اختر حرفاً يدوياً</span>
          <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-grow" />
        </div>

        {/* Manual Grid */}
        <div className="grid grid-cols-6 sm:grid-cols-7 md:grid-cols-9 gap-1.5 w-full">
          {ARABIC_LETTERS.map((letter, index) => {
            const isSelected = highlightedIndex === index;
            return (
              <button
                key={letter}
                onClick={() => selectManualLetter(letter, index)}
                disabled={disabled || spinning}
                className={`py-2 text-[13px] font-black rounded-lg transition-all active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-white scale-110 shadow-md shadow-amber-500/20 border border-amber-400'
                    : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-950 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-405 hover:text-zinc-800 dark:hover:text-zinc-100'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 mt-4 text-[11px] text-zinc-450">
          <AlertCircle className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
          <span>تلميح: الحروف تُقاس تلقائياً دون احتساب "الـ" التعريف!</span>
        </div>
      </div>
    </div>
  );
}
