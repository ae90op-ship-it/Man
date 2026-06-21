export type CategoryKey = 'boy' | 'girl' | 'animal' | 'plant' | 'inanimate' | 'country' | 'food';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface CategoryInfo {
  key: CategoryKey;
  label: string;
  icon: string;
  placeholder: string;
}

export interface CategoryResult {
  valid: boolean;
  score: number;
  feedback: string;
}

export interface Round {
  id: string;
  letter: string;
  answers: Record<CategoryKey, string>;
  opponentAnswers?: Record<CategoryKey, string>;
  results?: Record<CategoryKey, CategoryResult>;
  opponentResults?: Record<CategoryKey, CategoryResult>;
  overallVerdict?: string;
  totalScore?: number;
  opponentTotalScore?: number;
  durationSeconds: number; // actual time spent in seconds
  createdAt: number;
}

export interface GameState {
  currentRound: {
    letter: string;
    answers: Record<CategoryKey, string>;
    opponentAnswers: Record<CategoryKey, string>;
    opponentProgress: Record<CategoryKey, 'idle' | 'typing' | 'done'>;
    dynamicPlaceholders: Record<CategoryKey, string>;
    difficulty: Difficulty;
    durationSeconds: number;
    status: 'idle' | 'spinning' | 'playing' | 'submitting' | 'reviewing';
  };
  roundsHistory: Round[];
}

export const ARABIC_LETTERS = [
  'أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي'
];

export const CATEGORIES: CategoryInfo[] = [
  { key: 'boy', label: 'ولد 🧑', icon: 'User', placeholder: 'مثال: أحمد، بدر، تامر...' },
  { key: 'girl', label: 'بنت 👧', icon: 'UserSquare2', placeholder: 'مثال: أمل، بسمة، تهاني...' },
  { key: 'animal', label: 'حيوان 🦁', icon: 'Rabbit', placeholder: 'مثال: أسد، بطة، تمساح...' },
  { key: 'plant', label: 'نبات 🌳', icon: 'Sprout', placeholder: 'مثال: أرز، برتقال، تفاح...' },
  { key: 'inanimate', label: 'جماد 🧱', icon: 'Boxes', placeholder: 'مثال: إبريق، باب، تلفاز...' },
  { key: 'country', label: 'بلاد/مدن 🗺️', icon: 'Globe', placeholder: 'مثال: ألمانيا، بغداد، تركيا...' },
  { key: 'food', label: 'أكلة/وجبة 🍲', icon: 'UtensilsCustom', placeholder: 'مثال: أرز بالعدس، بامية...' }
];
