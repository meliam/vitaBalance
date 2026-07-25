# Implementation Plan

## Overview

Full implementation of an educational arcade web game using Phaser 3 + TypeScript + Vite. Tasks are ordered by dependency: project scaffold → types/config → pure systems → services → entities → UI components → scenes → integration/testing. Property-based tests use fast-check + Vitest to validate the 12 correctness properties from the design document.

## Tasks

- [x] 1. Project scaffold and tooling setup
  - [x] 1.1 Initialize project with pnpm, Vite, TypeScript, and Phaser 3
    - Run `pnpm init`, install `phaser`, `typescript`, `vite`, `vitest`, `fast-check`, `@typescript-eslint/eslint-plugin`, `prettier`
    - Create `index.html` shell, `vite.config.ts`, `tsconfig.json` (strict: true), `.eslintrc.cjs`, `.prettierrc`, `.gitignore`
    - Configure `package.json` scripts: dev, build, preview, lint, format, test, test:watch
    - Create `src/main.ts` entry point with Phaser game instance (1280×520, FIT scale mode)
    - Create directory structure: `src/config/`, `src/types/`, `src/systems/`, `src/entities/`, `src/ui/`, `src/scenes/`, `src/services/`, `src/utils/`, `tests/unit/`, `public/assets/sprites/`, `public/assets/ui/`, `public/assets/audio/`, `public/assets/fonts/`
    - _Requirements: 14.1, 14.2, 16.1–16.5_

- [x] 2. Core types and interfaces
  - [x] 2.1 Create `src/types/game.types.ts`
    - Define `GameState`, `ProductConfig`, `LevelConfig`, `LevelObjective`, `ScoringConfig`, `SeasonConfig`, `SeasonalCombination`, `SpawnProbabilities`, `SpawnItemConfig`, `CapturedItemData`, `Bounds`, `AvatarReward`, `ProgressData`, `SaveData`, `SettingsData`, `ProfileData`, `AudioSettings`, `ButtonConfig`, `ToastConfig`
    - All interfaces must match the Data Models section in design.md exactly
    - _Requirements: 2.1–2.8, 3.1, 4.1, 5.1–5.5, 6.1–6.5, 7.1–7.5_

  - [x] 2.2 Create `src/types/api.types.ts`
    - Define `RankingSubmission`, `RankingEntry` interfaces
    - _Requirements: 12.1, 12.2, 12.3_

- [x] 3. Data-driven configuration modules
  - [x] 3.1 Create `src/config/scoring.ts`
    - Export typed `ScoringConfig` object with all VitaScore formula coefficients (scoreMultiplier: 0.35, balanceMultiplier: 2, varietyMultiplier: 25, comboMaxBonus, balancePenaltyOnSpoiled, balanceGainOnCorrect, balanceMax: 100, precisionPenalties, comboBonusPerStreak, comboBonusMax)
    - _Requirements: 2.7, 2.8, 16.4_

  - [x] 3.2 Create `src/config/products.ts`
    - Export typed array of `ProductConfig` objects for all 15+ products (Naranja, Banana, Brócoli, Frutilla, Espinaca, Zanahoria, Manzana, Tomate, Kiwi, Sandía, Durazno, Mandarina, Choclo, Zapallo, Pera)
    - Each entry: id, name, emoji, nutrient, season, points, vitaminC?, potassium?
    - _Requirements: 8.1, 16.1_

  - [x] 3.3 Create `src/config/seasons.ts`
    - Export typed array of `SeasonConfig` objects for Verano, Otoño, Invierno, Primavera (with months and product IDs)
    - Export `SeasonalCombination[]` for Level 3 pairings (Primavera→Invierno, Invierno→Verano, Verano→Otoño, Otoño→Primavera)
    - _Requirements: 7.1, 16.2_

  - [x] 3.4 Create `src/config/levels.ts`
    - Export typed array of `LevelConfig` for 3 levels with duration, baseSpeed, speedVariance, spawnInterval, spawnProbabilities, objective, reward, color, bgGradient
    - Level 1: 60s, speed 1.6, spawn 1.3s, objective count:8
    - Level 2: 75s, speed 2.2, spawn 0.95s, objective combine (vitC, potassium, variety:5)
    - Level 3: 90s, speed 2.8, spawn 0.72s, objective seasonal (5 products)
    - _Requirements: 5.1, 6.1, 7.1, 16.3_

  - [x] 3.5 Create `src/config/game-config.ts`
    - Export Phaser.Types.Core.GameConfig with: type AUTO, width 1280, height 520, scale mode FIT, scene list, physics (none — manual movement), backgroundColor
    - _Requirements: 14.1, 14.2_

