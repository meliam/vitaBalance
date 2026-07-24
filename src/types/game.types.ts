/**
 * Core game type definitions for VitaBalance: Guardianes de las Estaciones.
 * Single source of truth for type safety and inter-module contracts.
 */

// ─── Item Types ──────────────────────────────────────────────────────────────

export type ItemType = 'correct' | 'spoiled' | 'unsolicited' | 'powerup';

// ─── Game State ──────────────────────────────────────────────────────────────

export interface GameState {
  score: number;
  lives: number; // starts at 3
  timeLeft: number; // seconds countdown
  paused: boolean;
  won: boolean;
  gameOver: boolean;
  balance: number; // 0–100
  precision: number; // 0–100 (%)
  combo: number; // current streak
  maxCombo: number; // session max
  errors: number;
  totalCaptures: number;
  correctCaptures: number;
  uniqueItems: string[];
  lastItemName: string;
  powerupActive: boolean;
  powerupTimeRemaining: number;
  totalCaught: number; // L1
  vitaminCCaught: boolean; // L2
  potassiumCaught: boolean; // L2
  checklist: Record<string, boolean>; // L3
}

// ─── Configuration Models ────────────────────────────────────────────────────

export interface ProductConfig {
  id: string;
  name: string;
  emoji: string;
  nutrient: string;
  season: 'verano' | 'otono' | 'invierno' | 'primavera' | 'all';
  points: number;
  vitaminC?: boolean;
  potassium?: boolean;
}

export interface SpawnProbabilities {
  correct: number;
  spoiled: number;
  unsolicited: number;
  powerup: number;
}

export type LevelObjective =
  | { type: 'count'; target: number }
  | { type: 'combine'; vitaminC: boolean; potassium: boolean; variety: number }
  | { type: 'seasonal'; products: string[] };

export interface AvatarReward {
  name: string;
  emoji: string;
  outfitLevel: number;
}

export interface LevelConfig {
  id: 1 | 2 | 3;
  title: string;
  description: string;
  duration: number;
  baseSpeed: number;
  speedVariance: number;
  spawnInterval: number;
  spawnProbabilities: SpawnProbabilities;
  objective: LevelObjective;
  reward: AvatarReward;
  color: string;
  bgGradient: string;
}

export interface ScoringConfig {
  scoreMultiplier: number;
  balanceMultiplier: number;
  varietyMultiplier: number;
  comboMaxBonus: number;
  balancePenaltyOnSpoiled: number;
  balanceGainOnCorrect: number;
  balanceMax: number;
  precisionPenaltyOnSpoiled: number;
  precisionPenaltyOnUnsolicited: number;
  comboBonusPerStreak: number;
  comboBonusMax: number;
}

export interface SeasonConfig {
  id: string;
  name: string;
  emoji: string;
  color: string;
  months: number[];
  products: string[];
}

export interface SeasonalCombination {
  from: string;
  to: string;
  bgGradient: string;
  targetProducts: string[];
  distractors: string[];
  explanation: string;
}

// ─── Spawn System ────────────────────────────────────────────────────────────

export interface SpawnItemConfig {
  type: ItemType;
  productConfig: ProductConfig;
  x: number;
  speed: number;
}

// ─── Capture Data ────────────────────────────────────────────────────────────

export interface CapturedItemData {
  type: ItemType;
  name: string;
  vitaminC?: boolean;
  potassium?: boolean;
}

// ─── Geometry ────────────────────────────────────────────────────────────────

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ─── Persistence Models ──────────────────────────────────────────────────────

export interface ProgressData {
  levelsCompleted: number[];
  unlockedLevel: 1 | 2 | 3;
  outfitLevel: number;
}

export interface SettingsData {
  reduceMotion: boolean;
  musicEnabled: boolean;
  volume: number;
}

export interface ProfileData {
  nickname: string;
  totalVitaScore: number;
  totalPoints: number;
}

export interface SaveData {
  version: number;
  progress: ProgressData;
  settings: SettingsData;
  profile: ProfileData;
}

// ─── Audio ───────────────────────────────────────────────────────────────────

export interface AudioSettings {
  musicEnabled: boolean;
  volume: number;
}

// ─── UI Components ───────────────────────────────────────────────────────────

export interface ButtonConfig {
  x: number;
  y: number;
  text: string;
  color?: string;
  width?: number;
  height?: number;
  fontSize?: number;
  onClick?: () => void;
}

export interface ToastConfig {
  text: string;
  subtext: string;
  color: string;
  x: number;
  y: number;
}
