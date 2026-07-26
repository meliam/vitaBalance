/**
 * FIGMA MAKE REFERENCE ONLY
 *
 * This file is not production code.
 * Do not import it into the Phaser application.
 * Use it only as a visual, content and interaction reference.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Settings, Play, HelpCircle, Star, Heart, Pause, RotateCcw, Home, ChevronRight, Trophy, User, CheckCircle, Circle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = "intro" | "mission-select" | "objective" | "gameplay" | "results" | "profile" | "ranking" | "howtoplay" | "settings";
type Level = 1 | 2 | 3;

interface SeasonalConfig {
  from: string; fromEmoji: string; fromColor: string;
  to: string; toEmoji: string; toColor: string;
  bgGradient: string;
  products: { emoji: string; name: string; nutrient: string }[];
  distractors: { emoji: string; name: string; nutrient: string }[];
  explanation: string;
}

interface LevelItem {
  emoji: string; name: string; nutrient: string; points: number;
  vitaminC?: boolean; potassium?: boolean;
}

interface FallingItem {
  id: number; x: number; y: number;
  type: "correct" | "wrong-season" | "spoiled" | "powerup";
  emoji: string; name: string; nutrient: string;
  points: number; speed: number; size: number;
  rotation: number; rotationSpeed: number;
  vitaminC?: boolean; potassium?: boolean;
}

interface Feedback {
  id: number; text: string; sub: string;
  x: number; color: string;
}

interface GameState {
  score: number; lives: number; timeLeft: number;
  balance: number; precision: number;
  combo: number; maxCombo: number; errors: number;
  powerupActive: boolean; powerupTime: number;
  paused: boolean; won: boolean; lastItem: string;
  // Level 1
  totalCaught: number;
  // Level 2
  vitaminCCaught: boolean; potassiumCaught: boolean; uniqueItems: string[];
  // Level 3
  checklist: Record<string, boolean>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GAME_W = 1280;
const GAME_H = 520;
const AVATAR_W = 64;
const AVATAR_SPEED = 14;
const MARGIN = 32;

// ─── Seasonal configs (Level 3) ───────────────────────────────────────────────

const SEASONAL_CONFIGS: SeasonalConfig[] = [
  {
    from: "Primavera", fromEmoji: "🌸", fromColor: "#22c55e",
    to: "Invierno", toEmoji: "❄️", toColor: "#60a5fa",
    bgGradient: "linear-gradient(180deg, #0f2744 0%, #0a3060 60%, #091a40 100%)",
    products: [
      { emoji: "🍊", name: "Mandarina", nutrient: "Vitamina C" },
      { emoji: "🍈", name: "Pomelo", nutrient: "Vitamina C" },
      { emoji: "🥦", name: "Brócoli", nutrient: "Fibra y vitamina C" },
      { emoji: "🧅", name: "Puerro", nutrient: "Vitaminas del grupo B" },
      { emoji: "🥔", name: "Papa", nutrient: "Energía e hidratos" },
    ],
    distractors: [
      { emoji: "🍓", name: "Frutilla", nutrient: "Producto de primavera" },
      { emoji: "🍑", name: "Durazno", nutrient: "Producto de verano" },
      { emoji: "🍉", name: "Sandía", nutrient: "Producto de verano" },
      { emoji: "🌽", name: "Choclo", nutrient: "Producto de verano" },
    ],
    explanation: "La mandarina, el pomelo, el brócoli, el puerro y la papa suelen estar disponibles en invierno en la región central de Argentina.",
  },
  {
    from: "Invierno", fromEmoji: "❄️", fromColor: "#60a5fa",
    to: "Verano", toEmoji: "☀️", toColor: "#f97316",
    bgGradient: "linear-gradient(180deg, #1a0a44 0%, #2a1800 60%, #1a0800 100%)",
    products: [
      { emoji: "🍉", name: "Sandía", nutrient: "Hidratación" },
      { emoji: "🍑", name: "Durazno", nutrient: "Vitamina A" },
      { emoji: "🍅", name: "Tomate", nutrient: "Licopeno" },
      { emoji: "🥒", name: "Pepino", nutrient: "Hidratación y vitaminas" },
      { emoji: "🌽", name: "Choclo", nutrient: "Fibra y energía" },
    ],
    distractors: [
      { emoji: "🍊", name: "Mandarina", nutrient: "Producto de invierno" },
      { emoji: "🍈", name: "Pomelo", nutrient: "Producto de invierno" },
      { emoji: "🥦", name: "Brócoli", nutrient: "Producto de invierno" },
      { emoji: "🧅", name: "Puerro", nutrient: "Producto de invierno" },
    ],
    explanation: "La sandía, el durazno, el tomate, el pepino y el choclo son frutas y verduras características del verano en Argentina.",
  },
  {
    from: "Verano", fromEmoji: "☀️", fromColor: "#f97316",
    to: "Otoño", toEmoji: "🍂", toColor: "#b45309",
    bgGradient: "linear-gradient(180deg, #2a1800 0%, #1a2a08 60%, #0f1a04 100%)",
    products: [
      { emoji: "🍎", name: "Manzana", nutrient: "Fibra y vitaminas" },
      { emoji: "🍐", name: "Pera", nutrient: "Fibra y vitamina C" },
      { emoji: "🍇", name: "Uva", nutrient: "Antioxidantes" },
      { emoji: "🥕", name: "Zanahoria", nutrient: "Betacarotenos" },
    ],
    distractors: [
      { emoji: "🍉", name: "Sandía", nutrient: "Producto de verano" },
      { emoji: "🍑", name: "Durazno", nutrient: "Producto de verano" },
      { emoji: "🌽", name: "Choclo", nutrient: "Producto de verano" },
      { emoji: "🥒", name: "Pepino", nutrient: "Producto de verano" },
    ],
    explanation: "La manzana, la pera, la uva, la zanahoria y el zapallo son alimentos típicos del otoño en Argentina.",
  },
  {
    from: "Otoño", fromEmoji: "🍂", fromColor: "#b45309",
    to: "Primavera", toEmoji: "🌸", toColor: "#22c55e",
    bgGradient: "linear-gradient(180deg, #0f2a0a 0%, #1a3a10 60%, #0a2a08 100%)",
    products: [
      { emoji: "🍓", name: "Frutilla", nutrient: "Vitamina C" },
      { emoji: "🥬", name: "Lechuga", nutrient: "Folatos y agua" },
      { emoji: "🫛", name: "Arvejas", nutrient: "Proteínas vegetales" },
      { emoji: "🌿", name: "Espinaca", nutrient: "Hierro y ácido fólico" },
      { emoji: "🥦", name: "Brócoli tierno", nutrient: "Vitamina C y fibra" },
    ],
    distractors: [
      { emoji: "🍎", name: "Manzana", nutrient: "Producto de otoño" },
      { emoji: "🍐", name: "Pera", nutrient: "Producto de otoño" },
      { emoji: "🍇", name: "Uva", nutrient: "Producto de otoño" },
      { emoji: "🟠", name: "Zapallo", nutrient: "Producto de otoño" },
    ],
    explanation: "La frutilla, la lechuga, las arvejas y la espinaca son productos primaverales frecuentes en Argentina.",
  },
];

const SPOILED_ITEMS = [
  { emoji: "🍎", name: "Manzana podrida", nutrient: "Producto en mal estado" },
  { emoji: "🍌", name: "Banana marchita", nutrient: "Producto en mal estado" },
  { emoji: "🥕", name: "Zanahoria golpeada", nutrient: "Producto en mal estado" },
  { emoji: "🍅", name: "Tomate deteriorado", nutrient: "Producto en mal estado" },
];

const LEVEL_DATA = {
  1: {
    title: "Nivel 1: Reconocer",
    duration: 60,
    description: "Aprendé a identificar frutas y verduras frescas. ¡Evitá los productos en mal estado!",
    goalDescription: "Recolectá 8 productos frescos",
    goalCount: 8,
    reward: "Gorra Cítrica",
    rewardEmoji: "🧢",
    color: "#22c55e",
    items: [
      { emoji: "🍎", name: "Manzana", nutrient: "Vitamina C", points: 100 },
      { emoji: "🍊", name: "Naranja", nutrient: "Vitamina C", points: 100 },
      { emoji: "🍋", name: "Limón", nutrient: "Vitamina C", points: 100 },
      { emoji: "🥕", name: "Zanahoria", nutrient: "Betacarotenos", points: 100 },
      { emoji: "🥦", name: "Brócoli", nutrient: "Fibra y vitamina C", points: 100 },
      { emoji: "🍌", name: "Banana", nutrient: "Potasio", points: 100 },
    ] as LevelItem[],
  },
  2: {
    title: "Nivel 2: Combinar",
    duration: 75,
    description: "Combiná distintas frutas y verduras para completar los tres objetivos nutricionales.",
    goalDescription: "Vitamina C + Potasio + 5 productos diferentes",
    goalCount: 5,
    reward: "Remera VitaBalance",
    rewardEmoji: "👕",
    color: "#f97316",
    items: [
      { emoji: "🍊", name: "Naranja", nutrient: "Vitamina C", points: 100, vitaminC: true },
      { emoji: "🍋", name: "Limón", nutrient: "Vitamina C", points: 100, vitaminC: true },
      { emoji: "🍎", name: "Manzana", nutrient: "Vitamina C y fibra", points: 100, vitaminC: true },
      { emoji: "🍌", name: "Banana", nutrient: "Potasio", points: 100, potassium: true },
      { emoji: "🥬", name: "Espinaca", nutrient: "Hierro", points: 100 },
      { emoji: "🍇", name: "Uvas", nutrient: "Antioxidantes", points: 100 },
      { emoji: "🥒", name: "Pepino", nutrient: "Hidratación", points: 100 },
      { emoji: "🍅", name: "Tomate", nutrient: "Licopeno", points: 100 },
    ] as LevelItem[],
  },
  3: {
    title: "Nivel 3: Guardianes de las Estaciones",
    duration: 90,
    reward: "Capa VitaHero",
    rewardEmoji: "🦸",
    color: "#7c3aed",
  },
};

// ─── Avatar SVG ───────────────────────────────────────────────────────────────

function AvatarSVG({ outfit, size = 80, animate = false }: { outfit: number; size?: number; animate?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={animate ? { animation: "avatarBob 0.7s ease-in-out infinite alternate" } : {}}>
      {/* Cape (Level 3) */}
      {outfit >= 3 && (
        <path d="M20 54 Q14 70 20 74 Q32 79 40 74 Q48 79 60 74 Q66 70 60 54" fill="#7c3aed" opacity="0.92" />
      )}
      {/* Body */}
      <ellipse cx="40" cy="58" rx="18" ry="15" fill={outfit >= 2 ? "#f97316" : "#4ade80"} />
      {/* Legs */}
      <ellipse cx="33" cy="74" rx="5" ry="8" fill="#60a5fa" />
      <ellipse cx="47" cy="74" rx="5" ry="8" fill="#60a5fa" />
      {/* Arms */}
      <ellipse cx="19" cy="56" rx="5" ry="9" fill={outfit >= 2 ? "#f97316" : "#4ade80"} transform="rotate(-15 19 56)" />
      <ellipse cx="61" cy="56" rx="5" ry="9" fill={outfit >= 2 ? "#f97316" : "#4ade80"} transform="rotate(15 61 56)" />
      {/* Head */}
      <circle cx="40" cy="30" r="20" fill="#fde68a" />
      {/* Eyes */}
      <circle cx="33" cy="28" r="3.5" fill="#1e293b" />
      <circle cx="47" cy="28" r="3.5" fill="#1e293b" />
      <circle cx="34.5" cy="26.5" r="1.2" fill="white" />
      <circle cx="48.5" cy="26.5" r="1.2" fill="white" />
      {/* Smile */}
      <path d="M33 36 Q40 42 47 36" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Cheeks */}
      <ellipse cx="28" cy="34" rx="4" ry="2.5" fill="#fb923c" opacity="0.5" />
      <ellipse cx="52" cy="34" rx="4" ry="2.5" fill="#fb923c" opacity="0.5" />
      {/* Hair (no cap) */}
      {outfit === 0 && (
        <>
          <path d="M22 20 Q28 10 40 10 Q52 10 58 20" fill="#92400e" />
          <ellipse cx="40" cy="11" rx="14" ry="5" fill="#92400e" />
        </>
      )}
      {/* Cap (Level 1+) */}
      {outfit >= 1 && (
        <>
          <ellipse cx="40" cy="13" rx="23" ry="5" fill="#f97316" />
          <path d="M17 13 Q20 3 40 3 Q60 3 63 13" fill="#ea580c" />
          <circle cx="40" cy="3" r="3" fill="#fbbf24" />
          <rect x="30" y="11" width="20" height="3" rx="1.5" fill="#fbbf24" opacity="0.5" />
        </>
      )}
      {/* VitaBalance logo on shirt (Level 2+) */}
      {outfit >= 2 && (
        <text x="40" y="62" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold" opacity="0.9">VB</text>
      )}
      {/* Star on cape (Level 3) */}
      {outfit >= 3 && (
        <text x="40" y="70" textAnchor="middle" fontSize="8" fill="#eab308">★</text>
      )}
    </svg>
  );
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