- [x] 4. Checkpoint — Verify project builds
  - Ensure `pnpm build` runs without errors. Ensure `pnpm lint` passes. Ask the user if questions arise.

- [x] 5. Scoring system
  - [x] 5.1 Implement `src/systems/scoring-system.ts`
    - `processCapture(state: GameState, item: CapturedItemData, config: ScoringConfig): Partial<GameState>` — handles points, combo increment/reset, precision recalculation, balance adjustment, variety tracking, maxCombo update
    - `calculateVitaScore(state: GameState, config: ScoringConfig): number` — applies formula: score×scoreMultiplier + balance×balanceMultiplier + uniqueItems.length×varietyMultiplier + maxCombo×comboMaxBonus
    - All coefficients read from config, no hardcoded numbers
    - _Requirements: 2.1–2.8_

  - [x] 5.2 Write property tests for scoring system
    - **Property 1: Capture accounting identity** — For any sequence of captures, totalCaptures === correctCaptures + errors + unsolicitedCaptures
    - **Property 2: Precision formula correctness** — For any state with totalCaptures > 0, precision === (correctCaptures / totalCaptures) × 100
    - **Property 4: Combo resets on error capture** — For any capture of Spoiled or Unsolicited product, resulting combo === 0
    - **Property 5: Combo increments on distinct correct capture** — For any correct capture with different name than last, combo === prev + 1
    - **Property 6: maxCombo is monotonically non-decreasing** — For any capture event, resulting maxCombo >= previous maxCombo
    - **Property 7: VitaScore uses configurable coefficients** — For any GameState and ScoringConfig, vitaScore equals the formula applied with those config values
    - **Property 12: Balance bounded [0, balanceMax]** — For any sequence of captures, balance stays within [0, config.balanceMax]
    - **Validates: Requirements 2.1–2.8**

  - [x] 5.3 Write unit tests for scoring system edge cases
    - Test: first capture sets precision to 100%
    - Test: capturing same product consecutively does NOT increment combo
    - Test: VitaScore is 0 when all metrics are 0
    - Test: balance does not go below 0 on multiple spoiled captures
    - _Requirements: 2.1–2.8_

- [x] 6. Objective system
  - [x] 6.1 Implement `src/systems/objective-system.ts`
    - `checkWinCondition(state: GameState, objective: LevelObjective): boolean` — evaluates victory for count, combine, and seasonal objective types
    - `checkLoseCondition(state: GameState, timeLeft: number): boolean` — returns true when lives === 0
    - Level 1 (count): correctCaptures >= target
    - Level 2 (combine): vitaminCCaught && potassiumCaught && uniqueItems.length >= variety
    - Level 3 (seasonal): all required products in checklist are true
    - _Requirements: 5.2, 5.3, 6.2, 6.3, 7.2, 7.3_

  - [x] 6.2 Write unit tests for objective system
    - Test all 3 level objective types (count, combine, seasonal)
    - Test lose condition triggers at 0 lives
    - Test partial completion does not trigger win
    - **Property 3: Lives bounded [0, 3]** — For any game state, lives is always in [0, 3]
    - **Validates: Requirements 3.1, 3.2, 5.2, 5.3, 6.2, 6.3, 7.2, 7.3**

