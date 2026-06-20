import React, { useRef, useState, useEffect } from 'react';
import { 
  Undo2, 
  Redo2, 
  Trash2, 
  Eraser, 
  Paintbrush, 
  Save, 
  X,
  Sparkles,
  Grid3X3
} from 'lucide-react';
import { DrawingPath } from '../types';

interface DrawingCanvasProps {
  initialPaths?: DrawingPath[];
  onSave: (dataUrl: string, paths: DrawingPath[]) => void;
  onCancel: () => void;
  isAr: boolean;
}

export default function DrawingCanvas({ initialPaths = [], onSave, onCancel, isAr }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Drawing state
  const [paths, setPaths] = useState<DrawingPath[]>(() => {
    return initialPaths.map(p => ({
      ...p,
      points: [...p.points]
    }));
  });
  const [redoStack, setRedoStack] = useState<DrawingPath[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#2563eb'); // Tailwind Blue 600
  const [brushWidth, setBrushWidth] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  // Active path during continuous drawing
  const currentPathRef = useRef<DrawingPath | null>(null);

  const colors = [
    { value: '#000000', nameEN: 'Black', nameAR: 'أسود' },
    { value: '#ef4444', nameEN: 'Red', nameAR: 'أحمر' },
    { value: '#f97316', nameEN: 'Orange', nameAR: 'برتقالي' },
    { value: '#eab308', nameEN: 'Yellow', nameAR: 'أصفر' },
    { value: '#22c55e', nameEN: 'Green', nameAR: 'أخضر' },
    { value: '#06b6d4', nameEN: 'Teal', nameAR: 'فيروزي' },
    { value: '#3b82f6', nameEN: 'Blue', nameAR: 'أزرق' },
    { value: '#a855f7', nameEN: 'Purple', nameAR: 'بنفسجي' },
    { value: '#ec4899', nameEN: 'Pink', nameAR: 'وردي' },
    { value: '#ffffff', nameEN: 'White', nameAR: 'أبيض' },
  ];

  const strokeSizes = [
    { value: 2, label: 'Thin' },
    { value: 5, label: 'Medium' },
    { value: 10, label: 'Thick' },
    { value: 20, label: 'Jumbo' }
  ];

  // Draw all paths onto the canvas
  const drawAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    paths.forEach((path) => {
      if (path.points.length === 0) return;

      ctx.beginPath();
      ctx.lineWidth = path.width;
      
      if (path.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = path.color;
      }

      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      ctx.stroke();
    });

    ctx.restore();
  };

  // Setup fluid fullscreen canvas size
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const width = window.innerWidth;
      const height = window.innerHeight;

      if (canvas.width !== width || canvas.height !== height) {
        // Safe copy of current canvas contents to offscreen canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx && canvas.width > 0 && canvas.height > 0) {
          tempCtx.drawImage(canvas, 0, 0);
        }

        canvas.width = width;
        canvas.height = height;

        // Redraw trails dynamically
        drawAll();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    const timeout = setTimeout(resizeCanvas, 100);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      clearTimeout(timeout);
    };
  }, [paths]);

  useEffect(() => {
    drawAll();
  }, [paths]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (e.cancelable) {
      e.preventDefault();
    }

    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    
    const newPath: DrawingPath = {
      points: [coords],
      color: brushColor,
      width: brushWidth,
      isEraser: isEraser
    };

    currentPathRef.current = newPath;
    setPaths(prev => [...prev, newPath]);
    setRedoStack([]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentPathRef.current) return;
    
    if (e.cancelable) {
      e.preventDefault();
    }

    const coords = getCoordinates(e);
    if (!coords) return;

    const updatedPath = {
      ...currentPathRef.current,
      points: [...currentPathRef.current.points, coords]
    };

    currentPathRef.current = updatedPath;

    setPaths(prev => {
      const next = [...prev];
      if (next.length > 0) {
        next[next.length - 1] = updatedPath;
      }
      return next;
    });
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    currentPathRef.current = null;
  };

  const handleUndo = () => {
    if (paths.length === 0) return;
    const itemToUndo = paths[paths.length - 1];
    setPaths(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, itemToUndo]);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const itemToRedo = redoStack[redoStack.length - 1];
    setRedoStack(prev => [...prev, itemToRedo]);
    setPaths(prev => [...prev, itemToRedo]);
  };

  const handleClear = () => {
    setPaths([]);
    setRedoStack([]);
    setIsConfirmingClear(false);
  };

  const handleSaveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (paths.length === 0) {
      onSave('', []);
      return;
    }

    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl, paths);
  };

  return (
    <div ref={containerRef} className="fixed inset-0 bg-zinc-50 dark:bg-zinc-950 z-[9999] flex overflow-hidden select-none">
      {/* Dynamic Background Dots Matrix Pattern for Sketchpad */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.12] dark:opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(#1e293b 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Borderless Canvas covering the WHOLE screen */}
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="absolute inset-0 z-10 bg-transparent cursor-crosshair touch-none"
      />

      {/* Floating Header Banner */}
      <div className="absolute top-4 left-4 z-40 flex items-center gap-3 px-4 py-2 bg-white/90 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl border border-zinc-200/60 dark:border-zinc-800 shadow-xl">
        <div className="p-1.5 bg-blue-500/10 rounded-xl text-blue-500">
          <Sparkles className="h-4.5 w-4.5" />
        </div>
        <div>
          <h3 className="font-extrabold text-zinc-900 dark:text-white text-xs">
            {isAr ? 'لوحة الرسم اللانهائية' : 'Infinite Board'}
          </h3>
          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold">
            {isAr ? 'ارسم بحرية كاملة دون حدود' : 'Sketch freely without bounds'}
          </p>
        </div>
      </div>

      {/* Help Tip Overlay (vanishes once user draws) */}
      {paths.length === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 text-center animate-pulse duration-1000">
          <Paintbrush className="h-10 w-10 mx-auto mb-2 text-zinc-300 dark:text-zinc-700 stroke-1" />
          <p className="text-xs font-bold text-zinc-405 dark:text-zinc-550">
            {isAr ? 'ارسم هنا بأصبعك أو الماوس' : 'Sketch here with touch or mouse'}
          </p>
        </div>
      )}

      {/* Floating Vertical Toolpack Sidebar stacked to the RIGHT side of the Screen */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-4.5 w-16 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg px-2.5 py-4.5 rounded-3xl border border-zinc-250/70 dark:border-zinc-800/80 shadow-2xl">
        
        {/* Safe Dismiss Close Symbol */}
        <button
          onClick={onCancel}
          className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-rose-500 transition-colors cursor-pointer"
          title={isAr ? 'إغلاق بدون حفظ' : 'Close without saving'}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="w-full h-px bg-zinc-150 dark:bg-zinc-800" />

        {/* Brush/Pen & Eraser Toggle (Stack Vertically) */}
        <div className="flex flex-col gap-1 w-full bg-zinc-100/80 dark:bg-zinc-950 p-1 rounded-xl">
          <button
            onClick={() => setIsEraser(false)}
            className={`p-2.5 rounded-lg flex justify-center cursor-pointer transition-all ${
              !isEraser
                ? 'bg-white dark:bg-zinc-800 shadow-sm text-blue-600 dark:text-blue-400'
                : 'text-zinc-500 dark:text-zinc-505 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
            title={isAr ? 'قلم الرسم' : 'Drawing Pen'}
          >
            <Paintbrush className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setIsEraser(true);
            }}
            className={`p-2.5 rounded-lg flex justify-center cursor-pointer transition-all ${
              isEraser
                ? 'bg-white dark:bg-zinc-800 shadow-sm text-rose-500 dark:text-rose-455'
                : 'text-zinc-500 dark:text-zinc-505 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
            title={isAr ? 'الممحاة' : 'Eraser'}
          >
            <Eraser className="h-4 w-4" />
          </button>
        </div>

        {/* Vertical Colors Palette (Rendered only when drawing tool resides) */}
        {!isEraser && (
          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-0.5 scrollbar-thin">
            {colors.slice(0, 8).map((c) => (
              <button
                key={c.value}
                onClick={() => setBrushColor(c.value)}
                style={{ backgroundColor: c.value }}
                className={`h-5 w-5 rounded-full border transition-transform cursor-pointer hover:scale-125 duration-100 ${
                  brushColor === c.value
                    ? 'ring-2 ring-blue-500 ring-offset-2 scale-110 border-transparent'
                    : 'border-zinc-300 dark:border-zinc-700'
                }`}
                title={isAr ? c.nameAR : c.nameEN}
              />
            ))}
          </div>
        )}

        <div className="w-full h-px bg-zinc-150 dark:bg-zinc-800" />

        {/* Width selectors: stacked vertically with increasing sizes */}
        <div className="flex flex-col items-center gap-2.5">
          {strokeSizes.map(s => (
            <button
              key={s.value}
              onClick={() => setBrushWidth(s.value)}
              className="group relative flex items-center justify-center cursor-pointer h-6 w-6"
              title={`${s.value}px`}
            >
              <div 
                style={{ width: `${Math.max(3, s.value / 1.5)}px`, height: `${Math.max(3, s.value / 1.5)}px` }}
                className={`rounded-full transition-all duration-150 ${
                  brushWidth === s.value 
                    ? 'bg-zinc-900 dark:bg-zinc-100 scale-125 ring-2 ring-blue-500/40 ring-offset-2' 
                    : 'bg-zinc-400 group-hover:bg-zinc-600 dark:bg-zinc-600 dark:group-hover:bg-zinc-400'
                }`}
              />
            </button>
          ))}
        </div>

        <div className="w-full h-px bg-zinc-150 dark:bg-zinc-800" />

        {/* Undo, Redo, and Clear Bin (Stack Vertically) */}
        <div className="flex flex-col gap-1.5 items-center">
          <button
            onClick={handleUndo}
            disabled={paths.length === 0}
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 dark:disabled:opacity-20 cursor-pointer"
            title={isAr ? 'تراجع' : 'Undo'}
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 dark:disabled:opacity-20 cursor-pointer"
            title={isAr ? 'إعادة' : 'Redo'}
          >
            <Redo2 className="h-4 w-4" />
          </button>

          {/* Wipe completely with state checking */}
          {!isConfirmingClear ? (
            <button
              onClick={() => setIsConfirmingClear(true)}
              disabled={paths.length === 0}
              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 disabled:opacity-30 cursor-pointer transition-colors"
              title={isAr ? 'مسح اللوحة' : 'Wipe board'}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleClear}
              onMouseLeave={() => setIsConfirmingClear(false)}
              className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center animate-bounce cursor-pointer scale-110 shadow-md shadow-rose-900/40"
              title={isAr ? 'تأكيد المسح!' : 'Confirm clear!'}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="w-full h-px bg-zinc-150 dark:bg-zinc-800 mt-auto" />

        {/* Prime Save Confirm Button */}
        <button
          onClick={handleSaveDrawing}
          className="w-11 h-11 bg-emerald-600 hover:bg-emerald-500 hover:scale-105 active:scale-95 text-white flex items-center justify-center rounded-2xl shadow-xl shadow-emerald-500/10 cursor-pointer transition-all"
          title={isAr ? 'تأكيد وحفظ الرسم' : 'Save sketch'}
        >
          <Save className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
