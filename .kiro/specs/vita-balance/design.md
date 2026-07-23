# Design Document

## Overview

VitaBalance: Guardianes de las Estaciones is an educational arcade web game where players aged 8–12 move an avatar horizontally to catch falling fruits and vegetables, learn about nutrition and seasonality, and progressively customize their character. Built with Phaser 3 and TypeScript, deployed as a static bundle on AWS Amplify with a serverless ranking backend (API Gateway + Lambda + DynamoDB).

The system uses a 4-layer architecture: Presentation (Phaser scenes), Systems (pure game logic), Configuration (data-driven parameters), and Services (external I/O). This separation ensures testability, maintainability, and independence from cloud services.

## Architecture

### High-Level Architecture


### Dependency Rules

- Scenes → Systems → Config/Types
- Scenes → Entities, UI components
- Scenes → Services (for orchestration only)
- Systems **never** import Services (pure logic, no I/O)
- Services → Types only

### Scene Navigation Flow


### Scene Launch Modes

| Mode | Usage | Mechanism |
|------|-------|-----------|
| Replace | Menu, Profile, Ranking, etc. | `scene.start(key, data)` |
| Parallel | HudScene during gameplay | `scene.launch('hud', data)` |
| Overlay | PauseScene | `scene.launch('pause')` + `scene.pause('level')` |

## Components and Interfaces

### Entities (src/entities/)

