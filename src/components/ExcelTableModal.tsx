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
    // Default 10 rows x 5 columns grid to feel more spacious
    return Array.from({ length: 10 }, () => Array(5).fill(""));
  });

  // Pagination & Search States
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [rowJumpInput, setRowJumpInput] = useState('');
  const [quickAddCount, setQuickAddCount] = useState(50);

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
    const numCols = tableData[0]?.length || 5;
    setTableData(prev => [...prev, Array(numCols).fill("")]);
    // Auto-navigate to the last page where the new row was appended
    const updatedTotalRows = totalRows + 1;
    const nextLastPage = Math.ceil(updatedTotalRows / rowsPerPage);
    setCurrentPage(nextLastPage);
  };

  const handleAddMultipleRows = (count: number) => {
    const numCols = tableData[0]?.length || 5;
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
    setTableData(prev => prev.filter((_, idx) => idx !== absoluteRowIndex));
  };

  const handleDeleteColumn = (colIndex: number) => {
    if (tableData[0]?.length <= 1) return;
    setTableData(prev => prev.map(row => row.filter((_, idx) => idx !== colIndex)));
  };

  const handleReset = () => {
    if (window.confirm(isAr ? 'هل تريد إعادة ضبط الجدول ومسح محتوياته؟' : 'Are you sure you want to clear the entire grid?')) {
      setTableData(Array.from({ length: 10 }, () => Array(5).fill("")));
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
    } else {
      alert(isAr ? `يرجى إدخال رقم صف صالح بين 1 و ${totalRows}` : `Please enter a valid row between 1 and ${totalRows}`);
    }
  };

  const handleApplySave = () => {
    onSave(tableData);
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-zinc-950 z-[9999] flex flex-col overflow-hidden select-none">
      {/* Soft Blueprint grid visual decoration */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(to right, #059669 1px, transparent 1px), linear-gradient(to bottom, #059669 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Optimized Header Area */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800/80 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-black text-zinc-900 dark:text-white text-sm sm:text-base tracking-tight">
              {isAr ? 'محرر الجداول المتطور' : 'Advanced Table Workspace'}
            </h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold">
              {isAr ? 'تحكم كامل بالتنقل السريع والتعديل ذو المساحة الكبرى' : 'Full performance workspace optimized for large records'}
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-3">
          {/* Quick Stats overview */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-800/55 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-300">
            <Grid3X3 className="h-3.5 w-3.5 text-emerald-500" />
            <span>
              {isAr ? `إجمالي الصفوف: ${totalRows}` : `Total Rows: ${totalRows}`}
            </span>
          </div>

          <button
            onClick={handleReset}
            className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            title={isAr ? 'إعادة ضبط بالكامل' : 'Reset Table Data'}
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800" />

          {/* Close symbol */}
          <button
            onClick={onCancel}
            className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-rose-500 transition-colors cursor-pointer"
            title={isAr ? 'إلغاء وإغلاق' : 'Close and discard'}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Workspace Frame - Occupies 98vw of screen width to utilize space perfectly */}
      <div className="flex-1 overflow-auto p-2 sm:p-4.5 relative z-10 flex flex-col items-stretch max-w-[98vw] sm:max-w-[96vw] mx-auto w-full">
        
        {/* Toolbar & Fast Row Generator Section */}
        <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between bg-zinc-50 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 mb-4 shadow-sm shrink-0">
          
          {/* Left panel: Add rows and columns */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAddRow}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-lg text-xs font-extrabold cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>{isAr ? 'إضافة صف واحد' : 'Add Row'}</span>
            </button>
            
            <button
              type="button"
              onClick={handleAddColumn}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-extrabold cursor-pointer transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>{isAr ? 'إضافة عمود' : 'Add Column'}</span>
            </button>

            {/* Quick Multi-Row Add panel - solves user pain of generating e.g. 500 rows */}
            <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700 hidden sm:block mx-1" />
            
            <div className="flex items-center bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg p-0.5 shadow-2xs">
              <input
                type="number"
                value={quickAddCount}
                onChange={(e) => setQuickAddCount(Math.max(1, parseInt(e.target.value, 10) || 5))}
                className="w-14 text-center text-xs font-bold focus:outline-hidden text-zinc-800 dark:text-zinc-100"
                min="1"
                max="1000"
              />
              <button
                type="button"
                onClick={() => handleAddMultipleRows(quickAddCount)}
                className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 font-black text-[10px] text-zinc-700 dark:text-zinc-300 rounded-md transition-all cursor-pointer"
              >
                {isAr ? `+ إضافة صفوف` : `+ Add rows`}
              </button>
            </div>
          </div>

          {/* Right panel: Search and Jump to row */}
          <div className="flex flex-wrap items-center gap-3">
            <form onSubmit={handleJumpToRow} className="flex items-center gap-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg p-1 shadow-2xs w-full sm:w-auto">
              <input
                type="number"
                value={rowJumpInput}
                onChange={(e) => setRowJumpInput(e.target.value)}
                placeholder={isAr ? "اكتب رقم الصف (مثال: 150)..." : "Row number (e.g. 150)..."}
                className="w-full sm:w-44 px-2 focus:outline-hidden text-zinc-800 dark:text-zinc-100 font-bold bg-transparent placeholder-zinc-400 dark:placeholder-zinc-600 text-xs"
                min="1"
                max={totalRows}
              />
              <button
                type="submit"
                className="p-1 px-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-extrabold text-zinc-730 dark:text-zinc-300 rounded-md flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Search className="h-3 w-3" />
                <span>{isAr ? 'ذهاب' : 'Go'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Spacious Table view - occupying maximum width */}
        <div className="flex-1 min-h-[50vh] bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-lg p-3 sm:p-5 flex flex-col justify-between overflow-hidden">
          
          <div className="overflow-auto max-h-[60vh] border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950">
            <table className="w-full text-xs font-semibold select-none border-collapse">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-250 dark:border-zinc-800 sticky top-0 z-10 shadow-3xs">
                  <th className="p-3 text-center text-zinc-500 font-mono w-16 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-150/70 dark:bg-zinc-900 font-black">
                    #
                  </th>
                  {tableData[0]?.map((_, colIdx) => (
                    <th 
                      key={colIdx} 
                      className="p-3 text-center text-zinc-650 dark:text-zinc-400 font-mono uppercase bg-zinc-100 dark:bg-zinc-900 border-r last:border-r-0 border-zinc-200 dark:border-zinc-800 relative group/col min-w-[130px]"
                    >
                      <span className="font-extrabold tracking-wider">{String.fromCharCode(65 + colIdx)}</span>
                      {tableData[0].length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteColumn(colIdx)}
                          className="absolute -top-1.5 -right-1.5 hidden group-hover/col:flex h-5 w-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black items-center justify-center cursor-pointer shadow-md shadow-rose-900/40 transition-transform"
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
                      className="border-b last:border-0 border-zinc-200 dark:border-zinc-800/60 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/5 bg-white dark:bg-zinc-900 transition-colors"
                    >
                      {/* Row Header with index */}
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

                      {/* Input fields with highly optimized theme-safe styling */}
                      {row.map((cellValue, cIdx) => (
                        <td key={cIdx} className="p-0 border-r last:border-r-0 border-zinc-200 dark:border-zinc-800">
                          <input
                            type="text"
                            value={cellValue}
                            onChange={(e) => handleCellChange(relativeRowIdx, cIdx, e.target.value)}
                            placeholder="..."
                            className="w-full px-3 py-2.5 focus:outline-hidden bg-transparent text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100/30 dark:hover:bg-zinc-900/10 font-medium focus:bg-emerald-500/5 dark:focus:bg-emerald-500/10 transition-colors text-xs border-0 border-transparent outline-hidden"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Navigation Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-100 dark:border-zinc-800/80 pt-4.5 mt-4">
            
            {/* Rows Range Summary */}
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-bold">
              {isAr 
                ? `عرض صفوف من ${startIndex + 1} إلى ${endIndex} (من إجمالي ${totalRows} صف)` 
                : `Showing records ${startIndex + 1} - ${endIndex} of ${totalRows}`}
            </div>

            {/* Micro navigation buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                className="p-1 px-2.5 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-black disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title={isAr ? 'الصفحة الأولى' : 'First Page'}
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-black disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title={isAr ? 'السابق' : 'Previous'}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Responsive pages indicators */}
              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Sliding window for page numbers
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
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages}
                className="p-1.5 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-black disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title={isAr ? 'التالي' : 'Next'}
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
                className="p-1 px-2.5 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-black disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title={isAr ? 'الصفحة الأخيرة' : 'Last Page'}
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>

            {/* Custom rows per page size list selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500">
                {isAr ? 'صفوف لكل صفحة:' : 'Rows per page:'}
              </span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setCurrentPage(1);
                }}
                className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-350 text-xs rounded-lg p-1.5 cursor-pointer font-bold focus:outline-hidden"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

          </div>
        </div>

        {/* Global Save Controls */}
        <div className="flex items-center gap-3 w-full max-w-md justify-center mx-auto mt-6 shrink-0">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-xs font-extrabold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer shadow-sm text-center"
          >
            {isAr ? 'إلغاء والرجوع' : 'Discard / Exit'}
          </button>
          
          <button
            onClick={handleApplySave}
            className="flex-1 py-3 px-5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-600/15 transition-all scale-100 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="h-4.5 w-4.5" />
            <span>{isAr ? 'تأكيد وحفظ التغييرات' : 'Apply and Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
