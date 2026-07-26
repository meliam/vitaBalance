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
```

### Systems (src/systems/)

```typescript
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
```

### Services (src/services/)

```typescript
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
```

### UI Components (src/ui/)

```typescript
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
```

## Data Models

The following TypeScript interfaces define the core data structures used across systems, configuration, and services. They are the single source of truth for type safety and inter-module contracts.

### Game State

```typescript
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
```

### Configuration Models

```typescript
// src/config/products.ts
interface ProductConfig {
  id: string;
  name: string;
  emoji: string;
  nutrient: string;
  season: 'verano' | 'otono' | 'invierno' | 'primavera' | 'all';
  points: number;
  vitaminC?: boolean;
  potassium?: boolean;
}

// src/config/levels.ts
interface LevelConfig {
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

type LevelObjective =
  | { type: 'count'; target: number }
  | { type: 'combine'; vitaminC: boolean; potassium: boolean; variety: number }
  | { type: 'seasonal'; products: string[] };

// src/config/scoring.ts — VitaScore = score×0.35 + balance×2 + variety×25 + comboMax×bonusCombo
interface ScoringConfig {
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

// src/config/seasons.ts
interface SeasonConfig {
  id: string;
  name: string;
  emoji: string;
  color: string;
  months: number[];
  products: string[];
}

interface SeasonalCombination {
  from: string;
  to: string;
  bgGradient: string;
  targetProducts: string[];
  distractors: string[];
  explanation: string;
}
```

### Persistence Models

```typescript
interface SaveData {
  version: number;
  progress: {
    levelsCompleted: number[];
    unlockedLevel: 1 | 2 | 3;
    outfitLevel: number;
  };
  settings: {
    reduceMotion: boolean;
    musicEnabled: boolean;
    volume: number;
  };
  profile: {
    nickname: string;
    totalVitaScore: number;
    totalPoints: number;
  };
}
// Default: { version:1, progress:{levelsCompleted:[],unlockedLevel:1,outfitLevel:0},
//            settings:{reduceMotion:false,musicEnabled:true,volume:0.7},
//            profile:{nickname:'Jugador',totalVitaScore:0,totalPoints:0} }
```

### Ranking Models

```typescript
interface RankingSubmission {
  alias: string;
  level: 1 | 2 | 3;
  vitaScore: number;
  precision: number;
  variety: number;
}

interface RankingEntry {
  alias: string;
  vitaScore: number;
  precision: number;
  variety: number;
  createdAt: string;
}
```

## Correctness Properties

The following invariants must hold for all game logic. These properties serve as formal contracts for property-based testing and manual verification.

Property 1: Capture accounting identity
- **Validates: Requirements 2.4**
- totalCaptures == correctCaptures + errorCaptures (spoiled + unsolicited)
- `state.totalCaptures === state.correctCaptures + state.errors + unsolicitedCaptures`
- Where `errors` counts spoiled captures and `unsolicitedCaptures` counts non-mission captures.

Property 2: Precision formula correctness
- **Validates: Requirements 2.4**
- `state.precision === (state.correctCaptures / state.totalCaptures) * 100` when `totalCaptures > 0`.
- When `totalCaptures === 0`, precision is `0`.

Property 3: Lives bounded [0, 3]
- **Validates: Requirements 3.1, 3.2**
- At all times: `0 <= state.lives <= 3`.
- Lives start at 3 and only decrease on spoiled capture. They never increase.

Property 4: Combo resets on error capture
- **Validates: Requirements 2.3**
- After capturing a Spoiled_Product or Unsolicited_Product: `state.combo === 0`.

Property 5: Combo increments on distinct correct capture
- **Validates: Requirements 2.2**
- After capturing a Correct_Product with `item.name !== state.lastItemName`: `state.combo === previousCombo + 1`.

Property 6: maxCombo is monotonically non-decreasing
- **Validates: Requirements 2.7**
- `state.maxCombo >= previousMaxCombo` after any capture event.

Property 7: VitaScore uses configurable coefficients
- **Validates: Requirements 2.7, 2.8**
- `vitaScore === state.score * config.scoreMultiplier + state.balance * config.balanceMultiplier + state.uniqueItems.length * config.varietyMultiplier + state.maxCombo * config.comboMaxBonus`
- No hardcoded numeric values in the calculation.

Property 8: Estrella Vita speed multiplier is exactly 0.28 for exactly 3 seconds
- **Validates: Requirements 4.1**
- While `state.powerupActive === true`: all product speeds are multiplied by 0.28.
- Duration is exactly 3000ms from activation.

Property 9: Level unlock is sequential
- **Validates: Requirements 22.1, 22.2, 22.3, 22.4**
- `isLevelUnlocked(N) === true` requires `levelsCompleted.includes(N - 1)` for N > 1.
- Level 1 is always unlocked.

Property 10: Variety never exceeds available products
- **Validates: Requirements 2.6**
- `state.uniqueItems.length <= totalUniqueProductsInLevel`
- The variety counter only increments for products not already in `uniqueItems`.

Property 11: Spawn probabilities sum to 1.0
- **Validates: Requirements 1.6**
- `spawnProbabilities.correct + spawnProbabilities.spoiled + spawnProbabilities.unsolicited + spawnProbabilities.powerup === 1.0`

Property 12: Balance bounded [0, balanceMax]
- **Validates: Requirements 2.5**
- At all times: `0 <= state.balance <= config.balanceMax`.

## Error Handling

The game prioritizes uninterrupted gameplay. External failures must never crash the game or block user interaction.

### Ranking Service Unavailable

- **Behavior:** Game continues normally. Score submission silently fails.
- **UI feedback:** Non-intrusive toast: "Ranking temporalmente no disponible" displayed for ~3 seconds.
- **Retry:** `fetchWithRetry` attempts up to 2 retries with exponential backoff (1s, 2s) before failing.
- **Impact:** Player can still play, view local results, and retry submission later.

### localStorage Unavailable or Corrupted

- **Behavior:** Game starts with default `SaveData` values (Level 1 unlocked, base avatar, default settings).
- **UI feedback:** None — the player is not shown an error.
- **Detection:** `StorageService.load()` wraps access in try/catch. On any exception or invalid JSON, returns defaults.
- **Write failures:** `StorageService.save()` catches exceptions silently. Progress for that session is lost but gameplay continues.

### Asset Loading Failure

- **Behavior:** `PreloadScene` retries failed assets up to 2 times before proceeding.
- **Fallback:** Missing sprites render as colored rectangles with text labels. Missing audio is skipped.
- **UI feedback:** If critical assets fail after retries, display a friendly reload prompt: "Algo salió mal. ¿Reintentar?"

### WebFont Loading Failure

- **Behavior:** Font loading uses a timeout of 3 seconds via `document.fonts.load()`.
- **Fallback:** If fonts fail to load, the game proceeds with system fallback fonts (`sans-serif` for body, `monospace` for scores).
- **UI feedback:** None — the game is fully playable with fallback fonts.

### General Principles

- No `unhandledrejection` or uncaught exceptions should propagate to the user.
- All async service calls use try/catch at the scene orchestration level.
- Error boundaries do not exist in Phaser, so each scene's `create()` and `update()` must handle their own exceptions gracefully.

## Testing Strategy

Testing follows the quality principles defined in `quality.md`. The focus is on verifying pure game logic without coupling to the Phaser rendering engine.

### Unit Tests (Vitest)

| System | File | Focus |
|--------|------|-------|
| scoring-system | `tests/unit/scoring-system.test.ts` | Points, combo, precision, balance, VitaScore calculation |
| objective-system | `tests/unit/objective-system.test.ts` | Win/lose conditions for all 3 levels |
| spawn-system | `tests/unit/spawn-system.test.ts` | Probability distribution, item type selection |
| progress-system | `tests/unit/progress-system.test.ts` | Level unlock, reward assignment, persistence logic |
| collision-system | `tests/unit/collision-system.test.ts` | Overlap detection with boundary cases |

### Property-Based Tests (fast-check + Vitest)

Property-based tests validate the correctness properties defined above using randomized inputs.

| Property | Test |
|----------|------|
| totalCaptures == correctCaptures + errors + unsolicited | Random sequences of captures maintain accounting identity |
| Lives ∈ [0, 3] | No sequence of events produces lives outside bounds |
| Precision formula | Random capture sequences produce correct precision |
| Combo resets on spoiled/unsolicited | Random interleaving of capture types maintains combo invariant |
| VitaScore uses config coefficients | Randomized configs produce expected formula output |
| Level unlock is sequential | Random progression sequences respect unlock order |
| Variety ≤ available products | Random captures never exceed unique product count |
| Balance ∈ [0, balanceMax] | Random sequences keep balance within configured bounds |

### Smoke Tests

| Flow | Validation |
|------|-----------|
| Happy path Level 1 | Boot → Preload → Menu → Level1 → capture 8 → VictoryScene |
| Defeat Level 1 | Boot → Level1 → lose 3 lives → GameOverScene |
| Ranking unavailable | Game loads and plays without errors when API returns 500 |

### Testing Principles

- **No Phaser mocking:** Systems are pure functions that receive and return typed data. Tests never instantiate Phaser scenes or game objects.
- **Explicit mocks:** `localStorage` and `fetch` are mocked explicitly where needed.
- **Deterministic randomness:** Tests that involve randomness (spawn, seasonal selection) seed the RNG for reproducibility.
- **Coverage target:** ≥ 80% line coverage on `src/systems/` modules.