- [x] 7. Spawn system
  - [x] 7.1 Implement `src/systems/spawn-system.ts`
    - `selectItemType(probabilities: SpawnProbabilities): ItemType` — weighted random selection (correct 52%, spoiled 18%, unsolicited 18%, powerup 12%)
    - `createSpawnConfig(levelConfig: LevelConfig, seasonalConfig?: SeasonalCombination): SpawnItemConfig` — selects a product from the appropriate pool based on item type and seasonal constraints
    - Use seeded RNG for testability (accept optional seed parameter)
    - _Requirements: 1.5, 1.6, 1.7_

  - [x] 7.2 Write property tests for spawn system
    - **Property 11: Spawn probabilities sum to 1.0** — For any LevelConfig, the sum of all probabilities equals 1.0 (within floating point tolerance)
    - Test: over 10000 samples, distribution approximates configured probabilities within 5% tolerance
    - **Validates: Requirements 1.5, 1.6**

- [x] 8. Progress system
  - [x] 8.1 Implement `src/systems/progress-system.ts`
    - `handleLevelComplete(level: number, won: boolean, progress: ProgressData): ProgressData` — updates levelsCompleted, unlocks next level, assigns outfitLevel
    - `isLevelUnlocked(level: number, progress: ProgressData): boolean` — Level 1 always unlocked, Level N requires N-1 completed
    - `getRewardForLevel(level: number): AvatarReward` — returns reward name for completed level
    - _Requirements: 5.4, 6.4, 7.4, 9.1–9.5, 22.1–22.6_

  - [x] 8.2 Write property tests for progress system
    - **Property 9: Level unlock is sequential** — For any level N > 1, isLevelUnlocked(N) requires levelsCompleted.includes(N-1). Level 1 is always unlocked.
    - **Property 10: Variety never exceeds available products** — For any sequence of captures, uniqueItems.length <= total unique products in level
    - **Validates: Requirements 22.1–22.4**

  - [x] 8.3 Write unit tests for progress system
    - Test: completing level 1 unlocks level 2
    - Test: completing level 2 unlocks level 3
    - Test: locked level returns false from isLevelUnlocked
    - Test: losing does not unlock next level
    - _Requirements: 22.1–22.5_

- [x] 9. Collision system
  - [x] 9.1 Implement `src/systems/collision-system.ts`
    - `checkOverlap(avatar: Bounds, item: Bounds): boolean` — AABB overlap detection
    - Pure function, no Phaser dependencies
    - _Requirements: 1.3_

  - [x] 9.2 Write unit tests for collision system
    - Test: overlapping rectangles return true
    - Test: non-overlapping rectangles return false
    - Test: edge-touching rectangles (boundary behavior)
    - _Requirements: 1.3_

- [x] 10. Audio system
  - [x] 10.1 Implement `src/systems/audio-system.ts`
    - Class `AudioSystem` with methods: init, playMusic, stopMusic, playSFX, setVolume, setMusicEnabled
    - Wraps Phaser.Sound; reads settings from AudioSettings
    - Respects musicEnabled toggle and volume level
    - _Requirements: 21.1–21.10_

- [x] 11. Utility modules
  - [x] 11.1 Create `src/utils/math-helpers.ts`
    - `clamp(value, min, max)`, `randomBetween(min, max)`, `lerp(a, b, t)`, `weightedRandom(options: {value, weight}[])`
    - _Requirements: 1.7_

  - [x] 11.2 Create `src/utils/accessibility.ts`
    - `prefersReducedMotion(): boolean` — checks `window.matchMedia('(prefers-reduced-motion: reduce)')`
    - `getReducedMotionSetting(settings: SettingsData): boolean` — returns manual override OR OS preference
    - _Requirements: 15.3, 15.7_

  - [x] 11.3 Create `src/utils/constants.ts`
    - Export game-wide constants: GAME_WIDTH (1280), GAME_HEIGHT (520), MIN_TOUCH_TARGET (44), TOAST_DURATION (1800), POWERUP_DURATION (3000), POWERUP_SPEED_FACTOR (0.28), MAX_LIVES (3), FLASH_DURATION (350), FLASH_OPACITY (0.28)
    - _Requirements: 3.1, 4.1, 8.1, 14.1, 14.4, 15.6_

