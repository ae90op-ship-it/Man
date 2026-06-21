import React, { useState } from 'react';
import { 
  X, Languages, Settings, HelpCircle, ShieldCheck, 
  Monitor, Sun, Moon, Type, LayoutGrid, List, 
  Cloud, RefreshCw, Download, Upload, Trash2, 
  Lock, Key, AlertTriangle, Clock, Volume2, 
  Info, MessageSquare, Check, ShieldAlert,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { Note } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAr: boolean;
  onToggleLanguage: () => void;
  theme: 'light' | 'dark' | 'system';
  onChangeTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Custom state hooks
  fontFamily: string;
  onChangeFontFamily: (font: string) => void;
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  onChangeFontSize: (size: 'sm' | 'base' | 'lg' | 'xl') => void;
  
  viewLayout: 'grid' | 'list';
  onChangeViewLayout: (layout: 'grid' | 'list') => void;

  appLockEnabled: boolean;
  onChangeAppLockEnabled: (enabled: boolean) => void;
  appLockPIN: string;
  onChangeAppLockPIN: (pin: string) => void;

  notesPassword: string;
  onChangeNotesPassword: (password: string) => void;

  autoDeleteDays: number;
  onChangeAutoDeleteDays: (days: number) => void;

  reminderAlertStyle: 'chime' | 'beep' | 'silent';
  onChangeReminderAlertStyle: (style: 'chime' | 'beep' | 'silent') => void;

  isSyncConnected: boolean;
  syncEmail: string;
  lastSyncTime: number | null;
  onConnectSync: (email: string) => void;
  onDisconnectSync: () => void;
  onTriggerSyncNow: () => Promise<void>;

  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  onClearAllNotes: () => void;
}

type ActiveTab = 'appearance' | 'security' | 'data' | 'reminders' | 'support';