function Confetti({ reduceMotion }: { reduceMotion: boolean }) {
  if (reduceMotion) {
    return (
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
        <div className="flex gap-3 text-5xl">🎉🌟🎊✨🏆</div>
      </div>
    );
  }
  const pieces = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 1.5,
    duration: 2 + Math.random() * 1.5,
    color: ["#f97316", "#22c55e", "#eab308", "#7c3aed", "#60a5fa", "#f43f5e"][i % 6],
    size: 6 + Math.random() * 8,
    rotate: Math.random() * 360,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map(p => (
        <div key={p.id} style={{
          position: "absolute", left: `${p.x}%`, top: "-20px",
          width: p.size, height: p.size, background: p.color,
          borderRadius: p.id % 2 === 0 ? "50%" : "2px",
          transform: `rotate(${p.rotate}deg)`,
          animation: `confettiFall ${p.duration}s ${p.delay}s linear forwards`,
        }} />
      ))}
    </div>
  );
}

// ─── Intro Screen ─────────────────────────────────────────────────────────────

function IntroScreen({ onPlay, onHowTo, onSettings, outfitLevel }: {
  onPlay: () => void; onHowTo: () => void; onSettings: () => void; outfitLevel: number;
}) {
  const floatEmojis = ["🍎", "🍊", "🥦", "🍌", "🥕", "🍇", "🍋", "🥒", "🍅", "🫐"];
  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(135deg, #0d1b2a 0%, #1a3a5c 50%, #0d2a1a 100%)" }}>
      {floatEmojis.map((emoji, i) => (
        <div key={i} className="absolute select-none pointer-events-none" style={{
          left: `${5 + (i * 9.5) % 90}%`, top: `${8 + (i * 17) % 80}%`,
          fontSize: `${1.8 + (i % 3) * 0.5}rem`,
          animation: `floatBg ${3 + i * 0.4}s ease-in-out infinite alternate`,
          animationDelay: `${i * 0.3}s`, opacity: 0.12,
        }}>{emoji}</div>
      ))}

      <div className="relative z-10 flex flex-col items-center gap-1 mb-5">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🌿</span>
          <div>
            <h1 className="font-black text-5xl text-white leading-none"
              style={{ fontFamily: "'Fredoka One', cursive", textShadow: "0 4px 20px rgba(34,197,94,0.5)" }}>
              VitaBalance
            </h1>
            <p className="text-base font-bold text-green-400 tracking-widest uppercase text-center"
              style={{ fontFamily: "'Nunito', sans-serif", letterSpacing: "0.18em" }}>
              Guardianes de las Estaciones
            </p>
          </div>
          <span className="text-4xl">⚡</span>
        </div>
      </div>

      <div className="relative z-10 flex items-end gap-6 mb-5">
        <div className="text-4xl" style={{ animation: "floatBg 2.1s ease-in-out infinite alternate" }}>🍊</div>
        <div style={{ filter: "drop-shadow(0 8px 32px rgba(34,197,94,0.4))", animation: "avatarBob 1.2s ease-in-out infinite alternate" }}>
          <AvatarSVG outfit={outfitLevel} size={110} />
        </div>
        <div className="text-4xl" style={{ animation: "floatBg 2.5s ease-in-out infinite alternate" }}>🥦</div>
      </div>

      <p className="relative z-10 text-xl font-black text-yellow-300 mb-8 text-center px-6"
        style={{ fontFamily: "'Fredoka One', cursive", textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>
        "No atrapás todo. Tomás decisiones."
      </p>

      <div className="relative z-10 flex flex-col items-center gap-3">
        <button onClick={onPlay}
          className="flex items-center gap-3 px-10 py-4 rounded-full font-black text-xl text-white transition-all active:scale-95 hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-400"
          style={{ fontFamily: "'Fredoka One', cursive", background: "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: "0 6px 24px rgba(249,115,22,0.55)", minWidth: 220, minHeight: 56 }}>
          <Play size={24} fill="white" /> ¡Jugar!
        </button>
        <button onClick={onHowTo}
          className="flex items-center gap-2 px-7 py-3 rounded-full font-bold text-base text-white transition-all active:scale-95 hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-400"
          style={{ fontFamily: "'Nunito', sans-serif", background: "rgba(34,197,94,0.18)", border: "2px solid #22c55e", minHeight: 44 }}>
          <HelpCircle size={18} /> Cómo jugar
        </button>
      </div>

      <button onClick={onSettings} aria-label="Configuración"
        className="absolute top-4 right-4 z-20 p-3 rounded-full transition-all active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400"
        style={{ background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.2)", minWidth: 44, minHeight: 44 }}>
        <Settings size={20} className="text-white" />
      </button>

      {[...Array(5)].map((_, i) => (
        <div key={i} className="absolute pointer-events-none select-none text-yellow-400"
          style={{ right: `${8 + i * 4}%`, top: `${12 + i * 12}%`, fontSize: `${0.7 + (i % 3) * 0.35}rem`, animation: `twinkle ${1.5 + i * 0.4}s ease-in-out infinite alternate` }}>★</div>
      ))}
    </div>
  );
}

// ─── Mission Select ───────────────────────────────────────────────────────────

function MissionSelectScreen({ onSelect, unlockedLevel, outfitLevel, onBack }: {
  onSelect: (l: Level) => void; unlockedLevel: Level; outfitLevel: number; onBack: () => void;
}) {
  const lvls = [
    { level: 1 as Level, icon: "🍎", color: "#22c55e", border: "#16a34a" },
    { level: 2 as Level, icon: "🥗", color: "#f97316", border: "#ea580c" },
    { level: 3 as Level, icon: "❄️", color: "#7c3aed", border: "#6d28d9" },
  ];
  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-6 relative"
      style={{ background: "linear-gradient(135deg, #0d1b2a, #1a2e45)" }}>
      <button onClick={onBack} className="absolute top-4 left-4 p-3 rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-400"
        style={{ background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.2)", minWidth: 44, minHeight: 44 }}>
        <Home size={20} className="text-white" />
      </button>
      <h2 className="text-3xl font-black text-white mb-8" style={{ fontFamily: "'Fredoka One', cursive" }}>Elegí tu misión</h2>
      <div className="flex flex-wrap justify-center gap-5 max-w-3xl">
        {lvls.map(({ level, icon, color, border }) => {
          const data = LEVEL_DATA[level];
          const locked = level > unlockedLevel;
          const completed = outfitLevel >= level;
          return (
            <button key={level} onClick={() => !locked && onSelect(level)} disabled={locked}
              className="relative flex flex-col items-center gap-3 p-6 rounded-2xl transition-all active:scale-95 focus:outline-none focus-visible:ring-4"
              style={{
                width: 220, minHeight: 180,
                background: locked ? "rgba(255,255,255,0.04)" : `linear-gradient(135deg, ${color}18, ${color}38)`,
                border: `2px solid ${locked ? "rgba(255,255,255,0.08)" : border}`,
                opacity: locked ? 0.45 : 1,
                cursor: locked ? "not-allowed" : "pointer",
                boxShadow: locked ? "none" : `0 4px 24px ${color}38`,
              }}>
              <span className="text-5xl">{locked ? "🔒" : icon}</span>
              <div className="text-center">
                <p className="font-black text-white text-sm mb-1" style={{ fontFamily: "'Fredoka One', cursive" }}>{data.title}</p>
                <p className="text-xs text-white/55" style={{ fontFamily: "'Nunito', sans-serif" }}>
                  {"duration" in data ? `${(data as { duration: number }).duration}s` : "90s"}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ background: color, color: "#fff", fontFamily: "'Nunito', sans-serif" }}>
                {data.rewardEmoji} {data.reward}
              </div>
              {completed && (
                <div className="absolute top-2 right-3 text-green-400 font-black text-sm">✓</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Objective Screen ─────────────────────────────────────────────────────────

function ObjectiveScreen({ level, seasonalConfig, onStart, onBack }: {
  level: Level; seasonalConfig: SeasonalConfig | null; onStart: () => void; onBack: () => void;
}) {
  const data = LEVEL_DATA[level];
  const color = data.color;
  const isL3 = level === 3 && seasonalConfig;
  return (
    <div className="w-full h-full overflow-y-auto flex flex-col items-center justify-center px-6 py-8 relative"
      style={{ background: "linear-gradient(135deg, #0d1b2a, #1a2e45)" }}>
      <button onClick={onBack} className="absolute top-4 left-4 p-3 rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-400"
        style={{ background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.2)", minWidth: 44, minHeight: 44 }}>
        <Home size={20} className="text-white" />
      </button>
      <div className="flex flex-col items-center gap-4 max-w-lg text-center w-full">
        <div className="text-5xl">{data.rewardEmoji}</div>
        <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Fredoka One', cursive" }}>{data.title}</h2>

        {isL3 && (
          <>
            <div className="flex gap-3 flex-wrap justify-center">
              <div className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: `${seasonalConfig.fromColor}28`, border: `2px solid ${seasonalConfig.fromColor}`, color: seasonalConfig.fromColor, fontFamily: "'Nunito', sans-serif" }}>
                {seasonalConfig.fromEmoji} Estás en: {seasonalConfig.from}
              </div>
              <div className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: `${seasonalConfig.toColor}28`, border: `2px solid ${seasonalConfig.toColor}`, color: seasonalConfig.toColor, fontFamily: "'Nunito', sans-serif" }}>
                {seasonalConfig.toEmoji} Canasta para: {seasonalConfig.to}
              </div>
            </div>
            <p className="text-sm text-white/70 leading-relaxed" style={{ fontFamily: "'Nunito', sans-serif" }}>
              Prepará la canasta de {seasonalConfig.to.toLowerCase()}. Recolectá los 5 productos correctos y evitá los de otras estaciones.
            </p>
            <div className="p-4 rounded-2xl w-full" style={{ background: `${color}18`, border: `2px solid ${color}` }}>
              <p className="text-sm font-black text-white mb-3" style={{ fontFamily: "'Fredoka One', cursive" }}>
                {seasonalConfig.toEmoji} Productos de {seasonalConfig.to}:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {seasonalConfig.products.map(p => (
                  <div key={p.name} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
                    style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontFamily: "'Nunito', sans-serif" }}>
                    <span>{p.emoji}</span> {p.name}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-white/50 leading-relaxed" style={{ fontFamily: "'Nunito', sans-serif" }}>
              {seasonalConfig.explanation}
            </p>
          </>
        )}

        {!isL3 && (
          <>
            <p className="text-sm text-white/75 leading-relaxed" style={{ fontFamily: "'Nunito', sans-serif" }}>
              {"description" in data ? (data as { description: string }).description : ""}
            </p>
            <div className="p-4 rounded-2xl w-full" style={{ background: `${color}18`, border: `2px solid ${color}` }}>
              <p className="text-sm font-black text-white mb-1" style={{ fontFamily: "'Fredoka One', cursive" }}>Objetivo</p>
              <p className="text-sm text-white/75" style={{ fontFamily: "'Nunito', sans-serif" }}>
                {"goalDescription" in data ? (data as { goalDescription: string }).goalDescription : ""}
              </p>
            </div>
          </>
        )}

        <div className="flex items-center gap-4 text-sm text-white/55 flex-wrap justify-center" style={{ fontFamily: "'Nunito', sans-serif" }}>
          <span>⏱ {"duration" in data ? (data as { duration: number }).duration : 90} segundos</span>
          <span>·</span>
          <span>Recompensa: {data.rewardEmoji} {data.reward}</span>
        </div>
        <p className="text-xs text-white/35" style={{ fontFamily: "'Nunito', sans-serif" }}>
          Usá ← → o A D para mover · Teclado y botones táctiles disponibles
        </p>
        <button onClick={onStart}
          className="flex items-center gap-3 px-10 py-4 rounded-full font-black text-xl text-white transition-all active:scale-95 hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-400"
          style={{ fontFamily: "'Fredoka One', cursive", background: `linear-gradient(135deg, ${color}, ${color}bb)`, boxShadow: `0 6px 24px ${color}55`, minHeight: 56 }}>
          <Play size={22} fill="white" /> ¡Comenzar!
        </button>
      </div>
    </div>
  );
}

// ─── Gameplay Screen ──────────────────────────────────────────────────────────

function GameplayScreen({ level, seasonalConfig, onComplete, onMenu, outfit, reduceMotion }: {
  level: Level; seasonalConfig: SeasonalConfig | null;
  onComplete: (gs: GameState) => void; onMenu: () => void;
  outfit: number; reduceMotion: boolean;
}) {
  const duration = level === 1 ? 60 : level === 2 ? 75 : 90;

  const correctItems: LevelItem[] = level === 3 && seasonalConfig
    ? seasonalConfig.products.map(p => ({ ...p, points: 150 }))
    : (LEVEL_DATA[level] as { items: LevelItem[] }).items;

  const distractors = level === 3 && seasonalConfig
    ? seasonalConfig.distractors
    : [
      { emoji: "🍓", name: "Frutilla", nutrient: "No corresponde a esta misión" },
      { emoji: "🍑", name: "Durazno", nutrient: "No corresponde a esta misión" },
      { emoji: "🌽", name: "Choclo", nutrient: "No corresponde a esta misión" },
      { emoji: "🍉", name: "Sandía", nutrient: "No corresponde a esta misión" },
    ];

  const initialChecklist = level === 3 && seasonalConfig
    ? Object.fromEntries(seasonalConfig.products.map(p => [p.name, false]))
    : {};

  const [avatarX, setAvatarX] = useState(GAME_W / 2 - AVATAR_W / 2);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [flashRed, setFlashRed] = useState(false);
  const [gs, setGs] = useState<GameState>({
    score: 0, lives: 3, timeLeft: duration,
    balance: 100, precision: 100,
    combo: 0, maxCombo: 0, errors: 0,
    powerupActive: false, powerupTime: 0,
    paused: false, won: false, lastItem: "",
    totalCaught: 0,
    vitaminCCaught: false, potassiumCaught: false, uniqueItems: [],
    checklist: initialChecklist,
  });

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  const keysRef = useRef<Record<string, boolean>>({});
  const gsRef = useRef(gs);
  const itemsRef = useRef(items);
  const avatarXRef = useRef(avatarX);
  const nextIdRef = useRef(0);
  const feedbackIdRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const rafRef = useRef(0);
  const lastTimeRef = useRef(0);
  const doneRef = useRef(false);
  const touchLeft = useRef(false);
  const touchRight = useRef(false);

  gsRef.current = gs;
  itemsRef.current = items;
  avatarXRef.current = avatarX;

  // Responsive scale
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const s = Math.min(w / GAME_W, h / GAME_H, 1);
      setScale(s);
      setOffsetX(Math.max(0, (w - GAME_W * s) / 2));
      setOffsetY(Math.max(0, (h - GAME_H * s) / 2));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const addFeedback = useCallback((text: string, sub: string, x: number, color: string) => {
    const id = feedbackIdRef.current++;
    const clampedX = Math.max(MARGIN + 80, Math.min(x, GAME_W - MARGIN - 80));
    setFeedbacks(f => [...f, { id, text, sub, x: clampedX, color }]);
    setTimeout(() => setFeedbacks(f => f.filter(fb => fb.id !== id)), 1800);
  }, []);

  const handleCatch = useCallback((item: FallingItem) => {
    setItems(prev => prev.filter(i => i.id !== item.id));

    if (item.type === "powerup") {
      setGs(prev => ({ ...prev, score: prev.score + 50, powerupActive: true, powerupTime: 3 }));
      addFeedback("⭐ Estrella Vita", "Caída lenta · 3s", item.x, "#eab308");
      return;
    }

    if (item.type === "spoiled") {
      if (!reduceMotion) { setFlashRed(true); setTimeout(() => setFlashRed(false), 350); }
      setGs(prev => ({
        ...prev,
        lives: prev.lives - 1,
        balance: Math.max(prev.balance - 15, 0),
        precision: Math.max(prev.precision - 12, 0),
        combo: 0,
        errors: prev.errors + 1,
      }));
      addFeedback(item.name, "Producto en mal estado · -1 vida", item.x, "#ef4444");
      return;
    }

    if (item.type === "wrong-season") {
      setGs(prev => ({
        ...prev,
        combo: 0,
        precision: Math.max(prev.precision - 8, 0),
        errors: prev.errors + 1,
      }));
      addFeedback(item.name, "No corresponde a esta misión", item.x, "#f97316");
      return;
    }

    // Correct item
    setGs(prev => {
      const isDifferent = item.name !== prev.lastItem;
      const newCombo = isDifferent ? prev.combo + 1 : prev.combo;
      const newMaxCombo = Math.max(prev.maxCombo, newCombo);
      const bonus = isDifferent ? Math.min(newCombo * 12, 120) : 0;

      // Level 1
      const newTotalCaught = level === 1 ? prev.totalCaught + 1 : prev.totalCaught;

      // Level 2
      const newVitaminC = level === 2 ? prev.vitaminCCaught || !!item.vitaminC : prev.vitaminCCaught;
      const newPotassium = level === 2 ? prev.potassiumCaught || !!item.potassium : prev.potassiumCaught;
      const newUniqueItems = (level === 2 && !prev.uniqueItems.includes(item.name))
        ? [...prev.uniqueItems, item.name] : prev.uniqueItems;

      // Level 3
      const newChecklist = level === 3
        ? { ...prev.checklist, [item.name]: true }
        : prev.checklist;

      // Win check
      let won = false;
      if (level === 1) won = newTotalCaught >= 8;
      else if (level === 2) won = newVitaminC && newPotassium && newUniqueItems.length >= 5;
      else if (level === 3) won = Object.values(newChecklist).every(Boolean);

      return {
        ...prev,
        score: prev.score + item.points + bonus,
        combo: newCombo, maxCombo: newMaxCombo,
        balance: Math.min(prev.balance + 2, 100),
        lastItem: isDifferent ? item.name : prev.lastItem,
        totalCaught: newTotalCaught,
        vitaminCCaught: newVitaminC,
        potassiumCaught: newPotassium,
        uniqueItems: newUniqueItems,
        checklist: newChecklist,
        paused: won,
        won,
      };
    });

    const isVariety = item.name !== gsRef.current.lastItem;
    const feedText = `${item.emoji} ${item.name} · ${item.nutrient}`;
    const feedSub = item.points > 100 ? `+${item.points} · ✓ ${seasonalConfig?.to ?? ""}` : `+${item.points}${isVariety ? " · Variedad +1" : ""}`;
    addFeedback(feedText, feedSub, item.x, "#22c55e");
  }, [level, seasonalConfig, addFeedback, reduceMotion]);

  // Game loop
  useEffect(() => {
    const loop = (ts: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = ts;
      const dt = Math.min((ts - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = ts;
      const cur = gsRef.current;

      if (!cur.paused && !cur.won && !doneRef.current) {
        // Move avatar
        const left = keysRef.current["ArrowLeft"] || keysRef.current["a"] || keysRef.current["A"] || touchLeft.current;
        const right = keysRef.current["ArrowRight"] || keysRef.current["d"] || keysRef.current["D"] || touchRight.current;
        if (left) setAvatarX(x => Math.max(MARGIN, x - AVATAR_SPEED));
        if (right) setAvatarX(x => Math.min(GAME_W - MARGIN - AVATAR_W, x + AVATAR_SPEED));

        // Update items
        const speedMult = cur.powerupActive ? 0.28 : 1;
        setItems(prev =>
          prev.map(item => ({
            ...item,
            y: item.y + item.speed * speedMult * 60 * dt,
            rotation: item.rotation + item.rotationSpeed,
          })).filter(item => item.y < GAME_H + 80)
        );

        // Collision detection
        const ax = avatarXRef.current;
        const ay = GAME_H - 100;
        const toRemove: number[] = [];
        itemsRef.current.forEach(item => {
          if (toRemove.includes(item.id)) return;
          const ix = item.x - item.size / 2;
          const iy = item.y;
          if (ax < ix + item.size && ax + AVATAR_W > ix && ay < iy + item.size && ay + 64 > iy) {
            toRemove.push(item.id);
            handleCatch(item);
          }
        });

        // Spawn
        spawnTimerRef.current += dt;
        const interval = level === 1 ? 1.3 : level === 2 ? 0.95 : 0.72;
        if (spawnTimerRef.current >= interval) {
          spawnTimerRef.current = 0;
          // Spawn item
          const r = Math.random();
          let type: FallingItem["type"];
          let src: { emoji: string; name: string; nutrient: string; vitaminC?: boolean; potassium?: boolean; points?: number };

          if (r < 0.52) {
            type = "correct";
            const pick = correctItems[Math.floor(Math.random() * correctItems.length)];
            src = pick;
          } else if (r < 0.70) {
            type = "spoiled";
            src = SPOILED_ITEMS[Math.floor(Math.random() * SPOILED_ITEMS.length)];
          } else if (r < 0.88) {
            type = "wrong-season";
            src = distractors[Math.floor(Math.random() * distractors.length)];
          } else {
            type = "powerup";
            src = { emoji: "⭐", name: "Estrella Vita", nutrient: "Ralentiza la caída · 3s", points: 50 };
          }

          const baseSpeed = level === 1 ? 1.6 : level === 2 ? 2.2 : 2.8;
          const fallSpeed = cur.powerupActive ? baseSpeed * 0.28 : baseSpeed + Math.random() * 1.0;

          const newItem: FallingItem = {
            id: nextIdRef.current++,
            x: MARGIN + 40 + Math.random() * (GAME_W - MARGIN * 2 - 80),
            y: -60,
            type,
            emoji: src.emoji,
            name: src.name,
            nutrient: src.nutrient,
            points: (src as { points?: number }).points ?? 100,
            speed: fallSpeed,
            size: 44 + Math.random() * 14,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 2.5,
            vitaminC: (src as { vitaminC?: boolean }).vitaminC,
            potassium: (src as { potassium?: boolean }).potassium,
          };
          setItems(prev => [...prev, newItem]);
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [level, correctItems, distractors, handleCatch]);

  // Timer
  useEffect(() => {
    const t = setInterval(() => {
      setGs(prev => {
        if (prev.paused || prev.won) return prev;
        const newTime = prev.timeLeft - 1;
        if (newTime <= 0 || prev.lives <= 0) {
          if (!doneRef.current) {
            doneRef.current = true;
            setTimeout(() => onComplete({ ...prev, timeLeft: 0 }), 400);
          }
          return { ...prev, timeLeft: 0, paused: true };
        }
        return { ...prev, timeLeft: newTime };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [onComplete]);

  // Powerup countdown
  useEffect(() => {
    if (!gs.powerupActive) return;
    const t = setInterval(() => {
      setGs(prev => prev.powerupTime <= 1
        ? { ...prev, powerupActive: false, powerupTime: 0 }
        : { ...prev, powerupTime: prev.powerupTime - 1 });
    }, 1000);
    return () => clearInterval(t);
  }, [gs.powerupActive]);

  // Win detection
  useEffect(() => {
    if (gs.won && !doneRef.current) {
      doneRef.current = true;
      setTimeout(() => onComplete(gs), 2800);
    }
  }, [gs.won]);

  // Keyboard
  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if (e.key === "Escape") setGs(prev => ({ ...prev, paused: !prev.paused }));
    };
    const up = (e: KeyboardEvent) => { keysRef.current[e.key] = false; };
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); };
  }, []);

  const togglePause = () => setGs(prev => ({ ...prev, paused: !prev.paused }));

  // Progress indicator per level
  const progress = level === 1
    ? { label: `${gs.totalCaught}/8`, pct: (gs.totalCaught / 8) * 100, color: "#22c55e" }
    : null;

  const bgStyle = level === 3 && seasonalConfig
    ? { background: seasonalConfig.bgGradient }
    : { background: "linear-gradient(180deg, #0f2744 0%, #0a3d1a 60%, #1a4a0a 100%)" };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: "#0a1628", userSelect: "none" }}>
      {/* HUD */}
      <div className="flex-shrink-0 px-3 py-2"
        style={{ background: "linear-gradient(90deg, #0d1b2a, #1a2e45)", borderBottom: "2px solid rgba(255,255,255,0.08)" }}>
        {/* Row 1: core stats */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Score */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: "rgba(249,115,22,0.18)", border: "1px solid #f97316" }}>
            <Star size={13} className="text-yellow-400" />
            <span className="font-black text-white text-sm" style={{ fontFamily: "'Fredoka One', cursive" }}>{gs.score.toLocaleString()}</span>
          </div>
          {/* Lives */}
          <div className="flex items-center gap-1" aria-label={`Vidas: ${gs.lives}`}>
            {[0, 1, 2].map(i => <Heart key={i} size={18} fill={i < gs.lives ? "#ef4444" : "rgba(255,255,255,0.12)"} color={i < gs.lives ? "#ef4444" : "rgba(255,255,255,0.12)"} />)}
          </div>
          {/* Time */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full"
            style={{ background: gs.timeLeft <= 10 ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.08)", border: `1px solid ${gs.timeLeft <= 10 ? "#ef4444" : "rgba(255,255,255,0.18)"}` }}>
            <span className="text-white text-sm font-bold" style={{ fontFamily: "'Space Mono', monospace" }}>⏱ {gs.timeLeft}s</span>
          </div>
          {/* Balance */}
          <div className="flex items-center gap-1.5 min-w-[90px] flex-1">
            <span className="text-white/50 text-xs hidden sm:block" style={{ fontFamily: "'Nunito', sans-serif" }}>Balance</span>
            <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${gs.balance}%`, background: gs.balance > 60 ? "#22c55e" : gs.balance > 30 ? "#eab308" : "#ef4444" }} />
            </div>
          </div>
          {/* Combo */}
          {gs.combo >= 2 && (
            <div className="px-2 py-0.5 rounded-full font-black text-xs" style={{ fontFamily: "'Fredoka One', cursive", background: "linear-gradient(135deg,#f97316,#eab308)", color: "#fff" }}>
              x{gs.combo}!
            </div>
          )}
          {/* Powerup */}
          {gs.powerupActive && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold"
              style={{ fontFamily: "'Nunito', sans-serif", background: "rgba(96,165,250,0.25)", border: "1px solid #60a5fa", color: "#93c5fd", animation: "powerupPulse 1s ease-in-out infinite" }}>
              ⭐ {gs.powerupTime}s
            </div>
          )}
          {/* Level 1 progress */}
          {level === 1 && progress && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-black"
              style={{ fontFamily: "'Fredoka One', cursive", background: "rgba(34,197,94,0.2)", border: "1px solid #22c55e", color: "#86efac" }}>
              🍏 {progress.label}
            </div>
          )}
          {/* Pause */}
          <button onClick={togglePause} aria-label="Pausa"
            className="ml-auto p-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 transition-all active:scale-95"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", minWidth: 44, minHeight: 44 }}>
            <Pause size={16} className="text-white" />
          </button>
        </div>

        {/* Row 2: Level 2 nutrient indicators */}
        {level === 2 && (
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${gs.vitaminCCaught ? "text-white" : "text-white/50"}`}
              style={{ fontFamily: "'Nunito', sans-serif", background: gs.vitaminCCaught ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.06)", border: `1px solid ${gs.vitaminCCaught ? "#22c55e" : "rgba(255,255,255,0.12)"}` }}>
              {gs.vitaminCCaught ? <CheckCircle size={12} className="text-green-400" /> : <Circle size={12} />}
              Vitamina C
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${gs.potassiumCaught ? "text-white" : "text-white/50"}`}
              style={{ fontFamily: "'Nunito', sans-serif", background: gs.potassiumCaught ? "rgba(234,179,8,0.3)" : "rgba(255,255,255,0.06)", border: `1px solid ${gs.potassiumCaught ? "#eab308" : "rgba(255,255,255,0.12)"}` }}>
              {gs.potassiumCaught ? <CheckCircle size={12} className="text-yellow-400" /> : <Circle size={12} />}
              Potasio
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ fontFamily: "'Nunito', sans-serif", background: gs.uniqueItems.length >= 5 ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.06)", border: `1px solid ${gs.uniqueItems.length >= 5 ? "#7c3aed" : "rgba(255,255,255,0.12)"}`, color: gs.uniqueItems.length >= 5 ? "#c4b5fd" : "rgba(255,255,255,0.5)" }}>
              {gs.uniqueItems.length >= 5 ? <CheckCircle size={12} className="text-purple-400" /> : <Circle size={12} />}
              Variedad {gs.uniqueItems.length}/5
            </div>
          </div>
        )}

        {/* Row 2: Level 3 checklist */}
        {level === 3 && seasonalConfig && (
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs text-white/50 mr-1" style={{ fontFamily: "'Nunito', sans-serif" }}>Canasta:</span>
            {seasonalConfig.products.map(p => {
              const done = gs.checklist[p.name];
              return (
                <div key={p.name} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold transition-all"
                  style={{ fontFamily: "'Nunito', sans-serif", background: done ? "rgba(34,197,94,0.28)" : "rgba(255,255,255,0.06)", border: `1px solid ${done ? "#22c55e" : "rgba(255,255,255,0.1)"}`, color: done ? "#86efac" : "rgba(255,255,255,0.45)" }}>
                  {p.emoji} <span className="hidden sm:inline">{p.name}</span>
                  {done && <CheckCircle size={10} className="text-green-400" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Game canvas */}
      <div ref={wrapperRef} className="flex-1 relative overflow-hidden">
        {/* Scaled game area */}
        <div style={{
          position: "absolute",
          left: offsetX, top: offsetY,
          width: GAME_W, height: GAME_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          ...bgStyle,
          overflow: "hidden",
        }}>
          {/* Bg orbs */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="absolute rounded-full opacity-5"
                style={{ width: 100 + i * 50, height: 100 + i * 50, left: `${(i * 16) % 85}%`, top: `${(i * 23) % 70}%`, background: "#22c55e" }} />
            ))}
          </div>

          {/* Ground */}
          <div className="absolute bottom-0 left-0 right-0 h-20"
            style={{ background: "linear-gradient(0deg, rgba(16,44,8,0.9), transparent)", borderTop: "2px solid rgba(34,197,94,0.25)" }} />

          {/* Safe zone indicators */}
          <div className="absolute top-0 bottom-0" style={{ left: MARGIN - 2, width: 2, background: "rgba(255,255,255,0.04)" }} />
          <div className="absolute top-0 bottom-0" style={{ right: MARGIN - 2, width: 2, background: "rgba(255,255,255,0.04)" }} />

          {/* Falling items */}
          {items.map(item => (
            <div key={item.id} className="absolute pointer-events-none select-none"
              style={{ left: item.x - item.size / 2, top: item.y, transform: `rotate(${item.rotation}deg)`, width: item.size, height: item.size, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: item.size * 0.78, lineHeight: 1, filter: item.type === "spoiled" ? "saturate(0.25) brightness(0.65)" : item.type === "powerup" ? "drop-shadow(0 0 10px #60a5fa)" : "none", opacity: item.type === "spoiled" ? 0.65 : 1 }}>
                {item.emoji}
              </span>
              {item.type === "powerup" && (
                <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle, rgba(96,165,250,0.35), transparent)", animation: "powerupPulse 0.8s ease-in-out infinite" }} />
              )}
            </div>
          ))}

          {/* Avatar */}
          <div className="absolute transition-none" style={{ left: avatarX, bottom: 22, width: AVATAR_W, zIndex: 10 }}>
            <AvatarSVG outfit={outfit} size={AVATAR_W} animate={!reduceMotion} />
          </div>

          {/* Flash red */}
          {flashRed && (
            <div className="absolute inset-0 pointer-events-none z-30"
              style={{ background: "rgba(239,68,68,0.28)", animation: "flashRedAnim 0.35s ease-out forwards" }} />
          )}

          {/* Feedback messages */}
          {feedbacks.map((fb, idx) => (
            <div key={fb.id} className="absolute pointer-events-none z-20"
              style={{
                left: fb.x - 110, top: GAME_H - 180 - idx * 12,
                animation: reduceMotion ? "none" : "feedbackRise 1.8s ease-out forwards",
                opacity: reduceMotion ? 0.95 : undefined,
              }}>
              <div className="px-3 py-2 rounded-2xl flex flex-col items-center gap-0.5 max-w-[220px]"
                style={{ background: `${fb.color}ee`, boxShadow: `0 4px 20px ${fb.color}77`, border: `2px solid ${fb.color}` }}>
                <span className="text-white font-black text-sm leading-tight text-center" style={{ fontFamily: "'Fredoka One', cursive" }}>{fb.text}</span>
                {fb.sub && <span className="text-white/90 font-bold text-xs leading-tight text-center" style={{ fontFamily: "'Nunito', sans-serif" }}>{fb.sub}</span>}
              </div>
            </div>
          ))}

          {/* Win overlay */}
          {gs.won && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-40"
              style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}>
              {!reduceMotion && <Confetti reduceMotion={false} />}
              <div style={{ animation: reduceMotion ? "none" : "avatarBob 0.5s ease-in-out infinite alternate" }} className="text-6xl mb-3">🎉</div>
              <h2 className="text-4xl font-black text-white mb-1" style={{ fontFamily: "'Fredoka One', cursive", textShadow: "0 0 32px #22c55e" }}>¡Misión Cumplida!</h2>
              <p className="text-lg text-green-400 font-bold" style={{ fontFamily: "'Nunito', sans-serif" }}>Canasta completada · Procesando resultados...</p>
            </div>
          )}

          {/* Pause overlay */}
          {gs.paused && !gs.won && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-40 gap-4"
              style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(6px)" }}>
              <h2 className="text-3xl font-black text-white mb-2" style={{ fontFamily: "'Fredoka One', cursive" }}>⏸ Pausa</h2>
              {[
                { label: "Continuar", icon: <Play size={18} fill="white" />, fn: togglePause, color: "#22c55e" },
                { label: "Reiniciar", icon: <RotateCcw size={18} />, fn: () => { doneRef.current = false; onComplete({ ...gsRef.current, lives: 0, won: false }); }, color: "#f97316" },
                { label: "Menú principal", icon: <Home size={18} />, fn: onMenu, color: "#7c3aed" },
              ].map(btn => (
                <button key={btn.label} onClick={btn.fn}
                  className="flex items-center gap-3 px-8 py-3 rounded-full font-black text-lg text-white transition-all active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400"
                  style={{ fontFamily: "'Fredoka One', cursive", background: btn.color, minWidth: 220, minHeight: 52, boxShadow: `0 4px 16px ${btn.color}66` }}>
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Touch controls — always at bottom of wrapper, outside scaled area */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-between px-4 z-20 pointer-events-none">
          <button className="pointer-events-auto w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white"
            style={{ background: "rgba(255,255,255,0.12)", border: "2px solid rgba(255,255,255,0.25)", minWidth: 64, minHeight: 64, touchAction: "none", opacity: 0.8 }}
            onPointerDown={() => { touchLeft.current = true; }} onPointerUp={() => { touchLeft.current = false; }} onPointerLeave={() => { touchLeft.current = false; }}
            aria-label="Mover izquierda">◀</button>
          <button className="pointer-events-auto w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white"
            style={{ background: "rgba(255,255,255,0.12)", border: "2px solid rgba(255,255,255,0.25)", minWidth: 64, minHeight: 64, touchAction: "none", opacity: 0.8 }}
            onPointerDown={() => { touchRight.current = true; }} onPointerUp={() => { touchRight.current = false; }} onPointerLeave={() => { touchRight.current = false; }}
            aria-label="Mover derecha">▶</button>
        </div>
      </div>
    </div>
  );
}

// ─── Results Screen ───────────────────────────────────────────────────────────

function ResultsScreen({ level, gs, onContinue, onRepeat, outfit, seasonalConfig, reduceMotion }: {
  level: Level; gs: GameState; onContinue: () => void; onRepeat: () => void;
  outfit: number; seasonalConfig: SeasonalConfig | null; reduceMotion: boolean;
}) {
  const data = LEVEL_DATA[level];
  const stars = gs.errors === 0 ? 3 : gs.errors <= 3 ? 2 : 1;
  const vitaScore = Math.round((gs.score * 0.35) + (gs.balance * 2) + (gs.precision * 1.5) + (gs.uniqueItems.length * 25));

  const learnCards = level === 3 && seasonalConfig ? [
    { icon: seasonalConfig.products[0].emoji, title: seasonalConfig.products[0].name, desc: `Alimento característico del ${seasonalConfig.to.toLowerCase()} en Argentina. ${seasonalConfig.products[0].nutrient}.` },
    { icon: seasonalConfig.toEmoji, title: `Estación: ${seasonalConfig.to}`, desc: "Elegir alimentos de estación permite incorporar productos con mayor disponibilidad y precios más convenientes." },
    { icon: "🌈", title: "Variedad", desc: "Incorporar diferentes frutas y verduras permite sumar distintos nutrientes que el cuerpo necesita." },
  ] : level === 2 ? [
    { icon: "🍌", title: "Potasio", desc: "La banana es una buena fuente de potasio. Ayuda a los músculos y al sistema nervioso." },
    { icon: "🍊", title: "Vitamina C", desc: "Presente en cítricos como la naranja y el limón. Contribuye al sistema inmune y a la absorción del hierro." },
    { icon: "🥗", title: "Variedad", desc: "Elegir variedad permite incorporar diferentes nutrientes. No hay un solo alimento completo." },
  ] : [
    { icon: "🍎", title: "Frutas frescas", desc: "Una fruta sin golpes ni manchas conserva mejor sus nutrientes. Aprender a elegirlas es el primer paso." },
    { icon: "🥕", title: "Zanahoria", desc: "Rica en betacarotenos. El cuerpo los transforma en vitamina A, importante para la vista y las defensas." },
    { icon: "🌿", title: "Alimentos frescos", desc: "Los productos frescos y en buen estado suelen tener más nutrientes disponibles que los deteriorados." },
  ];

  return (
    <div className="w-full h-full overflow-y-auto flex flex-col items-center py-6 px-4 gap-5"
      style={{ background: "linear-gradient(135deg, #0d1b2a, #1a2e45)" }}>
      {!reduceMotion && gs.won && <Confetti reduceMotion={false} />}

      <div className="flex items-center gap-4">
        <div style={{ filter: "drop-shadow(0 0 24px #22c55e)" }}>
          <AvatarSVG outfit={outfit} size={80} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Fredoka One', cursive" }}>
            {gs.won ? "¡Resultados!" : "Tiempo agotado"}
          </h2>
          <div className="flex gap-1 mt-1" aria-label={`${stars} estrellas`}>
            {[1, 2, 3].map(i => <Star key={i} size={22} fill={i <= stars ? "#eab308" : "rgba(255,255,255,0.15)"} color={i <= stars ? "#eab308" : "rgba(255,255,255,0.15)"} />)}
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-white/55 text-sm font-bold" style={{ fontFamily: "'Nunito', sans-serif" }}>VitaScore</p>
        <p className="text-5xl font-black text-yellow-400" style={{ fontFamily: "'Fredoka One', cursive", textShadow: "0 0 24px rgba(234,179,8,0.45)" }}>
          {vitaScore.toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl">
        {[
          { label: "Balance", value: `${gs.balance}%`, color: "#22c55e" },
          { label: "Precisión", value: `${gs.precision}%`, color: "#f97316" },
          { label: "Variedad", value: gs.uniqueItems.length, color: "#7c3aed" },
          { label: "Tiempo extra", value: `${gs.timeLeft}s`, color: "#eab308" },
          { label: "Errores", value: gs.errors, color: "#ef4444" },
          { label: "Combo máx", value: `x${gs.maxCombo}`, color: "#60a5fa" },
          { label: "Puntuación", value: gs.score.toLocaleString(), color: "#f97316" },
          { label: "Estrellas", value: "★".repeat(stars) + "☆".repeat(3 - stars), color: "#eab308" },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-2xl flex flex-col items-center gap-1"
            style={{ background: `${s.color}14`, border: `1px solid ${s.color}3a` }}>
            <p className="text-xs text-white/55 font-bold" style={{ fontFamily: "'Nunito', sans-serif" }}>{s.label}</p>
            <p className="text-base font-black" style={{ fontFamily: "'Fredoka One', cursive", color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {gs.won && (
        <div className="p-4 rounded-2xl w-full max-w-xl flex items-center gap-4"
          style={{ background: "linear-gradient(135deg, rgba(234,179,8,0.18), rgba(249,115,22,0.18))", border: "2px solid #eab308" }}>
          <span className="text-4xl">{data.rewardEmoji}</span>
          <div>
            <p className="text-white/55 text-xs font-bold" style={{ fontFamily: "'Nunito', sans-serif" }}>¡Prenda desbloqueada!</p>
            <p className="text-xl font-black text-yellow-400" style={{ fontFamily: "'Fredoka One', cursive" }}>{data.reward}</p>
          </div>
          <div className="ml-auto">
            <AvatarSVG outfit={outfit} size={56} />
          </div>
        </div>
      )}

      <div className="w-full max-w-xl">
        <h3 className="text-lg font-black text-white mb-3" style={{ fontFamily: "'Fredoka One', cursive" }}>Lo que aprendiste</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {learnCards.map(c => (
            <div key={c.title} className="p-3 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <span className="text-2xl">{c.icon}</span>
              <p className="text-sm font-black text-white mt-1" style={{ fontFamily: "'Fredoka One', cursive" }}>{c.title}</p>
              <p className="text-xs text-white/60 mt-1 leading-relaxed" style={{ fontFamily: "'Nunito', sans-serif" }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 flex-wrap justify-center">
        <button onClick={onContinue}
          className="flex items-center gap-2 px-8 py-3 rounded-full font-black text-lg text-white transition-all active:scale-95 hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-400"
          style={{ fontFamily: "'Fredoka One', cursive", background: "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: "0 4px 16px rgba(249,115,22,0.4)", minHeight: 52 }}>
          Continuar <ChevronRight size={20} />
        </button>
        <button onClick={onRepeat}
          className="flex items-center gap-2 px-8 py-3 rounded-full font-black text-lg text-white transition-all active:scale-95 hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-400"
          style={{ fontFamily: "'Fredoka One', cursive", background: "rgba(34,197,94,0.18)", border: "2px solid #22c55e", minHeight: 52 }}>
          <RotateCcw size={18} /> Repetir
        </button>
      </div>
    </div>
  );
}

// ─── Profile Screen ───────────────────────────────────────────────────────────

function ProfileScreen({ outfitLevel, totalScore, onBack }: { outfitLevel: number; totalScore: number; onBack: () => void }) {
  const outfits = [
    { name: "Avatar base", emoji: "👦", reqLevel: 0 },
    { name: "Gorra Cítrica", emoji: "🧢", reqLevel: 1 },
    { name: "Remera VitaBalance", emoji: "👕", reqLevel: 2 },
    { name: "Capa VitaHero", emoji: "🦸", reqLevel: 3 },
  ];
  return (
    <div className="w-full h-full overflow-y-auto flex flex-col items-center py-8 px-4 gap-6 relative"
      style={{ background: "linear-gradient(135deg, #0d1b2a, #1a2e45)" }}>
      <button onClick={onBack} className="absolute top-4 left-4 p-3 rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-400"
        style={{ background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.2)", minWidth: 44, minHeight: 44 }}>
        <Home size={20} className="text-white" />
      </button>
      <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Fredoka One', cursive" }}>Mi Perfil</h2>
      <div style={{ filter: "drop-shadow(0 0 32px rgba(34,197,94,0.4))" }}>
        <AvatarSVG outfit={outfitLevel} size={110} animate />
      </div>
      <div className="text-center">
        <p className="text-3xl font-black text-yellow-400" style={{ fontFamily: "'Fredoka One', cursive" }}>{totalScore.toLocaleString()}</p>
        <p className="text-sm text-white/55" style={{ fontFamily: "'Nunito', sans-serif" }}>VitaScore total</p>
      </div>
      <div className="w-full max-w-md">
        <h3 className="text-lg font-black text-white mb-3" style={{ fontFamily: "'Fredoka One', cursive" }}>Prendas</h3>
        <div className="grid grid-cols-2 gap-3">
          {outfits.map(o => {
            const unlocked = outfitLevel >= o.reqLevel;
            return (
              <div key={o.name} className="p-4 rounded-2xl flex flex-col items-center gap-2"
                style={{ background: unlocked ? "rgba(34,197,94,0.14)" : "rgba(255,255,255,0.04)", border: `2px solid ${unlocked ? "#22c55e" : "rgba(255,255,255,0.08)"}`, opacity: unlocked ? 1 : 0.45 }}>
                <span className="text-3xl">{unlocked ? o.emoji : "🔒"}</span>
                <p className="text-sm font-black text-white text-center" style={{ fontFamily: "'Fredoka One', cursive" }}>{o.name}</p>
                {unlocked && <span className="text-xs text-green-400 font-bold" style={{ fontFamily: "'Nunito', sans-serif" }}>✓ Desbloqueada</span>}
              </div>
            );
          })}
        </div>
      </div>
      <div className="w-full max-w-md">
        <h3 className="text-lg font-black text-white mb-3" style={{ fontFamily: "'Fredoka One', cursive" }}>Progreso</h3>
        {[1, 2, 3].map(l => (
          <div key={l} className="flex items-center gap-3 p-3 rounded-xl mb-2" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <span className="text-xl">{LEVEL_DATA[l as Level].rewardEmoji}</span>
            <p className="text-sm font-bold text-white flex-1" style={{ fontFamily: "'Fredoka One', cursive" }}>{LEVEL_DATA[l as Level].title}</p>
            {outfitLevel >= l ? <span className="text-green-400 text-sm font-bold">✓</span> : outfitLevel === l - 1 ? <span className="text-yellow-400 text-xs">⚡ Desbloqueado</span> : <span className="text-white/25 text-sm">🔒</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Ranking Screen ───────────────────────────────────────────────────────────

function RankingScreen({ totalScore, onBack }: { totalScore: number; onBack: () => void }) {
  const rows = [
    { alias: "VitaHero99", score: 12400, balance: 98, precision: 95 },
    { alias: "FrutaFan", score: 10800, balance: 92, precision: 88 },
    { alias: "GreenGuard", score: 9500, balance: 90, precision: 85 },
    { alias: "NutriChamp", score: 8700, balance: 87, precision: 82 },
    { alias: "SaladKid", score: 7200, balance: 80, precision: 75 },
    { alias: "VerdeStar", score: 6100, balance: 75, precision: 70 },
  ];
  const withMe = [...rows, { alias: "Tú", score: totalScore, balance: 85, precision: 80 }]
    .sort((a, b) => b.score - a.score)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  return (
    <div className="w-full h-full overflow-y-auto flex flex-col items-center py-8 px-4 gap-4 relative"
      style={{ background: "linear-gradient(135deg, #0d1b2a, #1a2e45)" }}>
      <button onClick={onBack} className="absolute top-4 left-4 p-3 rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-400"
        style={{ background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.2)", minWidth: 44, minHeight: 44 }}>
        <Home size={20} className="text-white" />
      </button>
      <div className="flex items-center gap-3">
        <Trophy size={30} className="text-yellow-400" />
        <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Fredoka One', cursive" }}>Ranking demo</h2>
      </div>
      <p className="text-xs text-white/35 -mt-2" style={{ fontFamily: "'Nunito', sans-serif" }}>Simulación visual · Sin persistencia real</p>
      <div className="w-full max-w-lg">
        <div className="grid grid-cols-4 gap-2 px-4 py-2 text-xs text-white/35 font-bold" style={{ fontFamily: "'Nunito', sans-serif" }}>
          <span>#</span><span>Jugador</span><span className="text-right">VitaScore</span><span className="text-right">Precisión</span>
        </div>
        {withMe.map(r => (
          <div key={r.alias} className="grid grid-cols-4 gap-2 px-4 py-3 rounded-2xl items-center mb-2"
            style={{
              background: r.alias === "Tú" ? "rgba(249,115,22,0.18)" : "rgba(255,255,255,0.04)",
              border: `2px solid ${r.alias === "Tú" ? "#f97316" : r.rank <= 3 ? "#eab308" : "rgba(255,255,255,0.07)"}`,
            }}>
            <span className="font-black text-lg" style={{ fontFamily: "'Fredoka One', cursive", color: r.rank === 1 ? "#eab308" : r.rank === 2 ? "#94a3b8" : r.rank === 3 ? "#b45309" : "#fff" }}>
              {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : r.rank}
            </span>
            <span className="font-bold text-sm text-white" style={{ fontFamily: "'Nunito', sans-serif" }}>{r.alias}</span>
            <span className="text-right font-black text-sm text-yellow-400" style={{ fontFamily: "'Space Mono', monospace" }}>{r.score.toLocaleString()}</span>
            <span className="text-right text-xs text-white/55" style={{ fontFamily: "'Space Mono', monospace" }}>{r.precision}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── HowToPlay Screen ─────────────────────────────────────────────────────────

function HowToPlayScreen({ onBack }: { onBack: () => void }) {
  const tips = [
    { icon: "⬅️➡️", title: "Movimiento", desc: "Usá las flechas ← → o las teclas A/D para mover al avatar. También hay botones en pantalla." },
    { icon: "✅", title: "Producto correcto", desc: "+puntos, sube el balance, aumenta el combo si es diferente al anterior." },
    { icon: "❌", title: "Producto en mal estado", desc: "Perdés una vida. Reconocé frutas y verduras golpeadas, marchitas o deterioradas." },
    { icon: "⚠️", title: "Fuera de misión", desc: "No perdés vida, pero baja la precisión y se corta el combo." },
    { icon: "⭐", title: "Estrella Vita", desc: "Ralentiza la caída al 28% durante 3 segundos. Tiene brillo celeste." },
    { icon: "🔀", title: "Variedad", desc: "Alternar productos distintos activa el combo y sube el VitaScore más rápido." },
    { icon: "❄️", title: "Estaciones (N3)", desc: "En el Nivel 3 elegí los 5 productos de la estación objetivo. Los de otras estaciones reducen precisión." },
    { icon: "⏸", title: "Pausa", desc: "Presioná el botón ⏸ o la tecla Escape para pausar y acceder al menú." },
  ];
  return (
    <div className="w-full h-full overflow-y-auto flex flex-col items-center py-8 px-4 gap-4 relative"
      style={{ background: "linear-gradient(135deg, #0d1b2a, #1a2e45)" }}>
      <button onClick={onBack} className="absolute top-4 left-4 p-3 rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-400"
        style={{ background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.2)", minWidth: 44, minHeight: 44 }}>
        <Home size={20} className="text-white" />
      </button>
      <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Fredoka One', cursive" }}>Cómo jugar</h2>
      <p className="text-base font-black text-yellow-300 text-center" style={{ fontFamily: "'Fredoka One', cursive" }}>
        "No atrapás todo. Tomás decisiones."
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
        {tips.map(t => (
          <div key={t.title} className="p-4 rounded-2xl flex gap-3 items-start"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <span className="text-2xl flex-shrink-0">{t.icon}</span>
            <div>
              <p className="font-black text-white text-sm" style={{ fontFamily: "'Fredoka One', cursive" }}>{t.title}</p>
              <p className="text-xs text-white/60 mt-0.5 leading-relaxed" style={{ fontFamily: "'Nunito', sans-serif" }}>{t.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onBack}
        className="px-8 py-3 rounded-full font-black text-lg text-white transition-all active:scale-95 hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-400"
        style={{ fontFamily: "'Fredoka One', cursive", background: "linear-gradient(135deg, #f97316, #ea580c)", minHeight: 52 }}>
        ¡Entendido!
      </button>
    </div>
  );
}

// ─── Settings Screen ──────────────────────────────────────────────────────────

function SettingsScreen({ onBack, reduceMotion, onToggleMotion }: {
  onBack: () => void; reduceMotion: boolean; onToggleMotion: () => void;
}) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-4 gap-6 relative"
      style={{ background: "linear-gradient(135deg, #0d1b2a, #1a2e45)" }}>
      <button onClick={onBack} className="absolute top-4 left-4 p-3 rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-400"
        style={{ background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.2)", minWidth: 44, minHeight: 44 }}>
        <Home size={20} className="text-white" />
      </button>
      <Settings size={36} className="text-orange-400" />
      <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Fredoka One', cursive" }}>Configuración</h2>
      <div className="w-full max-w-sm flex flex-col gap-4">
        <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div>
            <p className="font-bold text-white text-sm" style={{ fontFamily: "'Nunito', sans-serif" }}>Reducir movimiento</p>
            <p className="text-xs text-white/40" style={{ fontFamily: "'Nunito', sans-serif" }}>Para mayor accesibilidad</p>
          </div>
          <button onClick={onToggleMotion} role="switch" aria-checked={reduceMotion}
            className="rounded-full transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 relative"
            style={{ width: 52, height: 28, background: reduceMotion ? "#22c55e" : "rgba(255,255,255,0.2)", minWidth: 52, minHeight: 28 }}>
            <div className="absolute top-1 w-5 h-5 rounded-full bg-white transition-all"
              style={{ left: reduceMotion ? "calc(100% - 24px)" : "4px", boxShadow: "0 2px 4px rgba(0,0,0,0.3)" }} />
          </button>
        </div>
        <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <p className="font-bold text-white text-sm mb-2" style={{ fontFamily: "'Nunito', sans-serif" }}>Controles de teclado</p>
          <div className="text-xs text-white/55 flex flex-col gap-1" style={{ fontFamily: "'Space Mono', monospace" }}>
            <span>← / A → mover izquierda</span>
            <span>→ / D → mover derecha</span>
            <span>Escape → pausar / reanudar</span>
          </div>
        </div>
        <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <p className="font-bold text-white text-sm mb-1" style={{ fontFamily: "'Nunito', sans-serif" }}>Accesibilidad</p>
          <p className="text-xs text-white/55 leading-relaxed" style={{ fontFamily: "'Nunito', sans-serif" }}>
            Contraste mínimo AA · Botones ≥44px · Foco visible · Navegación por teclado · Etiquetas accesibles
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Global CSS ───────────────────────────────────────────────────────────────

const globalCSS = `
@keyframes floatBg {
  from { transform: translateY(0px) rotate(0deg); }
  to   { transform: translateY(-16px) rotate(7deg); }
}
@keyframes avatarBob {
  from { transform: translateY(0px); }
  to   { transform: translateY(-7px); }
}
@keyframes twinkle {
  from { opacity: 0.25; transform: scale(0.8); }
  to   { opacity: 1;    transform: scale(1.2); }
}
@keyframes feedbackRise {
  0%   { opacity: 0; transform: translateY(0)   scale(0.85); }
  12%  { opacity: 1; transform: translateY(-14px) scale(1.05); }
  65%  { opacity: 1; transform: translateY(-44px) scale(1); }
  100% { opacity: 0; transform: translateY(-76px) scale(0.92); }
}
@keyframes confettiFall {
  0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
  100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
}
@keyframes flashRedAnim {
  0%   { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes powerupPulse {
  0%   { box-shadow: 0 0 6px #60a5fa; }
  50%  { box-shadow: 0 0 22px #60a5fa, 0 0 40px #93c5fd; }
  100% { box-shadow: 0 0 6px #60a5fa; }
}
`;

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [level, setLevel] = useState<Level>(1);
  const [unlockedLevel, setUnlockedLevel] = useState<Level>(1);
  const [outfitLevel, setOutfitLevel] = useState(0); // 0=base,1=cap,2=shirt,3=cape
  const [resultOutfit, setResultOutfit] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [lastGs, setLastGs] = useState<GameState | null>(null);
  const [seasonalConfigIdx, setSeasonalConfigIdx] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [prevScreen, setPrevScreen] = useState<Screen>("intro");

  const seasonalConfig = SEASONAL_CONFIGS[seasonalConfigIdx];

  const goTo = (s: Screen) => { setPrevScreen(screen); setScreen(s); };

  const handleSelectLevel = (l: Level) => {
    setLevel(l);
    if (l === 3) setSeasonalConfigIdx(Math.floor(Math.random() * SEASONAL_CONFIGS.length));
    goTo("objective");
  };

  const handleComplete = (gs: GameState) => {
    setLastGs(gs);
    let newOutfit = outfitLevel;
    if (gs.won && outfitLevel < level) {
      newOutfit = level;
      setOutfitLevel(level);
      if (level < 3) setUnlockedLevel(prev => Math.max(prev, (level + 1) as Level) as Level);
    }
    setResultOutfit(newOutfit);
    const vitaScore = Math.round((gs.score * 0.35) + (gs.balance * 2) + (gs.precision * 1.5) + (gs.uniqueItems.length * 25));
    setTotalScore(prev => prev + vitaScore);
    setScreen("results");
  };

  const handleContinue = () => {
    if (level < 3 && lastGs?.won) {
      setLevel(prev => Math.min(3, prev + 1) as Level);
    }
    goTo("mission-select");
  };

  const reduceMotionCSS = reduceMotion
    ? `* { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }`
    : "";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalCSS + reduceMotionCSS }} />
      <div className="w-full h-screen overflow-hidden flex flex-col" style={{ fontFamily: "'Nunito', sans-serif" }}>
        {/* Top nav for non-gameplay/intro screens */}
        {screen !== "gameplay" && screen !== "intro" && (
          <div className="flex items-center justify-between px-4 py-2 flex-shrink-0 z-50"
            style={{ background: "rgba(13,27,42,0.97)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <span className="font-black text-white text-lg" style={{ fontFamily: "'Fredoka One', cursive" }}>🌿 VitaBalance</span>
            <div className="flex gap-2">
              {screen !== "profile" && (
                <button onClick={() => goTo("profile")} aria-label="Perfil"
                  className="p-2.5 rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-400"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", minWidth: 44, minHeight: 44 }}>
                  <User size={17} className="text-white" />
                </button>
              )}
              {screen !== "ranking" && (
                <button onClick={() => goTo("ranking")} aria-label="Ranking"
                  className="p-2.5 rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", minWidth: 44, minHeight: 44 }}>
                  <Trophy size={17} className="text-yellow-400" />
                </button>
              )}
              <button onClick={() => goTo("settings")} aria-label="Configuración"
                className="p-2.5 rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", minWidth: 44, minHeight: 44 }}>
                <Settings size={17} className="text-white" />
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 relative overflow-hidden">
          {screen === "intro" && (
            <IntroScreen onPlay={() => goTo("mission-select")} onHowTo={() => goTo("howtoplay")} onSettings={() => goTo("settings")} outfitLevel={outfitLevel} />
          )}
          {screen === "howtoplay" && <HowToPlayScreen onBack={() => goTo("intro")} />}
          {screen === "settings" && (
            <SettingsScreen onBack={() => goTo(prevScreen)} reduceMotion={reduceMotion} onToggleMotion={() => setReduceMotion(p => !p)} />
          )}
          {screen === "mission-select" && (
            <MissionSelectScreen onSelect={handleSelectLevel} unlockedLevel={unlockedLevel} outfitLevel={outfitLevel} onBack={() => goTo("intro")} />
          )}
          {screen === "objective" && (
            <ObjectiveScreen level={level} seasonalConfig={level === 3 ? seasonalConfig : null} onStart={() => goTo("gameplay")} onBack={() => goTo("mission-select")} />
          )}
          {screen === "gameplay" && (
            <GameplayScreen
              key={`${level}-${seasonalConfigIdx}-${Date.now()}`}
              level={level}
              seasonalConfig={level === 3 ? seasonalConfig : null}
              onComplete={handleComplete}
              onMenu={() => goTo("intro")}
              outfit={outfitLevel}
              reduceMotion={reduceMotion}
            />
          )}
          {screen === "results" && lastGs && (
            <ResultsScreen
              level={level} gs={lastGs}
              onContinue={handleContinue} onRepeat={() => goTo("gameplay")}
              outfit={resultOutfit}
              seasonalConfig={level === 3 ? seasonalConfig : null}
              reduceMotion={reduceMotion}
            />
          )}
          {screen === "profile" && (
            <ProfileScreen outfitLevel={outfitLevel} totalScore={totalScore} onBack={() => goTo(prevScreen)} />
          )}
          {screen === "ranking" && (
            <RankingScreen totalScore={totalScore} onBack={() => goTo(prevScreen)} />
          )}
        </div>
      </div>
    </>
  );
}
