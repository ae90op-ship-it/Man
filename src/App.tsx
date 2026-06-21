import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HelpCircle,
  Trophy,
  Sparkles,
  Volume2,
  VolumeX,
  Timer,
  ChevronLeft,
  BookOpen,
  Info,
  Play,
  Check,
  X,
  Dices,
  RotateCcw,
  Sliders,
  AlertCircle,
  Cpu,
  User,
  Lightbulb,
  Loader2,
  Users,
  Copy,
  LogOut,
  Medal,
  Award,
  Zap,
  CheckCircle2,
  Smartphone
} from 'lucide-react';

import { CATEGORIES, CategoryKey, Round, GameState, Difficulty, ARABIC_LETTERS } from './types';
import {
  generateId,
  startsWithLetter,
  setMuteState,
  getMuteState,
  playSuccessSound,
  playWrongSound,
  playTickSound
} from './utils';

import LetterSelector from './components/LetterSelector';
import TickingTimer from './components/TickingTimer';
import ResultsDashboard from './components/ResultsDashboard';
import RulesModal from './components/RulesModal';

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const BADGES_CONFIG: Badge[] = [
  { id: 'win_streak_5', title: 'بطل الانتصارات المتتالية 👑', description: 'التفوق والفوز بـ 5 جولات متتالية باللعبة', icon: '🔥' },
  { id: 'perfect_70', title: 'المكتشف الفصيح 🎯', description: 'الحصول على درجة كاملة 70/70 في جولة واحدة', icon: '💎' },
  { id: 'speed_demon', title: 'الصاروخ الخارق ⚡', description: 'إنهاء الحلول والضغط على STOP مع بقاء أكثر من 60 ثانية بالعداد', icon: '🚀' },
  { id: 'no_hints', title: 'العبقري المكتفي 🧠', description: 'الفوز بالمواجهة دون استخدام أي تلميحات مطلقاً', icon: '⭐' },
  { id: 'coin_150', title: 'صائد الثروات 🪙', description: 'تجميع والوصول إلى ما يزيد عن 150 نقطة في رصيدك', icon: '💰' },
  { id: 'veteran_10', title: 'شغف التحدي المستمر 🌟', description: 'خوض ولعب 10 جولات إجمالاً باللعبة', icon: '🏆' }
];

export interface PlayerInRoom {
  id: 'p1' | 'p2';
  name: string;
  answers: Record<CategoryKey, string>;
  isReady: boolean;
  hasSubmitted: boolean;
  score: number;
  results: any;
  overallVerdict: string;
}

export interface MultiplayerRoom {
  code: string;
  letter: string;
  difficulty: string;
  durationSeconds: number;
  status: 'lobby' | 'playing' | 'grading' | 'results';
  timerStartedAt: number | null;
  p1: PlayerInRoom | null;
  p2: PlayerInRoom | null;
  whoTriggeredStop: string | null;
  lastUpdated: number;
}

const TIMER_PRESETS = [
  { label: '60 ثانية (حماسي)', value: 60 },
  { label: '90 ثانية (معتدل)', value: 90 },
  { label: '120 ثانية (مهلة إضافية)', value: 120 },
  { label: 'مفتوح (دون وقت)', value: 0 }
];