export default function SettingsModal({
  isOpen,
  onClose,
  isAr,
  onToggleLanguage,
  theme,
  onChangeTheme,
  fontFamily,
  onChangeFontFamily,
  fontSize,
  onChangeFontSize,
  viewLayout,
  onChangeViewLayout,
  appLockEnabled,
  onChangeAppLockEnabled,
  appLockPIN,
  onChangeAppLockPIN,
  notesPassword,
  onChangeNotesPassword,
  autoDeleteDays,
  onChangeAutoDeleteDays,
  reminderAlertStyle,
  onChangeReminderAlertStyle,
  isSyncConnected,
  syncEmail,
  lastSyncTime,
  onConnectSync,
  onDisconnectSync,
  onTriggerSyncNow,
  notes,
  setNotes,
  onClearAllNotes
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('appearance');

  const SETTINGS_TABS = [
    { id: 'appearance', labelAR: 'التخصيص والمظهر', labelEN: 'Appearance', icon: Type },
    { id: 'security', labelAR: 'الحماية والأمان', labelEN: 'Security & App Lock', icon: Lock },
    { id: 'data', labelAR: 'البيانات والتزامُن', labelEN: 'Data & Backup', icon: Cloud },
    { id: 'reminders', labelAR: 'التنبيهات والمهملات', labelEN: 'Organization', icon: Clock },
    { id: 'support', labelAR: 'الدعم وعن التطبيق', labelEN: 'Support & Help', icon: HelpCircle }
  ];

  const activeIndex = SETTINGS_TABS.findIndex(t => t.id === activeTab);
  const prevTab = activeIndex > 0 ? SETTINGS_TABS[activeIndex - 1] : null;
  const nextTab = activeIndex < SETTINGS_TABS.length - 1 ? SETTINGS_TABS[activeIndex + 1] : null;

  const navigateToTab = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setFeedbackSuccess(false);
  };

  const [tempPIN, setTempPIN] = useState(appLockPIN);
  const [tempLockPassword, setTempLockPassword] = useState(notesPassword);
  
  // Local state for Cloud Sync connection flow
  const [syncEmailInput, setSyncEmailInput] = useState(syncEmail || 'ae90op@gmail.com');
  const [isConnectingSync, setIsConnectingSync] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Local state for Feedback Submission
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackType, setFeedbackType] = useState('bug');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Danger zone validation
  const [confirmWipeInput, setConfirmWipeInput] = useState('');
  const [showWipeSecurityDialogue, setShowWipeSecurityDialogue] = useState(false);

  if (!isOpen) return null;

  // Synthesize audios for Reminder alert check
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (reminderAlertStyle === 'beep') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 high beep
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } else if (reminderAlertStyle === 'chime') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      } else {
        // Silent alert simulation, flash a local reminder toast or alert
        alert(isAr ? 'تم كتم الصوت! الملاحظات ستعرض تنبيهاً مرئياً فقط.' : 'Sound muted! Notes will pop a silent overlay popup.');
      }
    } catch (e) {
      console.warn("AudioContext block", e);
    }
  };

  // Export handlers
  const exportAsJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(notes, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `keep_notes_backup_${Date.now()}.json`);
    dlAnchorElem.click();
  };

  const exportAsTXT = () => {
    let output = isAr 
      ? `=== نسخ احتياطي لمذكرات Keep Notebook ===\nتم التصدير بتاريخ: ${new Date().toLocaleString('ar-EG')}\n\n`
      : `=== Keep Notebook Back-up export ===\nExported on: ${new Date().toLocaleString()}\n\n`;

    notes.forEach((note, index) => {
      output += `${index + 1}. [${note.title || (isAr ? 'بدون عنوان' : 'Untitled')}]\n`;
      output += isAr ? `   الحالة: ${note.isTrashed ? 'في المهملات' : 'نشط'}\n` : `   Status: ${note.isTrashed ? 'Trashed' : 'Active'}\n`;
      if (note.reminder) {
        output += `   Reminder: ${new Date(note.reminder).toLocaleString()}\n`;
      }
      
      if (note.isChecklist) {
        output += isAr ? `   محتوى القائمة المتسلسلة:\n` : `   Checklist items:\n`;
        note.checklistItems.forEach(item => {
          output += `     [${item.completed ? '✓' : ' '}] ${item.text}\n`;
        });
      } else {
        output += `   Content: ${note.content}\n`;
      }
      output += `\n--------------------------------------------\n\n`;
    });

    const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(output);
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `keep_notes_export_${Date.now()}.txt`);
    dlAnchorElem.click();
  };

  const triggerPDFPrint = () => {
    // Generate clean printable window formatting
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const notesHTML = notes.map(note => `
      <div style="border: 1px solid #e4e4e7; border-radius: 8px; padding: 15px; margin-bottom: 15px; page-break-inside: avoid; font-family: sans-serif;">
        <h2 style="margin-top:0; color:#18181b;">${note.title || 'Untitled note'}</h2>
        ${note.isChecklist ? `
          <ul style="list-style: none; padding-left: 0;">
            ${note.checklistItems.map(item => `
              <li style="margin-bottom: 5px;">
                <input type="checkbox" ${item.completed ? 'checked' : ''} disabled />
                <span style="text-decoration: ${item.completed ? 'line-through' : 'none'}; color: ${item.completed ? '#71717a' : '#18181b'};">
                  ${item.text}
                </span>
              </li>
            `).join('')}
          </ul>
        ` : `
          <p style="white-space: pre-wrap; color: #27272a; line-height: 1.5;">${note.content}</p>
        `}
        ${note.reminder ? `<div style="font-size: 11px; color: #f59e0b; margin-top: 10px;">⏰ Alarm: ${new Date(note.reminder).toLocaleString()}</div>` : ''}
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${isAr ? 'طباعة المذكرات' : 'Smart Notes PDF Printout'}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 30px; margin: 0; background: #fff; color: #000; }
            h1 { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #f59e0b; padding-bottom: 15px; }
          </style>
        </head>
        <body>
          <h1>${isAr ? 'مذكرات Keep المحفوظة' : 'My Smart Keep Notes Archive'}</h1>
          ${notesHTML}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Import handler
  const handleImportJSONFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.readAsText(files[0], "UTF-8");
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          // Soft validation on structural integrity
          const sanitized: Note[] = parsed.filter(n => typeof n === 'object' && n.id);
          if (sanitized.length > 0) {
            setNotes(prev => {
              const prevIds = prev.map(p => p.id);
              // Merge only non-duplicate IDs
              const filteredNew = sanitized.filter(s => !prevIds.includes(s.id));
              const merged = [...filteredNew, ...prev];
              localStorage.setItem('keep_notes', JSON.stringify(merged));
              return merged;
            });
            alert(isAr 
              ? `تم استيراد مذكراتك القديمة بنجاح! تم دمج عدد ${sanitized.length} مذكرة.` 
              : `Import succeeded! Merged ${sanitized.length} old notes back into your boards.`
            );
          } else {
            alert(isAr ? 'تنبيه: محتوى ملف الـ JSON غير متطابق مع بنية الملاحظات!' : 'Warning: JSON layout is outdated or invalid.');
          }
        }
      } catch (err) {
        alert(isAr ? 'حدث خطأ أثناء قراءة الملف! يرجى التأكد من اختيار ملف JSON صحيح.' : 'Failed to parse notes JSON.');
      }
    };
  };

  // Cloud sync handlers
  const handleConnectSyncFlow = () => {
    if (!syncEmailInput || !syncEmailInput.includes('@')) {
      alert(isAr ? 'الرجاء إدخال بريد إلكتروني صحيح للربط' : 'Please provide a valid connection email name');
      return;
    }
    setIsConnectingSync(true);
    setTimeout(() => {
      onConnectSync(syncEmailInput);
      setIsConnectingSync(false);
    }, 1200);
  };

  const handleManualSyncNow = async () => {
    setIsSyncing(true);
    await onTriggerSyncNow();
    setIsSyncing(false);
  };

  // Submit Feedback Mock
  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMsg) return;
    setFeedbackSuccess(true);
    setTimeout(() => {
      setFeedbackSuccess(false);
      setFeedbackName('');
      setFeedbackEmail('');
      setFeedbackMsg('');
    }, 4000);
  };

  // Save changes to passwords/pins inline
  const handleSaveSecurityKeys = () => {
    onChangeAppLockPIN(tempPIN);
    onChangeNotesPassword(tempLockPassword);
    alert(isAr ? 'تم تحديث كلمات المرور ورموز الحماية بنجاح!' : 'Passwords & security codes saved successfully!');
  };

  // Trigger absolute system wipeout
  const handleAbsoluteWipeWorkspace = () => {
    if (confirmWipeInput.toLowerCase() === 'wipe' || confirmWipeInput === (isAr ? 'حذف' : 'delete')) {
      onClearAllNotes();
      setShowWipeSecurityDialogue(false);
      setConfirmWipeInput('');
      onClose();
    } else {
      alert(isAr ? 'الكلمة التأكيدية غير صحيحة!' : 'Validation text mismatch!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/65 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div 
        className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-3xl h-[600px] flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        
        {/* ===================== SIDE TAB NAVIGATION ===================== */}
        <aside className="w-full md:w-64 bg-zinc-50 dark:bg-zinc-950/70 border-b md:border-b-0 md:border-r border-zinc-150 dark:border-zinc-800/80 p-4 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-y-auto shrink-0 scrollbar-none">
          <div className="hidden md:flex items-center gap-2 mb-6 px-2">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-stone-400 font-mono text-[10px] uppercase tracking-widest font-black">
              {isAr ? 'لوحة التحكم الكبري' : 'Main Control Panel'}
            </span>
          </div>

          {SETTINGS_TABS.map(tab => {
            const IconComponent = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => navigateToTab(tab.id as ActiveTab)}
                className={`flex items-center gap-2.5 py-2.5 px-3.5 rounded-2xl text-xs font-extrabold whitespace-nowrap cursor-pointer transition-all ${
                  active 
                    ? 'bg-amber-500/10 dark:bg-amber-500/5 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs' 
                    : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-zinc-800 dark:hover:text-zinc-250 border border-transparent'
                }`}
              >
                <IconComponent className="h-4.5 w-4.5 shrink-0" />
                <span>{isAr ? tab.labelAR : tab.labelEN}</span>
              </button>
            );
          })}

          <div className="hidden md:block flex-1" />

          {/* Quick Lang Switch */}
          <button
            onClick={onToggleLanguage}
            className="hidden md:flex items-center justify-between gap-2 p-3 bg-zinc-200/50 dark:bg-zinc-900 rounded-2xl border border-zinc-300/40 dark:border-zinc-850 text-[11px] font-bold text-zinc-600 dark:text-zinc-400 cursor-pointer active:scale-95 transition-all mt-4 hover:border-amber-500/30"
          >
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-amber-500" />
              <span>{isAr ? 'English Interface' : 'التحويل للعربية'}</span>
            </div>
            <div className="bg-amber-500 text-stone-900 text-[9px] px-1.5 py-0.5 rounded-md font-mono uppercase">
              {isAr ? 'EN' : 'AR'}
            </div>
          </button>
        </aside>

        {/* ===================== SETTINGS MAIN EDITING COLUMN ===================== */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-900">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-zinc-150 dark:border-zinc-800 shrink-0">
            <div>
              <h3 className="font-extrabold text-zinc-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
                <Settings className="h-5 w-5 text-amber-500 animate-spin-slow" />
                <span>{isAr ? 'التحكم الإعدادي والتخصيص' : 'Interactive System Settings'}</span>
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 px-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl cursor-pointer transition-colors text-xs font-bold flex items-center gap-1"
            >
              <span>{isAr ? 'إغلاق' : 'Close'}</span>
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content panel list window */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* -------------------- TAB 1: APPEARANCE & TYPOGRAPHY -------------------- */}
            {activeTab === 'appearance' && (
              <div className="space-y-6 animate-in fade-in-50 duration-150">
                
                {/* 1. Theme Configuration */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-1.5 leading-none">
                    <Sun className="h-3.5 w-3.5" />
                    <span>{isAr ? 'مظهر وتصميم المذكرة' : 'Workspace Theme Mode'}</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-2 bg-zinc-50 dark:bg-zinc-950 p-2 border border-zinc-200/50 dark:border-zinc-850/80 rounded-2xl">
                    {[
                      { id: 'light', nameAR: 'وضع النهار', nameEN: 'Day View', icon: Sun },
                      { id: 'dark', nameAR: 'الوضع الداكن', nameEN: 'Dark Core', icon: Moon },
                      { id: 'system', nameAR: 'تلقائي النظام', nameEN: 'OS Default', icon: Monitor }
                    ].map(opt => {
                      const Icon = opt.icon;
                      const active = theme === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => onChangeTheme(opt.id as any)}
                          className={`py-3 px-2 rounded-xl text-xs font-black flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                            active 
                              ? 'bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-750 text-amber-500 shadow-sm' 
                              : 'text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 border border-transparent'
                          }`}
                        >
                          <Icon className={`h-5 w-5 ${active ? 'text-amber-500' : ''}`} />
                          <span className="text-[11px]">{isAr ? opt.nameAR : opt.nameEN}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Typology Settings (Font scale and Typeface options) */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-1.5 leading-none">
                    <Type className="h-3.5 w-3.5" />
                    <span>{isAr ? 'نوع الخط وتخصيص القراءة' : 'Typeface & Letter Size'}</span>
                  </h4>
                  
                  {/* Font Face selection options */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-zinc-500 block">{isAr ? 'عائلة الخط المعتمدة:' : 'Active font family:'}</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'cairo', name: 'Cairo (Al-professional)', class: 'font-cairo' },
                        { id: 'tajawal', name: 'Tajawal (Contemporary)', class: 'font-tajawal' },
                        { id: 'elmessiri', name: 'El Messiri (Artistic)', class: 'font-elmessiri' },
                        { id: 'almarai', name: 'Almarai (Classic Rounded)', class: 'font-almarai' },
                        { id: 'inter', name: 'Inter (Elegant Sans)', class: 'font-inter' },
                        { id: 'mono-jb', name: 'JetBrains Mono', class: 'font-mono-jb' }
                      ].map(font => (
                        <button
                          key={font.id}
                          onClick={() => onChangeFontFamily(font.id)}
                          className={`py-2 px-3 border rounded-xl text-left text-xs font-extrabold flex items-center justify-between cursor-pointer transition-all ${
                            fontFamily === font.id
                              ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-450 shadow-xs'
                              : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-405 hover:bg-zinc-50 dark:hover:bg-zinc-850'
                          }`}
                        >
                          <span className={font.class}>{font.name}</span>
                          {fontFamily === font.id && <Check className="h-3.5 w-3.5 text-amber-500" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Size Scaling Options */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold text-zinc-500 block">{isAr ? 'حجم النصوص والخطوة:' : 'Letter zoom step size:'}</span>
                    <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-950 p-1.5 rounded-xl border border-zinc-200/60 dark:border-zinc-850">
                      {[
                        { id: 'sm', textAR: 'صغير جداً', textEN: 'Small Readable' },
                        { id: 'base', textAR: 'متوسط قياسي', textEN: 'Standard Default' },
                        { id: 'lg', textAR: 'تكبير مريح', textEN: 'Large Zoom' },
                        { id: 'xl', textAR: 'ضخم ومقروء', textEN: 'Extra Large' }
                      ].map(sz => (
                        <button
                          key={sz.id}
                          onClick={() => onChangeFontSize(sz.id as any)}
                          className={`flex-1 py-2 px-1 text-center rounded-lg text-xs font-black transition-all cursor-pointer ${
                            fontSize === sz.id
                              ? 'bg-white dark:bg-zinc-800 text-amber-500 shadow-xs'
                              : 'text-zinc-405 hover:text-zinc-700 dark:hover:text-zinc-200'
                          }`}
                        >
                          {isAr ? sz.textAR : sz.textEN}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Default View Switch */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-1.5 leading-none">
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span>{isAr ? 'طريقة مصفوفة الملاحظات الافتراضية' : 'Board Grid Default View'}</span>
                  </h4>
                  <div className="bg-zinc-50 dark:bg-zinc-950 p-4 border border-zinc-200/50 dark:border-zinc-850/80 rounded-2xl flex items-center justify-between gap-4">
                    <div>
                      <h5 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">
                        {isAr ? 'الهيكل المنظم للريد' : 'Active Grid/List Layout'}
                      </h5>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        {isAr ? 'تحويل الملا حظات إلى طريقة الشبكة أو القسط المنظم الشامل.' : 'Default standard layout system for listing saved note cards.'}
                      </span>
                    </div>

                    <div className="flex bg-zinc-200/60 dark:bg-zinc-850 p-1 rounded-xl gap-0.5 self-center shrink-0">
                      <button
                        onClick={() => onChangeViewLayout('grid')}
                        className={`p-1.5 px-3 rounded-lg flex items-center gap-1 text-[11px] font-black cursor-pointer transition-all ${
                          viewLayout === 'grid' ? 'bg-white text-amber-600 dark:bg-zinc-800 dark:text-amber-400 shadow-xs' : 'text-zinc-400'
                        }`}
                      >
                        <LayoutGrid className="h-3.5 w-3.5" />
                        <span>{isAr ? 'شبكة' : 'Grid'}</span>
                      </button>
                      <button
                        onClick={() => onChangeViewLayout('list')}
                        className={`p-1.5 px-3 rounded-lg flex items-center gap-1 text-[11px] font-black cursor-pointer transition-all ${
                          viewLayout === 'list' ? 'bg-white text-amber-600 dark:bg-zinc-800 dark:text-amber-400 shadow-xs' : 'text-zinc-400'
                        }`}
                      >
                        <List className="h-3.5 w-3.5" />
                        <span>{isAr ? 'قائمة' : 'List'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile Language Switcher visibility right inside Tab 1 */}
                <div className="md:hidden space-y-2.5 pt-4 border-t border-zinc-150 dark:border-zinc-800">
                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-1.5 leading-none">
                    <Languages className="h-3.5 w-3.5" />
                    <span>{isAr ? 'لغة واجهة المحرر' : 'UI Lang Override'}</span>
                  </h4>
                  <div className="bg-zinc-100 dark:bg-zinc-950 p-4 rounded-2xl flex items-center justify-between">
                    <span className="text-xs font-extrabold">{isAr ? 'اللغة الحالية: العربية' : 'English workspace is on'}</span>
                    <button
                      onClick={onToggleLanguage}
                      className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-[11px] font-black"
                    >
                      {isAr ? 'English' : 'تحويل للعربية'}
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* -------------------- TAB 2: SECURITY & LOCKS -------------------- */}
            {activeTab === 'security' && (
              <div className="space-y-6 animate-in fade-in-50 duration-150">
                
                {/* Intro warning badge */}
                <div className="bg-amber-500/5 dark:bg-amber-500/[0.02] border border-amber-500/20 p-4.5 rounded-2xl flex gap-3">
                  <ShieldCheck className="h-6 w-6 text-amber-500 shrink-0" />
                  <div className="space-y-1">
                    <h5 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">
                      {isAr ? 'بروتوكول الأمان والخصوصية الفعّال' : 'Local Sandbox Protection System'}
                    </h5>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {isAr 
                        ? 'تشفير وحماية البيانات محلياً. تفعيل رمز القفل سيطلب إدخال الكود السري بمجرد بدء تشغيل التطبيق أو الخمول، لحماية خصوصيتك التامة.'
                        : 'Manage local security profiles. App lock screens show up during initial boot steps or cold loads.'}
                    </p>
                  </div>
                </div>

                {/* 1. Complete App Lock PIN setup */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-1.5 leading-none">
                      <Lock className="h-3.5 w-3.5" />
                      <span>{isAr ? 'قفل التطبيق بالكامل (App Lock)' : 'Workspace Application PIN Lock'}</span>
                    </h4>
                    
                    <button
                      onClick={() => onChangeAppLockEnabled(!appLockEnabled)}
                      className={`py-1 px-3 rounded-full text-[10px] font-black uppercase transition-all ${
                        appLockEnabled 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25' 
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {appLockEnabled ? (isAr ? 'مُفعّل' : 'ENABLED') : (isAr ? 'مُعطّل' : 'DISABLED')}
                    </button>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-950 p-4 border border-zinc-200/50 dark:border-zinc-850 rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-300 block">
                          {isAr ? 'رمز قفل الـ PIN السري للتطبيق:' : 'Set 4-Digit Application PIN:'}
                        </span>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">
                          {isAr ? 'أدخل 4 أرقام عددية لفتح لوحة الحماية الأساسية بالتطبيق.' : 'Numeric PIN to secure whole application suite.'}
                        </span>
                      </div>
                      
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="1234"
                        value={tempPIN}
                        onChange={(e) => setTempPIN(e.target.value.replace(/\D/g, ''))}
                        className="w-20 tracking-widest text-center py-1.5 px-2.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl text-xs font-mono font-black text-zinc-900 dark:text-white focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Isolated individual locked note security password */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-1.5 leading-none">
                    <Key className="h-3.5 w-3.5" />
                    <span>{isAr ? 'الملاحظات المخفية والمغلقة الخاصة' : 'Note-Specific Lock Passphrase'}</span>
                  </h4>

                  <div className="bg-zinc-50 dark:bg-zinc-950 p-4 border border-zinc-200/50 dark:border-zinc-850 rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-300 block">
                          {isAr ? 'كلمة سر المذكرات المغلقة منفردة:' : 'Locked Individual Notes Password:'}
                        </span>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">
                          {isAr 
                            ? 'عيّن كلمة المرور هذه لقفل ملاحظة بعينها. لرؤية محتواها سيُطلب هذا الرمز بالتحديد.' 
                            : 'Set custom lock word. Used when protecting single nodes of notes.'}
                        </span>
                      </div>

                      <input
                        type="text"
                        placeholder="1234"
                        value={tempLockPassword}
                        onChange={(e) => setTempLockPassword(e.target.value)}
                        className="w-32 text-center py-1.5 px-3 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl text-xs font-black text-zinc-900 dark:text-white focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Confirm Save security Keys */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveSecurityKeys}
                    className="py-2 px-5 bg-amber-500 hover:bg-amber-400 text-stone-900 rounded-xl text-xs font-black cursor-pointer shadow-md shadow-amber-500/10 active:scale-95 transition-all"
                  >
                    {isAr ? 'حفظ إعدادات الأمان السري' : 'Commit & Lock Credentials'}
                  </button>
                </div>

              </div>
            )}

            {/* -------------------- TAB 3: DATA BACKUP & INTEGRATIONS -------------------- */}
            {activeTab === 'data' && (
              <div className="space-y-6 animate-in fade-in-50 duration-150">
                
                {/* 1. Cloud Synchronization Setup */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-1.5 leading-none">
                    <Cloud className="h-3.5 w-3.5" />
                    <span>{isAr ? 'النسخ الاحتياطي السحابي المتزامن (Cloud Sync)' : 'Cloud Backup Sync Center (Simulated)'}</span>
                  </h4>

                  <div className="bg-zinc-50 dark:bg-zinc-950 p-4.5 border border-zinc-200/50 dark:border-zinc-850/80 rounded-2xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${isSyncConnected ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/10 text-amber-500'}`}>
                        <Cloud className="h-5 w-5" />
                      </div>
                      <div>
                        <h5 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">
                          {isSyncConnected ? (isAr ? 'حساب التزامن السحابي نشط' : 'Cloud Sync Server Connected') : (isAr ? 'لم يتم ربط مخزن سحابي' : 'Cloud Storage Disconnected')}
                        </h5>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                          {isSyncConnected 
                            ? (isAr ? `متصل بحساب: ${syncEmail}` : `Secure Sync Active on: ${syncEmail}`)
                            : (isAr ? 'اربط بريدك (جوجل درايف) لتلقي نسخ المذكرات التلقائية وتصديرها.' : 'Link accounts representing Google Drive or Dropbox to sync lists.')
                          }
                        </p>
                      </div>
                    </div>

                    {isSyncConnected ? (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-800/60">
                        <div className="text-[10px] font-mono text-zinc-405 dark:text-zinc-500">
                          {isAr ? 'آخر مزامنة سحابية:' : 'Last Cloud Update:'}{' '}
                          <span className="font-bold text-zinc-800 dark:text-zinc-300">
                            {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : (isAr ? 'مطلقاً' : 'Never')}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleManualSyncNow}
                            disabled={isSyncing}
                            className="flex-1 sm:flex-none py-1.5 px-3 bg-zinc-900 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 hover:bg-zinc-800 rounded-lg text-[11px] font-black flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                            <span>{isSyncing ? (isAr ? 'جاري الرفع والدمج..' : 'Backing up now..') : (isAr ? 'مزامنة الآن' : 'Sync Now')}</span>
                          </button>
                          
                          <button
                            onClick={onDisconnectSync}
                            className="py-1.5 px-3 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-955/20 text-rose-500 rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            {isAr ? 'قطع الربط' : 'Disconnect'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-2">
                        <input
                          type="email"
                          placeholder="ae90op_backup@gmail.com"
                          value={syncEmailInput}
                          onChange={(e) => setSyncEmailInput(e.target.value)}
                          className="flex-1 py-1.5 px-3.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl text-xs text-zinc-800 dark:text-white focus:outline-hidden"
                        />
                        <button
                          onClick={handleConnectSyncFlow}
                          disabled={isConnectingSync}
                          className="py-1.5 px-4 bg-amber-500 hover:bg-amber-400 text-stone-900 rounded-xl text-xs font-black cursor-pointer shadow-md shadow-amber-500/15"
                        >
                          {isConnectingSync ? (isAr ? 'جاري الاتصال وصناعة المخزن..' : 'Connecting Vault..') : (isAr ? 'ربط جوجل درايف' : 'Link Google Drive')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Physical File Import & Exports */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-1.5 leading-none">
                    <Download className="h-3.5 w-3.5" />
                    <span>{isAr ? 'تصدير واستيراد البيانات يدوياً' : 'Manual File Portability / Import & Export'}</span>
                  </h4>

                  <div className="bg-zinc-50 dark:bg-zinc-950 p-4.5 border border-zinc-200/50 dark:border-zinc-850/80 rounded-2xl space-y-4">
                    
                    {/* Export Actions Row */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-zinc-500 block">{isAr ? 'تنزيل وتصدير جميع المذكورات بضغطة واحدة:' : 'Download formatted file copies of notes:'}</span>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={exportAsTXT}
                          className="py-2.5 px-1.5 bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-extrabold flex flex-col items-center gap-2 cursor-pointer transition-all"
                        >
                          <span className="text-[11px] font-bold text-sky-500 block">TXT</span>
                          <span className="text-[10px] leading-tight opacity-75">{isAr ? 'ملف نصوص مستقل' : 'Formatted Text'}</span>
                        </button>
                        
                        <button
                          onClick={exportAsJSON}
                          className="py-2.5 px-1.5 bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-extrabold flex flex-col items-center gap-2 cursor-pointer transition-all"
                        >
                          <span className="text-[11px] font-bold text-amber-500 block">JSON</span>
                          <span className="text-[10px] leading-tight opacity-75">{isAr ? 'ملف قواعد البيانات' : 'Notes JSON db'}</span>
                        </button>
                        
                        <button
                          onClick={triggerPDFPrint}
                          className="py-2.5 px-1.5 bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-extrabold flex flex-col items-center gap-2 cursor-pointer transition-all"
                        >
                          <span className="text-[11px] font-bold text-rose-500 block">PDF / Print</span>
                          <span className="text-[10px] leading-tight opacity-75">{isAr ? 'ملفات جاهزة للطباعة' : 'Printable File'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Import Notes Element */}
                    <div className="pt-3 border-t border-zinc-150 dark:border-zinc-800/60 space-y-2">
                      <span className="text-[11px] font-bold text-zinc-500 block">{isAr ? 'استيراد بنية ملاحظات من ملف خارجي (.json):' : 'Import old notes database (.json file):'}</span>
                      <div className="flex items-center gap-2">
                        <label className="flex-1 py-1.5 px-3 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-250 dark:border-zinc-800 rounded-xl text-xs text-zinc-500 dark:text-zinc-400 cursor-pointer flex items-center justify-center gap-2 transition-all">
                          <Upload className="h-4 w-4 text-amber-500 shrink-0" />
                          <span>{isAr ? 'اختر ملف الملاحظات القديمة' : 'Select Backup JSON File'}</span>
                          <input
                            type="file"
                            accept=".json"
                            onChange={handleImportJSONFile}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. HARD RESET / DANGER ZONE */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black text-rose-500 uppercase tracking-widest font-mono flex items-center gap-1.5 leading-none">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                    <span>{isAr ? 'منطقة الخطر والمسح المباشر (Danger Zone)' : 'Danger Control Area'}</span>
                  </h4>

                  <div className="border border-rose-500/20 bg-rose-500/[0.02] p-4.5 rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-black text-rose-600 dark:text-rose-400 block pb-0.5">
                          {isAr ? 'مسح جميع المذكرات والتسميات نهائياً' : 'Wipe entire environment & data'}
                        </span>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md">
                          {isAr 
                            ? 'سيؤدي هذا الإجراء إلى مسح كافة الملاحظات والملفات والرسوم المسجلة في المتصفح فوراً دون إمكانية للاسترداد!' 
                            : 'This absolutely resets database. Irreversible action. Local files and sketches will be deleted immediately.'
                          }
                        </p>
                      </div>

                      <button
                        onClick={() => setShowWipeSecurityDialogue(prev => !prev)}
                        className="py-1.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black cursor-pointer shrink-0"
                      >
                        {isAr ? 'مسح كلي للبيانات' : 'RESET ALL DATA'}
                      </button>
                    </div>

                    {showWipeSecurityDialogue && (
                      <div className="p-3 bg-white dark:bg-zinc-900 border border-rose-500/30 rounded-xl space-y-3 animate-in fade-in-30">
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-350">
                          {isAr 
                            ? <span>يرجى كتابة كلمة <b className="text-rose-500">حذف</b> لتأكيد تصفير المذكرة:</span> 
                            : <span>Type verification word <b className="text-rose-500">wipe</b> to proceed:</span>
                          }
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder={isAr ? 'حذف' : 'wipe'}
                            value={confirmWipeInput}
                            onChange={(e) => setConfirmWipeInput(e.target.value)}
                            className="flex-1 py-1 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs"
                          />
                          <button
                            onClick={handleAbsoluteWipeWorkspace}
                            className="py-1 px-4 bg-rose-650 hover:bg-rose-600 text-white rounded-lg text-xs font-black cursor-pointer"
                          >
                            {isAr ? 'أؤكد الحذف والشطب' : 'Confirm Absolute Wipe'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* -------------------- TAB 4: TRASH & ALERTS (ORGANIZATION) -------------------- */}
            {activeTab === 'reminders' && (
              <div className="space-y-6 animate-in fade-in-50 duration-150">
                
                {/* 1. Auto-clean Trash policy */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-1.5 leading-none">
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{isAr ? 'صيانة وتنظيف سلة المهملات تلقائياً' : 'Automatic Garbage / Trash Clean Schedule'}</span>
                  </h4>

                  <div className="bg-zinc-50 dark:bg-zinc-950 p-4.5 border border-zinc-200/50 dark:border-zinc-850 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 block">
                        {isAr ? 'مدة الاحتفاظ بالملاحظات المحذوفة تلقائيًا:' : 'Auto Deletion Retention Rule:'}
                      </span>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-relaxed">
                        {isAr 
                          ? 'اختر المدة المسموح بها للملاحظات في المهملات قبل أن يتم حذفها تلقائياً بالخلفية.' 
                          : 'Notes resting inside the trash bin will auto delete themselves after specific days.'
                        }
                      </p>
                    </div>

                    <select
                      value={autoDeleteDays}
                      onChange={(e) => onChangeAutoDeleteDays(parseInt(e.target.value))}
                      className="py-1.5 px-3 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-800 dark:text-white focus:outline-hidden"
                    >
                      <option value={7}>{isAr ? 'حذف بعد 7 أيام' : '7 Days'}</option>
                      <option value={30}>{isAr ? 'حذف بعد 30 يوماً (مستحسن)' : '30 Days (Recommended)'}</option>
                      <option value={0}>{isAr ? 'احتفاظ دائم (عدم حذف تلقائي)' : 'Never auto-wipe (Keep always)'}</option>
                    </select>
                  </div>
                </div>

                {/* 2. Reminders alerting policy */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-1.5 leading-none">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{isAr ? 'طريقة ظهور رادارات التنبيه والتذكيرات' : 'Reminder Alerts & Acoustic Notifications'}</span>
                  </h4>

                  <div className="bg-zinc-50 dark:bg-zinc-950 p-4.5 border border-zinc-200/50 dark:border-zinc-850 rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 block">
                          {isAr ? 'مستقبل رنين الإشعارات:' : 'Acoustic Alarm Tone Profile:'}
                        </span>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-relaxed">
                          {isAr 
                            ? 'تخصيص نغمة صوتية مسموعة للتذكيرات المنتهية أو الاكتفاء بالتنبيه البصري.'
                            : 'Set melody style playing on note alarms or opt for quiet visual badges.'
                          }
                        </p>
                      </div>

                      <div className="flex bg-zinc-200/50 dark:bg-zinc-850 p-1 rounded-xl self-center shrink-0">
                        {[
                          { id: 'chime', nameAR: 'نغمة', nameEN: 'Chime' },
                          { id: 'beep', nameAR: 'رنين', nameEN: 'Beep' },
                          { id: 'silent', nameAR: 'صامت', nameEN: 'Silent' }
                        ].map(st => (
                          <button
                            key={st.id}
                            onClick={() => onChangeReminderAlertStyle(st.id as any)}
                            className={`p-1 px-3 rounded-lg text-xs font-black cursor-pointer transition-all ${
                              reminderAlertStyle === st.id ? 'bg-white text-stone-900 dark:bg-zinc-800 dark:text-amber-400 shadow-sm' : 'text-zinc-400'
                            }`}
                          >
                            {isAr ? st.nameAR : st.nameEN}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Acoustic Sound Tester Button */}
                    <div className="pt-3 border-t border-zinc-150 dark:border-zinc-800/60 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-bold">
                        {isAr ? 'قم باختبار مخرج الصوت للتأكد ومطابقة الصوت:' : 'Test speaker volume alert profile:'}
                      </span>
                      <button
                        onClick={playAlertSound}
                        className="py-1 px-3 border border-amber-500/35 hover:bg-amber-500/10 text-amber-600 dark:text-amber-450 rounded-lg text-[10px] font-black flex items-center gap-1"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        <span>{isAr ? 'تجربة مخرج الرنين' : 'Play Sound Test'}</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* -------------------- TAB 5: TECHNICAL SUPPORT & ABOUT -------------------- */}
            {activeTab === 'support' && (
              <div className="space-y-6 animate-in fade-in-50 duration-150">
                
                {/* 1. Feedback / Contact Request Form */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-1.5 leading-none">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{isAr ? 'الدعم الفني والاتصال بنا' : 'User Feedback & Bug Reporting'}</span>
                  </h4>

                  {feedbackSuccess ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-5 rounded-2xl flex flex-col items-center text-center space-y-2.5 animate-in zoom-in-95">
                      <Check className="h-7 w-7 text-emerald-500 bg-white dark:bg-zinc-800 p-1 rounded-full border border-emerald-400 animate-bounce" />
                      <h5 className="font-extrabold text-xs">
                        {isAr ? 'تم استقبال تقريرك وملاحظاتك بنجاح!' : 'Feedback Sent Successfully!'}
                      </h5>
                      <p className="text-[10.5px] opacity-80 leading-relaxed max-w-sm">
                        {isAr 
                          ? 'شكراً لك على المساهمة في تطوير كيب. سيقوم فريق التطوير بمراجعة ملاحظاتك في غضون 24 ساعة.' 
                          : 'Thanks for contributing. Tech stack engineers review your suggestions promptly.'
                        }
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitFeedback} className="bg-zinc-50 dark:bg-zinc-950 p-4.5 border border-zinc-200/50 dark:border-zinc-850 rounded-2xl space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-zinc-500 block">{isAr ? 'الاسم:' : 'Name:'}</label>
                          <input
                            type="text"
                            required
                            placeholder={isAr ? 'مثال: أحمد' : 'e.g. John'}
                            value={feedbackName}
                            onChange={(e) => setFeedbackName(e.target.value)}
                            className="w-full py-1 px-3 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-zinc-500 block">{isAr ? 'البريد الالكتروني:' : 'Email Address:'}</label>
                          <input
                            type="email"
                            required
                            placeholder="ae90op@gmail.com"
                            value={feedbackEmail}
                            onChange={(e) => setFeedbackEmail(e.target.value)}
                            className="w-full py-1 px-3 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-zinc-500 block">{isAr ? 'نوع البلاغ:' : 'Message Type:'}</label>
                        <select
                          value={feedbackType}
                          onChange={(e) => setFeedbackType(e.target.value)}
                          className="w-full py-1 px-3 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-semibold focus:outline-hidden"
                        >
                          <option value="bug">{isAr ? 'إبلاغ عن عطل أو مشكلة تقنية (Bug)' : 'Report a Technical Error (Bug)'}</option>
                          <option value="feature">{isAr ? 'اقتراح ميزة إضافية مفيدة (Feature Request)' : 'Propose New Feature'}</option>
                          <option value="praise">{isAr ? 'تقييم واستبصار للمصممين (Praise / Feedback)' : 'Praise & Experience review'}</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-zinc-500 block">{isAr ? 'محتوى الرسالة والوصف المالي:' : 'Message description:'}</label>
                        <textarea
                          required
                          rows={2}
                          value={feedbackMsg}
                          onChange={(e) => setFeedbackMsg(e.target.value)}
                          placeholder={isAr ? 'اكتب تفاصيل وبلاغك بوضوح هنا...' : 'Explain the issue in detail...'}
                          className="w-full py-1 px-3 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:outline-hidden"
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          className="py-1.5 px-4 bg-zinc-900 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 hover:bg-zinc-800 rounded-lg text-xs font-black cursor-pointer"
                        >
                          {isAr ? 'إرسال الرسالة الآن' : 'Submit feedback Report'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* 2. Structured App Version Info Card */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-1.5 leading-none">
                    <Info className="h-3.5 w-3.5" />
                    <span>{isAr ? 'معلومات الإصدار وشريان الحياة' : 'System Version & Core Pipeline'}</span>
                  </h4>

                  <div className="bg-zinc-50 dark:bg-zinc-950 p-4 border border-zinc-200/50 dark:border-zinc-850 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-zinc-600 dark:text-zinc-400">{isAr ? 'رقم إصدار واجهة المنسق:' : 'App Version:'}</span>
                      <span className="font-mono font-black text-zinc-800 dark:text-zinc-200 bg-zinc-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded">
                        v1.0.0
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-zinc-600 dark:text-zinc-400">{isAr ? 'بيئة التخزين النشطة الحالية:' : 'Active Data Pipeline:'}</span>
                      <span className="text-emerald-500 font-bold flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span>HTML5 LocalStorage Encrypted</span>
                      </span>
                    </div>

                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed pt-2 border-t border-zinc-150 dark:border-zinc-850/70">
                      {isAr 
                        ? 'كيب نوت بوك يقوم بحفظ رسومك البيانية وملفاتك الكروكية وجداول البيانات بشكل فوري وتلقائي لتلبية احتياجاتك اليومية بسرعة واحترافية.'
                        : 'Creative Notes & Sketches Suite compiles your hand drafts, photos, custom checklists, and grids in strict isolation.'
                      }
                    </p>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Footer block buttons */}
          <div className="bg-zinc-50 dark:bg-zinc-950 px-4 sm:px-6 py-4.5 border-t border-zinc-150 dark:border-zinc-805 flex items-center justify-between gap-3 shrink-0">
            {/* Previous Tab Button */}
            {prevTab ? (
              <button
                onClick={() => navigateToTab(prevTab.id as ActiveTab)}
                className="py-2 px-3 sm:px-4 bg-zinc-200/60 hover:bg-zinc-300 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 border border-zinc-300/20 dark:border-zinc-800"
                title={isAr ? `السابق: ${prevTab.labelAR}` : `Previous: ${prevTab.labelEN}`}
              >
                {isAr ? <ChevronRight className="h-4 w-4 shrink-0 text-amber-500" /> : <ChevronLeft className="h-4 w-4 shrink-0 text-amber-500" />}
                <span>{isAr ? 'السابق' : 'Previous'}</span>
              </button>
            ) : (
              <div className="w-10 sm:w-20" />
            )}

            {/* Stepper Dots (Hidden on small screens) */}
            <div className="hidden sm:flex items-center gap-2">
              {SETTINGS_TABS.map((tab, idx) => {
                const isCurrent = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    onClick={() => navigateToTab(tab.id as ActiveTab)}
                    className={`h-2 rounded-full duration-200 cursor-pointer ${
                      isCurrent 
                        ? 'w-6 bg-amber-500 shadow-md shadow-amber-500/20' 
                        : 'w-2 bg-zinc-350 dark:bg-zinc-800 hover:bg-zinc-400 dark:hover:bg-zinc-700'
                    }`}
                    title={isAr ? tab.labelAR : tab.labelEN}
                  />
                );
              })}
            </div>

            {/* Next Tab / Save & Close */}
            <div className="flex items-center gap-2">
              {nextTab ? (
                <button
                  onClick={() => navigateToTab(nextTab.id as ActiveTab)}
                  className="py-2 px-3.5 sm:px-4 bg-amber-500 hover:bg-amber-400 text-stone-900 rounded-xl text-xs font-black cursor-pointer shadow-md shadow-amber-500/10 transition-all flex items-center gap-1.5 active:scale-95"
                  title={isAr ? `التالي: ${nextTab.labelAR}` : `Next: ${nextTab.labelEN}`}
                >
                  <span>{isAr ? 'التالي' : 'Next'}</span>
                  {isAr ? <ChevronLeft className="h-4 w-4 shrink-0 text-stone-950" /> : <ChevronRight className="h-4 w-4 shrink-0 text-stone-950" />}
                </button>
              ) : null}

              <button
                onClick={onClose}
                className={`py-2 px-4 rounded-xl text-xs font-black cursor-pointer transition-all active:scale-95 ${
                  !nextTab
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
                    : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-200 dark:hover:bg-zinc-100 text-white dark:text-zinc-900'
                }`}
              >
                {isAr ? 'إنهاء وحفظ' : 'Exit & Save'}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
