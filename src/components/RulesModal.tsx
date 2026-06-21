import React from 'react';
import { motion } from 'motion/react';
import { X, Trophy, Sparkles, Sprout, CornerDownLeft, Volume2 } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RulesModal({ isOpen, onClose }: RulesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 overflow-hidden md:p-8"
        dir="rtl"
      >
        {/* Background Decorative Gradient */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-xl transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-inner shadow-white/25">
            <Trophy className="h-6 w-6 animate-bounce" />
          </div>
          <div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white">قواعد اللعبة وآلية اللعب</h3>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">طريقة الفوز في تحدي أوتوبيس كومبليت الشهير</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs sm:text-sm text-zinc-650 dark:text-zinc-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          <p>
            تعتبر <strong>لعبة جماد حيوان نبات</strong> واحدة من أعرق الألعاب الجماعية والذهنية العربية الشائعة. صممناها لك هنا بأسلوب رقمي ذكي يستعين بالحكم الفائق <strong>ذكاء اصطناعي (Gemini)</strong> لتقييم إجاباتك فورياً وبكل دقة!
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex gap-3 items-start bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-150 dark:border-zinc-850">
              <span className="text-xl">1️⃣</span>
              <div>
                <strong className="text-zinc-850 dark:text-zinc-100">اختر حرفك:</strong>
                <p className="text-xs mt-1 text-zinc-500">اضغط على عجلة الحروف الدوارة لاختيار حرف عربي عشوائي تبدأ به جميع كلماتك في هذه الجولة.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-150 dark:border-zinc-850">
              <span className="text-xl">2️⃣</span>
              <div>
                <strong className="text-zinc-850 dark:text-zinc-100">املأ الفئات السبع:</strong>
                <p className="text-xs mt-1 text-zinc-500">
                  اكتب كلمة صحيحة لكل تصنيف متاح (ولد، بنت، حيوان، نبات، جماد، بلاد، أكلة). الـ التعريف في بداية الكلمات يتغاضى عنها الحكم تلقائياً.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-150 dark:border-zinc-850">
              <span className="text-xl">3️⃣</span>
              <div>
                <strong className="text-zinc-850 dark:text-zinc-100">اضغط STOP لتقييم الذكاء الاصطناعي:</strong>
                <p className="text-xs mt-1 text-zinc-500">
                  عند الانتهاء أو انتهاء الوقت، اضغط على زر التقييم. سيقوم نموذج الذكاء الاصطناعي بتحليل إجاباتك وإعطاء 10 درجات لكل كلمة صحيحة، أو 5 درجات للأخطاء الإملائية الشائعة وعاميات الدول، و0 درجات للإجابة الخاطئة أو الفارغة.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-850">
            <h4 className="font-bold flex items-center gap-1.5 text-amber-600 dark:text-amber-400 mb-2">
              <Sparkles className="h-4 w-4" />
              <span>أسرار للحصول على القوة الكاملة:</span>
            </h4>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-zinc-500 pr-2">
              <li>الحكم يستوعب الطبخات واللهجات والعادات في كافة الدول العربية (مثل الزلابية، المنسف، الكبسة..).</li>
              <li>الهمزات على الألف (أ، إ، آ، ا) تُعامل كحرف واحد للسهولة.</li>
              <li>الصوت التفاعلي يمنحك تجربة واقعية، يمكنك تشغيل أو إلغاء كتم الطقطقة ومؤثر الفوز من الواجهة.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-850 flex justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 py-2.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl text-xs font-extrabold hover:opacity-90 shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <span>فهمت، لنبدأ التحدي!</span>
            <CornerDownLeft className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
