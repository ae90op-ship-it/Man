import React from 'react';
import { X, Languages, Settings, HelpCircle, ShieldCheck } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAr: boolean;
  onToggleLanguage: () => void;
  theme: 'light' | 'dark';
  onChangeTheme: (theme: 'light' | 'dark') => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  isAr,
  onToggleLanguage,
  theme,
  onChangeTheme
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div 
        className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-150 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Settings className="h-4.5 w-4.5 text-zinc-500 animate-spin-slow" />
            <h3 className="font-bold text-zinc-900 dark:text-white">
              {isAr ? 'الإعدادات والخيارات' : 'Settings & Preferences'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-5 space-y-5">
          {/* Section: Language */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {isAr ? 'لغة التطبيق' : 'Application Language'}
            </label>
            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-850 p-4 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 shrink-0">
                  <Languages className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {isAr ? 'اللغة العربية مفعلة' : 'English is active'}
                  </h4>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    {isAr ? 'تغيير واجهة المستخدم إلى الإنجليزية' : 'Change the interface layout to Arabic'}
                  </p>
                </div>
              </div>

              <button
                onClick={onToggleLanguage}
                className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-xs font-extrabold cursor-pointer transition-all active:scale-95"
              >
                {isAr ? 'Switch to English' : 'التحويل للعربية'}
              </button>
            </div>
          </div>

          {/* Section: Theme */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {isAr ? 'مظهر التطبيق' : 'Application Theme'}
            </label>
            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-850 p-4 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 shrink-0 font-bold">
                  🌓
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {isAr ? 'مظهر الواجهة' : 'UI Mode'}
                  </h4>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    {isAr ? 'تغيير المظهر بين الداكن والفاتح' : 'Toggle between Light and Dark mode'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-zinc-200/60 dark:bg-zinc-800 p-1 rounded-xl">
                <button
                  onClick={() => onChangeTheme('light')}
                  className={`py-1.5 px-3.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    theme === 'light' 
                      ? 'bg-white text-amber-600 dark:text-amber-500 shadow-xs' 
                      : 'text-zinc-505 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {isAr ? 'فاتح' : 'Light'}
                </button>
                <button
                  onClick={() => onChangeTheme('dark')}
                  className={`py-1.5 px-3.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    theme === 'dark' 
                      ? 'bg-zinc-900 dark:bg-zinc-700 text-amber-400 shadow-xs' 
                      : 'text-zinc-505 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200'
                  }`}
                >
                  {isAr ? 'داكن' : 'Dark'}
                </button>
              </div>
            </div>
          </div>

          {/* Section: App info (for beautiful professional finish) */}
          <div className="space-y-2 pt-2 border-t border-zinc-150 dark:border-zinc-800">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {isAr ? 'عن التطبيق' : 'About Application'}
            </label>
            <div className="space-y-2 text-xs text-zinc-650 dark:text-zinc-350">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="font-semibold">{isAr ? 'مستكشف الملاحظات والرسوم v2.0' : 'Notes & Sketches Suite v2.0'}</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-80">
                {isAr 
                  ? 'يتم تخزين جميع البيانات والرسومات محلياً لضمان الخصوصية والسرية التامة لملفاتك.'
                  : 'All notes and whiteboard sketches are safely stored inside your browser secure local storage.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-zinc-50 dark:bg-zinc-905 px-5 py-3 border-t border-zinc-150 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-1.5 px-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
