import React from 'react';
import { motion } from 'motion/react';
import { Trophy, HelpCircle, RefreshCw, Star, Calendar, Clock, Sparkles, User, Cpu } from 'lucide-react';
import { Round, CATEGORIES } from '../types';

interface ResultsDashboardProps {
  round: Round;
  onRestart: () => void;
  history: Round[];
  onClearHistory: () => void;
  userPoints?: number;
}

export default function ResultsDashboard({
  round,
  onRestart,
  history,
  onClearHistory,
  userPoints = 0
}: ResultsDashboardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 10) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40';
    if (score >= 5) return 'text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40';
    return 'text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 10) return 'صح (10)';
    if (score >= 5) return 'مقبول (5)';
    return 'خطأ (0)';
  };

  // Find max historic score
  const personalBest = history.length > 0 
    ? Math.max(...history.map(r => r.totalScore || 0)) 
    : 0;

  const playerScore = round.totalScore || 0;
  const opponentScore = round.opponentTotalScore !== undefined ? round.opponentTotalScore : 0;
  
  // Decide the winner
  const isPlayerWinner = playerScore > opponentScore;
  const isTie = playerScore === opponentScore;

  return (
    <div className="w-full space-y-6" dir="rtl">
      
      {/* 1. Duel Scoring Header banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Score Card: Player */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-12 -translate-y-12" />
          
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono tracking-widest text-amber-100 font-extrabold flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>نتيجتك أنت 👤</span>
            </span>
            {isPlayerWinner && <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded font-black">البطل! 🏆</span>}
          </div>

          <div className="my-4 text-center">
            <h1 className="text-5xl font-black">{playerScore}</h1>
            <p className="text-xs text-amber-100 mt-1 font-bold">من أصل 70 كدرجة كبرى</p>
          </div>

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2 text-xs text-amber-50">
            <div className="flex items-center justify-between">
              <span className="font-semibold">حرف الجولة:</span>
              <span className="text-sm font-black bg-white/15 px-2.5 py-0.5 rounded-lg">{round.letter}</span>
            </div>
            <div className="flex items-center justify-between border-t border-white/5 pt-2">
              <span className="font-semibold text-[11px]">محفظة النقاط الإجمالية:</span>
              <span className="text-xs font-black bg-white/20 px-2 rounded-lg py-0.5">🪙 {userPoints}</span>
            </div>
          </div>
        </motion.div>

        {/* Score Card: AI Opponent */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-gradient-to-br from-zinc-800 to-zinc-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-12 -translate-y-12" />
          
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono tracking-widest text-zinc-300 font-extrabold flex items-center gap-1">
              <Cpu className="h-4 w-4 text-amber-500 animate-pulse" />
              <span>الخصم الآلي (الذكاء) 🤖</span>
            </span>
            {!isPlayerWinner && !isTie && <span className="bg-amber-500 text-[10px] text-zinc-900 px-2 py-0.5 rounded font-black">تفوق! 👑</span>}
            {isTie && <span className="bg-zinc-700 text-[10px] text-zinc-200 px-2 py-0.5 rounded font-black">تعادل 🤝</span>}
          </div>

          <div className="my-4 text-center">
            <h1 className="text-5xl font-black text-amber-400">{opponentScore}</h1>
            <p className="text-xs text-zinc-300 mt-1 font-bold">من أصل 70 كدرجة كبرى</p>
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold">طبيعة التحدي:</span>
            <span className="text-xs text-amber-400 font-bold">مواجهة مباشرة</span>
          </div>
        </motion.div>

        {/* AI Judge Verdict Bubble */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden"
        >
          {/* Sparkles Overlay */}
          <div className="absolute -top-3 left-3 text-amber-500/25">
            <Sparkles className="h-24 w-24" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 px-2.5 bg-amber-550/10 text-amber-500 text-[10px] font-black rounded-lg">بيان المنافسة والحكم 🤖</div>
            </div>
            <h3 className="text-sm font-black text-zinc-900 dark:text-white mb-2 leading-relaxed">
              {isPlayerWinner 
                ? "يا للروعة! لقد تمكنت من سحق الذكاء الاصطناعي واقتناص الصدارة بنجاح باهر! 🎉" 
                : isTie 
                ? "يا لها من منافسة حامية الوطيس! تعادل عادل مع منافسك الآلي." 
                : "الذكاء الاصطناعي فاز بهذه الجولة! لا بأس، حاول التفوق عليه في الجولات القادمة!"}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
              {round.overallVerdict || 'تمت مقارنة الإجابات وتصحيحها بكل عدالة وشفافية لغوية.'}
            </p>
          </div>

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-850 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-zinc-400" />
              <span>المدى المستغرق: <strong className="text-zinc-650 dark:text-zinc-300 font-mono font-black">{round.durationSeconds} ثانية</strong></span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 2. Side-by-Side Detailed Validation comparing Player and AI */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="p-5 border-b border-zinc-150 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950/20 flex justify-between items-center">
          <h3 className="text-sm font-black text-zinc-900 dark:text-white">المقارنة التفصيلية للفئات: [ أنت 👤 vs الخصم الآلي 🤖 ]</h3>
          <span className="text-[10px] text-zinc-400 font-mono">حرف الجولة: "{round.letter}"</span>
        </div>

        <div className="divide-y divide-zinc-150 dark:divide-zinc-850">
          {CATEGORIES.map((cat) => {
            const playerAnswer = round.answers[cat.key] || '';
            const playerResult = round.results?.[cat.key];
            const playerScoreValue = playerResult ? playerResult.score : 0;
            const playerFeedback = playerResult ? playerResult.feedback : 'لم تلعب إجابة.';

            const aiAnswer = round.opponentAnswers?.[cat.key] || '';
            const aiResult = round.opponentResults?.[cat.key];
            const aiScoreValue = aiResult ? aiResult.score : (aiAnswer ? 10 : 0);
            const aiFeedback = aiResult ? aiResult.feedback : (aiAnswer ? 'إجابة سليمة من الخصم الآلي.' : 'لم يجد الخصم كلمة في الوقت المناسب.');

            return (
              <div key={cat.key} className="p-5 hover:bg-zinc-50/30 dark:hover:bg-zinc-850/10 transition-all flex flex-col gap-4">
                
                {/* Category Header Label */}
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500/10 text-amber-550 rounded-xl text-lg font-bold">
                    {cat.label.slice(-2)}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-zinc-900 dark:text-white">{cat.label.slice(0, -2)}</h4>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Player column */}
                  <div className="p-3.5 bg-zinc-50/50 dark:bg-zinc-950/35 rounded-2xl border border-zinc-150 dark:border-zinc-850 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-zinc-400 font-bold">إجابتك أنت 👤</span>
                        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-black ${getScoreColor(playerScoreValue)}`}>
                          {getScoreBadge(playerScoreValue)}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-zinc-900 dark:text-white">
                        {playerAnswer ? `"${playerAnswer}"` : <span className="text-zinc-300 dark:text-zinc-700 italic">فارغ!</span>}
                      </h4>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-1.5 leading-relaxed">
                      {playerFeedback}
                    </p>
                  </div>

                  {/* AI Opponent column */}
                  <div className="p-3.5 bg-amber-500/2 dark:bg-zinc-950/15 rounded-2xl border border-amber-500/10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-zinc-400 font-bold">إجابة الخصم الآلي 🤖</span>
                        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-black ${getScoreColor(aiScoreValue)}`}>
                          {getScoreBadge(aiScoreValue)}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-amber-600 dark:text-amber-400">
                        {aiAnswer ? `"${aiAnswer}"` : <span className="text-rose-300 dark:text-rose-950 italic">لم يستطع الإجابة!</span>}
                      </h4>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-1.5 leading-relaxed">
                      {aiFeedback}
                    </p>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-3 justify-center pt-3">
        <button
          onClick={onRestart}
          className="flex items-center gap-2 py-3.5 px-8 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-2xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.01] active:scale-98 cursor-pointer"
        >
          <RefreshCw className="h-4.5 w-4.5" />
          <span>ابدأ جولة جديدة مجدداً ♟️</span>
        </button>
      </div>

      {/* 3. Personal History Ledger */}
      {history.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl overflow-hidden mt-8">
          <div className="p-5 border-b border-zinc-150 dark:border-zinc-850 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/20">
            <div className="flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
              <h3 className="text-sm font-black text-zinc-900 dark:text-white">جدول الإنجازات وسجل الجولات السابقة</h3>
            </div>
            <button
              onClick={onClearHistory}
              className="text-[11px] font-extrabold text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
            >
              مسح السجل نهائياً
            </button>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4 bg-amber-500/5 border-b border-zinc-100 dark:border-zinc-850">
            <div className="text-center md:border-l border-zinc-150 dark:border-zinc-800 p-2">
              <span className="text-[10px] text-zinc-400 font-black block">أعلى مجموع تاريخي</span>
              <span className="text-2xl font-black text-amber-550 flex items-center justify-center gap-1 mt-1">
                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                <span>{personalBest}</span>
              </span>
            </div>
            <div className="text-center md:border-l border-zinc-150 dark:border-zinc-800 p-2">
              <span className="text-[10px] text-zinc-400 font-black block">إجمالي الجولات الملعوبة</span>
              <span className="text-2xl font-black text-zinc-800 dark:text-zinc-200 mt-1 block">{history.length}</span>
            </div>
            <div className="text-center md:border-l border-zinc-150 dark:border-zinc-800 p-2">
              <span className="text-[10px] text-zinc-400 font-black block">متوسط النقاط للجولة</span>
              <span className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1 block">
                {Math.round(history.reduce((a, b) => a + (b.totalScore || 0), 0) / history.length)}
              </span>
            </div>
            <div className="text-center p-2">
              <span className="text-[10px] text-zinc-400 font-black block">سرعة الفوز (المتوسط)</span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">
                {Math.round(history.reduce((a, b) => a + b.durationSeconds, 0) / history.length)} ثانية
              </span>
            </div>
          </div>

          {/* List of Previous rounds */}
          <div className="max-h-64 overflow-y-auto divide-y divide-zinc-150 dark:divide-zinc-850">
            {history.map((h, i) => (
              <div key={h.id || i} className="p-4 flex items-center justify-between text-xs hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-black text-sm flex items-center justify-center text-zinc-800 dark:text-white">
                    {h.letter}
                  </div>
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-white block">جولة الحرف "{h.letter}"</span>
                    <span className="text-[10px] text-zinc-400 mt-0.5 block">{new Date(h.createdAt).toLocaleDateString('ar-EG', { dateStyle: 'short' })} • في {h.durationSeconds} ثانية</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-zinc-805 dark:text-zinc-200">{h.totalScore} نقطة</span>
                  {h.totalScore === personalBest && (
                    <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-200">القمة 👑</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