- [x] 12. Checkpoint — Ensure all system tests pass
  - Run `pnpm test` and ensure all unit and property tests pass. Ask the user if questions arise.

- [x] 13. Services layer
  - [x] 13.1 Implement `src/services/api-client.ts`
    - `fetchWithRetry(url: string, options: RequestInit, retries?: number, timeoutMs?: number): Promise<Response>` — exponential backoff (1s, 2s), AbortController timeout, try/catch wrapping
    - Reads base URL from `import.meta.env.VITE_API_URL`
    - _Requirements: 12.4_

  - [x] 13.2 Implement `src/services/storage-service.ts`
    - Static class `StorageService` with methods: load, save, reset, getProgress, saveProgress, getSettings, saveSettings, getProfile, saveProfile
    - Wraps localStorage with try/catch; returns defaults on failure
    - Default SaveData: version 1, progress (levelsCompleted:[], unlockedLevel:1, outfitLevel:0), settings (reduceMotion:false, musicEnabled:true, volume:0.7), profile (nickname:'Jugador', totalVitaScore:0, totalPoints:0)
    - _Requirements: 17.1–17.5_

  - [x] 13.3 Implement `src/services/ranking-service.ts`
    - Static class `RankingService` with methods: submit(entry: RankingSubmission): Promise<void>, getTopScores(level, limit?): Promise<RankingEntry[]>
    - Uses `fetchWithRetry` internally; catches errors and fails silently
    - _Requirements: 12.1–12.4_

  - [x] 13.4 Write unit tests for storage-service
    - Mock localStorage; test load/save round trip, corrupted data fallback, unavailable localStorage
    - _Requirements: 17.3, 17.4_

- [x] 14. UI components
  - [x] 14.1 Implement `src/ui/Button.ts`
    - Extends Phaser.GameObjects.Container; pill-shaped with configurable text, color, size
    - Minimum 44×44 touch target; visible focus indicator (4px ring on keyboard focus)
    - Methods: setEnabled, onPress, setFocused
    - Keyboard-navigable: responds to Enter when focused
    - _Requirements: 14.4, 15.1, 15.2_

  - [x] 14.2 Implement `src/ui/Toast.ts`
    - Static method `show(scene, config)` — displays product name + nutrient + points for 1.8s
    - Positioned above Player_Avatar, clamped 80px from edges
    - Stacks vertically with 12px offset on rapid successive captures
    - Auto-fades out after TOAST_DURATION
    - _Requirements: 8.1–8.5_

  - [x] 14.3 Implement `src/ui/Toggle.ts`
    - Extends Phaser.GameObjects.Container; accessible switch (role="switch", aria-checked equivalent via visual state)
    - Methods: getValue, setValue, onChange
    - Visible focus indicator; keyboard Enter toggles
    - _Requirements: 15.7, 19.2, 19.3_

  - [x] 14.4 Implement `src/ui/ConfettiEffect.ts`
    - Particle-based confetti that respects reduced-motion (disabled when reduceMotion is true)
    - Triggered on victory
    - _Requirements: 11.1, 15.3_

