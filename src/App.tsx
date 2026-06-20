import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lightbulb, 
  Tag as TagIcon, 
  Archive, 
  Trash2, 
  Plus, 
  Search, 
  Grid, 
  List, 
  Languages, 
  FolderEdit, 
  NotebookPen,
  Pin,
  Clock,
  LayoutGrid,
  CheckSquare,
  HelpCircle,
  Paintbrush,
  Type,
  Settings,
  Sun,
  Moon
} from 'lucide-react';

import { Note, Label, NOTE_COLORS } from './types';
import { generateId } from './utils';
import NoteCard from './components/NoteCard';
import NoteEditor from './components/NoteEditor';
import LabelManager from './components/LabelManager';
import SettingsModal from './components/SettingsModal';

// Initial Starter Notes to populate the app beautifully on first boot
const STARTER_LABELS: Label[] = [
  { id: 'l-creative', name: 'أفكار إبداعية / Creative' },
  { id: 'l-work', name: 'مهام العمل / Work' },
  { id: 'l-personal', name: 'شخصي / Personal' }
];

const STARTER_NOTES = (labels: Label[]): Note[] => [
  {
    id: 'note-1',
    title: 'أهلاً بك في منظم الملاحظات الإبداعي! 🎨✨',
    content: 'هذا التطبيق مصمم ليعمل تماماً مثل Google Keep مع دعم كامل للرسم الحر وإدراج الصور والملاحظات الملونة.\n\nالمميزات الحالية:\n- ✍️ ارسم بيدك مع تراجع وإعادة وتعديل الرسم لاحقاً.\n- 🖼️ ارفع صورك واكتب تفاصيلها بترميز عالي الأداء.\n- 🎨 اختر ألواناً رائعة لبطاقاتك الإبداعية.\n- 📌 ثبت الملاحظات الهامة في الأعلى.\n- 🏷️ صنف ملاحظاتك ونقّب فيها عبر شريط البحث الذكي.\n- 📱 متجاوب تماماً للهواتف والأجهزة اللوحية!',
    isChecklist: false,
    checklistItems: [],
    color: 'indigo',
    isPinned: true,
    isArchived: false,
    isTrashed: false,
    labels: [labels[0].id],
    drawingData: null,
    images: [],
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 3600000 * 2
  },
  {
    id: 'note-2',
    title: 'قائمة مهام اليومية 🗒️🕊️',
    content: '',
    isChecklist: true,
    checklistItems: [
      { id: 'c-1', text: 'شرب كوب من القهوة الدافئة ☕', completed: true },
      { id: 'c-2', text: 'رسم المخطط الكروكي للواجهة الجديدة 🎨', completed: false },
      { id: 'c-3', text: 'رفع الصور وتجربة ضغط الملفات لتوفير الاستهلاك 🖼️', completed: false },
      { id: 'c-4', text: 'مراجعة المهام المكتملة والأرشيف 🚀', completed: true }
    ],
    color: 'teal',
    isPinned: true,
    isArchived: false,
    isTrashed: false,
    labels: [labels[1].id],
    drawingData: null,
    images: [],
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now()
  }
];

