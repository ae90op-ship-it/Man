import React, { useState } from 'react';
import { Plus, X, Trash2, Check, Tag } from 'lucide-react';
import { Label } from '../types';

interface LabelManagerProps {
  labels: Label[];
  onAddLabel: (name: string) => void;
  onUpdateLabel: (id: string, name: string) => void;
  onDeleteLabel: (id: string) => void;
  onClose: () => void;
  isAr: boolean;
}

export default function LabelManager({
  labels,
  onAddLabel,
  onUpdateLabel,
  onDeleteLabel,
  onClose,
  isAr
}: LabelManagerProps) {
  const [newLabelName, setNewLabelName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    onAddLabel(newLabelName.trim());
    setNewLabelName('');
  };

  const startEditing = (label: Label) => {
    setEditingId(label.id);
    setEditingName(label.name);
  };

  const saveEdit = (id: string) => {
    if (!editingName.trim()) return;
    onUpdateLabel(id, editingName.trim());
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-150 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Tag className="h-4.5 w-4.5 text-zinc-500" />
            <h3 className="font-bold text-zinc-900 dark:text-white">
              {isAr ? 'تعديل التصنيفات' : 'Edit labels'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Create Label Entry */}
        <div className="p-5 border-b border-zinc-150 dark:border-zinc-800">
          <form onSubmit={handleCreate} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder={isAr ? 'إنشاء تصنيف جديد...' : 'Create new label...'}
                className="w-full text-xs py-2.5 px-3.5 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-250 dark:border-zinc-800 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={!newLabelName.trim()}
              className="py-2.5 px-3.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black rounded-xl text-xs font-bold disabled:opacity-45 flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>{isAr ? 'إضافة' : 'Create'}</span>
            </button>
          </form>
        </div>

        {/* Existing labels list */}
        <div className="max-h-60 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
          {labels.length === 0 ? (
            <div className="text-center py-6 text-zinc-400 dark:text-zinc-600 text-xs">
              {isAr ? 'لا توجد تصنيفات حالياً. أضف واحداً أعلاه!' : 'No custom labels created yet.'}
            </div>
          ) : (
            labels.map((label) => (
              <div 
                key={label.id}
                className="flex items-center justify-between gap-3 p-2 rounded-xl text-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-950/40 transition-colors"
                dir={isAr ? 'rtl' : 'ltr'}
              >
                {editingId === label.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 bg-white dark:bg-zinc-900 border border-blue-550 focus:outline-hidden text-xs py-1 px-2.5 rounded-lg text-zinc-900 dark:text-zinc-100"
                    />
                    <button
                      onClick={() => saveEdit(label.id)}
                      className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-md cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 text-zinc-400 hover:bg-zinc-105 dark:hover:bg-zinc-800 rounded-md cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5">
                      <Tag className="h-3.5 w-3.5 text-zinc-405 dark:text-zinc-505" />
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        {label.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {confirmDeleteId === label.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/15 border border-rose-200 dark:border-rose-900/45 px-1 py-0.5 rounded-lg animate-in zoom-in-95 duration-100">
                          <span className="text-[9px] text-rose-600 dark:text-rose-400 font-bold px-1 shrink-0">
                            {isAr ? 'حذف؟' : 'Delete?'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteLabel(label.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white text-[8px] font-black rounded cursor-pointer transition-colors"
                          >
                            {isAr ? 'نعم' : 'Yes'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[8px] font-bold rounded cursor-pointer transition-colors"
                          >
                            {isAr ? 'لا' : 'No'}
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEditing(label)}
                            className="py-1 px-2 text-[10px] text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-400 rounded-lg cursor-pointer"
                          >
                            {isAr ? 'تعديل' : 'Rename'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(label.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer"
                            title={isAr ? 'حذف هذا التصنيف' : 'Delete label'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        <div className="bg-zinc-50 dark:bg-zinc-905 px-5 py-3 border-t border-zinc-150 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-1.5 px-4 bg-zinc-200 hover:bg-zinc-250 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            {isAr ? 'تم' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}