- [x] 15. Game entities
  - [x] 15.1 Implement `src/entities/Player.ts`
    - Extends Phaser.GameObjects.Container; layered outfit rendering (base body + cap + shirt + cape)
    - `setOutfit(level: number)` — shows accumulated outfit items based on progress
    - `moveLeft(dt)` / `moveRight(dt)` — moves at 14 px/frame within game bounds
    - `getBounds(): Phaser.Geom.Rectangle` — returns collision bounds
    - Touch input support: follow touch X position on lower half of screen
    - _Requirements: 1.1, 1.2, 9.1–9.5_

  - [x] 15.2 Implement `src/entities/Product.ts`
    - Extends Phaser.GameObjects.Container; uses object pooling pattern (reset method)
    - Properties: type ('correct'|'spoiled'|'unsolicited'|'powerup'), speed, rotationSpeed, data (ProductConfig)
    - `reset(config: SpawnItemConfig)` — reconfigures for reuse from pool
    - `update(dt, speedMultiplier)` — applies gravity and rotation
    - Visual differentiation: Spoiled products have distorted shape + dark overlay texture (not color-only)
    - _Requirements: 1.4, 1.5, 1.7, 15.5_

  - [x] 15.3 Implement `src/entities/PowerUp.ts`
    - Extends Product; adds pulsing blue glow particle effect
    - Visual indicator makes it distinct from regular products
    - _Requirements: 4.1_

- [x] 16. Checkpoint — Verify build passes with entities and UI
  - Ensure `pnpm build` succeeds with all entities and UI components. Ask the user if questions arise.

- [x] 17. BootScene and PreloadScene
  - [x] 17.1 Implement `src/scenes/BootScene.ts`
    - Initializes Phaser engine settings
    - Immediately transitions to PreloadScene
    - _Requirements: 18.1_

  - [x] 17.2 Implement `src/scenes/PreloadScene.ts`
    - Displays a progress bar showing asset loading percentage
    - Loads all sprites, audio, UI assets, and web fonts (Fredoka One, Nunito, Space Mono with 3s timeout)
    - Retry failed assets up to 2 times; fallback to colored rectangles for missing sprites, system fonts for missing fonts
    - Transitions to MenuScene on completion
    - _Requirements: 18.2, 18.3, 18.4_

- [x] 18. MenuScene and navigation
  - [x] 18.1 Implement `src/scenes/MenuScene.ts`
    - Displays game title, Player_Avatar with current outfit, "¡Jugar!" button, "Cómo jugar" button, settings icon
    - "¡Jugar!" transitions to MissionSelect sub-state (can be inline or separate scene)
    - MissionSelect shows 3 level cards: unlocked levels are colored and interactive, locked levels are grayed out with lock icon and non-interactive
    - Selecting unlocked level shows ObjectiveScreen with level goal description and "¡Comenzar!" button
    - Top nav bar with Profile, Ranking, Settings icons (visible on non-gameplay screens)
    - Full keyboard navigation: Tab between elements, Enter to select
    - _Requirements: 13.1–13.5, 15.1, 22.6_

- [x] 19. LevelScene — Core gameplay
  - [x] 19.1 Implement `src/scenes/LevelScene.ts`
    - Generic scene parametrized by level ID (1, 2, or 3); reads LevelConfig from config
    - Initializes GameState: score 0, lives 3, timer from config, balance 100, precision 0, combo 0, etc.
    - Creates Player entity with current outfit; handles keyboard (left/right, A/D) and touch input
    - Spawns products using spawn-system at configured interval; manages object pool
    - Runs collision detection each frame using collision-system; on overlap triggers processCapture
    - Applies Estrella Vita power-up: sets speedMultiplier to 0.28 for 3000ms on powerup capture
    - Red screen flash (28% opacity, 350ms) on spoiled capture; respects reduced-motion
    - Checks win/lose conditions via objective-system each frame
    - On win: transitions to VictoryScene with game stats
    - On lose (0 lives or time up without objective met): transitions to GameOverScene
    - Launches HudScene in parallel; launches PauseScene on Escape/pause button
    - Disposes unused resources on scene shutdown
    - _Requirements: 1.1–1.7, 2.1–2.6, 3.1–3.5, 4.1–4.4, 5.1–5.5, 6.1–6.5, 7.1–7.5, 15.3, 15.6, 18.5_