```typescript
// Player.ts — Avatar with layered outfit rendering
class Player extends Phaser.GameObjects.Container {
  setOutfit(level: number): void;
  moveLeft(dt: number): void;
  moveRight(dt: number): void;
  getBounds(): Phaser.Geom.Rectangle;
}

// Product.ts — Pooled falling item
class Product extends Phaser.GameObjects.Container {
  type: 'correct' | 'spoiled' | 'unsolicited' | 'powerup';
  speed: number;
  rotationSpeed: number;
  data: ProductConfig;
  reset(config: SpawnItemConfig): void;
  update(dt: number, speedMultiplier: number): void;
}

// PowerUp.ts — Estrella Vita with glow effect
class PowerUp extends Product {
  // Adds pulsing blue glow particle effect
}
// scoring-system.ts
function processCapture(state: GameState, item: CapturedItemData, config: ScoringConfig): Partial<GameState>;
function calculateVitaScore(state: GameState, config: ScoringConfig): number;

// objective-system.ts
function checkWinCondition(state: GameState, objective: LevelObjective): boolean;
function checkLoseCondition(state: GameState, timeLeft: number): boolean;

// spawn-system.ts
function selectItemType(probabilities: SpawnProbabilities): ItemType;
function createSpawnConfig(levelConfig: LevelConfig, seasonalConfig?: SeasonalCombination): SpawnItemConfig;

// progress-system.ts
function handleLevelComplete(level: number, won: boolean, progress: ProgressData): ProgressData;
function isLevelUnlocked(level: number, progress: ProgressData): boolean;

// collision-system.ts
function checkOverlap(avatar: Bounds, item: Bounds): boolean;

// audio-system.ts
class AudioSystem {
  init(scene: Phaser.Scene, settings: AudioSettings): void;
  playMusic(key: string): void;
  stopMusic(): void;
  playSFX(key: string): void;
  setVolume(volume: number): void;
  setMusicEnabled(enabled: boolean): void;
}
// storage-service.ts
class StorageService {
  static load(): SaveData;
  static save(data: SaveData): void;
  static reset(): void;
  static getProgress(): ProgressData;
  static saveProgress(progress: ProgressData): void;
  static getSettings(): SettingsData;
  static saveSettings(settings: SettingsData): void;
  static getProfile(): ProfileData;
  static saveProfile(profile: ProfileData): void;
}

// ranking-service.ts
class RankingService {
  static submit(entry: RankingSubmission): Promise<void>;
  static getTopScores(level: 1|2|3, limit?: number): Promise<RankingEntry[]>;
}

// api-client.ts
function fetchWithRetry(url: string, options: RequestInit, retries?: number, timeoutMs?: number): Promise<Response>;
// Button.ts — Pill-shaped accessible button (min 44×44)
class Button extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, config: ButtonConfig);
  setEnabled(enabled: boolean): void;
  onPress(callback: () => void): void;
}

// Toast.ts — Feedback notification (1.8s, stacks with 12px offset)
class Toast extends Phaser.GameObjects.Container {
  static show(scene: Phaser.Scene, config: ToastConfig): void;
}

// Toggle.ts — Accessible switch (role="switch", aria-checked)
class Toggle extends Phaser.GameObjects.Container {
  getValue(): boolean;
  setValue(value: boolean): void;
  onChange(callback: (value: boolean) => void): void;
}
interface GameState {
  score: number;
  lives: number;                        // starts at 3
  timeLeft: number;                     // seconds countdown
  paused: boolean;
  won: boolean;
  gameOver: boolean;
  balance: number;                      // 0–100
  precision: number;                    // 0–100 (%)
  combo: number;                        // current streak
  maxCombo: number;                     // session max
  errors: number;
  totalCaptures: number;
  correctCaptures: number;
  uniqueItems: string[];
  lastItemName: string;
  powerupActive: boolean;
  powerupTimeRemaining: number;
  totalCaught: number;                  // L1
  vitaminCCaught: boolean;              // L2
  potassiumCaught: boolean;             // L2
  checklist: Record<string, boolean>;   // L3
}
// src/config/products.ts
interface ProductConfig {
  id: string; name: string; emoji: string; nutrient: string;
  season: 'verano' | 'otono' | 'invierno' | 'primavera' | 'all';
  points: number; vitaminC?: boolean; potassium?: boolean;
}

// src/config/levels.ts
interface LevelConfig {
  id: 1 | 2 | 3; title: string; description: string;
  duration: number; baseSpeed: number; speedVariance: number; spawnInterval: number;
  spawnProbabilities: SpawnProbabilities;
  objective: LevelObjective; reward: AvatarReward; color: string; bgGradient: string;
}
type LevelObjective =
  | { type: 'count'; target: number }
  | { type: 'combine'; vitaminC: boolean; potassium: boolean; variety: number }
  | { type: 'seasonal'; products: string[] };

// src/config/scoring.ts — VitaScore = score×0.35 + balance×2 + variety×25 + comboMax×bonusCombo
interface ScoringConfig {
  scoreMultiplier: number; balanceMultiplier: number; varietyMultiplier: number; comboMaxBonus: number;
  balancePenaltyOnSpoiled: number; balanceGainOnCorrect: number; balanceMax: number;
  precisionPenaltyOnSpoiled: number; precisionPenaltyOnUnsolicited: number;
  comboBonusPerStreak: number; comboBonusMax: number;
}

// src/config/seasons.ts
interface SeasonConfig { id: string; name: string; emoji: string; color: string; months: number[]; products: string[]; }
interface SeasonalCombination { from: string; to: string; bgGradient: string; targetProducts: string[]; distractors: string[]; explanation: string; }
interface SaveData {
  version: number;
  progress: { levelsCompleted: number[]; unlockedLevel: 1|2|3; outfitLevel: number; };
  settings: { reduceMotion: boolean; musicEnabled: boolean; volume: number; };
  profile: { nickname: string; totalVitaScore: number; totalPoints: number; };
}
// Default: { version:1, progress:{levelsCompleted:[],unlockedLevel:1,outfitLevel:0}, settings:{reduceMotion:false,musicEnabled:true,volume:0.7}, profile:{nickname:'Jugador',totalVitaScore:0,totalPoints:0} }
interface RankingSubmission { alias: string; level: 1|2|3; vitaScore: number; precision: number; variety: number; }
interface RankingEntry { alias: string; vitaScore: number; precision: number; variety: number; createdAt: string; }