const checkAndUnlockBadges = (
  history: Round[],
  points: number,
  unlockedList: string[],
  currentRoundData?: { totalScore: number; timerRemaining: number; hintsUsed: number; didWin: boolean }
) => {
  const newlyUnlocked: string[] = [];

  // 1. Streak 5 wins (consecutive rounds where player score > opponent score)
  if (!unlockedList.includes('win_streak_5') && history.length >= 5) {
    let currentStreak = 0;
    let maxStreak = 0;
    // Walk through history in chronological order (reverse of history array)
    const chronoHistory = [...history].reverse();
    for (const r of chronoHistory) {
      const pScore = r.totalScore || 0;
      const oScore = r.opponentTotalScore || 0;
      if (pScore > oScore) {
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    }
    if (maxStreak >= 5) {
      newlyUnlocked.push('win_streak_5');
    }
  }

  // 2. Perfect score
  if (!unlockedList.includes('perfect_70')) {
    const hasPerfect = history.some(r => r.totalScore === 70) || (currentRoundData && currentRoundData.totalScore === 70);
    if (hasPerfect) newlyUnlocked.push('perfect_70');
  }

  // 3. Speed Demon
  if (!unlockedList.includes('speed_demon') && currentRoundData && currentRoundData.timerRemaining > 60 && currentRoundData.totalScore > 0) {
    newlyUnlocked.push('speed_demon');
  }

  // 4. No hints
  if (!unlockedList.includes('no_hints') && currentRoundData && currentRoundData.didWin && currentRoundData.hintsUsed === 0) {
    newlyUnlocked.push('no_hints');
  }

  // 5. Coin 150
  if (!unlockedList.includes('coin_150') && points >= 150) {
    newlyUnlocked.push('coin_150');
  }

  // 6. Veteran 10 total played
  if (!unlockedList.includes('veteran_10') && history.length >= 10) {
    newlyUnlocked.push('veteran_10');
  }

  return newlyUnlocked;
};

export default function App() {
  // Game states
  const [gameState, setGameState] = useState<GameState>(() => {
    return {
      currentRound: {
        letter: '',
        answers: { boy: '', girl: '', animal: '', plant: '', inanimate: '', country: '', food: '' },
        opponentAnswers: { boy: '', girl: '', animal: '', plant: '', inanimate: '', country: '', food: '' },
        opponentProgress: { boy: 'idle', girl: 'idle', animal: 'idle', plant: 'idle', inanimate: 'idle', country: 'idle', food: 'idle' },
        dynamicPlaceholders: { boy: '', girl: '', animal: '', plant: '', inanimate: '', country: '', food: '' },
        difficulty: 'medium',
        durationSeconds: 0,
        status: 'idle'
      },
      roundsHistory: []
    };
  });

  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const [timerMaxSeconds, setTimerMaxSeconds] = useState<number>(90);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(90);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  // Game coins/points & Hints mechanics
  const HINT_COST_POINTS = 20;
  const [userPoints, setUserPoints] = useState<number>(() => {
    const saved = localStorage.getItem('stop_game_user_points');
    return saved ? parseInt(saved, 10) : 100; // start with more coins for multiplayer support and higher hint price!
  });

  // Badges system local states
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>(() => {
    const saved = localStorage.getItem('stop_game_unlocked_badges');
    return saved ? JSON.parse(saved) : [];
  });
  const [badgeToasts, setBadgeToasts] = useState<Badge[]>([]);

  // Local Multiplayer States
  const [multiplayerMode, setMultiplayerMode] = useState<boolean>(false);
  const [multiplayerRoom, setMultiplayerRoom] = useState<MultiplayerRoom | null>(null);
  const [playerId, setPlayerId] = useState<'p1' | 'p2' | null>(null);
  const [roomCode, setRoomCode] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>(() => {
    const saved = localStorage.getItem('stop_game_player_name');
    return saved || 'بطل الحروف ' + Math.floor(1000 + Math.random() * 9000);
  });
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [isLoadingRoom, setIsLoadingRoom] = useState<boolean>(false);
  const [multiplayerError, setMultiplayerError] = useState<string | null>(null);

  const [hintErrorCategory, setHintErrorCategory] = useState<Record<CategoryKey, string | null>>({
    boy: null, girl: null, animal: null, plant: null, inanimate: null, country: null, food: null
  });

  // Modals
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isApiKeyActive, setIsApiKeyActive] = useState<boolean | null>(null);

  // Dynamic hints database state for the current active round
  const [hints, setHints] = useState<Record<CategoryKey, { word: string; loading: boolean }>>({
    boy: { word: '', loading: false },
    girl: { word: '', loading: false },
    animal: { word: '', loading: false },
    plant: { word: '', loading: false },
    inanimate: { word: '', loading: false },
    country: { word: '', loading: false },
    food: { word: '', loading: false }
  });

  // AI Opponent simulation live status states
  const [opponentProgress, setOpponentProgress] = useState<Record<CategoryKey, 'idle' | 'typing' | 'done'>>({
    boy: 'idle', girl: 'idle', animal: 'idle', plant: 'idle', inanimate: 'idle', country: 'idle', food: 'idle'
  });
  const [opponentAnswers, setOpponentAnswers] = useState<Record<CategoryKey, string>>({
    boy: '', girl: '', animal: '', plant: '', inanimate: '', country: '', food: ''
  });
  const [dynamicPlaceholders, setDynamicPlaceholders] = useState<Record<CategoryKey, string>>({
    boy: '', girl: '', animal: '', plant: '', inanimate: '', country: '', food: ''
  });

  // Loading states message carousel
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const loadingMessages = [
    'جاري استدعاء الحكم جيميناي للفصل في المعاني اللغوية بينك وبين الخصم...',
    'الذكاء الاصطناعي يراجع إجاباتك وإجابات الخصم في القواميس والمعاجم...',
    'الحكم التلقائي الذكي يقيّم البدايات ويوزّع الدرجات بعدالة صارمة...',
    'فحص شامل للمأكولات والجمادات والبلدان التراثية بين الخصمين...',
    'توليد النتيجة الفورية واحتساب من سيفوز بكأس الجولة الحالية...'
  ];

  // Store total time spent in this round
  const [actualTimeElapsed, setActualTimeElapsed] = useState(0);

  // References and timers
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const opponentTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load history on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('stop_game_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setGameState(prev => ({
          ...prev,
          roundsHistory: parsed
        }));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    const savedMuted = localStorage.getItem('stop_game_muted') === 'true';
    setIsMuted(savedMuted);
    setMuteState(savedMuted);

    // Warm up/check if API configuration exists on the server side
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ letter: 'أ', answers: {} })
      });
      const data = await res.json();
      setIsApiKeyActive(!data.fallback);
    } catch {
      setIsApiKeyActive(false);
    }
  };

  const triggerBadgeToast = (badge: Badge) => {
    setBadgeToasts(prev => [...prev, badge]);
    playSuccessSound();
    setTimeout(() => {
      setBadgeToasts(prev => prev.filter(b => b.id !== badge.id));
    }, 5500);
  };

  // Create Room
  const handleCreateRoom = async () => {
    if (!playerName) return;
    setIsLoadingRoom(true);
    setMultiplayerError(null);
    try {
      const res = await fetch('/api/multiplayer/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName, difficulty: selectedDifficulty, durationSeconds: timerMaxSeconds })
      });
      if (!res.ok) throw new Error("فشل إنشاء الغرفة بالخادم.");
      const data = await res.json();
      if (data.success) {
        setRoomCode(data.room.code);
        setPlayerId('p1');
        setMultiplayerRoom(data.room);
        setMultiplayerMode(true);
      } else {
        throw new Error(data.error || "خطأ غير معروف");
      }
    } catch (e: any) {
      setMultiplayerError(e.message);
    } finally {
      setIsLoadingRoom(false);
    }
  };

  // Join Room
  const handleJoinRoom = async () => {
    const trimmedCode = joinCodeInput.trim();
    if (!trimmedCode || !playerName) return;
    setIsLoadingRoom(true);
    setMultiplayerError(null);
    try {
      const res = await fetch('/api/multiplayer/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmedCode, name: playerName })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "كود الغرفة غير صحيح أو ممتلئة.");
      }
      const data = await res.json();
      if (data.success) {
        setRoomCode(trimmedCode);
        setPlayerId('p2');
        setMultiplayerRoom(data.room);
        setMultiplayerMode(true);
      }
    } catch (e: any) {
      setMultiplayerError(e.message);
    } finally {
      setIsLoadingRoom(false);
    }
  };

  // Start Multiplayer Round as P1 (Host)
  const handleMultiplayerStart = async () => {
    if (!roomCode) return;
    setIsTimerActive(false);
    const randomLetter = ARABIC_LETTERS[Math.floor(Math.random() * ARABIC_LETTERS.length)];
    try {
      await fetch('/api/multiplayer/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: roomCode,
          letter: randomLetter,
          difficulty: selectedDifficulty,
          durationSeconds: timerMaxSeconds
        })
      });
    } catch (err) {
      console.error("Failed to trigger start on server:", err);
    }
  };

  // Submit Multiplayer answers
  const handleMultiplayerSubmit = async (isTriggerStop = true) => {
    if (!roomCode || !playerId) return;
    setIsTimerActive(false);
    try {
      await fetch('/api/multiplayer/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: roomCode,
          playerId,
          answers: gameState.currentRound.answers,
          isTriggerStop
        })
      });
    } catch (err) {
      console.error("Failed to submit answers to room:", err);
    }
  };

  // Restart Lobby
  const handleMultiplayerRestart = async () => {
    if (!roomCode) return;
    try {
      await fetch('/api/multiplayer/restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: roomCode })
      });
    } catch (err) {
      console.error("Failed to restart room:", err);
    }
  };

  const handleExitMultiplayer = () => {
    setMultiplayerMode(false);
    setRoomCode('');
    setPlayerId(null);
    setMultiplayerRoom(null);
    handleRestart(); // reset to clear fields and idle status
  };

  // Save Player Name preference
  const handleSavePlayerName = (name: string) => {
    setPlayerName(name);
    localStorage.setItem('stop_game_player_name', name);
  };

  // Multiplayer Polling Loop
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (multiplayerMode && roomCode && playerId) {
      const poll = async () => {
        try {
          const res = await fetch(`/api/multiplayer/state?code=${roomCode}&playerId=${playerId}`);
          if (!res.ok) {
            throw new Error("حدث خطأ أثناء التزامن اللحظي مع الغرفة.");
          }
          const data = await res.json();
          if (data.success && data.room) {
            const room: MultiplayerRoom = data.room;
            setMultiplayerRoom(room);
            setMultiplayerError(null);

            // 1. Sync PLAYING
            if (room.status === 'playing') {
              if (gameState.currentRound.status !== 'playing') {
                playSuccessSound();
                setGameState(prev => ({
                  ...prev,
                  currentRound: {
                    ...prev.currentRound,
                    letter: room.letter,
                    difficulty: room.difficulty as Difficulty,
                    status: 'playing',
                    answers: { boy: '', girl: '', animal: '', plant: '', inanimate: '', country: '', food: '' }
                  }
                }));

                if (room.timerStartedAt) {
                  const elapsed = Math.floor((Date.now() - room.timerStartedAt) / 1000);
                  const remaining = Math.max(0, room.durationSeconds - elapsed);
                  setSecondsRemaining(remaining);
                  setTimerMaxSeconds(room.durationSeconds);
                  setIsTimerActive(room.durationSeconds > 0);
                  setActualTimeElapsed(elapsed);
                }
              } else {
                if (room.whoTriggeredStop) {
                  setIsTimerActive(false);
                }
              }
            }
            // 2. Sync GRADING
            else if (room.status === 'grading') {
              if (gameState.currentRound.status !== 'submitting') {
                setIsTimerActive(false);
                setGameState(prev => ({
                  ...prev,
                  currentRound: {
                    ...prev.currentRound,
                    status: 'submitting'
                  }
                }));
              }
            }
            // 3. Sync RESULTS
            else if (room.status === 'results') {
              if (gameState.currentRound.status !== 'reviewing') {
                setIsTimerActive(false);
                setGameState(prev => ({
                  ...prev,
                  currentRound: {
                    ...prev.currentRound,
                    status: 'reviewing'
                  }
                }));

                // Award points & run Badging System on results sync
                const me = playerId === 'p1' ? room.p1 : room.p2;
                const opp = playerId === 'p1' ? room.p2 : room.p1;
                if (me && opp) {
                  const gained = me.score > opp.score ? 50 : me.score === opp.score ? 15 : 0;
                  const nextPoints = userPoints + gained;
                  if (gained > 0) {
                    setUserPoints(nextPoints);
                    localStorage.setItem('stop_game_user_points', nextPoints.toString());
                  }

                  // Build local history item to persist progress
                  const customRound: Round = {
                    id: generateId(),
                    letter: room.letter,
                    answers: me.answers,
                    opponentAnswers: opp.answers,
                    results: me.results,
                    opponentResults: opp.results,
                    overallVerdict: me.overallVerdict,
                    totalScore: me.score,
                    opponentTotalScore: opp.score,
                    durationSeconds: Math.floor((Date.now() - (room.timerStartedAt || Date.now())) / 1000),
                    createdAt: Date.now()
                  };

                  const updatedHistory = [customRound, ...gameState.roundsHistory];
                  localStorage.setItem('stop_game_history', JSON.stringify(updatedHistory));
                  setGameState(prev => ({ ...prev, roundsHistory: updatedHistory }));

                  // Badge evaluations
                  const newlyUnlocked = checkAndUnlockBadges(
                    updatedHistory,
                    nextPoints,
                    unlockedBadges,
                    {
                      totalScore: me.score,
                      timerRemaining: 0,
                      hintsUsed: 0,
                      didWin: me.score > opp.score
                    }
                  );
                  if (newlyUnlocked.length > 0) {
                    const merged = [...unlockedBadges, ...newlyUnlocked];
                    setUnlockedBadges(merged);
                    localStorage.setItem('stop_game_unlocked_badges', JSON.stringify(merged));
                    newlyUnlocked.forEach(badgeId => {
                      const bConf = BADGES_CONFIG.find(bc => bc.id === badgeId);
                      if (bConf) triggerBadgeToast(bConf);
                    });
                  }
                }
              }
            }
            // 4. Reset back to LOBBY
            else if (room.status === 'lobby') {
              if (gameState.currentRound.status !== 'idle') {
                setGameState(prev => ({
                  ...prev,
                  currentRound: {
                    ...prev.currentRound,
                    status: 'idle',
                    letter: '',
                    answers: { boy: '', girl: '', animal: '', plant: '', inanimate: '', country: '', food: '' }
                  }
                }));
              }
            }
          }
        } catch (e: any) {
          console.error("Multiplayer polling sync error:", e);
          setMultiplayerError(e.message);
        }
      };

      poll();
      intervalId = setInterval(poll, 1500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [multiplayerMode, roomCode, playerId, gameState.currentRound.status, unlockedBadges, userPoints]);

  // Timer interval processor
  useEffect(() => {
    if (isTimerActive) {
      timerIntervalRef.current = setInterval(() => {
        setActualTimeElapsed(prev => prev + 1);

        if (timerMaxSeconds > 0) {
          setSecondsRemaining(prev => {
            if (prev <= 1) {
              setIsTimerActive(false);
              handleTriggerStop(); // Times up - STOP!
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerActive, timerMaxSeconds]);

  // AI Opponent Simulated live typing timeline effect
  useEffect(() => {
    const activeRound = gameState.currentRound;

    if (activeRound.status === 'playing') {
      // Reset hints too
      setHints({
        boy: { word: '', loading: false },
        girl: { word: '', loading: false },
        animal: { word: '', loading: false },
        plant: { word: '', loading: false },
        inanimate: { word: '', loading: false },
        country: { word: '', loading: false },
        food: { word: '', loading: false }
      });

      // Reset internal simulation states
      setOpponentProgress({
        boy: 'idle', girl: 'idle', animal: 'idle', plant: 'idle', inanimate: 'idle', country: 'idle', food: 'idle'
      });
      setOpponentAnswers({
        boy: '', girl: '', animal: '', plant: '', inanimate: '', country: '', food: ''
      });
      setDynamicPlaceholders({
        boy: '', girl: '', animal: '', plant: '', inanimate: '', country: '', food: ''
      });

      // Call express API to get placeholders and opponent target plays
      const setupOpponentGameInfo = async () => {
        try {
          const res = await fetch('/api/opponent-and-placeholders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ letter: activeRound.letter, difficulty: selectedDifficulty })
          });
          const data = await res.json();

          if (data.dynamicPlaceholders) {
            setDynamicPlaceholders(data.dynamicPlaceholders);
          }

          const targetAnswers = data.opponentAnswers || {};

          // Filter out categories that are kept empty based on selected difficulty target logic
          const categoriesToFill = CATEGORIES.filter(cat => targetAnswers[cat.key] && targetAnswers[cat.key].trim() !== '')
            .map(cat => cat.key);

          let currentIdx = 0;
          let typingStage: 'typing' | 'done' = 'typing';

          // Typing speeds depend strongly on selected AI opponent difficulty
          const speedStep = selectedDifficulty === 'hard' ? 1200 : selectedDifficulty === 'medium' ? 2400 : 4500;

          opponentTimerRef.current = setInterval(() => {
            if (currentIdx >= categoriesToFill.length) {
              if (opponentTimerRef.current) clearInterval(opponentTimerRef.current);
              return;
            }

            const targetCategory = categoriesToFill[currentIdx];

            if (typingStage === 'typing') {
              setOpponentProgress(prev => ({ ...prev, [targetCategory]: 'typing' }));
              typingStage = 'done';
            } else {
              setOpponentProgress(prev => ({ ...prev, [targetCategory]: 'done' }));
              setOpponentAnswers(prev => ({ ...prev, [targetCategory]: targetAnswers[targetCategory] }));
              typingStage = 'typing';
              currentIdx++;
            }
          }, speedStep);

        } catch (err) {
          console.error("Failed to fetch opponent configuration", err);
        }
      };

      setupOpponentGameInfo();

    } else {
      if (opponentTimerRef.current) clearInterval(opponentTimerRef.current);
    }

    return () => {
      if (opponentTimerRef.current) clearInterval(opponentTimerRef.current);
    };
  }, [gameState.currentRound.status, gameState.currentRound.letter, selectedDifficulty]);

  // Loading carousel loop
  useEffect(() => {
    if (gameState.currentRound.status === 'submitting') {
      setLoadingMsgIdx(0);
      loadingIntervalRef.current = setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % loadingMessages.length);
      }, 2500);
    } else {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    }
    return () => {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    };
  }, [gameState.currentRound.status]);

  // Actions
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    setMuteState(nextMuted);
    localStorage.setItem('stop_game_muted', nextMuted ? 'true' : 'false');
  };

  const startSetup = () => {
    setGameState(prev => ({
      ...prev,
      currentRound: {
        letter: '',
        answers: { boy: '', girl: '', animal: '', plant: '', inanimate: '', country: '', food: '' },
        opponentAnswers: { boy: '', girl: '', animal: '', plant: '', inanimate: '', country: '', food: '' },
        opponentProgress: { boy: 'idle', girl: 'idle', animal: 'idle', plant: 'idle', inanimate: 'idle', country: 'idle', food: 'idle' },
        dynamicPlaceholders: { boy: '', girl: '', animal: '', plant: '', inanimate: '', country: '', food: '' },
        difficulty: selectedDifficulty,
        durationSeconds: 0,
        status: 'spinning'
      }
    }));
  };

  const handleLetterSelected = (letter: string) => {
    setSecondsRemaining(timerMaxSeconds);
    setActualTimeElapsed(0);
    setGameState(prev => ({
      ...prev,
      currentRound: {
        ...prev.currentRound,
        letter,
        status: 'playing'
      }
    }));
    setIsTimerActive(true);
  };

  const handleAnswerChange = (category: CategoryKey, value: string) => {
    setGameState(prev => ({
      ...prev,
      currentRound: {
        ...prev.currentRound,
        answers: {
          ...prev.currentRound.answers,
          [category]: value
        }
      }
    }));
  };

  // Fetch word suggest hint from express server
  const handleRequestHint = async (category: CategoryKey) => {
    if (hints[category].loading || hints[category].word) return;

    if (userPoints < HINT_COST_POINTS) {
      setHintErrorCategory(prev => ({
        ...prev,
        [category]: `تحتاج إلى ${HINT_COST_POINTS} نقاط! فُز في الجولات لكسب النقاط ⭐️`
      }));
      playWrongSound();
      setTimeout(() => {
        setHintErrorCategory(prev => ({
          ...prev,
          [category]: null
        }));
      }, 4000);
      return;
    }

    // Deduct coins/points
    const nextPoints = userPoints - HINT_COST_POINTS;
    setUserPoints(nextPoints);
    localStorage.setItem('stop_game_user_points', nextPoints.toString());

    setHints(prev => ({
      ...prev,
      [category]: { ...prev[category], loading: true }
    }));

    try {
      const res = await fetch('/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ letter: gameState.currentRound.letter, category })
      });
      const data = await res.json();
      
      // Clean word in case it has prefix words
      const cleanedHintWord = (data.hint || 'لا توجد فكرة صالحة مسبقاً')
        .replace(/^(مثل|مثال|مثال ذلك|مثلاً)\s*[:\-]?\s*/, '')
        .trim();

      setHints(prev => ({
        ...prev,
        [category]: { word: cleanedHintWord, loading: false }
      }));
      playSuccessSound();
    } catch (err) {
      console.error(err);
      setHints(prev => ({
        ...prev,
        [category]: { word: 'تلميح محلي البدء بحرف ' + gameState.currentRound.letter, loading: false }
      }));
    }
  };

  // Submit and grade with parallel referee judging for both Player and Opposition
  const handleTriggerStop = async () => {
    if (multiplayerMode) {
      handleMultiplayerSubmit(true);
      return;
    }

    setIsTimerActive(false);
    if (opponentTimerRef.current) clearInterval(opponentTimerRef.current);

    setGameState(prev => ({
      ...prev,
      currentRound: {
        ...prev.currentRound,
        status: 'submitting'
      }
    }));

    const roundData = gameState.currentRound;
    
    try {
      // Parallel grading of both Player and AI Opponent outputs
      const [playerRes, opponentRes] = await Promise.all([
        fetch('/api/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ letter: roundData.letter, answers: roundData.answers })
        }).then(r => r.json()),

        fetch('/api/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ letter: roundData.letter, answers: opponentAnswers })
        }).then(r => r.json())
      ]);

      // Compile completed round information
      const completedRound: Round = {
        id: generateId(),
        letter: roundData.letter,
        answers: roundData.answers,
        opponentAnswers: opponentAnswers,
        results: playerRes.results,
        opponentResults: opponentRes.results,
        overallVerdict: playerRes.overallVerdict,
        totalScore: playerRes.totalScore,
        opponentTotalScore: opponentRes.totalScore,
        durationSeconds: actualTimeElapsed,
        createdAt: Date.now()
      };

      // Play victory sound or default feedback and calculate earned points
      const pScore = completedRound.totalScore || 0;
      const oScore = completedRound.opponentTotalScore || 0;
      const isWinner = pScore > oScore;
      const isTiePlayer = pScore === oScore;

      let earnedPoints = 0;
      if (isWinner) {
        earnedPoints = 50;
        playSuccessSound();
      } else if (isTiePlayer && pScore > 0) {
        earnedPoints = 15;
        playSuccessSound();
      } else {
        playWrongSound();
      }

      let nextPoints = userPoints;
      if (earnedPoints > 0) {
        nextPoints = userPoints + earnedPoints;
        setUserPoints(nextPoints);
        localStorage.setItem('stop_game_user_points', nextPoints.toString());
      }

      const updatedHistory = [completedRound, ...gameState.roundsHistory];
      localStorage.setItem('stop_game_history', JSON.stringify(updatedHistory));

      // Badges check & notification trigger
      try {
        const hintsUsed = Object.values(hints).filter(h => h.word && h.word.length > 0).length;
        const newlyUnlocked = checkAndUnlockBadges(
          updatedHistory,
          nextPoints,
          unlockedBadges,
          {
            totalScore: pScore,
            timerRemaining: secondsRemaining,
            hintsUsed,
            didWin: isWinner
          }
        );
        if (newlyUnlocked.length > 0) {
          const merged = [...unlockedBadges, ...newlyUnlocked];
          setUnlockedBadges(merged);
          localStorage.setItem('stop_game_unlocked_badges', JSON.stringify(merged));
          newlyUnlocked.forEach(badgeId => {
            const bConf = BADGES_CONFIG.find(bc => bc.id === badgeId);
            if (bConf) {
              triggerBadgeToast(bConf);
            }
          });
        }
      } catch (be) {
        console.error("Badges check failed:", be);
      }

      setGameState(prev => ({
        ...prev,
        roundsHistory: updatedHistory,
        currentRound: {
          ...prev.currentRound,
          status: 'reviewing'
        }
      }));

    } catch (err) {
      console.error("Grading failed completely:", err);
      // Fail gracefully back to beginning setup
      setGameState(prev => ({
        ...prev,
        currentRound: {
          ...prev.currentRound,
          status: 'idle'
        }
      }));
    }
  };

  const handleRestart = () => {
    setGameState(prev => ({
      ...prev,
      currentRound: {
        letter: '',
        answers: { boy: '', girl: '', animal: '', plant: '', inanimate: '', country: '', food: '' },
        opponentAnswers: { boy: '', girl: '', animal: '', plant: '', inanimate: '', country: '', food: '' },
        opponentProgress: { boy: 'idle', girl: 'idle', animal: 'idle', plant: 'idle', inanimate: 'idle', country: 'idle', food: 'idle' },
        dynamicPlaceholders: { boy: '', girl: '', animal: '', plant: '', inanimate: '', country: '', food: '' },
        difficulty: selectedDifficulty,
        durationSeconds: 0,
        status: 'idle'
      }
    }));
  };

  const handleClearHistory = () => {
    localStorage.removeItem('stop_game_history');
    setGameState(prev => ({
      ...prev,
      roundsHistory: []
    }));
  };

  const activeRound = gameState.currentRound;
  const isFilledCount = (Object.values(activeRound.answers) as string[]).filter(v => v.trim().length > 0).length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors duration-200">
      
      {/* ----------------- TOP NAVBAR HEADER ----------------- */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 shadow-xs" dir="rtl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-amber-500 rounded-2xl flex items-center justify-center text-white font-extrabold shadow-md shadow-amber-500/25">
            <Trophy className="h-5.5 w-5.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase font-mono bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded border border-amber-200/40 select-none">
                تحدي الخبراء والذكاء
              </span>
            </div>
            <h1 className="font-extrabold text-zinc-900 dark:text-white text-sm sm:text-base tracking-tight mt-0.5">
              لعبة جماد حيوان نبات ضد الذكاء الاصطناعي 🦁🤖
            </h1>
          </div>
        </div>

        {/* Global actions: Audio, Rules, Points */}
        <div className="flex items-center gap-2">
          {/* Points Wallet */}
          <div className="flex items-center gap-1 bg-amber-500/10 dark:bg-amber-550/15 border border-amber-500/20 px-3 py-1.5 rounded-xl text-xs font-black text-amber-700 dark:text-amber-400 select-none">
            <span>رصيدك:</span>
            <span className="font-mono text-xs font-black bg-amber-500/20 px-1.5 rounded-md text-amber-600 dark:text-amber-300">🪙 {userPoints}</span>
          </div>

          {isApiKeyActive !== null && (
            <div 
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                isApiKeyActive 
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/15'
                  : 'bg-zinc-500/10 text-zinc-500 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <div className={`h-2 w-2 rounded-full ${isApiKeyActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
              <span>{isApiKeyActive ? "الذكاء الاصطناعي نشط" : "تقييم محلي كلاسيكي"}</span>
            </div>
          )}

          <button
            onClick={toggleMute}
            className="p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all cursor-pointer text-zinc-650 dark:text-zinc-200"
            title={isMuted ? 'تشغيل المؤثرات الصوتية' : 'كتم كلي للصوت'}
          >
            {isMuted ? <VolumeX className="h-4.5 w-4.5" /> : <Volume2 className="h-4.5 w-4.5" />}
          </button>

          <button
            onClick={() => setIsRulesOpen(true)}
            className="p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all cursor-pointer text-zinc-650 dark:text-zinc-200 font-black flex items-center gap-1 text-xs"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden md:inline">قواعد اللعب</span>
          </button>
        </div>
      </header>

      {/* ---------------- centrale viewport board ----------------- */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col justify-center">

        <AnimatePresence mode="wait">
          
          {/* STATE 1: IDLE / SETTINGS */}
          {activeRound.status === 'idle' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
              dir="rtl"
            >
              {/* Feature Hero banner */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xl text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col items-center">
                  <div className="p-4 bg-amber-500 text-white rounded-3xl mb-4 shadow-xl shadow-amber-500/20">
                    <Sparkles className="h-8 w-8 text-white-505" />
                  </div>
                  
                  <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white">تحدي جماد حيوان نبات ضد جيميناي! 🤖🧬</h2>
                  <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-350 max-w-xl mt-2 leading-relaxed font-semibold">
                    الآن بنظام الخصوم التفاعلي والحلول الإرشادية الفورية. اختر مستوى ذكاء خصمك الآلي، واحصل على تلميحات ذكية أثناء اللعب لمنافسة الخصم وهزيمته بضربة القاضية!
                  </p>
                </div>
              </div>

              {/* Preferences Settings Module */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-850 pb-3">
                  <Sliders className="h-4.5 w-4.5 text-amber-500" />
                  <h3 className="text-sm font-black text-zinc-900 dark:text-white">خيارات حدّ المؤقت</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {TIMER_PRESETS.map((p) => {
                    const isSelected = timerMaxSeconds === p.value;
                    return (
                      <button
                        key={p.value}
                        onClick={() => {
                          setTimerMaxSeconds(p.value);
                          setSecondsRemaining(p.value);
                          playTickSound();
                        }}
                        className={`py-3 px-4 rounded-2xl text-xs font-black border transition-all active:scale-95 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/15'
                            : 'bg-zinc-55 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-zinc-650'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AI Opponent Difficulty Selector */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <Cpu className="h-4.5 w-4.5 text-amber-500" />
                  <h3 className="text-sm font-black text-zinc-900 dark:text-white">صعوبة ذكاء الخصم الآلي 🤖</h3>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {(['easy', 'medium', 'hard'] as const).map((diff) => {
                    const isSelected = selectedDifficulty === diff;
                    const labels = {
                      easy: 'سهل 🐢 (3-4 فئات)',
                      medium: 'متوسط 🦊 (5-6 فئات)',
                      hard: 'صعب قوي 🦁 (كل الفئات!)'
                    };
                    return (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => {
                          setSelectedDifficulty(diff);
                          playTickSound();
                        }}
                        className={`py-3.5 px-4 rounded-2xl text-[11px] font-black border transition-all active:scale-95 cursor-pointer text-center ${
                          isSelected
                            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-md'
                            : 'bg-zinc-55 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-zinc-650'
                        }`}
                      >
                        {labels[diff]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start game trigger */}
              <div className="flex justify-center pt-2">
                <button
                  onClick={startSetup}
                  className="flex items-center gap-2.5 py-4 px-10 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-amber-500/25 hover:shadow-amber-500/35 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
                >
                  <Play className="h-5 w-5 fill-white" />
                  <span>بدء الجولة المنافسة 🎮</span>
                </button>
              </div>

              {/* Quick info advisory */}
              <div className="bg-emerald-500/5 border border-emerald-500/15 p-4 rounded-2xl flex gap-3 text-xs text-emerald-600 dark:text-emerald-450 leading-relaxed max-w-2xl mx-auto items-start">
                <Info className="h-4 w-4 stroke-[2.2] shrink-0 mt-0.5" />
                <p>
                  <strong>قواعد المواجهة:</strong> عند دوران روليت اختيار الحرف وبداية اللعب، سيقوم الخصم الآلي بمنافستك وتعبئة كلماته تدريجياً حسب مستوى ذكائه المختار! يمكنك الضغط على "تلميح 💡" إذا صعبت عليك كلمة لمعاونتك فورياً.
                </p>
              </div>
            </motion.div>
          )}

          {/* STATE 2: SPINNING FOR A LETTER */}
          {activeRound.status === 'spinning' && (
            <motion.div
              key="letter-spin"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full mx-auto"
            >
              <div className="mb-4">
                <button
                  onClick={handleRestart}
                  className="text-xs text-zinc-400 hover:text-zinc-650 flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>العودة للشاشة الرئيسية</span>
                </button>
              </div>

              <LetterSelector onLetterSelected={handleLetterSelected} />
            </motion.div>
          )}

          {/* STATE 3: PLAYING (TYPING UNDER PRESSURE) */}
          {activeRound.status === 'playing' && (
            <motion.div
              key="gameplay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
              dir="rtl"
            >
              {/* Letter Title, Timer control info */}
              <div className="flex flex-col sm:flex-row gap-4 items-stretch justify-between">
                
                {/* Big Letter indicator */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 flex items-center gap-4 shadow-md pr-6">
                  <div className="h-14 w-14 rounded-2xl bg-amber-500 text-white font-black text-3xl flex items-center justify-center shadow-lg shadow-amber-500/20 animate-pulse">
                    {activeRound.letter}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-zinc-900 dark:text-white">جولة حرف "{activeRound.letter}"</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">اكتب بسرعة قبل أن يُنهي الخصم كلماته!</p>
                  </div>
                </div>

                {/* Standard timer component */}
                <div className="flex-1 max-w-sm">
                  <TickingTimer
                    secondsRemaining={secondsRemaining}
                    maxSeconds={timerMaxSeconds}
                    isActive={isTimerActive}
                    onTimeUp={handleTriggerStop}
                    isMuted={isMuted}
                  />
                </div>

              </div>

              {/* Real-time AI Opponent Typing status monitor */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-3xl p-5 shadow-lg">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
                    <h3 className="text-xs font-black text-zinc-900 dark:text-white">لوحة ووضعية الخصم الآلي المنافس 🤖</h3>
                  </div>
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-extrabold px-3 py-0.5 rounded-full border border-amber-250/20">
                    الذكاء: {selectedDifficulty === 'easy' ? 'سهل 🐢' : selectedDifficulty === 'medium' ? 'متوسط 🦊' : 'صعب 🦁'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                  {CATEGORIES.map((cat) => {
                    const status = opponentProgress[cat.key] || 'idle';
                    let label = '💤 في الانتظار';
                    let style = 'bg-zinc-50 dark:bg-zinc-950/40 text-zinc-400 border-zinc-200 dark:border-zinc-805';
                    if (status === 'typing') {
                      label = '✍️ يكتب الآن...';
                      style = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse font-bold';
                    } else if (status === 'done') {
                      label = '✅ جاهز!';
                      style = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/30 font-bold';
                    }

                    return (
                      <div key={cat.key} className={`p-2 rounded-xl border text-center flex flex-col justify-between h-14 ${style}`}>
                        <span className="text-[9px] font-black">{cat.label}</span>
                        <span className="text-[10px] font-bold block mt-1">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Categorized Inputs Board */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CATEGORIES.map((cat, index) => {
                  const val = activeRound.answers[cat.key] || '';
                  const isValidStart = val.trim().length > 0 && startsWithLetter(val, activeRound.letter);
                  const isWrongStart = val.trim().length > 0 && !startsWithLetter(val, activeRound.letter);
                  
                  const rawPlaceholder = dynamicPlaceholders[cat.key] || cat.placeholder;
                  const placeholderExample = rawPlaceholder
                    .replace(/^(مثل|مثال|مثال ذلك|مثلاً)\s*[:\-]?\s*/g, '')
                    .trim();
                  const hintInfo = hints[cat.key];
                  const hasError = hintErrorCategory[cat.key];

                  return (
                    <motion.div
                      key={cat.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`bg-white dark:bg-zinc-900 border rounded-2xl p-4 sm:p-4.5 shadow-sm transition-all flex flex-col justify-between ${
                        isValidStart 
                          ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-500/2' 
                          : isWrongStart 
                          ? 'border-rose-300 dark:border-rose-800 bg-rose-500/2' 
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-amber-550/30'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-black text-zinc-700 dark:text-zinc-250 flex items-center gap-1.5">
                          <span>{cat.label}</span>
                        </label>

                        <div className="flex items-center gap-1.5">
                          {/* Hint request button */}
                          <button
                            type="button"
                            disabled={hintInfo?.loading}
                            onClick={() => handleRequestHint(cat.key)}
                            className="bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 border border-zinc-200 dark:border-zinc-700 text-amber-600 dark:text-amber-400 font-extrabold text-[9px] py-1 px-2.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Lightbulb className="h-3 w-3" />
                            <span>
                              {hintInfo?.loading 
                                ? 'جاري استدعاء...' 
                                : hintInfo?.word 
                                ? 'تم شراؤه ✨' 
                                : `شراء تلميح 💡 (${HINT_COST_POINTS} 🪙)`}
                            </span>
                          </button>

                          {/* Visual indicator of matching letter */}
                          {isValidStart && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-455 font-bold bg-emerald-50 dark:bg-emerald-950/20 py-0.5 px-2 rounded-md flex items-center gap-1">
                              <Check className="h-3 w-3 stroke-[2.5]" />
                              <span>بداية صحيحة</span>
                            </span>
                          )}
                          {isWrongStart && (
                            <span className="text-[10px] text-rose-600 dark:text-rose-455 font-bold bg-rose-50 dark:bg-rose-950/20 py-0.5 px-2 rounded-md flex items-center gap-1 animate-pulse">
                              <X className="h-3 w-3 stroke-[2.5]" />
                              <span>تأكد من الحرف الأول</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Points purchase warning */}
                      {hasError && (
                        <div className="text-[9px] text-rose-600 bg-rose-100/50 dark:bg-rose-950/40 p-1 rounded-lg text-center font-bold mt-1 animate-shake border border-rose-200 dark:border-rose-900">
                          ⚠️ {hasError}
                        </div>
                      )}

                      <input
                        type="text"
                        value={val}
                        onChange={(e) => handleAnswerChange(cat.key, e.target.value)}
                        placeholder="اكتب الإجابة هنا..."
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 py-2.5 px-3.5 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-amber-500 focus:bg-white dark:focus:bg-zinc-950 transition-colors mt-2 text-right"
                        dir="rtl"
                        autoFocus={index === 0}
                      />

                      {/* Display retrieved hint for the category */}
                      {hintInfo?.word && (
                        <div className="mt-2.5 flex items-center justify-between bg-amber-500/5 border border-dashed border-amber-300 dark:border-amber-900/50 p-2 rounded-xl text-[10px] text-amber-700 dark:text-amber-400 animate-fadeIn">
                          <span className="font-semibold">تلميح متاح: <strong>{hintInfo.word}</strong></span>
                          <button
                            type="button"
                            onClick={() => {
                              handleAnswerChange(cat.key, hintInfo.word);
                              playTickSound();
                            }}
                            className="bg-amber-505 bg-amber-500 text-white font-extrabold px-2.5 py-0.5 rounded-md active:scale-95 cursor-pointer hover:bg-amber-600 transition-colors text-[9px]"
                          >
                            تعبئة تلقائية 🤝
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Action Buttons: STOP, Restart */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={handleRestart}
                  className="py-3 px-6 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-650 dark:text-zinc-300 font-extrabold text-xs rounded-2xl cursor-pointer"
                >
                  إعادة تهيئة / إلغاء الجولة
                </button>

                <div className="flex items-center gap-4">
                  <span className="text-xs text-zinc-400 font-bold hidden sm:inline">
                    تم كتابة {isFilledCount} من أصل 7 فئات
                  </span>

                  <button
                    onClick={handleTriggerStop}
                    className="flex items-center gap-2.5 py-4 px-10 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-rose-600/20 hover:shadow-rose-600/30 hover:scale-[1.01] active:scale-98 transition-all cursor-pointer"
                  >
                    <span>STOP! تقييم ومواجهة الخصم 🛑</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STATE 4: SUBMITTING / AI IS GRADING */}
          {activeRound.status === 'submitting' && (
            <motion.div
              key="grading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-md w-full mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl text-center"
              dir="rtl"
            >
              {/* Spinner animation */}
              <div className="relative flex justify-center py-6">
                <div className="h-20 w-20 rounded-full border-4 border-zinc-100 dark:border-zinc-800 border-t-amber-500 animate-spin" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Sparkles className="h-7 w-7 text-amber-500 animate-pulse" />
                </div>
              </div>

              <h2 className="text-lg font-black text-zinc-900 dark:text-white mt-4">الحكم يوثّق الدرجات ونتائج المواجهة...</h2>
              
              {/* Rotating funny Arabic messages */}
              <div className="h-10 mt-2 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.p
                     key={loadingMsgIdx}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     className="text-xs text-zinc-500 dark:text-zinc-350 leading-relaxed font-semibold italic"
                  >
                    {loadingMessages[loadingMsgIdx]}
                  </motion.p>
                </AnimatePresence>
              </div>

              <p className="text-[10px] text-zinc-400 mt-6 leading-relaxed">
                نقوم باستخدام Gemini Flash للتحقق العادل بمقارنة فورية بينك وبين تصنيفات الخصم الآلي، انتظر ثانية واحدة!
              </p>
            </motion.div>
          )}

          {/* STATE 5: REVIEWING (RESULTS AND CHARTS) */}
          {activeRound.status === 'reviewing' && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <div className="mb-4">
                <button
                  onClick={handleRestart}
                  className="text-xs text-zinc-400 hover:text-zinc-650 flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>العودة للشاشة الرئيسية</span>
                </button>
              </div>

              {/* History contains compiled rounds */}
              {gameState.roundsHistory.length > 0 && (
                <ResultsDashboard
                  round={gameState.roundsHistory[0]}
                  onRestart={handleRestart}
                  history={gameState.roundsHistory}
                  onClearHistory={handleClearHistory}
                  userPoints={userPoints}
                />
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Rules instructions dialog */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

    </div>
  );
}