- [x] 20. HudScene — Overlay UI during gameplay
  - [x] 20.1 Implement `src/scenes/HudScene.ts`
    - Launched in parallel with LevelScene; displays on top
    - Shows: score, lives (heart icons), countdown timer, balance bar, combo counter, pause button
    - Level 1: progress indicator "X/8 productos"
    - Level 2: three checkable indicators (Vitamina C ✓/✗, Potasio ✓/✗, Variedad X/5)
    - Level 3: seasonal checklist showing 5 target products (captured ✓ / not yet)
    - Estrella Vita active indicator: blue pulsing dot + countdown seconds
    - Updates every frame from shared game state (via scene data or event bus)
    - _Requirements: 4.2, 5.5, 6.5, 7.5_

- [x] 21. PauseScene
  - [x] 21.1 Implement `src/scenes/PauseScene.ts`
    - Launched as overlay; pauses LevelScene (freezes timer, products, avatar)
    - Displays 3 buttons: "Continuar" (resume), "Reiniciar" (restart level), "Menú principal" (return to menu)
    - "Continuar" resumes LevelScene exactly as before pause
    - "Reiniciar" restarts the current level from initial state
    - "Menú principal" discards session and navigates to MenuScene
    - Keyboard: Escape resumes, Tab navigates buttons, Enter selects
    - _Requirements: 10.1–10.5_

- [x] 22. VictoryScene
  - [x] 22.1 Implement `src/scenes/VictoryScene.ts`
    - Displays confetti animation (disabled if reduceMotion), star rating (3 stars: 0 errors, 2 stars: 1–3 errors, 1 star: 4+ errors)
    - Shows VitaScore, detailed stats (Balance, Precisión, Variedad, Tiempo extra, Errores, Combo máx, Puntuación, Estrellas)
    - Shows unlocked reward (Gorra Cítrica, Remera VitaBalance, or Capa VitaHero)
    - Shows educational "Lo que aprendiste" section
    - Buttons: "Continuar" (next level or mission select), "Repetir" (replay same level)
    - Alias input field for ranking submission (1–16 chars, alphanumeric + spaces); pre-filled from localStorage nickname
    - On submit: calls RankingService.submit; on failure shows non-intrusive toast
    - Calls progress-system to unlock next level and persist progress
    - _Requirements: 11.1, 11.3, 11.5, 11.6, 11.7, 5.4, 6.4, 7.4, 9.2–9.5_

- [x] 23. GameOverScene
  - [x] 23.1 Implement `src/scenes/GameOverScene.ts`
    - Displays motivational non-punitive message, partial VitaScore, and stats
    - Buttons: "Reintentar" (replay same level), "Menú" (return to menu)
    - Optional alias input for partial score submission
    - _Requirements: 11.2, 11.4_

- [x] 24. RankingScene
  - [x] 24.1 Implement `src/scenes/RankingScene.ts`
    - Fetches and displays top scores for selected level from RankingService
    - Level selector tabs (Level 1, 2, 3)
    - Displays entries: rank, alias, VitaScore, precision, variety
    - Ordered by VitaScore descending
    - On API failure: shows "Ranking temporalmente no disponible" toast
    - Back button returns to previous screen
    - _Requirements: 12.1–12.4_

- [x] 25. ProfileScene
  - [x] 25.1 Implement `src/scenes/ProfileScene.ts`
    - Displays Player_Avatar at current outfit level with animated idle bob
    - Shows: accumulated VitaScore total, total points, nickname
    - Displays current outfit name and badge/outfit collection grid (locked vs unlocked items)
    - Shows level progression status: completed (checkmark), next available (highlighted), locked
    - If no nickname set, shows "Jugador" placeholder with edit option
    - Persists nickname changes to localStorage
    - _Requirements: 20.1–20.6_

