import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square,
  Pin, 
  Trash2, 
  Palette, 
  Tag as TagIcon, 
  Image as ImageIcon, 
  Paintbrush,
  RotateCcw,
  Clock,
  LayoutGrid,
  Lock,
  Key
} from 'lucide-react';
import { Note, Label, NOTE_COLORS, PaletteColor } from '../types';

interface NoteCardProps {
  key?: string;
  note: Note;
  labels: Label[];
  onSelect: (note: Note) => void;
  onUpdateNote: (noteId: string, updates: Partial<Note>) => void;
  onDeleteNote: (noteId: string) => void;
  onRestoreNote?: (noteId: string) => void;
  isAr: boolean;
  onEditDrawing?: (note: Note) => void;
  notesPassword?: string;
}

export default function NoteCard({
  note,
  labels,
  onSelect,
  onUpdateNote,
  onDeleteNote,
  onRestoreNote,
  isAr,
  onEditDrawing,
  notesPassword
}: NoteCardProps) {
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [typedPass, setTypedPass] = useState('');
  const [authError, setAuthError] = useState(false);

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typedPass === (notesPassword || '1234')) {
      setAuthError(false);
      setIsUnlocking(false);
      onSelect(note);
    } else {
      setAuthError(true);
      setTypedPass('');
    }
  };

  // Match the note's color ID to its Palette definition
  const colorDef = NOTE_COLORS.find(c => c.id === note.color) || NOTE_COLORS[0];

  // Map label IDs to real Label definitions
  const noteLabels = labels.filter(l => note.labels.includes(l.id));

  // Render images respecting layout alignment and density constraints
  const renderImages = () => {
    if (!note.images || note.images.length === 0) return null;

    const size = note.imageSize || 'medium';
    
    let imgClass = 'w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]';
    let wrapperClass = 'w-full relative rounded-xl overflow-hidden bg-zinc-100/40 dark:bg-zinc-950/40 border border-zinc-200/20';
    
    if (size === 'small') {
      imgClass = 'max-h-24 max-w-[120px] mx-auto object-contain';
      wrapperClass = 'w-full relative rounded-xl p-1 bg-zinc-100/20 dark:bg-zinc-950/20';
    } else if (size === 'large') {
      imgClass = 'max-h-72 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]';
    } else {
      imgClass = 'max-h-44 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]';
    }

    return (
      <div className={wrapperClass} onClick={(e) => e.stopPropagation()}>
        <img 
          src={note.images[0]} 
          alt="Attached notes media" 
          className={imgClass}
          referrerPolicy="no-referrer"
        />
        {note.images.length > 1 && (
          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/75 text-white text-[9px] font-mono font-bold">
            +{note.images.length - 1} {isAr ? 'صور' : 'more'}
          </span>
        )}
      </div>
    );
  };

  // Handle checking/unchecking items directly from the card
  const toggleCheckItem = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation(); // Avoid opening the note editor modal
    const updatedItems = note.checklistItems.map(item => {
      if (item.id === itemId) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });
    onUpdateNote(note.id, {
      checklistItems: updatedItems,
      updatedAt: Date.now()
    });
  };

  const handleColorChange = (e: React.MouseEvent, colorId: string) => {
    e.stopPropagation();
    onUpdateNote(note.id, { color: colorId, updatedAt: Date.now() });
    setShowColorMenu(false);
  };

  const handlePinToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateNote(note.id, { isPinned: !note.isPinned, updatedAt: Date.now() });
  };

  const handleTrashToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (note.isTrashed) {
      if (onRestoreNote) {
        onRestoreNote(note.id);
      } else {
        onUpdateNote(note.id, { isTrashed: false, updatedAt: Date.now() });
      }
    } else {
      onUpdateNote(note.id, { isTrashed: true, isPinned: false, updatedAt: Date.now() });
    }
  };

  const handlePermanentDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteNote(note.id);
  };

  // Helper to format timestamps
  const getFormattedDate = (timestamp: number) => {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      onClick={() => {
        if (note.isTrashed) return;
        if (note.isLocked) {
          setIsUnlocking(true);
        } else {
          onSelect(note);
        }
      }}
      className={`group relative rounded-2xl border ${colorDef.bgClass} ${colorDef.borderClass} ${colorDef.textClass} p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg ${
        note.isTrashed ? 'opacity-85 cursor-default' : 'cursor-pointer hover:scale-[1.01]'
      }`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
          {note.isLocked && !note.isTrashed ? (
        <div className="flex-1 flex flex-col justify-center py-5 text-center">
          {isUnlocking ? (
            <form 
              onSubmit={handleVerifyPassword} 
              onClick={(e) => e.stopPropagation()} 
              className="space-y-3 p-1 animate-in zoom-in-95 duration-150"
            >
              <div className="flex justify-center">
                <Key className="h-6 w-6 text-amber-500 animate-pulse" />
              </div>
              <span className="text-[11px] font-bold block text-zinc-500 dark:text-zinc-400">
                {isAr ? 'أدخل كلمة مرور الملاحظة:' : 'Enter Note Password:'}
              </span>
              <div className="flex gap-1.5 items-center justify-center">
                <input
                  type="password"
                  autoFocus
                  required
                  placeholder="••••"
                  value={typedPass}
                  onChange={(e) => { setTypedPass(e.target.value); setAuthError(false); }}
                  className={`w-24 text-center py-1 bg-white dark:bg-zinc-950 border ${authError ? 'border-rose-500' : 'border-zinc-350 dark:border-zinc-800'} rounded-lg text-xs font-black focus:outline-hidden text-zinc-900 dark:text-white`}
                />
                <button
                  type="submit"
                  className="py-1 px-2.5 bg-amber-500 hover:bg-amber-400 text-stone-900 rounded-lg text-xs font-black cursor-pointer shadow-xs"
                >
                  {isAr ? 'فتح' : 'Ok'}
                </button>
              </div>
              {authError && (
                <span className="text-[10px] text-rose-500 font-bold block animate-pulse">
                  {isAr ? 'كلمة المرور غير صحيحة!' : 'Incorrect password!'}
                </span>
              )}
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); setIsUnlocking(false); }} 
                className="text-[9.5px] hover:underline text-zinc-400 hover:text-zinc-500 block mx-auto pt-1"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </form>
          ) : (
            <div 
              onClick={(e) => { e.stopPropagation(); setIsUnlocking(true); }}
              className="space-y-3 cursor-pointer py-4 group/lock rounded-xl hover:bg-zinc-150/40 dark:hover:bg-zinc-950/20 transition-all duration-200"
            >
              <div className="flex justify-center">
                <Lock className="h-8 w-8 text-amber-500 group-hover/lock:scale-115 transition-transform duration-200" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 block truncate max-w-[150px] mx-auto">
                  {note.title || (isAr ? 'ملاحظة مغلقة ومحمية' : 'Locked Protected Note')}
                </span>
                <span className="text-[9.5px] text-zinc-400 block max-w-[200px] mx-auto leading-normal">
                  {isAr ? 'محتوى هذه المزدوجة مخفي بكلمة مرور خاصة. انقر لفك التشفير.' : 'Sensitive content hidden under lock. Click to view.'}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Drawings/Images Top banners */}
          <div className="flex flex-col gap-2 mb-3">
            {/* Uploaded Images */}
            {(note.imagePosition !== 'bottom') && renderImages()}

            {/* Saved Vector Drawing Preview */}
            {note.drawingData && (
              <div className="w-full rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-2 relative flex items-center justify-center">
                <img 
                  src={note.drawingData} 
                  alt="Vector sketchpad image" 
                  className="max-h-40 object-contain mx-auto"
                  referrerPolicy="no-referrer"
                />
                {!note.isTrashed && onEditDrawing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditDrawing(note);
                    }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-900 text-white transition-opacity scale-90 cursor-pointer"
                    title={isAr ? 'تعديل الرسم الكروكي' : 'Edit Sketch'}
                  >
                    <Paintbrush className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Note Main Body */}
          <div>
            {/* Title row */}
            <div className="flex items-start justify-between gap-2 mb-2">
              {note.title ? (
                <h4 className="font-extrabold text-base tracking-tight break-words flex-1 leading-snug">
                  {note.title}
                </h4>
              ) : (
                // Empty placeholder to balance spacing if no title exists
                <div className="h-1.5" />
              )}

              {/* Pin Icon Toggle (Except in TRASH) */}
              {!note.isTrashed && (
                <button
                  onClick={handlePinToggle}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 ${
                    note.isPinned 
                      ? 'opacity-100 text-amber-500 hover:bg-amber-100/30' 
                      : 'text-zinc-400 hover:bg-zinc-100/30 dark:hover:bg-zinc-805/30'
                  }`}
                  title={note.isPinned ? (isAr ? 'إلغاء التثبيت' : 'Unpin note') : (isAr ? 'تثبيت الملاحظة' : 'Pin note')}
                >
                  <Pin className={`h-4 w-4 transform transition-all ${note.isPinned ? 'rotate-45 fill-amber-500' : ''}`} />
                </button>
              )}
            </div>

            {/* Note content or checkboxes preview */}
            {note.isChecklist ? (
              <div className="space-y-1.5 mt-2">
                {note.checklistItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    onClick={(e) => toggleCheckItem(e, item.id)}
                    className="flex items-start gap-2.5 group/item text-xs cursor-pointer font-medium"
                  >
                    {item.completed ? (
                      <CheckSquare className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Square className="h-4 w-4 shrink-0 text-zinc-400 group-hover/item:text-zinc-600" />
                    )}
                    <span className={`break-all leading-tight ${item.completed ? 'line-through text-zinc-400 dark:text-zinc-505' : ''}`}>
                      {item.text || '...'}
                    </span>
                  </div>
                ))}
                {note.checklistItems.length > 5 && (
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold pl-6 mt-1">
                    + {note.checklistItems.length - 5} {isAr ? 'مزيد من المهام...' : 'more items...'}
                  </p>
                )}
              </div>
            ) : note.isTable && note.tableData ? (
              <div className="overflow-x-auto border border-zinc-200/50 dark:border-zinc-800/40 rounded-xl my-1 bg-zinc-50/50 dark:bg-zinc-950/20 max-h-48 overflow-y-hidden" onClick={(e) => e.stopPropagation()}>
                <table className="w-full text-[10px] font-semibold border-collapse">
                  <thead>
                    <tr className="bg-zinc-100/70 dark:bg-zinc-900/40 border-b border-zinc-250 dark:border-zinc-800/80">
                      <th className="p-1 text-center text-zinc-400 font-mono w-6 border-r border-zinc-200 dark:border-zinc-800/50">#</th>
                      {note.tableData[0]?.map((_, colIdx) => (
                        <th key={colIdx} className="p-1 text-center text-zinc-500 font-mono uppercase border-r last:border-r-0 border-zinc-200 dark:border-zinc-800/50">
                          {String.fromCharCode(65 + colIdx)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {note.tableData.slice(0, 5).map((row, rIdx) => (
                      <tr key={rIdx} className="border-b last:border-0 border-zinc-200/50 dark:border-zinc-805/50">
                        <td className="p-1 text-center font-mono text-zinc-400 bg-zinc-100/30 dark:bg-zinc-905/20 border-r border-zinc-250 dark:border-zinc-800/50 font-bold">
                          {rIdx + 1}
                        </td>
                        {row.map((cellValue, cIdx) => (
                          <td key={cIdx} className="p-1 border-r last:border-r-0 border-zinc-200/50 dark:border-zinc-805/50 truncate max-w-[80px]">
                            {cellValue || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {note.tableData.length > 5 && (
                  <div className="text-[9px] text-zinc-405 font-bold p-1 text-center border-t border-zinc-205 dark:border-zinc-800">
                    + {note.tableData.length - 5} {isAr ? 'صفوف إضافية...' : 'more rows...'}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap break-words opacity-90 line-clamp-6">
                {note.content}
              </p>
            )}
          </div>

          {/* Uploaded Images - Bottom Position */}
          {note.imagePosition === 'bottom' && (
            <div className="mt-3">
              {renderImages()}
            </div>
          )}
        </>
      )}

      {/* Tags and timestamp footer */}
      <div className="mt-4 pt-3 border-t border-zinc-150/50 dark:border-zinc-800/50 flex flex-col gap-2.5">
        {/* Label chips rendering */}
        {noteLabels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {noteLabels.map(l => (
              <span
                key={l.id}
                className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-zinc-200/55 dark:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300 border border-zinc-300/20"
              >
                {l.name}
              </span>
            ))}
          </div>
        )}

        {/* Timestamp & Actions */}
        <div className="flex flex-col gap-2.5">
          {/* Row 1: Primary Controls Row (Always visual left side for actions, clock on the right) */}
          <div className="flex items-center justify-between gap-2 text-xs" dir="ltr">
            {/* Direct Edit and Delete controls (Larger, more prominent) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {!isConfirmingDelete ? (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(note);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-200/90 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white hover:scale-[1.01] transition-all cursor-pointer text-xs font-black shadow-xs flex items-center justify-center min-w-[55px]"
                    title={isAr ? 'تعديل الملاحظة' : 'Edit note'}
                  >
                    {isAr ? 'تعديل' : 'Edit'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (note.isTrashed) {
                        setIsConfirmingDelete(true);
                      } else {
                        onUpdateNote(note.id, { isTrashed: true, isPinned: false, updatedAt: Date.now() });
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-600 hover:text-white dark:bg-rose-500/10 dark:hover:bg-rose-600 hover:scale-[1.01] text-rose-600 dark:text-rose-405 transition-all cursor-pointer text-xs font-black shadow-xs flex items-center justify-center min-w-[55px]"
                    title={isAr ? 'حذف الملاحظة' : 'Delete note'}
                  >
                    {isAr ? 'حذف' : 'Delete'}
                  </button>
                </>
              ) : (
                <div 
                  className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 p-0.5 rounded-xl animate-in zoom-in-95 duration-100"
                  onClick={(e) => e.stopPropagation()}
                  onMouseLeave={() => setIsConfirmingDelete(false)}
                >
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-extrabold px-1.5 shrink-0">
                    {isAr ? 'تأكيد؟' : 'Sure?'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePermanentDelete(e);
                      setIsConfirmingDelete(false);
                    }}
                    className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded-md text-[10px] font-black cursor-pointer transition-colors"
                  >
                    {isAr ? 'نعم' : 'Yes'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsConfirmingDelete(false);
                    }}
                    className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    {isAr ? 'لا' : 'No'}
                  </button>
                </div>
              )}
            </div>

            {/* Visual Clock indicator (Always visual right because dir="ltr") */}
            <div className="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500 font-mono font-bold shrink-0">
              <Clock className="h-3 w-3" />
              <span>{getFormattedDate(note.updatedAt || note.createdAt)}</span>
            </div>
          </div>

          {/* Row 2: Secondary Quick Tools Drawer (Appears on hover) */}
          <div className="flex items-center justify-between min-h-[24px]">
            <div />
            {/* Quick Tools Tray */}
            <div className="relative flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
              {note.isTrashed ? (
                // Actions in TRASH (Restore or Delete permanently)
                <>
                  <button
                    onClick={handleTrashToggle}
                    className="p-1.5 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 text-emerald-500 hover:text-emerald-600 cursor-pointer"
                    title={isAr ? 'استعادة الملاحظة' : 'Restore'}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={handlePermanentDelete}
                    className="p-1.5 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 text-rose-500 hover:text-rose-600 cursor-pointer"
                    title={isAr ? 'حذف نهائي' : 'Delete forever'}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                // Standard actions
                <>
                  {/* Color trigger */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowColorMenu(!showColorMenu);
                    }}
                    className="p-1.5 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-805/60 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                    title={isAr ? 'تغيير اللون' : 'Change color'}
                  >
                    <Palette className="h-3.5 w-3.5" />
                  </button>

                  {/* Color popover menu */}
                  {showColorMenu && (
                    <div 
                      className={`absolute bottom-8 ${isAr ? 'right-0' : 'left-0'} z-30 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl shadow-xl flex gap-1 animate-in slide-in-from-bottom-2 duration-100`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {NOTE_COLORS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={(e) => handleColorChange(e, c.id)}
                          className={`h-5 w-5 rounded-full border border-zinc-300 dark:border-zinc-700 transition-transform hover:scale-125 cursor-pointer ${c.buttonColor}`}
                          title={isAr ? c.nameAR : c.nameEN}
                        />
                      ))}
                    </div>
                  )}

                  {/* Lock Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateNote(note.id, { isLocked: !note.isLocked, updatedAt: Date.now() });
                    }}
                    className="p-1.5 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-805/60 text-zinc-405 hover:text-amber-500 cursor-pointer"
                    title={note.isLocked ? (isAr ? 'إلغاء قفل الملاحظة' : 'Unlock note') : (isAr ? 'قفل الملاحظة' : 'Lock note')}
                  >
                    <Lock className={`h-3.5 w-3.5 ${note.isLocked ? 'text-amber-500 fill-amber-500/20' : ''}`} />
                  </button>

                  {/* Trash Button */}
                  <button
                    onClick={handleTrashToggle}
                    className="p-1.5 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-805/60 text-zinc-405 hover:text-rose-600 dark:hover:text-zinc-200 cursor-pointer"
                    title={isAr ? 'نقل للمهملات' : 'Move to trash'}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
