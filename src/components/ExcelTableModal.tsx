import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  X, 
  FileSpreadsheet, 
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Grid3X3,
  Sun,
  Moon
} from 'lucide-react';

interface ExcelTableModalProps {
  initialData?: string[][];
  onSave: (tableData: string[][]) => void;
  onCancel: () => void;
  isAr: boolean;
}

export default function ExcelTableModal({ initialData, onSave, onCancel, isAr }: ExcelTableModalProps) {
  // Main Table state
  const [tableData, setTableData] = useState<string[][]>(() => {
    if (initialData && initialData.length > 0) {
      return initialData.map(row => [...row]);
    }
    // Default 15 rows x 6 columns grid to feel more spacious
    return Array.from({ length: 15 }, () => Array(6).fill(""));
  });

  // Pagination & Search States
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [rowJumpInput, setRowJumpInput] = useState('');
  const [quickAddCount, setQuickAddCount] = useState(100);

  // Synchronous page boundary capping on table size changes
  const totalRows = tableData.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages || 1);

  const startIndex = (safeCurrentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
  const visibleRows = tableData.slice(startIndex, endIndex);

  // Keep cell updates aligned with real absolute index
  const handleCellChange = (visibleRowIdx: number, colIndex: number, text: string) => {
    const absoluteRowIndex = startIndex + visibleRowIdx;
    setTableData(prev => prev.map((row, rIdx) => {
      if (rIdx === absoluteRowIndex) {
        return row.map((cell, cIdx) => (cIdx === colIndex ? text : cell));
      }
      return row;
    }));
  };

  const handleAddRow = () => {
    const numCols = tableData[0]?.length || 6;
    setTableData(prev => [...prev, Array(numCols).fill("")]);
    // Auto-navigate to the last page where the new row was appended
    const updatedTotalRows = totalRows + 1;
    const nextLastPage = Math.ceil(updatedTotalRows / rowsPerPage);
    setCurrentPage(nextLastPage);
  };

  const handleAddMultipleRows = (count: number) => {
    const numCols = tableData[0]?.length || 6;
    const newRows = Array.from({ length: count }, () => Array(numCols).fill(""));
    setTableData(prev => [...prev, ...newRows]);
    // Go to the updated last page
    const updatedTotalRows = totalRows + count;
    const nextLastPage = Math.ceil(updatedTotalRows / rowsPerPage);
    setCurrentPage(nextLastPage);
  };

  const handleAddColumn = () => {
    setTableData(prev => prev.map(row => [...row, ""]));
  };

  const handleDeleteRow = (visibleRowIdx: number) => {
    if (tableData.length <= 1) return;
    const absoluteRowIndex = startIndex + visibleRowIdx;
    const nextTableData = tableData.filter((_, idx) => idx !== absoluteRowIndex);
    setTableData(nextTableData);
    
    // Adjust current page if we deleted the last row on the last page
    const newTotalRows = nextTableData.length;
    const newTotalPages = Math.ceil(newTotalRows / rowsPerPage);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    }
  };

  const handleDeleteColumn = (colIndex: number) => {
    if (tableData[0]?.length <= 1) return;
    setTableData(prev => prev.map(row => row.filter((_, idx) => idx !== colIndex)));
  };

  const handleReset = () => {
    if (window.confirm(isAr ? 'هل تريد إعادة ضبط الجدول ومسح محتوياته؟' : 'Are you sure you want to clear the entire grid?')) {
      setTableData(Array.from({ length: 15 }, () => Array(6).fill("")));
      setCurrentPage(1);
    }
  };

  const handleJumpToRow = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const rowNum = parseInt(rowJumpInput, 10);
    if (!isNaN(rowNum) && rowNum >= 1 && rowNum <= totalRows) {
      const pageIndex = Math.ceil(rowNum / rowsPerPage);
      setCurrentPage(pageIndex);
      setRowJumpInput('');
      // Focus the cell in that row after a brief delay
      setTimeout(() => {
        const targetRelativeIdx = (rowNum - 1) % rowsPerPage;
        const targetCell = document.getElementById(`cell-${targetRelativeIdx}-0`);
        if (targetCell) {
          (targetCell as HTMLInputElement).focus();
          targetCell.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 100);
    } else {
      alert(isAr ? `يرجى إدخال رقم صف صالح بين 1 و ${totalRows}` : `Please enter a valid row between 1 and ${totalRows}`);
    }
  };

  // Keyboard navigation logic
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, relativeRowIdx: number, colIdx: number) => {
    if (e.key === 'ArrowDown' || (e.key === 'Enter' && !e.shiftKey)) {
      e.preventDefault();
      const nextInput = document.getElementById(`cell-${relativeRowIdx + 1}-${colIdx}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      } else if (relativeRowIdx + 1 >= visibleRows.length && startIndex + relativeRowIdx + 1 < totalRows) {
        // Go to next page
        setCurrentPage(prev => prev + 1);
        setTimeout(() => {
          const firstInputNextPage = document.getElementById(`cell-0-${colIdx}`);
          if (firstInputNextPage) (firstInputNextPage as HTMLInputElement).focus();
        }, 80);
      }
    } else if (e.key === 'ArrowUp' || (e.key === 'Enter' && e.shiftKey)) {
      e.preventDefault();
      const prevInput = document.getElementById(`cell-${relativeRowIdx - 1}-${colIdx}`);
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
      } else if (relativeRowIdx === 0 && currentPage > 1) {
        // Go to previous page
        setCurrentPage(prev => prev - 1);
        setTimeout(() => {
          const lastInputPrevPage = document.getElementById(`cell-${rowsPerPage - 1}-${colIdx}`);
          if (lastInputPrevPage) (lastInputPrevPage as HTMLInputElement).focus();
        }, 80);
      }
    } else if (e.key === 'ArrowRight') {
      const input = e.currentTarget;
      if (input.selectionStart === input.value.length) {
        const nextInput = document.getElementById(`cell-${relativeRowIdx}-${colIdx + 1}`);
        if (nextInput) {
          e.preventDefault();
          (nextInput as HTMLInputElement).focus();
        }
      }
    } else if (e.key === 'ArrowLeft') {
      const input = e.currentTarget;
      if (input.selectionStart === 0) {
        const prevInput = document.getElementById(`cell-${relativeRowIdx}-${colIdx - 1}`);
        if (prevInput) {
          e.preventDefault();
          (prevInput as HTMLInputElement).focus();
        }
      }
    }
  };

  const handleApplySave = () => {
    onSave(tableData);
  };

  return (
    <div className="fixed inset-0 bg-zinc-50 dark:bg-zinc-950 z-[9999] flex flex-col overflow-hidden select-none">
      {/* Subtle spreadsheet grid visual background decoration */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.04] dark:opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Top Navigation & Brand Header - Space optimized */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800/80 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
            <FileSpreadsheet className="h-5.5 w-5.5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-zinc-900 dark:text-white text-sm sm:text-base tracking-tight leading-tight">
              {isAr ? 'مساحة العمل الكاملة للجداول' : 'Full Screen Table Workspace'}
            </h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold">
              {isAr ? 'تم تحسين الواجهة لتستغل كامل حجم الشاشة لسهولة التنقل والتعديل السريع' : 'Optimized to utilize 100% viewport space with pro keyboard navigation'}
            </p>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-3">
          {/* Quick Stats banner */}
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-black text-emerald-700 dark:text-emerald-400">
            <Grid3X3 className="h-3.5 w-3.5" />
            <span>
              {isAr ? `الصفوف: ${totalRows} | الأعمدة: ${tableData[0]?.length || 0}` : `Rows: ${totalRows} | Columns: ${tableData[0]?.length || 0}`}
            </span>
          </div>

          <button
            onClick={handleReset}
            className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            title={isAr ? 'إعادة ضبط بالكامل' : 'Reset Table Data'}
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800" />

          {/* Close modal */}
          <button
            onClick={onCancel}
            className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-rose-500 transition-colors cursor-pointer"
            title={isAr ? 'إلغاء وإغلاق' : 'Close and discard'}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Workspace Frame - Occupies full viewport thickness to minimize padding waste */}
      <div className="flex-1 w-full max-w-full px-3 sm:px-6 py-3 flex flex-col min-h-0 relative z-10 gap-3">
        
        {/* Fast Action Tools Section */}
        <div className="flex flex-col xl:flex-row gap-3 xl:items-center justify-between bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-xs shrink-0">
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAddRow}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-xl text-xs font-black cursor-pointer transition-colors shadow-xs hover:shadow-emerald-500/10"
            >
              <Plus className="h-4 w-4" />
              <span>{isAr ? 'إضافة صف واحد' : 'Add Row'}</span>
            </button>
            
            <button
              type="button"
              onClick={handleAddColumn}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-black cursor-pointer transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>{isAr ? 'إضافة عمود' : 'Add Column'}</span>
            </button>

            {/* Fast Multi-Row batch creator */}
            <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-750 hidden sm:block mx-1" />
            
            <div className="flex items-center bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl p-0.5 shadow-2xs">
              <input
                type="number"
                value={quickAddCount}
                onChange={(e) => setQuickAddCount(Math.max(1, parseInt(e.target.value, 10) || 5))}
                className="w-16 bg-transparent text-center text-xs font-black focus:outline-hidden text-zinc-800 dark:text-zinc-100"
                min="1"
                max="1000"
              />
              <button
                type="button"
                onClick={() => handleAddMultipleRows(quickAddCount)}
                className="px-3 py-1.5 bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 font-extrabold text-[10px] text-zinc-700 dark:text-zinc-300 rounded-lg border border-zinc-200/60 dark:border-zinc-800 transition-all cursor-pointer"
              >
                {isAr ? `توليد صفوف دُفعة واحدة` : `Generate Rows`}
              </button>
            </div>
          </div>

          {/* Quick Row Navigation Input */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {isAr ? 'الانتقال السريع للصف:' : 'Jump directly to row:'}
            </span>
            <form onSubmit={handleJumpToRow} className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl p-1 shadow-2xs w-full sm:w-auto">
              <input
                type="number"
                value={rowJumpInput}
                onChange={(e) => setRowJumpInput(e.target.value)}
                placeholder={isAr ? "مثال: 320" : "e.g. 320"}
                className="w-24 px-2 focus:outline-hidden text-zinc-800 dark:text-zinc-100 font-black bg-transparent placeholder-zinc-400 dark:placeholder-zinc-650 text-xs"
                min="1"
                max={totalRows}
              />
              <button
                type="submit"
                className="p-1 px-3.5 bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-800 text-xs font-black text-zinc-700 dark:text-zinc-300 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Search className="h-3 w-3 text-emerald-500" />
                <span>{isAr ? 'ذهاب' : 'Go'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Real Dynamic Full-Screen Size Container - flex-1 stretches to take up 100% of remaining screen height */}
        <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-xs p-3 flex flex-col justify-between overflow-hidden">
          
          {/* Scrollable table pane - scrolls correctly regardless of row count */}
          <div className="flex-1 min-h-0 overflow-auto border border-zinc-200 dark:border-zinc-800/80 rounded-xl bg-zinc-50 dark:bg-zinc-950/40">
            <table className="w-full text-xs font-semibold select-none border-collapse">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-250 dark:border-zinc-800 sticky top-0 z-20 shadow-2xs">
                  <th className="p-3 text-center text-zinc-500 font-mono w-16 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-150/70 dark:bg-zinc-900 font-black">
                    #
                  </th>
                  {tableData[0]?.map((_, colIdx) => (
                    <th 
                      key={colIdx} 
                      className="p-3 text-center text-zinc-650 dark:text-zinc-400 font-mono uppercase bg-zinc-100 dark:bg-zinc-900 border-r last:border-r-0 border-zinc-200 dark:border-zinc-800 relative group/col min-w-[150px]"
                    >
                      <span className="font-extrabold tracking-wider">{String.fromCharCode(65 + colIdx)}</span>
                      {tableData[0].length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteColumn(colIdx)}
                          className="absolute -top-1 -right-1 hidden group-hover/col:flex h-5 w-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black items-center justify-center cursor-pointer shadow-md shadow-rose-900/40 transition-transform"
                          title={isAr ? 'حذف العمود' : 'Delete column'}
                        >
                          ×
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, relativeRowIdx) => {
                  const absoluteRowIdx = startIndex + relativeRowIdx;
                  return (
                    <tr 
                      key={absoluteRowIdx} 
                      className="border-b last:border-0 border-zinc-200 dark:border-zinc-800/60 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/5 bg-white dark:bg-zinc-900/70 transition-colors"
                    >
                      {/* Left Numeric Row ID Headers */}
                      <td className="p-2 text-center font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100/50 dark:bg-zinc-900/40 border-r border-zinc-200 dark:border-zinc-800 font-bold relative group/row">
                        <span>{absoluteRowIdx + 1}</span>
                        {tableData.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(relativeRowIdx)}
                            className="absolute -top-1.5 -left-1 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black h-5 w-5 hidden group-hover/row:flex items-center justify-center cursor-pointer shadow-md shadow-rose-900/40 transition-transform"
                            title={isAr ? 'حذف هذا الصف' : 'Delete row'}
                          >
                            ×
                          </button>
                        )}
                      </td>

                      {/* Spreadsheet Inputs with optimized key navigation support */}
                      {row.map((cellValue, cIdx) => (
                        <td key={cIdx} className="p-0 border-r last:border-r-0 border-zinc-200 dark:border-zinc-800">
                          <input
                            type="text"
                            id={`cell-${relativeRowIdx}-${cIdx}`}
                            value={cellValue || ''}
                            onChange={(e) => handleCellChange(relativeRowIdx, cIdx, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, relativeRowIdx, cIdx)}
                            placeholder="..."
                            className="w-full px-3 py-3 focus:outline-hidden bg-transparent text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100/20 dark:hover:bg-zinc-900/10 font-bold focus:bg-emerald-500/5 dark:focus:bg-emerald-500/10 transition-colors text-xs border-0 outline-hidden"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Navigation & Pagination Controls Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-zinc-100 dark:border-zinc-800/80 pt-3 mt-3 shrink-0">
            
            {/* Range counter label */}
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-bold">
              {isAr 
                ? `عرض صفوف من ${startIndex + 1} إلى ${endIndex} (من إجمالي ${totalRows} صف)` 
                : `Showing records ${startIndex + 1} - ${endIndex} of ${totalRows}`}
            </div>

            {/* Pagination direct page selection block */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => { setCurrentPage(1); }}
                disabled={safeCurrentPage === 1}
                className="p-1 px-2.5 rounded-lg border border-zinc-350 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-black disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title={isAr ? 'الصفحة الأولى' : 'First Page'}
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => { setCurrentPage(prev => Math.max(1, prev - 1)); }}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded-lg border border-zinc-350 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-black disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title={isAr ? 'السابق' : 'Previous'}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (safeCurrentPage > 3 && totalPages > 5) {
                    pageNum = safeCurrentPage - 3 + i;
                    if (pageNum + (4 - i) > totalPages) {
                      pageNum = totalPages - 4 + i;
                    }
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-7 min-w-7 px-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        safeCurrentPage === pageNum
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                          : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => { setCurrentPage(prev => Math.min(totalPages, prev + 1)); }}
                disabled={safeCurrentPage === totalPages}
                className="p-1.5 rounded-lg border border-zinc-350 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-black disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title={isAr ? 'التالي' : 'Next'}
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => { setCurrentPage(totalPages); }}
                disabled={safeCurrentPage === totalPages}
                className="p-1 px-2.5 rounded-lg border border-zinc-350 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-black disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title={isAr ? 'الصفحة الأخيرة' : 'Last Page'}
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>

            {/* Size selector dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500">
                {isAr ? 'الصفوف المعروضة:' : 'Rows display limit:'}
              </span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setCurrentPage(1);
                }}
                className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs rounded-lg p-1.5 cursor-pointer font-bold focus:outline-hidden"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

          </div>
        </div>

        {/* Primary Save Changes Panel at bottom */}
        <div className="flex items-center gap-3 w-full max-w-lg justify-center mx-auto mt-2 pb-2 shrink-0">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xs font-black text-zinc-700 dark:text-zinc-350 transition-colors cursor-pointer shadow-sm text-center"
          >
            {isAr ? 'إلغاء وتجاهل' : 'Discard / Cancel'}
          </button>
          
          <button
            onClick={handleApplySave}
            className="flex-1 py-3 px-5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-500/10 transition-all scale-100 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{isAr ? 'تأكيد وحفظ التغييرات للجدول' : 'Apply & Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