- [x] 26. HowToPlayScene
  - [x] 26.1 Implement `src/scenes/HowToPlayScene.ts`
    - Displays control instructions (keyboard and touch)
    - Game objectives overview for all 3 levels
    - Product type explanations (correct, unsolicited, spoiled, power-up) with visual examples
    - Back button to MenuScene
    - _Requirements: 19.1_

- [x] 27. SettingsScene
  - [x] 27.1 Implement `src/scenes/SettingsScene.ts`
    - "Reducir movimiento" toggle — applies immediately, persists to localStorage
    - Music on/off toggle — toggles AudioSystem music immediately, persists
    - Volume slider/control — adjusts master volume immediately, persists
    - Keyboard control reference section
    - Accessibility information block
    - Nutritional disclaimer: "La información nutricional es orientativa y educativa. No reemplaza el consejo de un profesional de la salud."
    - Back button returns to previous screen
    - _Requirements: 15.7, 19.2, 19.3, 19.4, 21.7, 21.8, 21.9_

- [x] 28. Checkpoint — All scenes implemented
  - Ensure `pnpm build` succeeds with all scenes registered in game-config. Verify scene navigation flow manually or via console. Ask the user if questions arise.

- [x] 29. Audio integration
  - [x] 29.1 Wire AudioSystem into LevelScene and menu scenes
    - Level start: play background music loop
    - Correct capture: positive chime SFX
    - Spoiled capture: negative buzz SFX
    - Unsolicited capture: neutral SFX
    - Victory: fanfare SFX
    - Defeat: gentle game-over sound
    - Load saved audio settings on game boot (via StorageService)
    - _Requirements: 21.1–21.10_

- [x] 30. Accessibility pass
  - [x] 30.1 Implement full keyboard navigation across all scenes
    - Tab order follows visual layout in menus and result screens
    - Enter activates focused element; Escape goes back or pauses
    - Visible 4px focus ring on all interactive elements
    - _Requirements: 15.1, 15.2_

  - [x] 30.2 Implement reduced-motion support
    - Check prefersReducedMotion() + manual toggle from settings
    - Disable confetti, reduce falling animations to simple vertical translation, disable decorative particles
    - _Requirements: 15.3, 15.7_

  - [x] 30.3 Verify contrast and non-color differentiation
    - Ensure all text meets 4.5:1 contrast ratio (3:1 for large text)
    - Spoiled products differentiated by shape distortion + texture, not color alone
    - Screen flash limited to single 350ms pulse, never > 3 flashes/sec
    - _Requirements: 15.4, 15.5, 15.6_

  - [x] 30.4 Implement touch controls for mobile
    - Display left/right arrow buttons (64×64 px minimum) at bottom of viewport on touch devices
    - All interactive elements maintain 44×44 minimum touch target
    - _Requirements: 14.3, 14.4_

- [x] 31. Responsive scaling verification
  - [x] 31.1 Verify Phaser FIT scale mode across viewports
    - Test at 640×360 (minimum), 1024×768 (tablet), 1280×520 (base), 1920×1080 (full HD)
    - Ensure no critical UI elements outside viewport or under notch/nav bar
    - Ensure text and HUD scale proportionally
    - _Requirements: 14.1–14.4_

- [x] 32. Educational feedback integration
  - [x] 32.1 Wire Toast component into LevelScene capture events
    - On correct capture: show "[Product name] · [Nutrient] · +[points]" for 1.8s
    - On spoiled capture: show "¡Ese no estaba bien!" for 1.8s
    - On unsolicited capture: show "[Product name] · No es de esta misión" for 1.8s
    - Level 3 correct: additionally show season indicator
    - Stacking behavior with 12px offset on rapid captures
    - _Requirements: 8.1–8.5_

