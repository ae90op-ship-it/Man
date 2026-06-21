export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface DrawingPath {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  isEraser?: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  isChecklist: boolean;
  checklistItems: ChecklistItem[];
  color: string; // Background color class name (e.g., 'bg-amber-100 dark:bg-amber-950')
  isPinned: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  labels: string[]; // Label IDs
  drawingData: string | null; // Base64 drawing canvas PNG string
  drawingPaths?: DrawingPath[]; // Saved vector paths to enable re-editing the drawing
  images: string[]; // Base64 resized images
  imagePosition?: 'top' | 'bottom'; // Control image display placement
  imageSize?: 'small' | 'medium' | 'large'; // Control image container size scaling
  isTable?: boolean;
  tableData?: string[][]; // 2D array of grid cells (rows x columns)
  createdAt: number;
  updatedAt: number;
  reminder?: string; // Optional: ISO date string for reminder
  isLocked?: boolean; // Password protected note option
}

export interface Label {
  id: string;
  name: string;
}

export interface PaletteColor {
  id: string;
  nameAR: string;
  nameEN: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  darkBgClass: string;
  buttonColor: string;
}

export const NOTE_COLORS: PaletteColor[] = [
  {
    id: 'default',
    nameAR: 'تلقائي',
    nameEN: 'Default',
    bgClass: 'bg-white dark:bg-zinc-900',
    borderClass: 'border-zinc-200 dark:border-zinc-800',
    textClass: 'text-zinc-800 dark:text-zinc-200',
    darkBgClass: 'dark:bg-zinc-900',
    buttonColor: 'bg-zinc-200 dark:bg-zinc-700',
  },
  {
    id: 'black',
    nameAR: 'أسود',
    nameEN: 'Black',
    bgClass: 'bg-zinc-900 dark:bg-black text-white',
    borderClass: 'border-zinc-800 dark:border-zinc-950',
    textClass: 'text-zinc-100 dark:text-zinc-50',
    darkBgClass: 'dark:bg-black',
    buttonColor: 'bg-zinc-900 dark:bg-zinc-950 ring-1 ring-zinc-500/30',
  },
  {
    id: 'red',
    nameAR: 'أحمر',
    nameEN: 'Red',
    bgClass: 'bg-rose-50 dark:bg-rose-950/20',
    borderClass: 'border-rose-100 dark:border-rose-900/45',
    textClass: 'text-rose-900 dark:text-rose-200',
    darkBgClass: 'dark:bg-rose-950/20',
    buttonColor: 'bg-rose-300 dark:bg-rose-800',
  },
  {
    id: 'amber',
    nameAR: 'برتقالي',
    nameEN: 'Amber',
    bgClass: 'bg-amber-50 dark:bg-amber-950/20',
    borderClass: 'border-amber-100 dark:border-amber-900/45',
    textClass: 'text-amber-900 dark:text-amber-200',
    darkBgClass: 'dark:bg-amber-950/20',
    buttonColor: 'bg-amber-300 dark:bg-amber-800',
  },
  {
    id: 'yellow',
    nameAR: 'أصفر',
    nameEN: 'Yellow',
    bgClass: 'bg-yellow-50 dark:bg-yellow-950/20',
    borderClass: 'border-yellow-200 dark:border-yellow-900/45',
    textClass: 'text-yellow-900 dark:text-yellow-200',
    darkBgClass: 'dark:bg-yellow-950/20',
    buttonColor: 'bg-yellow-200 dark:bg-yellow-800',
  },
  {
    id: 'green',
    nameAR: 'أخضر',
    nameEN: 'Green',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/20',
    borderClass: 'border-emerald-100 dark:border-emerald-900/45',
    textClass: 'text-emerald-900 dark:text-emerald-200',
    darkBgClass: 'dark:bg-emerald-950/20',
    buttonColor: 'bg-emerald-300 dark:bg-emerald-800',
  },
  {
    id: 'teal',
    nameAR: 'فيروزي',
    nameEN: 'Teal',
    bgClass: 'bg-teal-50 dark:bg-teal-950/20',
    borderClass: 'border-teal-100 dark:border-teal-900/45',
    textClass: 'text-teal-900 dark:text-teal-200',
    darkBgClass: 'dark:bg-teal-950/20',
    buttonColor: 'bg-teal-300 dark:bg-teal-800',
  },
  {
    id: 'blue',
    nameAR: 'أزرق',
    nameEN: 'Blue',
    bgClass: 'bg-blue-50 dark:bg-blue-950/20',
    borderClass: 'border-blue-100 dark:border-blue-900/45',
    textClass: 'text-blue-900 dark:text-blue-200',
    darkBgClass: 'dark:bg-blue-950/20',
    buttonColor: 'bg-blue-300 dark:bg-blue-800',
  },
  {
    id: 'indigo',
    nameAR: 'كحلي',
    nameEN: 'Indigo',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/20',
    borderClass: 'border-indigo-100 dark:border-indigo-900/45',
    textClass: 'text-indigo-900 dark:text-indigo-200',
    darkBgClass: 'dark:bg-indigo-950/20',
    buttonColor: 'bg-indigo-300 dark:bg-indigo-800',
  },
  {
    id: 'purple',
    nameAR: 'بنفسجي',
    nameEN: 'Purple',
    bgClass: 'bg-purple-50 dark:bg-purple-950/20',
    borderClass: 'border-purple-100 dark:border-purple-900/45',
    textClass: 'text-purple-900 dark:text-purple-200',
    darkBgClass: 'dark:bg-purple-950/20',
    buttonColor: 'bg-purple-300 dark:bg-purple-800',
  },
  {
    id: 'pink',
    nameAR: 'وردي',
    nameEN: 'Pink',
    bgClass: 'bg-pink-50 dark:bg-pink-950/20',
    borderClass: 'border-pink-100 dark:border-pink-900/45',
    textClass: 'text-pink-900 dark:text-pink-200',
    darkBgClass: 'dark:bg-pink-950/20',
    buttonColor: 'bg-pink-300 dark:bg-pink-800',
  }
];
