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
  Sparkles,
  Download,
  History,
  Smile,
  Lock,
  BookOpen,
  Clock
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

  // Premium properties states
  const [pattern, setPattern] = useState<'none' | 'dotted' | 'grid' | 'lined'>('none');
  const [emoji, setEmoji] = useState('');
  const [imageCaptions, setImageCaptions] = useState<{ [key: number]: string }>({});
  const [noteLockPIN, setNoteLockPIN] = useState('');
  const [reminder, setReminder] = useState('');
  const [reminderRepeat, setReminderRepeat] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [isZenMode, setIsZenMode] = useState(false);
  const [versions, setVersions] = useState<{ content: string; title: string; updatedAt: number }[]>([]);
  const [lastAutosave, setLastAutosave] = useState<string>('');

  // Submenus display triggers
  const [showPatternMenu, setShowPatternMenu] = useState(false);
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
      setPattern(note.pattern || 'none');
      setEmoji(note.emoji || '');
      setImageCaptions(note.imageCaptions || {});
      setNoteLockPIN(note.noteLockPIN || '');
      setReminder(note.reminder || '');
      setReminderRepeat(note.reminderRepeat || 'none');
      setVersions(note.versions || []);
      setLastAutosave(note.updatedAt ? new Date(note.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
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
      setPattern('none');
      setEmoji('');
      setImageCaptions({});
      setNoteLockPIN('');
      setReminder('');
      setReminderRepeat('none');
      setVersions([]);
      setLastAutosave('');
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

    // Auto-extract hashtags (e.g., #عمل or #أفكار) and classify under corresponding label IDs
    const wordsText = title + " " + content + " " + checklistItems.map(i => i.text).join(" ");
    const hashtagRegex = /#([\w\u0600-\u06FF]+)/g;
    const extractedHashtags: string[] = [];
    let match;
    while ((match = hashtagRegex.exec(wordsText)) !== null) {
      extractedHashtags.push(match[1]);
    }

    const updatedLabels = [...noteLabels];
    extractedHashtags.forEach(tag => {
      // Find a tag matching the name (case-insensitive)
      const matchedLabel = labels.find(l => l.name.toLowerCase().includes(tag.toLowerCase()));
      if (matchedLabel && !updatedLabels.includes(matchedLabel.id)) {
        updatedLabels.push(matchedLabel.id);
      }
    });

    // Version Control Tracker: store last 3 changes locally
    let updatedVersions = note?.versions ? [...note.versions] : [];
    if (note && (note.title !== title || note.content !== content)) {
      const currentVersionNode = {
        title: note.title || '',
        content: note.content || '',
        updatedAt: note.updatedAt || Date.now()
      };
      // Keep only most recent 3 versions, remove older ones
      updatedVersions = [currentVersionNode, ...updatedVersions].slice(0, 3);
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
      labels: updatedLabels,
      images,
      imagePosition,
      imageSize,
      drawingData,
      drawingPaths,
      pattern,
      emoji,
      imageCaptions,
      noteLockPIN,
      reminder: reminder || undefined,
      reminderRepeat,
      versions: updatedVersions,
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
      setPattern('none');
      setEmoji('');
      setImageCaptions({});
      setNoteLockPIN('');
      setReminder('');
      setReminderRepeat('none');
      setVersions([]);
      setLastAutosave('');
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

  // Word and character count calculation
  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  // Insert formatting tokens around selected text inside the textarea
  const insertTextAtCursor = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selectedText = currentText.substring(start, end);
    const replacement = prefix + (selectedText || "") + suffix;
    const newContent = currentText.substring(0, start) + replacement + currentText.substring(end);
    setContent(newContent);
    
    // Set selection range beautifully after insertion
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText || "").length);
    }, 15);
  };

  // Auto copy content to clipboard
  const [copied, setCopied] = useState(false);
  const handleCopyToClipboard = () => {
    let textToCopy = `Title: ${title || 'Untitled'}\n`;
    textToCopy += `======================\n`;
    textToCopy += getNoteTextBody();
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export note to markdown file
  const handleExportMarkdown = () => {
    let fileText = `# ${title || 'Untitled'}\n\n`;
    if (reminder) {
      fileText += `> 📅 Reminder: ${new Date(reminder).toLocaleString()}\n\n`;
    }
    fileText += getNoteTextBody();
    const blob = new Blob([fileText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title || 'note'}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Premium AI proofreader and style optimizer
  const handleAiProofread = async () => {
    if (!content.trim()) return;
    setIsAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch('/api/ai/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      });
      if (!response.ok) {
        const errDetails = await response.json().catch(() => ({}));
        throw new Error(errDetails.error || 'Failed to proofread');
      }
      const data = await response.json();
      setContent(data.result);
      setLastAutosave(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      setAiError(isAr ? 'عذراً، فشل تصحيح النص عبر الذكاء الاصطناعي.' : 'AI text proofread failed.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Premium task checklist extractor
  const handleAiExtractTasks = async () => {
    if (!content.trim()) return;
    setIsAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch('/api/ai/extract-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      });
      if (!response.ok) {
        const errDetails = await response.json().catch(() => ({}));
        throw new Error(errDetails.error || 'Failed to extract tasks');
      }
      const data = await response.json();
      if (Array.isArray(data.result) && data.result.length > 0) {
        const extractedItems = data.result.map((taskText: string) => ({
          id: generateId(),
          text: taskText,
          completed: false
        }));
        setIsChecklist(true);
        setIsTable(false);
        setChecklistItems(extractedItems);
        setContent('');
      } else {
        setAiError(isAr ? 'لم يجد الذكاء الاصطناعي مهام محددة لاستخراجها.' : 'AI could not detect actionable tasks.');
      }
    } catch (err: any) {
      setAiError(isAr ? 'عذراً، فشل استخراج المهام.' : 'AI task extraction failed.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Revision rollback
  const handleRollbackVersion = (prevVersion: { title: string; content: string }) => {
    setTitle(prevVersion.title);
    setContent(prevVersion.content);
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
    // If Zen Focus Mode is active, render a clean, zero-distraction layout and skip everything else
    if (isZenMode) {
      return (
        <div className="fixed inset-0 bg-stone-50 dark:bg-stone-950 z-55 flex flex-col items-center justify-center p-6 transition-all duration-300 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="w-full max-w-xl flex flex-col justify-between h-full max-h-[85vh] gap-4">
            <div className="flex items-center justify-between border-b border-zinc-200/40 pb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-500 animate-pulse flex items-center gap-1.5">
                ● ✍️ {isAr ? 'وضع التركيز الهادئ (اضغط لكتابة سلسلة أفكارك)' : 'Zen Focus Mode (let your ideas flow...)'}
              </span>
              <button
                type="button"
                onClick={() => setIsZenMode(false)}
                className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-xl text-[10px] font-black cursor-pointer shadow-md transition-all active:scale-95"
              >
                {isAr ? 'إنهاء وضع التركيز' : 'Exit Focus'}
              </button>
            </div>
            
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isAr ? 'تدفّق بأفكارك هنا دون مشتتات...' : 'Let your stream of thoughts flow here...'}
              className="w-full text-sm font-semibold focus:outline-hidden bg-transparent resize-none placeholder-zinc-400 dark:placeholder-zinc-600 leading-relaxed scrollbar-none h-full"
            />
            
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 dark:text-zinc-500 border-t border-zinc-250/20 pt-2 font-bold select-none">
              <span>{isAr ? `الحروف: ${charCount}` : `Chars: ${charCount}`}</span>
              <span>{isAr ? `الكلمات: ${wordCount}` : `Words: ${wordCount}`}</span>
            </div>
          </div>
        </div>
      );
    }

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

      const handleUpdateCaption = (idx: number, text: string) => {
        setImageCaptions(prev => {
          const next = { ...prev };
          next[idx] = text;
          return next;
        });
      };

      return (
        <div className="space-y-3 select-none" onClick={(e) => e.stopPropagation()}>
          {/* Main images layout controls */}
          <div className="flex flex-wrap items-center gap-2 p-2 bg-zinc-100/50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800/55 rounded-xl text-[10px] font-bold">
            <span className="text-zinc-550 dark:text-zinc-400">{isAr ? 'تنسيق حجم وموضع الصورة:' : 'Image layout & scale:'}</span>
            
            <div className="flex items-center gap-0.5 bg-white dark:bg-zinc-950 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-850">
              <button
                type="button"
                onClick={() => setImagePosition('top')}
                className={`px-2 py-0.5 rounded text-[10px] cursor-pointer font-bold transition-all ${imagePosition === 'top' ? 'bg-amber-500 text-white' : 'text-zinc-650 dark:text-zinc-405 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
              >
                {isAr ? 'أعلى' : 'Top'}
              </button>
              <button
                type="button"
                onClick={() => setImagePosition('bottom')}
                className={`px-2 py-0.5 rounded text-[10px] cursor-pointer font-bold transition-all ${imagePosition === 'bottom' ? 'bg-amber-500 text-white' : 'text-zinc-650 dark:text-zinc-405 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
              >
                {isAr ? 'أسفل' : 'Bottom'}
              </button>
            </div>

            <div className="flex items-center gap-0.5 bg-white dark:bg-zinc-950 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-850">
              <button
                type="button"
                onClick={() => setImageSize('small')}
                className={`px-2 py-0.5 rounded text-[10px] cursor-pointer font-bold transition-all ${imageSize === 'small' ? 'bg-amber-500 text-white' : 'text-zinc-650 dark:text-zinc-405 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
              >
                {isAr ? 'صغير' : 'Small'}
              </button>
              <button
                type="button"
                onClick={() => setImageSize('medium')}
                className={`px-2 py-0.5 rounded text-[10px] cursor-pointer font-bold transition-all ${imageSize === 'medium' ? 'bg-amber-500 text-white' : 'text-zinc-650 dark:text-zinc-405 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
              >
                {isAr ? 'متوسط' : 'Medium'}
              </button>
              <button
                type="button"
                onClick={() => setImageSize('large')}
                className={`px-2 py-0.5 rounded text-[10px] cursor-pointer font-bold transition-all ${imageSize === 'large' ? 'bg-amber-500 text-white' : 'text-zinc-650 dark:text-zinc-405 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
              >
                {isAr ? 'كبير' : 'Large'}
              </button>
            </div>
          </div>

          {/* Grid display with specific captions input per picture */}
          <div className={`grid gap-3.5 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {images.map((img, idx) => (
              <div key={idx} className="flex flex-col gap-1.5">
                <div className={`relative rounded-xl overflow-hidden group/img bg-zinc-100/30 dark:bg-zinc-950/30 border border-zinc-200/40 ${wrapperSizeClass}`}>
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
                {/* Specific caption edit box */}
                <input
                  type="text"
                  value={imageCaptions[idx] || ''}
                  onChange={(e) => handleUpdateCaption(idx, e.target.value)}
                  placeholder={isAr ? 'اكتب تعليقاً على الصورة...' : 'Add a caption...'}
                  className="w-full text-[10.5px] font-bold py-1 px-1.5 bg-zinc-500/5 dark:bg-white/5 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-750 focus:outline-hidden rounded text-center text-zinc-700 dark:text-zinc-300 transition-colors"
                />
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="flex flex-col gap-2.5 relative select-text">
        {/* Transparent background pattern overlay inside editor canvas */}
        {pattern !== 'none' && (
          <div className={`absolute inset-0 opacity-[0.09] dark:opacity-[0.04] pointer-events-none rounded-2xl pattern-${pattern}`} />
        )}

        {/* Custom Custom Emoji / Cover Icon Badge */}
        {emoji && (
          <div className="flex items-center gap-1.5 pb-1">
            <div className="flex items-center gap-2 bg-zinc-400/15 dark:bg-zinc-850/30 p-1.5 px-3 rounded-full select-none text-xs font-black w-max border border-zinc-300/10">
              <span className="text-xl leading-none">{emoji}</span>
              <button
                type="button"
                onClick={() => setEmoji('')}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 font-extrabold cursor-pointer"
                title={isAr ? 'إزالة الرمز' : 'Remove Emoji'}
              >
                ×
              </button>
            </div>
          </div>
        )}
        
        {/* Render media layout previews */}
        <div className="space-y-4">
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
                  className="p-1 px-2 text-xs bg-zinc-900/80 hover:bg-zinc-900 text-white rounded-md flex items-center gap-1 cursor-pointer font-bold"
                >
                  <Paintbrush className="h-3 w-3" />
                  <span>{isAr ? 'تعديل الرسم' : 'Edit Sketch'}</span>
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
            placeholder={isAr ? 'العنوان الكاتب...' : 'Title...'}
            className="w-full text-base font-extrabold focus:outline-hidden placeholder-zinc-400 dark:placeholder-zinc-600 bg-transparent py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          />

          <div className="flex items-center gap-1 shrink-0">
            {/* Zen Mode focus Toggle */}
            <button
              type="button"
              onClick={() => setIsZenMode(true)}
              className="p-2 rounded-lg cursor-pointer text-zinc-400 hover:bg-zinc-100/20 hover:text-indigo-500 transition-all"
              title={isAr ? 'تفعيل وضع التركيز الهادئ' : 'Zen Focus Mode'}
            >
              <BookOpen className="h-4.5 w-4.5" />
            </button>

            {/* Pin note toggle */}
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
        </div>

        {/* Rich Structure text toolbars directly above inputs */}
        {!isChecklist && !isTable && (
          <div className="flex flex-wrap items-center gap-1 p-1 bg-zinc-150/45 dark:bg-zinc-900/40 rounded-xl border border-zinc-200/30 w-max select-none" dir={isAr ? 'rtl' : 'ltr'}>
            <button
              type="button"
              onClick={() => insertTextAtCursor('**', '**')}
              className="p-1 px-2.5 rounded-lg text-xs font-black hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer"
              title={isAr ? 'خط عريض' : 'Bold'}
            >
              B
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('*', '*')}
              className="p-1 px-2.5 rounded-lg text-xs font-black italic hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer"
              title={isAr ? 'خط مائل' : 'Italic'}
            >
              I
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('<u>', '</u>')}
              className="p-1 px-2.5 rounded-lg text-xs font-black underline hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer"
              title={isAr ? 'تسطير' : 'Underline'}
            >
              U
            </button>
            <span className="h-4 w-px bg-zinc-250 dark:bg-zinc-800 mx-1" />
            <button
              type="button"
              onClick={() => insertTextAtCursor('# ', '')}
              className="p-1 px-1.5 rounded-lg text-[10.5px] font-black hover:bg-zinc-200 dark:hover:bg-zinc-805 text-zinc-700 dark:text-zinc-300 cursor-pointer"
              title={isAr ? 'عنوان عريض H1' : 'Heading 1'}
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('## ', '')}
              className="p-1 px-1.5 rounded-lg text-[10.5px] font-black hover:bg-zinc-200 dark:hover:bg-zinc-805 text-zinc-700 dark:text-zinc-300 cursor-pointer"
              title={isAr ? 'عنوان فرعي H2' : 'Heading 2'}
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('### ', '')}
              className="p-1 px-1.5 rounded-lg text-[10.5px] font-black hover:bg-zinc-200 dark:hover:bg-zinc-805 text-zinc-700 dark:text-zinc-300 cursor-pointer"
              title={isAr ? 'عنوان صغير H3' : 'Heading 3'}
            >
              H3
            </button>
            <span className="h-4 w-px bg-zinc-250 dark:bg-zinc-800 mx-1" />
            <button
              type="button"
              onClick={() => insertTextAtCursor('- ', '')}
              className="p-1 px-2 rounded-lg text-[10.5px] font-extrabold hover:bg-zinc-200 dark:hover:bg-zinc-805 text-zinc-700 dark:text-zinc-300 cursor-pointer"
              title={isAr ? 'قائمة نقطية' : 'Bulleted list'}
            >
              • List
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('\n1. ', '')}
              className="p-1 px-2 rounded-lg text-[10.5px] font-extrabold hover:bg-zinc-200 dark:hover:bg-zinc-805 text-zinc-700 dark:text-zinc-300 cursor-pointer"
              title={isAr ? 'قائمة مرقمة' : 'Numbered list'}
            >
              1. List
            </button>
          </div>
        )}

        {/* Notes Writing Node: Text, Checkbox list, or spreadsheets */}
        {isChecklist ? (
          <div className="space-y-2 mt-1">
            {/* Checklist dynamic progress bar in-editor */}
            {checklistItems.length > 0 && (
              <div className="px-1 py-1 select-none">
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-extrabold mb-1">
                  <span>{isAr ? 'نسبة إنجاز المهام:' : 'Checklist completed:'}</span>
                  <span>{Math.round((checklistItems.filter(i => i.completed).length / checklistItems.length) * 100) || 0}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-200/50 dark:bg-zinc-800/40 rounded-full overflow-hidden border border-zinc-250/10">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${(checklistItems.filter(i => i.completed).length / checklistItems.length) * 100 || 0}%` }}
                  />
                </div>
              </div>
            )}

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
                      className="flex-1 text-xs font-medium bg-transparent line-through text-zinc-400 dark:text-zinc-505 py-1"
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
          /* High quality spreadsheet preview inside editor inside modal */
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
          /* Auto-growing Text area connected with core ref for cursor helpers */
          <div className="flex flex-col gap-1.5">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isAiLoading}
              placeholder={isAr ? 'اكتب ملاحظتك هنا...' : 'Take a note...'}
              rows={isModal ? 8 : 3}
              className="w-full text-xs font-medium focus:outline-hidden bg-transparent resize-none placeholder-zinc-400 dark:placeholder-zinc-650 leading-relaxed scrollbar-none disabled:opacity-50 disabled:cursor-not-allowed z-10"
              style={{ minHeight: isModal ? '180px' : '80px' }}
            />

            {/* Premium counters and autosave log indicator */}
            <div className="flex flex-wrap items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-550 font-mono font-bold mt-2 px-1 border-t border-zinc-250/20 pt-2 shrink-0 select-none z-10">
              <div className="flex items-center gap-3">
                <span>{isAr ? `الحروف: ${charCount}` : `Chars: ${charCount}`}</span>
                <span>{isAr ? `الكلمات: ${wordCount}` : `Words: ${wordCount}`}</span>
                {lastAutosave && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 animate-pulse">
                    ● {isAr ? `حفظ تلقائي: ${lastAutosave}` : `Auto-saved: ${lastAutosave}`}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1.5">
                {/* Export Button */}
                <button
                  type="button"
                  onClick={handleExportMarkdown}
                  className="px-2 py-0.5 rounded hover:bg-zinc-200/50 dark:hover:bg-zinc-800/65 transition-colors flex items-center gap-1 text-[9px] cursor-pointer font-extrabold text-zinc-500 dark:text-zinc-400"
                  title={isAr ? 'تصدير كمستند Markdown' : 'Export as MD'}
                >
                  <Download className="h-3 w-3 text-zinc-400" />
                  <span>{isAr ? 'تصدير' : 'Export'}</span>
                </button>

                {/* Copy Clipboard button */}
                <button
                  type="button"
                  onClick={handleCopyToClipboard}
                  className="px-2 py-0.5 rounded hover:bg-zinc-200/50 dark:hover:bg-zinc-800/65 transition-colors flex items-center gap-1 text-[9px] cursor-pointer font-extrabold text-zinc-500 dark:text-zinc-400"
                  title={isAr ? 'نسخ محتوى الملاحظة' : 'Copy markdown content'}
                >
                  <CheckSquare className="h-3 w-3 text-zinc-400" />
                  <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ' : 'Copy')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Selected labels chips tags list inside modal */}
        {noteLabels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {labels.filter(l => noteLabels.includes(l.id)).map(l => (
              <span
                key={l.id}
                onClick={() => toggleLabel(l.id)}
                className="group select-none text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-zinc-200/60 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 hover:bg-rose-55/40 hover:text-rose-600 dark:hover:bg-rose-955/20 dark:hover:text-rose-450 border border-zinc-200/20 cursor-pointer flex items-center gap-1 transition-all"
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

        {/* Revision history collapsible section */}
        {versions.length > 0 && (
          <div className="p-2 border border-zinc-200/40 dark:border-zinc-800/40 rounded-xl bg-zinc-550/10 dark:bg-zinc-950/20 my-2 select-none z-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold mb-1.5 uppercase">
              <History className="h-3 w-3" />
              <span>{isAr ? 'تاريخ المراجعات (آخر 3 تعديلات):' : 'Revision History (last 3 edits):'}</span>
            </div>
            <div className="space-y-1.5">
              {versions.map((ver, vIdx) => (
                <div key={vIdx} className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-zinc-100/50 dark:bg-zinc-900/60 text-[10px] font-semibold">
                  <div className="truncate flex-1">
                    <span className="font-bold block text-[9px] mb-0.5 opacity-80 text-zinc-500">{new Date(ver.updatedAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}</span>
                    <span className="opacity-95 text-zinc-700 dark:text-zinc-300">{ver.title || (isAr ? 'بدون عنوان' : 'Untitled')} - {ver.content ? ver.content.substring(0, 30) + '...' : ''}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRollbackVersion(ver)}
                    className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-stone-900 rounded-md text-[9px] font-black cursor-pointer shadow-xs transition-colors shrink-0"
                  >
                    {isAr ? 'استعادة' : 'Restore'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
        <div className="flex flex-wrap items-center justify-between border-t border-zinc-150/50 dark:border-zinc-800/55 pt-3.5 mt-2 gap-3 z-20">
          
          <div className="flex items-center gap-1 sm:gap-2 relative">
            
            {/* Color Palette Picker Icon */}
            <button
              type="button"
              onClick={() => {
                setShowColorMenu(!showColorMenu);
                setShowLabelMenu(false);
                setShowPatternMenu(false);
                setShowEmojiMenu(false);
                setShowReminderForm(false);
              }}
              className="p-2 rounded-lg text-zinc-550 hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors"
              title={isAr ? 'خلفية الملاحظة' : 'Change color'}
            >
              <Palette className="h-4 w-4" />
            </button>

            {/* Custom Color Selector Popup */}
            {showColorMenu && (
              <div 
                className={`absolute bottom-11 ${isAr ? 'right-0' : 'left-0'} z-50 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 p-2.5 rounded-xl shadow-2xl flex gap-1 animate-in slide-in-from-bottom-2 duration-100`}
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

            {/* Pattern picker */}
            <button
              type="button"
              onClick={() => {
                setShowPatternMenu(!showPatternMenu);
                setShowColorMenu(false);
                setShowLabelMenu(false);
                setShowEmojiMenu(false);
                setShowReminderForm(false);
              }}
              className="p-2 rounded-lg text-zinc-550 hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors"
              title={isAr ? 'نمط الورقة الخلفية' : 'Notebook paper pattern'}
            >
              <Paintbrush className={`h-4 w-4 ${pattern !== 'none' ? 'text-amber-500' : ''}`} />
            </button>

            {showPatternMenu && (
              <div 
                className={`absolute bottom-11 ${isAr ? 'right-0' : 'left-0'} z-50 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 p-2.5 rounded-xl shadow-2xl flex flex-col gap-1.5 animate-in slide-in-from-bottom-2 duration-100 min-w-[124px]`}
                onMouseLeave={() => setShowPatternMenu(false)}
              >
                {[
                  { id: 'none', labelAr: 'سادة عادي', labelEn: 'Plain' },
                  { id: 'dotted', labelAr: 'ورق منقط', labelEn: 'Dotted' },
                  { id: 'grid', labelAr: 'ورق مربعات', labelEn: 'Grid' },
                  { id: 'lined', labelAr: 'ورق مسطّر', labelEn: 'Lined' }
                ].map((pat) => (
                  <button
                    key={pat.id}
                    type="button"
                    onClick={() => {
                      setPattern(pat.id as any);
                      setShowPatternMenu(false);
                    }}
                    className={`text-[11px] font-bold text-zinc-700 dark:text-zinc-300 py-1.5 px-2.5 rounded-md hover:bg-zinc-150 dark:hover:bg-zinc-900 cursor-pointer text-left ${pattern === pat.id ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : ''}`}
                  >
                    {isAr ? pat.labelAr : pat.labelEn}
                  </button>
                ))}
              </div>
            )}

            {/* Emoji cover picker popup */}
            <button
              type="button"
              onClick={() => {
                setShowEmojiMenu(!showEmojiMenu);
                setShowPatternMenu(false);
                setShowColorMenu(false);
                setShowLabelMenu(false);
                setShowReminderForm(false);
              }}
              className="p-2 rounded-lg text-zinc-550 hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors"
              title={isAr ? 'اختر رمز تعبيري' : 'Select Emoji symbol'}
            >
              <Smile className={`h-4 w-4 ${emoji ? 'text-amber-500' : ''}`} />
            </button>

            {showEmojiMenu && (
              <div 
                className={`absolute bottom-11 ${isAr ? 'right-0' : 'left-0'} z-50 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 p-2.5 rounded-xl shadow-2xl animate-in slide-in-from-bottom-2 duration-100 max-h-36 overflow-y-auto w-44`}
                onMouseLeave={() => setShowEmojiMenu(false)}
              >
                <div className="grid grid-cols-5 gap-1.5">
                  {['⭐', '💡', '🚀', '📌', '🎨', '📝', '🗒️', '🕊️', '🔒', '❤️', '🔥', '🎉', '🌟', '⚠️', '🎯'].map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => {
                        setEmoji(em);
                        setShowEmojiMenu(false);
                      }}
                      className="text-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 p-1 rounded transition-transform hover:scale-115 cursor-pointer"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Calendar deadlines system with repeat loops */}
            <button
              type="button"
              onClick={() => {
                setShowReminderForm(!showReminderForm);
                setShowEmojiMenu(false);
                setShowPatternMenu(false);
                setShowColorMenu(false);
                setShowLabelMenu(false);
              }}
              className="p-2 rounded-lg text-zinc-550 hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors"
              title={isAr ? 'تنبيه وميعاد تسليم' : 'Due date & Reminder schedule'}
            >
              <Clock className={`h-4 w-4 ${reminder ? 'text-amber-500' : ''}`} />
            </button>

            {showReminderForm && (
              <div 
                className={`absolute bottom-11 ${isAr ? 'right-0' : 'left-0'} z-50 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 p-3 rounded-xl shadow-2xl flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-100 min-w-[210px] text-zinc-800 dark:text-zinc-200`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 block">
                    {isAr ? 'تاريخ ووقت التنبيه:' : 'Choose Date & Time:'}
                  </span>
                  <input
                    type="datetime-local"
                    value={reminder}
                    onChange={(e) => setReminder(e.target.value)}
                    className="w-full text-xs p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-bold focus:outline-hidden text-zinc-800 dark:text-zinc-200"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 block">
                    {isAr ? 'تكرار التذكير:' : 'Loop repeat interval:'}
                  </span>
                  <select
                    value={reminderRepeat}
                    onChange={(e) => setReminderRepeat(e.target.value as any)}
                    className="w-full text-xs p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-bold focus:outline-hidden text-zinc-805 dark:text-zinc-200 cursor-pointer"
                  >
                    <option value="none">{isAr ? 'بدون تكرار' : 'No Repeat'}</option>
                    <option value="daily">{isAr ? 'يومياً' : 'Daily'}</option>
                    <option value="weekly">{isAr ? 'أسبوعياً' : 'Weekly'}</option>
                    <option value="monthly">{isAr ? 'شهرياً' : 'Monthly'}</option>
                  </select>
                </div>

                <div className="flex gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!reminder) {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        tomorrow.setHours(9, 0, 0, 0);
                        const offsetTime = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        setReminder(offsetTime);
                      }
                      setShowReminderForm(false);
                    }}
                    className="flex-1 py-1.5 px-2 bg-amber-500 hover:bg-amber-400 text-stone-900 rounded-lg text-[10px] font-black text-center cursor-pointer transition-colors shadow-xs"
                  >
                    {isAr ? 'حفظ' : 'OK'}
                  </button>
                  {reminder && (
                    <button
                      type="button"
                      onClick={() => {
                        setReminder('');
                        setReminderRepeat('none');
                        setShowReminderForm(false);
                      }}
                      className="py-1 px-2.5 bg-rose-500/10 hover:bg-rose-505 hover:text-white text-rose-500 rounded-lg text-[10px] font-black cursor-pointer transition-all"
                    >
                      {isAr ? 'مسح' : 'Clear'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Individual PIN LOCK selection code */}
            <button
              type="button"
              onClick={() => {
                setShowReminderForm(false);
                setShowEmojiMenu(false);
                setShowPatternMenu(false);
                setShowColorMenu(false);
                setShowLabelMenu(false);
                if (noteLockPIN) {
                  setNoteLockPIN('');
                } else {
                  const typed = prompt(isAr ? 'أدخل كلمة مرور / PIN خاصة لقفل وحماية هذه الملاحظة تلقائياً:' : 'Enter custom password / PIN specifically for this note:', '1234');
                  if (typed) setNoteLockPIN(typed);
                }
              }}
              className="p-2 rounded-lg text-zinc-550 hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors"
              title={noteLockPIN ? (isAr ? `الملاحظة مقفلة بـ PIN مخصصة: ${noteLockPIN} (اضغط للإلغاء)` : `Custom Locked with PIN: ${noteLockPIN} (Click to clear)`) : (isAr ? 'قفل وحماية الملاحظة بكلمة مرور PIN معزلة' : 'Lock note under custom Password PIN')}
            >
              <Lock className={`h-4 w-4 ${noteLockPIN ? 'text-amber-500 fill-amber-500/10' : ''}`} />
            </button>

            {/* Labels popover Checklist selector */}
            <button
              type="button"
              onClick={() => {
                setShowLabelMenu(!showLabelMenu);
                setShowColorMenu(false);
                setShowPatternMenu(false);
                setShowEmojiMenu(false);
                setShowReminderForm(false);
              }}
              className="p-2 rounded-lg text-zinc-550 hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors"
              title={isAr ? 'التصنيفات' : 'Add label'}
            >
              <TagIcon className="h-4 w-4" />
            </button>

            {showLabelMenu && (
              <div 
                className={`absolute bottom-11 ${isAr ? 'right-0' : 'left-0'} z-50 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 p-3 rounded-xl shadow-2xl w-48 flex flex-col gap-1.5 animate-in slide-in-from-bottom-2 duration-100 max-h-56 overflow-y-auto scrollbar-thin`}
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
              title={isAr ? 'رسم كروكي لوحة بيضاء' : 'Add handwritten sketch'}
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

            {/* Premium AI helper style proofreader */}
            <button
              type="button"
              disabled={isAiLoading || !content.trim() || isChecklist || isTable}
              onClick={handleAiProofread}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                isAiLoading 
                  ? 'text-pink-500 bg-pink-500/15 animate-pulse' 
                  : 'text-pink-600 dark:text-pink-400 hover:bg-pink-100/50 dark:hover:bg-pink-950/20'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
              title={isAr ? 'تصحيح وتطوير الصياغة (Gemini AI)' : 'AI Writing Improvement & Proofreading (Gemini)'}
            >
              <Type className="h-4.5 w-4.5" />
            </button>

            {/* Premium AI task extractor */}
            <button
              type="button"
              disabled={isAiLoading || !content.trim() || isChecklist || isTable}
              onClick={handleAiExtractTasks}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                isAiLoading 
                  ? 'text-sky-500 bg-sky-500/15 animate-pulse' 
                  : 'text-sky-600 dark:text-sky-450 hover:bg-sky-100/50 dark:hover:bg-sky-950/20'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
              title={isAr ? 'استخراج المهام الذكية لقائمة مهام (Gemini AI)' : 'Smart Task Extract to Checklist (Gemini)'}
            >
              <CheckSquare className="h-4.5 w-4.5" />
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
              <LayoutGrid className={`h-4 w-4 ${isTable ? 'text-amber-550' : ''}`} />
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
              className="py-1.5 px-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-205 text-white dark:text-zinc-950 font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{isAr ? 'حفظ' : 'Save'}</span>
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