- [x] 33. Estrella Vita power-up integration
  - [x] 33.1 Wire power-up activation in LevelScene
    - On Estrella_Vita capture: set powerupActive = true, speedMultiplier = 0.28 for all products (existing + newly spawned)
    - Start 3000ms timer; on expiry restore speedMultiplier to 1.0
    - HUD shows blue pulsing indicator with countdown
    - _Requirements: 4.1–4.4_

  - [x] 33.2 Write property test for Estrella Vita
    - **Property 8: Estrella Vita speed multiplier is exactly 0.28 for exactly 3 seconds** — While powerupActive is true, all product speeds are multiplied by 0.28; duration is exactly 3000ms
    - **Validates: Requirements 4.1**

- [x] 34. Checkpoint — Full game loop working
  - Ensure the complete flow works: Boot → Preload → Menu → select Level 1 → play → capture 8 → Victory → progress saved. Ensure `pnpm build` and `pnpm test` pass. Ask the user if questions arise.

- [x] 35. Ranking integration end-to-end
  - [x] 35.1 Wire ranking submission from VictoryScene and GameOverScene
    - Validate alias input (1–16 chars, alphanumeric + spaces only)
    - Submit via RankingService; handle API failure gracefully with toast
    - Pre-fill alias from localStorage nickname
    - Persist nickname on successful submission
    - _Requirements: 11.5, 11.6, 11.7, 12.1–12.4_

- [x] 36. Local persistence integration
  - [x] 36.1 Wire StorageService across all scenes
    - On game boot: load saved progress, settings, profile
    - On level complete: save updated progress
    - On settings change: save immediately
    - On profile nickname change: save immediately
    - On corrupted/unavailable localStorage: use defaults silently
    - _Requirements: 17.1–17.5_

- [x] 37. Error handling hardening
  - [x] 37.1 Add global error boundaries and graceful fallbacks
    - Wrap all async service calls in try/catch at scene level
    - PreloadScene: retry failed assets up to 2 times, fallback to colored rectangles/system fonts
    - Font loading: 3s timeout, fallback to sans-serif/monospace
    - Ranking API: non-intrusive toast on failure, game continues
    - No unhandledrejection or uncaught exceptions reaching the user
    - _Requirements: 12.4, 17.4, 18.4_

- [x] 38. Final checkpoint — All tests pass, build clean
  - Run `pnpm lint`, `pnpm test`, `pnpm build`. Ensure zero errors. Ask the user if questions arise.

## Task Dependency Graph

```
1 -> 2
2 -> 3
3 -> 4
4 -> 5
4 -> 6
4 -> 7
4 -> 8
4 -> 9
4 -> 10
4 -> 11
5 -> 12
6 -> 12
7 -> 12
8 -> 12
9 -> 12
10 -> 12
11 -> 12
12 -> 13
12 -> 14
12 -> 15
13 -> 16
14 -> 16
15 -> 16
16 -> 17
16 -> 18
17 -> 19
18 -> 19
17 -> 20
18 -> 20
17 -> 21
18 -> 21
19 -> 22
20 -> 22
21 -> 22
19 -> 23
20 -> 23
21 -> 23
19 -> 24
20 -> 24
21 -> 24
19 -> 25
20 -> 25
21 -> 25
19 -> 26
20 -> 26
21 -> 26
19 -> 27
20 -> 27
21 -> 27
22 -> 28
23 -> 28
24 -> 28
25 -> 28
26 -> 28
27 -> 28
28 -> 29
28 -> 30
28 -> 31
28 -> 32
28 -> 33
29 -> 34
30 -> 34
31 -> 34
32 -> 34
33 -> 34
34 -> 35
34 -> 36
34 -> 37
35 -> 38
36 -> 38
37 -> 38
```

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate the 12 universal correctness properties from the design document using fast-check
- Unit tests validate specific examples and edge cases
- Systems are pure functions — no Phaser mocking needed for testing
- The project uses pnpm as package manager and Vitest for all testing
- All configuration values are in `src/config/` — never hardcoded in scenes or systems