export default function App() {
  // Sync core lists
  const [notes, setNotes] = useState<Note[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  
  // Navigation & Filtering
  const [currentSection, setCurrentSection] = useState<'notes' | 'trash' | string>('notes'); // labelId can be a section
  const [searchQuery, setSearchQuery] = useState('');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [isAr, setIsAr] = useState<boolean>(true); // default Arabic
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Edit states variables
  const [activeEditingNote, setActiveEditingNote] = useState<Note | null>(null);
  const [isNewEditorModalOpen, setIsNewEditorModalOpen] = useState(false);
  const [newEditorStartWithWhiteboard, setNewEditorStartWithWhiteboard] = useState(false);
  const [newEditorStartWithTable, setNewEditorStartWithTable] = useState(false);
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [isLabelManagerOpen, setIsLabelManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConfirmingWipeTrash, setIsConfirmingWipeTrash] = useState(false);

  // Synchronize CSS Class with Theme parameter
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('keep_theme', theme);
  }, [theme]);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedLabels = localStorage.getItem('keep_labels');
    const savedNotes = localStorage.getItem('keep_notes');
    const savedLayout = localStorage.getItem('keep_layout');
    const savedLanguage = localStorage.getItem('keep_language');
    const savedTheme = localStorage.getItem('keep_theme') as 'light' | 'dark' | null;

    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }

    // Parse labels
    let parsedLabels: Label[] = [];
    if (savedLabels) {
      try {
        parsedLabels = JSON.parse(savedLabels);
        setLabels(parsedLabels);
      } catch (e) {
        parsedLabels = STARTER_LABELS;
        setLabels(parsedLabels);
      }
    } else {
      parsedLabels = STARTER_LABELS;
      setLabels(parsedLabels);
      localStorage.setItem('keep_labels', JSON.stringify(parsedLabels));
    }

    // Parse notes
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        setNotes(STARTER_NOTES(parsedLabels));
      }
    } else {
      const starters = STARTER_NOTES(parsedLabels);
      setNotes(starters);
      localStorage.setItem('keep_notes', JSON.stringify(starters));
    }

    // Parse config
    if (savedLayout === 'list') setViewLayout('list');
    if (savedLanguage === 'en') setIsAr(false);
  }, []);

  // Save changes to localStorage whenever notes or labels updates
  const saveNotesToStorage = (updatedNotes: Note[]) => {
    setNotes(updatedNotes);
    localStorage.setItem('keep_notes', JSON.stringify(updatedNotes));
  };

  const saveLabelsToStorage = (updatedLabels: Label[]) => {
    setLabels(updatedLabels);
    localStorage.setItem('keep_labels', JSON.stringify(updatedLabels));
  };

  // Toggle layout
  const handleToggleLayout = () => {
    const nextLayout = viewLayout === 'grid' ? 'list' : 'grid';
    setViewLayout(nextLayout);
    localStorage.setItem('keep_layout', nextLayout);
  };

  // Toggle language
  const handleToggleLanguage = () => {
    const nextAr = !isAr;
    setIsAr(nextAr);
    localStorage.setItem('keep_language', nextAr ? 'ar' : 'en');
  };

  // ----------------------------------------------------
  // NOTE CRUD ACTIONS
  // ----------------------------------------------------
  
  // Create / Update Note
  const handleSaveNote = (noteData: Partial<Note>) => {
    if (activeEditingNote) {
      // Editing Mode
      const updated = notes.map(n => {
        if (n.id === activeEditingNote.id) {
          return {
            ...n,
            ...noteData,
            updatedAt: Date.now()
          };
        }
        return n;
      });
      saveNotesToStorage(updated);
      setActiveEditingNote(null);
    } else {
      // Creation Mode
      const brandNewNote: Note = {
        id: generateId(),
        title: noteData.title || '',
        content: noteData.content || '',
        isChecklist: noteData.isChecklist || false,
        checklistItems: noteData.checklistItems || [],
        color: noteData.color || 'default',
        isPinned: noteData.isPinned || false,
        isArchived: noteData.isArchived || false,
        isTrashed: false,
        labels: noteData.labels || [],
        drawingData: noteData.drawingData || null,
        drawingPaths: noteData.drawingPaths || [],
        images: noteData.images || [],
        imagePosition: noteData.imagePosition || 'top',
        imageSize: noteData.imageSize || 'medium',
        isTable: noteData.isTable || false,
        tableData: noteData.tableData || [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      saveNotesToStorage([brandNewNote, ...notes]);
      setIsNewEditorModalOpen(false);
    }
  };

  // Quick incremental update from card hover actions
  const handleUpdateNoteField = (noteId: string, updates: Partial<Note>) => {
    const updated = notes.map(n => {
      if (n.id === noteId) {
        return { ...n, ...updates, updatedAt: Date.now() };
      }
      return n;
    });
    saveNotesToStorage(updated);
  };

  // Restoration or Trashing
  const handleRestoreNote = (noteId: string) => {
    const updated = notes.map(n => {
      if (n.id === noteId) {
        return { ...n, isTrashed: false, updatedAt: Date.now() };
      }
      return n;
    });
    saveNotesToStorage(updated);
  };

  // Physical deletion / Permanent delete from Trash
  const handlePermanentDeleteNote = (noteId: string) => {
    const remaining = notes.filter(n => n.id !== noteId);
    saveNotesToStorage(remaining);
  };

  // Wipe Trash completely empty
  const handleWipeTrash = () => {
    const saved = notes.filter(n => !n.isTrashed);
    saveNotesToStorage(saved);
    setIsConfirmingWipeTrash(false);
  };

  // Live Whiteboard Sketch loader for existing drawings
  const handleEditDrawingOnNote = (noteToEdit: Note) => {
    // Open the note editing modal but flag the whiteboard directly!
    // Simply set activeNote and the editor component will boot with whiteboard open.
    setActiveEditingNote(noteToEdit);
  };

  // ----------------------------------------------------
  // LABEL LABELS CRUD ACTIONS
  // ----------------------------------------------------
  const handleAddLabel = (name: string) => {
    const newLbl: Label = { id: `lbl-${generateId()}`, name };
    const nextLabels = [...labels, newLbl];
    saveLabelsToStorage(nextLabels);
  };

  const handleUpdateLabel = (id: string, name: string) => {
    const nextLabels = labels.map(l => l.id === id ? { ...l, name } : l);
    saveLabelsToStorage(nextLabels);
  };

  const handleDeleteLabel = (id: string) => {
    // Remove label definition
    const nextLabels = labels.filter(l => l.id !== id);
    saveLabelsToStorage(nextLabels);

    // Clean label references in all notes
    const nextNotes = notes.map(note => {
      if (note.labels.includes(id)) {
        return {
          ...note,
          labels: note.labels.filter(lblId => lblId !== id),
          updatedAt: Date.now()
        };
      }
      return note;
    });
    saveNotesToStorage(nextNotes);

    // If active section is this label, fall back to notes
    if (currentSection === id) {
      setCurrentSection('notes');
    }
  };

  // ----------------------------------------------------
  // FILTERING ENGINE OF NOTES
  // ----------------------------------------------------
  const getFilteredNotes = () => {
    return notes.filter((note) => {
      // Match query first
      const matchesQuery = 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.checklistItems.some(item => item.text.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesQuery) return false;

      // Section sorting
      if (currentSection === 'notes') {
        return !note.isTrashed;
      }
      if (currentSection === 'trash') {
        return note.isTrashed;
      }
      // Section is actually a Label ID
      return !note.isTrashed && note.labels.includes(currentSection);
    });
  };

  const filteredList = getFilteredNotes();

  // Split Main Notes into Pinned vs Others for visual Keep hierarchy
  const pinnedNotes = filteredList.filter(n => n.isPinned);
  const unpinnedNotes = filteredList.filter(n => !n.isPinned);

  // Active section metadata display title
  const getActiveSectionTitle = () => {
    if (currentSection === 'notes') return isAr ? 'الملاحظات' : 'Notes';
    if (currentSection === 'trash') return isAr ? 'سلة المهملات' : 'Trash';
    const activeLabel = labels.find(l => l.id === currentSection);
    return activeLabel ? activeLabel.name : '';
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-yellow-420 selection:text-black">
      
      {/* -------------------- MAIN TOP HEADER NAVBAR -------------------- */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-850 h-16 px-4 py-2 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        
        {/* Brand Details */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-amber-500 rounded-xl flex items-center justify-center text-white font-extrabold shadow-md shadow-amber-500/20">
            <NotebookPen className="h-5.5 w-5.5 text-amber-50" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase font-mono bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded border border-amber-200/50 leading-none">
                {isAr ? 'ملاحظات كيب' : 'Keep Notebook'}
              </span>
            </div>
            <h1 className="font-extrabold text-zinc-900 dark:text-white text-sm sm:text-base tracking-tight mt-0.5">
              {isAr ? 'محرر المذكرات الذكي' : 'Smart Note Organizer'}
            </h1>
          </div>
        </div>

        {/* Global Instant Search input (In context filtering) */}
        <div className="hidden sm:flex items-center gap-2 bg-zinc-105 dark:bg-zinc-950/80 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md mx-6 transition-colors focus-within:border-amber-500/55">
          <Search className="h-4.5 w-4.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'البحث عن ملاحظة...' : 'Search through notes...'}
            className="w-full text-xs font-semibold focus:outline-hidden bg-transparent py-0.5"
            dir={isAr ? 'rtl' : 'ltr'}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="text-zinc-400 hover:text-zinc-650 text-xs font-bold leading-none"
            >
              ×
            </button>
          )}
        </div>

        {/* Global Right Actions (Layout switch, Settings, Clock) */}
        <div className="flex items-center gap-2">
          
          {/* Quick theme toggler */}
          <button
            onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-350 transition-colors cursor-pointer"
            title={isAr ? 'تبديل المظهر (فاتح / داكن)' : 'Toggle light/dark theme'}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4.5 text-zinc-700" />
            ) : (
              <Sun className="h-4 w-4.5 text-amber-500" />
            )}
          </button>

          {/* Settings button in the old place of New Note */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="bg-amber-500 hover:bg-amber-400 text-white rounded-xl py-2 px-3.5 shadow-md flex items-center gap-1.5 text-xs font-extrabold transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-amber-500/10"
            title={isAr ? 'الإعدادات واللغة' : 'Settings & Language'}
          >
            <Settings className="h-4 w-4 stroke-[2.5]" />
            <span>{isAr ? 'الإعدادات' : 'Settings'}</span>
          </button>

        </div>

      </header>

      {/* Mobile search bar visible on xs devices */}
      <div className="flex sm:hidden p-3 bg-zinc-100 border-b border-zinc-200 dark:bg-zinc-950 dark:border-zinc-850 justify-center">
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-250 dark:border-zinc-800 w-full">
          <Search className="h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'البحث عن ملاحظة...' : 'Search through notes...'}
            className="w-full text-xs font-semibold focus:outline-hidden bg-transparent"
            dir={isAr ? 'rtl' : 'ltr'}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-zinc-450">×</button>
          )}
        </div>
      </div>

      {/* -------------------- WORKSPACE SIDEBAR + CENTRAL BOARD -------------------- */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative" dir={isAr ? 'rtl' : 'ltr'}>
        
        {/* Left/Right Sidebar Menu (Sticky responsive) */}
        <aside className="bg-white dark:bg-zinc-900 md:w-64 border-zinc-200 dark:border-zinc-850 border-r md:h-full shrink-0 p-3 flex md:flex-col overflow-x-auto md:overflow-x-visible z-20 scrollbar-none gap-1 sm:gap-1.5 shrink-0">
          
          <div className="hidden md:block py-2 px-2.5 mb-1.5">
            <span className="text-[10px] uppercase font-mono text-zinc-400 dark:text-zinc-500 tracking-widest font-extrabold">
              {isAr ? 'أدوات التنظيم' : 'ORGANIZATION TOOLS'}
            </span>
          </div>

          {/* Switch: Notes */}
          <button
            onClick={() => setCurrentSection('notes')}
            className={`flex items-center gap-3 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              currentSection === 'notes'
                ? 'bg-amber-500/10 dark:bg-amber-500/5 text-amber-650 dark:text-amber-450 border border-amber-500/20 shadow-xs'
                : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-850 hover:text-zinc-800 dark:hover:text-zinc-200 border border-transparent'
            }`}
          >
            <Lightbulb className="h-4.5 w-4.5" />
            <span>{isAr ? 'الملاحظات' : 'My Notes'}</span>
          </button>

          {/* Switch: Labels Editor */}
          <button
            onClick={() => setIsLabelManagerOpen(true)}
            className="flex items-center gap-3 py-2.5 px-4 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-850 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all cursor-pointer border border-transparent shrink-0"
          >
            <FolderEdit className="h-4.5 w-4.5" />
            <span>{isAr ? 'إدارة التصنيفات' : 'Edit Labels'}</span>
          </button>

          {/* DYNAMIC LABELS CHIPS LIST BAR */}
          {labels.length > 0 && (
            <div className="flex md:flex-col gap-1 sm:gap-1.5 md:my-1.5 md:pt-1.5 md:border-t border-zinc-150 dark:border-zinc-850">
              {labels.map((lbl) => (
                <button
                  key={lbl.id}
                  onClick={() => setCurrentSection(lbl.id)}
                  className={`flex items-center gap-2.5 py-2 px-3.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    currentSection === lbl.id
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-250 dark:border-zinc-700 shadow-xs'
                      : 'text-zinc-500 hover:bg-zinc-50/70 dark:hover:bg-zinc-850/60 hover:text-zinc-800 dark:hover:text-zinc-300 border border-transparent'
                  }`}
                >
                  <TagIcon className="h-4 w-4 rotate-90" />
                  <span className="truncate max-w-28 sm:max-w-none">{lbl.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Separation list */}
          <div className="hidden md:block w-full h-px bg-zinc-150 dark:bg-zinc-850 my-2" />

          {/* Switch: Trash */}
          <button
            onClick={() => setCurrentSection('trash')}
            className={`flex items-center gap-3 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              currentSection === 'trash'
                ? 'bg-amber-500/10 dark:bg-amber-500/5 text-amber-650 dark:text-amber-450 border border-amber-500/20 shadow-xs'
                : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-850 hover:text-zinc-800 dark:hover:text-zinc-200 border border-transparent'
            }`}
          >
            <Trash2 className="h-4.5 w-4.5" />
            <span>{isAr ? 'المهملات' : 'Trash bin'}</span>
          </button>

        </aside>

        {/* Primary Scrollable Board View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5">
          
          {/* Header Section Title (And Empty Trash option if in Trash) */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-4 bg-amber-500 rounded-full" />
              <h2 className="text-lg font-black text-zinc-900 dark:text-white capitalize">
                {getActiveSectionTitle()}
              </h2>
              {searchQuery && (
                <span className="text-[11px] bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-500 font-bold px-2.5 py-0.5 rounded-full">
                  {isAr ? `نتائج البحث عن: "${searchQuery}"` : `search: "${searchQuery}"`}
                </span>
              )}
            </div>

            {currentSection === 'trash' && filteredList.length > 0 && (
              <button
                onClick={() => {
                  if (isConfirmingWipeTrash) {
                    handleWipeTrash();
                  } else {
                    setIsConfirmingWipeTrash(true);
                  }
                }}
                onMouseLeave={() => setIsConfirmingWipeTrash(false)}
                className={`py-1.5 px-3 rounded-lg border text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                  isConfirmingWipeTrash
                    ? 'bg-rose-600 hover:bg-rose-500 text-white border-transparent'
                    : 'border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-955/20'
                }`}
                title={isAr ? 'إفراغ جميع محتويات سلة المهملات نهائياً' : 'Empty Trash completely'}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>
                  {isConfirmingWipeTrash
                    ? (isAr ? 'تأكيد إفراغ سلة المهملات؟' : 'Confirm Empty Trash?')
                    : (isAr ? 'إفراغ سلة المهملات' : 'Empty Trash')}
                </span>
              </button>
            )}
          </div>

          {/* -------------------- INLINE EXPANDABLE WRITER -------------------- */}
          {currentSection === 'notes' && !searchQuery && (
            <div className="mb-6">
              <NoteEditor
                labels={labels}
                onSave={handleSaveNote}
                onCancel={() => {}}
                isAr={isAr}
                isModal={false}
              />
            </div>
          )}

          {/* -------------------- FILTERED NOTES CARD WALLS -------------------- */}
          {filteredList.length === 0 ? (
            
            /* EMPTY VIEW ILLUSTRATOR */
            <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-400 dark:text-zinc-600 px-4">
              <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-2xl mb-3 border border-zinc-200/50 dark:border-zinc-800/50">
                {currentSection === 'trash' ? (
                  <Trash2 className="h-12 w-12 text-zinc-300 dark:text-zinc-700 stroke-1" />
                ) : currentSection === 'archive' ? (
                  <Archive className="h-12 w-12 text-zinc-300 dark:text-zinc-700 stroke-1" />
                ) : (
                  <Lightbulb className="h-12 w-12 text-zinc-300 dark:text-zinc-700 stroke-1" />
                )}
              </div>
              <h3 className="font-extrabold text-sm text-zinc-700 dark:text-zinc-300">
                {currentSection === 'trash'
                  ? (isAr ? 'سلة المهملات فارغة' : 'No notes in trash')
                  : currentSection === 'archive'
                  ? (isAr ? 'لا توجد ملاحظات مؤرشفة' : 'No archived notes')
                  : (isAr ? 'ابدأ بتدوين ملاحظاتك الأولى!' : 'No matching notes found')}
              </h3>
              <p className="text-[11px] opacity-75 max-w-sm mt-1 leading-relaxed">
                {currentSection === 'trash'
                  ? (isAr ? 'عند حذف ملاحظة، سوف تُنقل هنا ويمكنك استعادتها لاحقاً.' : 'Notes you delete will appear here and can be restored.')
                  : currentSection === 'archive'
                  ? (isAr ? 'أرشف الملاحظات القديمة لإبعادها عن الواجهة الرئيسية دون خسارتها.' : 'Archive notes to tidy up your board while keeping them search-ready.')
                  : (isAr ? 'اضغط على زر ملاحظة جديدة لتدوين أفكارك ورسم الرسومات وحفظ الصور.' : 'Click "New Note" to easily capture checklist plans, hand sketches, and photos.')}
              </p>
            </div>

          ) : (
            
            /* CHIP FEED SEPARATORS (PINNED VS OTHERS) */
            <div className="space-y-6">
              
              {/* Pinned notes list */}
              {pinnedNotes.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-550">
                    <Pin className="h-3 w-3 rotate-45" />
                    <span>{isAr ? 'الملاحظات المثبتة' : 'PINNED NOTES'}</span>
                  </div>
                  
                  <div className={
                    viewLayout === 'grid'
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                      : "max-w-xl mx-auto flex flex-col gap-4"
                  }>
                    {pinnedNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        labels={labels}
                        onSelect={setActiveEditingNote}
                        onUpdateNote={handleUpdateNoteField}
                        onDeleteNote={handlePermanentDeleteNote}
                        onRestoreNote={handleRestoreNote}
                        isAr={isAr}
                        onEditDrawing={handleEditDrawingOnNote}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Unpinned notes list (Others) */}
              {unpinnedNotes.length > 0 && (
                <div className="space-y-2.5">
                  {pinnedNotes.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-550">
                      <span>{isAr ? 'الأشكال والملاحظات الأخرى' : 'OTHERS'}</span>
                    </div>
                  )}

                  <div className={
                    viewLayout === 'grid'
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                      : "max-w-xl mx-auto flex flex-col gap-4"
                  }>
                    {unpinnedNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        labels={labels}
                        onSelect={setActiveEditingNote}
                        onUpdateNote={handleUpdateNoteField}
                        onDeleteNote={handlePermanentDeleteNote}
                        onRestoreNote={handleRestoreNote}
                        isAr={isAr}
                        onEditDrawing={handleEditDrawingOnNote}
                      />
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </main>

      </div>

      {/* -------------------- DYNAMIC MODALS RENDERING VIEW -------------------- */}
      <AnimatePresence>
        
        {/* MODAL 1: EDITING / EXPANDED ACTIVE NOTE OVERLAY */}
        {activeEditingNote && (
          <NoteEditor
            note={activeEditingNote}
            labels={labels}
            onSave={handleSaveNote}
            onCancel={() => setActiveEditingNote(null)}
            isAr={isAr}
            isModal={true}
          />
        )}

        {/* MODAL 2: CREATION POPUP OVERLAY */}
        {isNewEditorModalOpen && (
          <NoteEditor
            labels={labels}
            onSave={handleSaveNote}
            onCancel={() => {
              setIsNewEditorModalOpen(false);
              setNewEditorStartWithWhiteboard(false);
              setNewEditorStartWithTable(false);
            }}
            isAr={isAr}
            isModal={true}
            startWithWhiteboard={newEditorStartWithWhiteboard}
            startWithTable={newEditorStartWithTable}
          />
        )}

        {/* MODAL 3: TAG CATEGORIES LABEL MANAGER OVERLAY */}
        {isLabelManagerOpen && (
          <LabelManager
            labels={labels}
            onAddLabel={handleAddLabel}
            onUpdateLabel={handleUpdateLabel}
            onDeleteLabel={handleDeleteLabel}
            onClose={() => setIsLabelManagerOpen(false)}
            isAr={isAr}
          />
        )}

        {/* MODAL 4: SETTINGS OVERLAY */}
        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            isAr={isAr}
            onToggleLanguage={handleToggleLanguage}
            theme={theme}
            onChangeTheme={setTheme}
          />
        )}

      </AnimatePresence>

      {/* FLOATING ACTION TRIGGER: NEW NOTE (Bottom Left) */}
      <div className="fixed bottom-14 left-6 z-40 md:bottom-16 md:left-8" dir="ltr">
        <div className="relative">
          <button
            onClick={() => setShowAddOptions(!showAddOptions)}
            className="bg-amber-500 hover:bg-amber-400 text-white rounded-full p-4.5 shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-amber-500/40 hover:rotate-90 duration-200"
            title={isAr ? 'ملاحظة جديدة' : 'New Note'}
          >
            <Plus className="h-6 w-6 stroke-[3.5]" />
          </button>

          {showAddOptions && (
            <div 
              className="absolute bottom-full mb-3 left-0 w-60 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1.5 animate-in slide-in-from-bottom-3 duration-150"
              onMouseLeave={() => setShowAddOptions(false)}
            >
              <div className="px-2.5 py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 block">
                  {isAr ? 'إضافة ملاحظة جديدة' : 'CREATE NEW NOTE'}
                </span>
              </div>

              {/* Option 1: Write text note */}
              <button
                onClick={() => {
                  setNewEditorStartWithWhiteboard(false);
                  setNewEditorStartWithTable(false);
                  setIsNewEditorModalOpen(true);
                  setShowAddOptions(false);
                }}
                className={`flex items-center gap-3 w-full p-2.5 text-xs font-bold rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 cursor-pointer transition-colors ${
                  isAr ? 'text-right justify-end flex-row-reverse' : 'text-left'
                }`}
              >
                <Type className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                <span>{isAr ? 'كتابة ملاحظة نصية' : 'Write text note'}</span>
              </button>

              {/* Option 2: Drawing whiteboard */}
              <button
                onClick={() => {
                  setNewEditorStartWithWhiteboard(true);
                  setNewEditorStartWithTable(false);
                  setIsNewEditorModalOpen(true);
                  setShowAddOptions(false);
                }}
                className={`flex items-center gap-3 w-full p-2.5 text-xs font-bold rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 cursor-pointer transition-colors ${
                  isAr ? 'text-right justify-end flex-row-reverse' : 'text-left'
                }`}
              >
                <Paintbrush className="h-4.5 w-4.5 text-purple-500 shrink-0" />
                <span>{isAr ? 'فتح لوحة الرسم' : 'Open drawing board'}</span>
              </button>

              {/* Option 3: Create Excel Table */}
              <button
                onClick={() => {
                  setNewEditorStartWithTable(true);
                  setNewEditorStartWithWhiteboard(false);
                  setIsNewEditorModalOpen(true);
                  setShowAddOptions(false);
                }}
                className={`flex items-center gap-3 w-full p-2.5 text-xs font-bold rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 cursor-pointer transition-colors ${
                  isAr ? 'text-right justify-end flex-row-reverse' : 'text-left'
                }`}
              >
                <LayoutGrid className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                <span>{isAr ? 'عمل جدول' : 'Create table'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cockpit systems footer stats */}
      <footer className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-850 h-10 px-4 py-2 flex items-center justify-between text-[11px] text-zinc-405 dark:text-zinc-500 font-mono shrink-0">
        <div>{isAr ? 'برنامج تنظيم الملاحظات والرسوم الكروكية © 2026' : 'Creative Notes & Sketches Suite © 2026'}</div>
        <div className="hidden sm:flex items-center gap-2">
          <span>{isAr ? 'عناصر الحفظ المباشر تلقائية:' : 'Local-first autosave:'}</span>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-emerald-600 dark:text-emerald-400">ONLINE LOCAL persistence</span>
        </div>
      </footer>

    </div>
  );
}
