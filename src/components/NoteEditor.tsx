import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Palette, 
  Tag as TagIcon, 
  Image as ImageIcon, 
  Paintbrush, 
  Pin, 
  Archive, 
  Trash2, 
  CheckSquare, 
  Plus, 
  Calendar,
  MoreVertical,
  Check,
  Type,
  LayoutGrid,
  Brain,
  Sparkles
} from 'lucide-react';
import { Note, Label, NOTE_COLORS, ChecklistItem, DrawingPath } from '../types';
import { compressAndResizeImage, generateId } from '../utils';
import DrawingCanvas from './DrawingCanvas';
import ExcelTableModal from './ExcelTableModal';

interface NoteEditorProps {
  note?: Note | null; // Null means we are creating a brand new note
  labels: Label[];
  onSave: (noteData: Partial<Note>) => void;
  onCancel: () => void;
  isAr: boolean;
  isModal: boolean; // Determines if it's rendered as centered overlay modal vs top-feed creator widget
  startWithWhiteboard?: boolean; // Instantly launch diagram visualizer
  startWithTable?: boolean; // Instantly launch Excel table
}

export default function NoteEditor({
  note,
  labels,
  onSave,
  onCancel,
  isAr,
  isModal,
  startWithWhiteboard,
  startWithTable
}: NoteEditorProps) {
  // Main states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isChecklist, setIsChecklist] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [color, setColor] = useState('default');
  const [isPinned, setIsPinned] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [noteLabels, setNoteLabels] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [imagePosition, setImagePosition] = useState<'top' | 'bottom'>('top');
  const [imageSize, setImageSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [isTable, setIsTable] = useState(false);
  const [tableData, setTableData] = useState<string[][]>([
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
    ["", "", ""]
  ]);
  
  // Custom whiteboard drawing layers
  const [drawingData, setDrawingData] = useState<string | null>(null);
  const [drawingPaths, setDrawingPaths] = useState<DrawingPath[]>([]);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  // Popover menus state
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showLabelMenu, setShowLabelMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!isModal ? false : true); // inline editor starts collapsed

  // AI states
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Refs for tracking focus
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const checklistRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const colorDef = NOTE_COLORS.find(c => c.id === color) || NOTE_COLORS[0];

  // Initialize fields if we are editing an existing note
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setIsChecklist(note.isChecklist || false);
      setChecklistItems(note.checklistItems ? [...note.checklistItems] : []);
      setColor(note.color || 'default');
      setIsPinned(note.isPinned || false);
      setIsArchived(note.isArchived || false);
      setNoteLabels(note.labels ? [...note.labels] : []);
      setImages(note.images ? [...note.images] : []);
      setImagePosition(note.imagePosition || 'top');
      setImageSize(note.imageSize || 'medium');
      setDrawingData(note.drawingData || null);
      setDrawingPaths(note.drawingPaths ? [...note.drawingPaths] : []);
      setIsTable(note.isTable || false);
      setTableData(note.tableData && note.tableData.length > 0 ? note.tableData.map(row => [...row]) : [
        ["", "", ""],
        ["", "", ""],
        ["", "", ""],
        ["", "", ""]
      ]);
      setIsExpanded(true);
      if (startWithWhiteboard) {
        setIsWhiteboardOpen(true);
      }
      if (startWithTable) {
        setIsTableModalOpen(true);
      }
    } else {
      // Clear all fields for clean brand new note
      setTitle('');
      setContent('');
      setIsChecklist(false);
      setChecklistItems([]);
      setColor('default');
      setIsPinned(false);
      setIsArchived(false);
      setNoteLabels([]);
      setImages([]);
      setImagePosition('top');
      setImageSize('medium');
      setDrawingData(null);
      setDrawingPaths([]);
      setIsTable(startWithTable || false);
      setTableData([
        ["", "", ""],
        ["", "", ""],
        ["", "", ""],
        ["", "", ""]
      ]);
      setIsWhiteboardOpen(startWithWhiteboard || false);
      setIsTableModalOpen(startWithTable || false);
      if (!isModal) {
        setIsExpanded(false);
      }
    }
  }, [note, isModal, startWithWhiteboard, startWithTable]);

  // Handle outside clicks to close the expanded inline editor (saves note organically, like Keep!)
  useEffect(() => {
    if (isModal) return; // Modals are handled separately

    const handleOutsideClick = (e: MouseEvent) => {
      if (editorRef.current && !editorRef.current.contains(e.target as Node)) {
        if (isExpanded) {
          submitNote();
        }
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isExpanded, title, content, checklistItems, color, isPinned, isArchived, noteLabels, images, drawingData, drawingPaths, imagePosition, imageSize]);

  // Submit/compile note with override parameters to handle instant modal saves without state lag
  const submitNoteWithOverride = (overrideTableData?: string[][], overrideIsTable?: boolean) => {
    const activeTable = overrideIsTable !== undefined ? overrideIsTable : isTable;
    const activeTableData = overrideTableData !== undefined ? overrideTableData : tableData;

    const hasText = title.trim().length > 0 || (content.trim().length > 0 && !activeTable);
    const hasList = isChecklist && checklistItems.some(item => item.text.trim().length > 0);
    const hasTable = activeTable && activeTableData.some(row => row.some(cell => cell && cell.trim().length > 0));
    const hasMedia = images.length > 0 || drawingData !== null;

    if (!hasText && !hasList && !hasTable && !hasMedia) {
      onCancel();
      setIsExpanded(false);
      return;
    }

    onSave({
      title: title.trim(),
      content: activeTable ? '' : isChecklist ? '' : content.trim(),
      isChecklist: activeTable ? false : isChecklist,
      isTable: activeTable,
      tableData: activeTable ? activeTableData : [],
      checklistItems: isChecklist 
        ? checklistItems.filter(item => item.text.trim().length > 0)
        : [],
      color,
      isPinned,
      isArchived,
      labels: noteLabels,
      images,
      imagePosition,
      imageSize,
      drawingData,
      drawingPaths,
      updatedAt: Date.now()
    });

    // Reset creator widget if inline
    if (!isModal) {
      setTitle('');
      setContent('');
      setIsChecklist(false);
      setChecklistItems([]);
      setColor('default');
      setIsPinned(false);
      setIsArchived(false);
      setNoteLabels([]);
      setImages([]);
      setImagePosition('top');
      setImageSize('medium');
      setDrawingData(null);
      setDrawingPaths([]);
      setIsTable(false);
      setTableData([
        ["", "", ""],
        ["", "", ""],
        ["", "", ""],
        ["", "", ""]
      ]);
      setIsExpanded(false);
    }
  };

  const submitNote = () => {
    submitNoteWithOverride();
  };

  // Convert text contents to checklist checkboxes
  const handleToggleChecklist = () => {
    if (!isChecklist) {
      // Split paragraphs by newline into checkboxes
      const paragraphs = content.split('\n').filter(p => p.trim().length > 0);
      const newItems: ChecklistItem[] = paragraphs.map(p => ({
        id: generateId(),
        text: p,
        completed: false
      }));

      // Always leave an empty trailing item to let them type more instantly
      newItems.push({
        id: generateId(),
        text: '',
        completed: false
      });

      setChecklistItems(newItems);
      setContent('');
    } else {
      // Join checkboxes back to paragraph strings
      const text = checklistItems
        ?.map(item => item.text)
        .filter(t => t.trim().length > 0)
        .join('\n');
      setContent(text);
    }
    setIsChecklist(!isChecklist);
  };

  // Excel Table row/col mutation helpers
  const handleCellChange = (rowIndex: number, colIndex: number, text: string) => {
    setTableData(prev => prev.map((row, rIdx) => {
      if (rIdx === rowIndex) {
        return row.map((cell, cIdx) => (cIdx === colIndex ? text : cell));
      }
      return row;
    }));
  };

  const handleAddRow = () => {
    const numCols = tableData[0]?.length || 3;
    setTableData(prev => [...prev, Array(numCols).fill("")]);
  };

  const handleAddColumn = () => {
    setTableData(prev => prev.map(row => [...row, ""]));
  };

  const handleDeleteRow = (rowIndex: number) => {
    if (tableData.length <= 1) return;
    setTableData(prev => prev.filter((_, idx) => idx !== rowIndex));
  };

  const handleDeleteColumn = (colIndex: number) => {
    if (tableData[0]?.length <= 1) return;
    setTableData(prev => prev.map(row => row.filter((_, idx) => idx !== colIndex)));
  };

  // New checklist item addition
  const addChecklistItem = () => {
    const newItem: ChecklistItem = {
      id: generateId(),
      text: '',
      completed: false
    };
    setChecklistItems(prev => [...prev, newItem]);
  };

  // Modify individual checklist item
  const updateChecklistItem = (id: string, text: string) => {
    setChecklistItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, text };
      }
      return item;
    }));
  };

  // Checkbox state handler
  const toggleCheckItemState = (id: string) => {
    setChecklistItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, completed: !item.completed };
      }
      return item;
    }));
  };

  // Checklist deletion
  const deleteChecklistItem = (id: string) => {
    setChecklistItems(prev => prev.filter(item => item.id !== id));
  };

  // Manage dynamic checkbox enter-key behaviors
  const handleChecklistKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number, itemId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Insert empty check item below current index
      const newItem: ChecklistItem = {
        id: generateId(),
        text: '',
        completed: false
      };
      
      const updatedList = [...checklistItems];
      updatedList.splice(index + 1, 0, newItem);
      setChecklistItems(updatedList);

      // Programmatically focus the new item on the next tick
      setTimeout(() => {
        const nextInput = checklistRefs.current[newItem.id];
        if (nextInput) {
          nextInput.focus();
        }
      }, 10);
    } else if (e.key === 'Backspace' && checklistItems[index].text === '' && checklistItems.length > 1) {
      e.preventDefault();
      // Delete current item and focus previous item
      const updatedList = checklistItems.filter(item => item.id !== itemId);
      setChecklistItems(updatedList);
      
      setTimeout(() => {
        const prevItem = checklistItems[index - 1];
        if (prevItem) {
          const prevInput = checklistRefs.current[prevItem.id];
          if (prevInput) {
            prevInput.focus();
            // Move cursor to end of text
            const len = prevInput.value.length;
            prevInput.setSelectionRange(len, len);
          }
        }
      }, 10);
    }
  };

  // Image upload selection and compression
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      try {
        const base64 = await compressAndResizeImage(files[i]);
        setImages(prev => [...prev, base64]);
      } catch (err) {
        console.error('Failed to compress notes image uploaded:', err);
      }
    }
  };

  // Remove attached images
  const removeImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Whiteboard drawings callbacks
  const saveDrawing = (dataUrl: string, paths: DrawingPath[]) => {
    setDrawingData(dataUrl);
    setDrawingPaths(paths);
    setIsWhiteboardOpen(false);
  };

  const deleteDrawing = () => {
    setDrawingData(null);
    setDrawingPaths([]);
  };

  // Labels checking toggle
  const toggleLabel = (labelId: string) => {
    setNoteLabels(prev => {
      if (prev.includes(labelId)) {
        return prev.filter(id => id !== labelId);
      } else {
        return [...prev, labelId];
      }
    });
  };

  // Helper to gather note contents for AI tasks
  const getNoteTextBody = () => {
    if (isChecklist) {
      return checklistItems.map(item => `- [${item.completed ? 'x' : ' '}] ${item.text}`).join('\n');
    }
    if (isTable) {
      return tableData.map(row => row.join(' | ')).join('\n');
    }
    return content;
  };

  const handleAiSummarize = async () => {
    const textToSummarize = getNoteTextBody();
    if (!textToSummarize.trim()) return;
    setIsAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: textToSummarize })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to summarize');
      }
      const data = await response.json();
      
      if (isChecklist) setIsChecklist(false);
      if (isTable) setIsTable(false);
      
      setContent(prev => {
        const suffix = isAr 
          ? `\n\n=== 🤖 تلخيص الذكاء الاصطناعي ===\n${data.result}`
          : `\n\n=== 🤖 AI Summary ===\n${data.result}`;
        return (prev.trim() ? prev + suffix : data.result);
      });
    } catch (err: any) {
      setAiError(isAr ? 'عذراً، فشل استدعاء الذكاء الاصطناعي.' : 'Oops, AI service failed.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiExpand = async () => {
    const textToExpand = getNoteTextBody();
    setIsAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch('/api/ai/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: textToExpand })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate ideas');
      }
      const data = await response.json();
      
      if (isChecklist) setIsChecklist(false);
      if (isTable) setIsTable(false);

      setContent(prev => {
        const suffix = isAr 
          ? `\n\n=== 💡 أفكار ملهمة مقترحة ===\n${data.result}`
          : `\n\n=== 💡 Suggested Ideas ===\n${data.result}`;
        return (prev.trim() ? prev + suffix : data.result);
      });
    } catch (err: any) {
      setAiError(isAr ? 'عذراً، فشلت عملية توليد الأفكار.' : 'Oops, idea generation failed.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Render the inner editor inputs
  const renderEditorBody = () => {
    const uncompletedItems = checklistItems.filter(item => !item.completed);
    const completedItems = checklistItems.filter(item => item.completed);

    const renderEditorImages = () => {
      if (images.length === 0) return null;

      let imgHeightClass = 'max-h-48 object-cover';
      let wrapperSizeClass = '';
      if (imageSize === 'small') {
        imgHeightClass = 'max-h-24 object-contain';
        wrapperSizeClass = 'max-w-[124px]';
      } else if (imageSize === 'large') {
        imgHeightClass = 'max-h-72 object-cover';
      }

      return (
        <div className="space-y-2 select-none" onClick={(e) => e.stopPropagation()}>
          {/* Main images layout controls */}
          <div className="flex flex-wrap items-center gap-2 p-2 bg-zinc-100/50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl text-[10px] font-bold">
            <span className="text-zinc-550 dark:text-zinc-400">{isAr ? 'تنسيق حجم وموضع الصورة:' : 'Image layout & scale:'}</span>
            
            <div className="flex items-center gap-0.5 bg-white dark:bg-zinc-950 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-850">
              <button
                type="button"
                onClick={() => setImagePosition('top')}
                className={`px-2 py-0.5 rounded text-[10px] cursor-pointer font-bold transition-all ${imagePosition === 'top' ? 'bg-amber-500 text-white' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
              >
                {isAr ? 'أعلى' : 'Top'}
              </button>
              <button
                type="button"
                onClick={() => setImagePosition('bottom')}
                className={`px-2 py-0.5 rounded text-[10px] cursor-pointer font-bold transition-all ${imagePosition === 'bottom' ? 'bg-amber-500 text-white' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
              >
                {isAr ? 'أسفل' : 'Bottom'}
              </button>
            </div>

            <div className="flex items-center gap-0.5 bg-white dark:bg-zinc-950 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-850">
              <button
                type="button"
                onClick={() => setImageSize('small')}
                className={`px-2 py-0.5 rounded text-[10px] cursor-pointer font-bold transition-all ${imageSize === 'small' ? 'bg-amber-500 text-white' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
              >
                {isAr ? 'صغير' : 'Small'}
              </button>
              <button
                type="button"
                onClick={() => setImageSize('medium')}
                className={`px-2 py-0.5 rounded text-[10px] cursor-pointer font-bold transition-all ${imageSize === 'medium' ? 'bg-amber-500 text-white' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
              >
                {isAr ? 'متوسط' : 'Medium'}
              </button>
              <button
                type="button"
                onClick={() => setImageSize('large')}
                className={`px-2 py-0.5 rounded text-[10px] cursor-pointer font-bold transition-all ${imageSize === 'large' ? 'bg-amber-500 text-white' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
              >
                {isAr ? 'كبير' : 'Large'}
              </button>
            </div>
          </div>

          {/* Grid display */}
          <div className={`grid gap-2 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {images.map((img, idx) => (
              <div key={idx} className={`relative rounded-xl overflow-hidden group/img bg-zinc-100/30 dark:bg-zinc-950/30 border border-zinc-200/40 ${wrapperSizeClass}`}>
                <img 
                  src={img} 
                  alt="User uploaded attachment preview" 
                  className={`w-full ${imgHeightClass}`}
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/75 hover:bg-black text-white transition-opacity cursor-pointer shadow-sm z-10"
                  title={isAr ? 'إزالة الصورة' : 'Remove image'}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="flex flex-col gap-2.5">
        
        {/* Render media layout previews */}
        <div className="space-y-4">
          {/* Main attached image catalog sliders */}
          {imagePosition !== 'bottom' && renderEditorImages()}

          {/* Render Vector Whiteboard Drawing */}
          {drawingData && (
            <div className="relative rounded-xl overflow-hidden p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800 flex items-center justify-center min-h-[140px]">
              <img 
                src={drawingData} 
                alt="Whiteboard sketch" 
                className="max-h-56 object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2 right-2 flex gap-1.5">
                <button
                  onClick={() => setIsWhiteboardOpen(true)}
                  className="p-1 px-2 text-xs bg-zinc-900/80 hover:bg-zinc-900 text-white rounded-md flex items-center gap-1 cursor-pointer"
                >
                  <Paintbrush className="h-3 w-3" />
                  <span>{isAr ? 'تعديل الرسم' : 'Edit Script'}</span>
                </button>
                <button
                  onClick={deleteDrawing}
                  className="p-1.5 bg-rose-600/85 hover:bg-rose-600 text-white rounded-md cursor-pointer"
                  title={isAr ? 'حذف الرسم' : 'Delete drawing'}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Title entry bar */}
        <div className="flex items-start justify-between gap-3 pt-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isAiLoading}
            placeholder={isAr ? 'العنوان' : 'Title'}
            className="w-full text-base font-extrabold focus:outline-hidden placeholder-zinc-400 dark:placeholder-zinc-600 bg-transparent py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          />

          <button
            onClick={() => setIsPinned(!isPinned)}
            className={`p-2 rounded-lg cursor-pointer ${
              isPinned ? 'text-amber-500 hover:bg-amber-100/20' : 'text-zinc-400 hover:bg-zinc-100/20'
            }`}
            title={isPinned ? (isAr ? 'إلغاء التثبيت' : 'Unpin note') : (isAr ? 'تثبيت الملاحظة' : 'Pin note')}
          >
            <Pin className={`h-4.5 w-4.5 transform ${isPinned ? 'rotate-45 fill-amber-500' : ''}`} />
          </button>
        </div>

        {/* Notes Writing Node: Text or Checkbox list */}
        {isChecklist ? (
          <div className="space-y-2 mt-1">
            {/* Uncompleted Items */}
            <div className="space-y-1.5">
              {uncompletedItems.map((item, idx) => {
                const originalIndex = checklistItems.findIndex(i => i.id === item.id);
                return (
                  <div key={item.id} className="flex items-center gap-2 group/check">
                    <button
                      onClick={() => toggleCheckItemState(item.id)}
                      className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-350 cursor-pointer"
                    >
                      <CheckSquare className="h-4.5 w-4.5" />
                    </button>
                    <input
                      ref={el => checklistRefs.current[item.id] = el}
                      type="text"
                      value={item.text}
                      onChange={(e) => updateChecklistItem(item.id, e.target.value)}
                      onKeyDown={(e) => handleChecklistKeyDown(e, originalIndex, item.id)}
                      placeholder={isAr ? 'بند قائمة...' : 'List item...'}
                      className="flex-1 text-xs font-semibold focus:outline-hidden bg-transparent border-b border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 py-1"
                    />
                    <button
                      onClick={() => deleteChecklistItem(item.id)}
                      className="p-1 opacity-0 group-hover/check:opacity-100 text-zinc-400 hover:text-rose-500 rounded cursor-pointer transition-opacity"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}

              {/* Quick Add Checklist button row */}
              <button
                onClick={addChecklistItem}
                className="flex items-center gap-2 text-zinc-405 hover:text-zinc-600 dark:hover:text-zinc-300 text-xs font-semibold py-1.5 cursor-pointer mt-1"
              >
                <Plus className="h-4 w-4" />
                <span>{isAr ? 'إضافة بند للقائمة' : 'Add list item'}</span>
              </button>
            </div>

            {/* Separator for Completed Items */}
            {completedItems.length > 0 && (
              <div className="pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50 mt-2 space-y-1.5">
                <span className="text-[10px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">
                  {isAr ? `المهام المكتملة (${completedItems.length})` : `Completed items (${completedItems.length})`}
                </span>
                {completedItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 group/check opacity-70">
                    <button
                      onClick={() => toggleCheckItemState(item.id)}
                      className="text-emerald-500 cursor-pointer"
                    >
                      <CheckSquare className="h-4.5 w-4.5 fill-emerald-500/10" />
                    </button>
                    <input
                      type="text"
                      value={item.text}
                      disabled
                      className="flex-1 text-xs font-medium bg-transparent line-through text-zinc-40s dark:text-zinc-505 py-1"
                    />
                    <button
                      onClick={() => deleteChecklistItem(item.id)}
                      className="p-1 opacity-0 group-hover/check:opacity-100 text-zinc-400 hover:text-rose-500 rounded cursor-pointer transition-opacity"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : isTable ? (
          /* High quality spreadsheet preview inside editor with full-screen edit button */
          <div className="space-y-3 my-2" onClick={(e) => e.stopPropagation()}>
            <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 p-2.5">
              <table className="w-full text-xs font-semibold border-collapse">
                <thead>
                  <tr className="bg-zinc-150/70 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800/80">
                    <th className="p-1.5 text-center text-zinc-400 font-mono w-10 border-r border-zinc-200 dark:border-zinc-800/40">#</th>
                    {tableData[0]?.map((_, colIdx) => (
                      <th key={colIdx} className="p-1.5 text-center text-zinc-500 font-mono uppercase border-r last:border-r-0 border-zinc-200 dark:border-zinc-850">
                        {String.fromCharCode(65 + colIdx)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.slice(0, 4).map((row, rIdx) => (
                    <tr key={rIdx} className="border-b last:border-0 border-zinc-150 dark:border-zinc-850">
                      <td className="p-1.5 text-center font-mono text-zinc-400 bg-zinc-100/50 dark:bg-zinc-900/30 border-r border-zinc-200 dark:border-zinc-805/50 font-bold">
                        {rIdx + 1}
                      </td>
                      {row.map((cellValue, cIdx) => (
                        <td key={cIdx} className="p-1.5 px-2 text-zinc-800 dark:text-zinc-200 truncate max-w-[100px]">
                          {cellValue || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {tableData.length > 4 && (
                <div className="text-[10px] text-zinc-405 font-bold p-1 bg-zinc-100/20 dark:bg-zinc-900/20 text-center border-t border-zinc-200 dark:border-zinc-800 rounded-b-lg">
                  + {tableData.length - 4} {isAr ? 'صفوف إضافية...' : 'more rows...'}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsTableModalOpen(true)}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/10"
            >
              <LayoutGrid className="h-4 w-4" />
              <span>{isAr ? 'تعديل الجدول في واجهة كاملة' : 'Edit spreadsheet in full-screen'}</span>
            </button>
          </div>
        ) : (
          /* Auto-growing Text area */
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isAiLoading}
            placeholder={isAr ? 'اكتب ملاحظتك هنا...' : 'Take a note...'}
            rows={isModal ? 8 : 3}
            className="w-full text-xs font-medium focus:outline-hidden bg-transparent resize-none placeholder-zinc-400 dark:placeholder-zinc-650 leading-relaxed scrollbar-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: isModal ? '180px' : '80px' }}
          />
        )}

        {/* Selected labels chips tags list inside modal */}
        {noteLabels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {labels.filter(l => noteLabels.includes(l.id)).map(l => (
              <span
                key={l.id}
                onClick={() => toggleLabel(l.id)}
                className="group select-none text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-zinc-200/60 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-955/20 dark:hover:text-rose-450 border border-zinc-200/20 cursor-pointer flex items-center gap-1 transition-all"
                title={isAr ? 'اضغط للإزالة' : 'Click to delete tag'}
              >
                <span>{l.name}</span>
                <X className="h-3 w-3 opacity-0 group-hover:opacity-100 text-rose-500" />
              </span>
            ))}
          </div>
        )}

        {/* Main attached image catalog - Bottom position */}
        {imagePosition === 'bottom' && renderEditorImages()}

        {/* AI Loading status & Error alerts */}
        {isAiLoading && (
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 mt-2 animate-pulse" dir={isAr ? 'rtl' : 'ltr'}>
            <Sparkles className="h-4 w-4 animate-spin shrink-0" />
            <span>{isAr ? 'برجاء الانتظار، جاري معالجة الملاحظة عبر الذكاء الاصطناعي...' : 'Please wait, processing note via Gemini AI...'}</span>
          </div>
        )}

        {aiError && (
          <div className="flex items-center justify-between gap-2 text-xs font-bold text-rose-600 dark:text-rose-450 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 mt-2" dir={isAr ? 'rtl' : 'ltr'}>
            <div className="flex items-center gap-2">
              <span className="shrink-0">⚠️</span>
              <span>{aiError}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setAiError(null)} 
              className="text-sm px-1.5 hover:text-rose-800 dark:hover:text-rose-200 cursor-pointer font-black"
            >
              ×
            </button>
          </div>
        )}

        {/* Action bar widgets */}
        <div className="flex flex-wrap items-center justify-between border-t border-zinc-150/50 dark:border-zinc-800/55 pt-3.5 mt-2 gap-3">
          
          <div className="flex items-center gap-1 sm:gap-2 relative">
            
            {/* Color Palette Picker Icon */}
            <button
              type="button"
              onClick={() => {
                setShowColorMenu(!showColorMenu);
                setShowLabelMenu(false);
              }}
              className="p-2 rounded-lg text-zinc-550 hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors"
              title={isAr ? 'خلفية الملاحظة' : 'Change color'}
            >
              <Palette className="h-4 w-4" />
            </button>

            {/* Custom Color Selector Popup */}
            {showColorMenu && (
              <div 
                className={`absolute bottom-11 ${isAr ? 'right-0' : 'left-0'} z-40 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 p-2.5 rounded-xl shadow-2xl flex gap-1 animate-in slide-in-from-bottom-2 duration-100`}
                onMouseLeave={() => setShowColorMenu(false)}
              >
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setColor(c.id);
                      setShowColorMenu(false);
                    }}
                    className={`h-5.5 w-5.5 rounded-full border border-zinc-300 dark:border-zinc-800 transition-transform hover:scale-125 cursor-pointer ${c.buttonColor}`}
                    title={isAr ? c.nameAR : c.nameEN}
                  />
                ))}
              </div>
            )}

            {/* Labels popover Checklist selector */}
            <button
              type="button"
              onClick={() => {
                setShowLabelMenu(!showLabelMenu);
                setShowColorMenu(false);
              }}
              className="p-2 rounded-lg text-zinc-550 hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors"
              title={isAr ? 'التصنيفات' : 'Add label'}
            >
              <TagIcon className="h-4 w-4" />
            </button>

            {showLabelMenu && (
              <div 
                className={`absolute bottom-11 ${isAr ? 'right-0' : 'left-0'} z-40 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 p-3 rounded-xl shadow-2xl w-48 flex flex-col gap-1.5 animate-in slide-in-from-bottom-2 duration-100 max-h-56 overflow-y-auto scrollbar-thin`}
                onMouseLeave={() => setShowLabelMenu(false)}
              >
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase px-1 pb-1 border-b border-zinc-150 dark:border-zinc-850">
                  {isAr ? 'تصنيف الملاحظة:' : 'Tag note:'}
                </span>
                {labels.length === 0 ? (
                  <span className="text-[10px] text-zinc-400 py-2 text-center">
                    {isAr ? 'برجاء إنشاء تصنيف أولاً' : 'Create labels first'}
                  </span>
                ) : (
                  labels.map((l) => (
                    <label 
                      key={l.id}
                      className="flex items-center gap-2 px-1 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={noteLabels.includes(l.id)}
                        onChange={() => toggleLabel(l.id)}
                        className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                      />
                      <span>{l.name}</span>
                    </label>
                  ))
                )}
              </div>
            )}

            {/* Drawing whiteboard modal trigger */}
            <button
              type="button"
              onClick={() => setIsWhiteboardOpen(true)}
              className="p-2 rounded-lg text-zinc-550 hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors"
              title={isAr ? 'رسم كروكي' : 'Add sketch'}
            >
              <Paintbrush className="h-4 w-4" />
            </button>

            {/* Image Upload Input selector */}
            <button
              type="button"
              disabled={isAiLoading}
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg text-zinc-550 hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors disabled:opacity-55"
              title={isAr ? 'إضافة صورة' : 'Upload photo'}
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              multiple
              className="hidden"
            />

            {/* AI Summary Button */}
            <button
              type="button"
              disabled={isAiLoading || (!content.trim() && !isChecklist && !isTable)}
              onClick={handleAiSummarize}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                isAiLoading 
                  ? 'text-amber-500 bg-amber-500/15 animate-pulse' 
                  : 'text-amber-600 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-950/20'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
              title={isAr ? 'تلخيص كيب الذكي (Gemini)' : 'Smart Keep Summary (Gemini)'}
            >
              <Brain className="h-4.5 w-4.5" />
            </button>

            {/* AI Expand/Ideas Button */}
            <button
              type="button"
              disabled={isAiLoading || (!title.trim() && !content.trim() && !isChecklist && !isTable)}
              onClick={handleAiExpand}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                isAiLoading 
                  ? 'text-purple-500 bg-purple-500/15 animate-pulse' 
                  : 'text-purple-600 dark:text-purple-400 hover:bg-purple-100/50 dark:hover:bg-purple-950/20'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
              title={isAr ? 'توليد أفكار وملهمات (Gemini)' : 'Generate ideas & inspiration (Gemini)'}
            >
              <Sparkles className="h-4.5 w-4.5" />
            </button>

            {/* Toggle Checklist vs Text */}
            <button
              type="button"
              onClick={() => {
                if (!isChecklist) {
                  setIsChecklist(true);
                  setIsTable(false);
                  handleToggleChecklist();
                } else {
                  handleToggleChecklist();
                }
              }}
              className="p-2 rounded-lg text-zinc-550 hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:bg-zinc-805/60 cursor-pointer transition-colors"
              title={isChecklist ? (isAr ? 'تحويل لنص عادي' : 'Convert to note text') : (isAr ? 'تحويل لقائمة مهام' : 'Convert to checklist')}
            >
              <CheckSquare className={`h-4 w-4 ${isChecklist ? 'text-amber-500' : ''}`} />
            </button>

            {/* Toggle Table vs Text */}
            <button
              type="button"
              onClick={() => {
                if (!isTable) {
                  setIsTable(true);
                  setIsChecklist(false);
                } else {
                  setIsTable(false);
                }
              }}
              className="p-2 rounded-lg text-zinc-550 hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:bg-zinc-805/60 cursor-pointer transition-colors"
              title={isTable ? (isAr ? 'الرجوع لنص عادي' : 'Convert to text') : (isAr ? 'تحويل لجدول إكسيل' : 'Convert to Excel table')}
            >
              <LayoutGrid className={`h-4 w-4 ${isTable ? 'text-amber-500' : ''}`} />
            </button>
          </div>

          {/* Submission and Control bar */}
          <div className="flex items-center gap-2">
            {isModal && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isAiLoading}
                className="py-1.5 px-3.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            )}

            <button
              type="button"
              onClick={submitNote}
              disabled={isAiLoading}
              className="py-1.5 px-4 bg-zinc-900 hover:bg-zinc-805 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{isAr ? 'حفظ' : 'Close & Save'}</span>
            </button>
          </div>
        </div>

      </div>
    );
  };

  // 1. COLLAPSED INLINE "TAKE A NOTE..." BOX PREPARATION
  if (!isModal && !isExpanded) {
    return (
      <div 
        onClick={() => setIsExpanded(true)}
        className="w-full max-w-xl mx-auto bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md p-3.5 flex items-center justify-between cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-900/80 transition-all duration-150"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <span className="text-zinc-400 dark:text-zinc-500 text-xs font-bold pl-2 select-none">
          {isAr ? 'إنشاء ملاحظة جديدة...' : 'Take a note...'}
        </span>
        
        <div className="flex items-center gap-1">
          {/* Direct sketch whiteboard link */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
              setIsWhiteboardOpen(true);
            }}
            className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 cursor-pointer"
            title={isAr ? 'رسم كروكي فوري' : 'Quick drawing'}
          >
            <Paintbrush className="h-4.5 w-4.5" />
          </button>
          
          {/* DIRECT CHEKLIST LINK */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
              setIsChecklist(true);
              // Spawn initial blank checklist
              setChecklistItems([{ id: generateId(), text: '', completed: false }]);
            }}
            className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 cursor-pointer"
            title={isAr ? 'قائمة مهام جديدة' : 'New checklist list'}
          >
            <CheckSquare className="h-4.5 w-4.5" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
              // Trigger upload instantly
              setTimeout(() => fileInputRef.current?.click(), 10);
            }}
            className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 cursor-pointer"
            title={isAr ? 'إدراج صورة' : 'New image note'}
          >
            <ImageIcon className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Hidden inputs in collapsed state */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          multiple
          className="hidden"
        />
      </div>
    );
  }

  // 2. EXPANDED INLINE EDITOR BOX AT THE TOP OF THE BOARD FEED
  if (!isModal && isExpanded) {
    return (
      <div 
        ref={editorRef}
        className={`w-full max-w-xl mx-auto rounded-2xl border ${colorDef.bgClass} ${colorDef.borderClass} ${colorDef.textClass} shadow-lg p-5 transition-all duration-200`}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {renderEditorBody()}

        {/* Embedded Whiteboard overlay draw box */}
        {isWhiteboardOpen && (
          <DrawingCanvas
            initialPaths={drawingPaths}
            onSave={saveDrawing}
            onCancel={() => setIsWhiteboardOpen(false)}
            isAr={isAr}
          />
        )}

        {/* Embedded Excel spreadsheet overlay */}
        {isTableModalOpen && (
          <ExcelTableModal
            initialData={tableData}
            onSave={(savedTable) => {
              setTableData(savedTable);
              setIsTable(true);
              setIsTableModalOpen(false);
              submitNoteWithOverride(savedTable, true);
            }}
            onCancel={() => {
              setIsTableModalOpen(false);
              // if it is brand new editor and empty, close
              if (!note && tableData.every(row => row.every(cell => !cell))) {
                onCancel();
              }
            }}
            isAr={isAr}
          />
        )}
      </div>
    );
  }

  // 3. COMPLETE OVERLAY POPUP MODAL VIEW (FOR ACTIVE NOTES MODIFICATION)
  return (
    <div className="fixed inset-0 bg-black/65 z-55 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs select-none">
      <div 
        className={`w-full max-w-2xl rounded-2xl border ${colorDef.bgClass} ${colorDef.borderClass} ${colorDef.textClass} shadow-2xl p-5 sm:p-6 flex flex-col justify-between max-h-[90vh] overflow-y-auto outline-hidden select-text`}
        dir={isAr ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
      >
        {renderEditorBody()}

        {/* Drawing board inside editor */}
        {isWhiteboardOpen && (
          <DrawingCanvas
            initialPaths={drawingPaths}
            onSave={saveDrawing}
            onCancel={() => setIsWhiteboardOpen(false)}
            isAr={isAr}
          />
        )}

        {/* Embedded Excel spreadsheet overlay */}
        {isTableModalOpen && (
          <ExcelTableModal
            initialData={tableData}
            onSave={(savedTable) => {
              setTableData(savedTable);
              setIsTable(true);
              setIsTableModalOpen(false);
              submitNoteWithOverride(savedTable, true);
            }}
            onCancel={() => {
              setIsTableModalOpen(false);
              // if it is brand new editor and empty, close
              if (!note && tableData.every(row => row.every(cell => !cell))) {
                onCancel();
              }
            }}
            isAr={isAr}
          />
        )}
      </div>
    </div>
  );
}
