import Phaser from 'phaser';
import type {
  GameState,
  CapturedItemData,
  LevelConfig,
  SeasonalCombination,
  SpawnItemConfig,
} from '../types/game.types';
import { Player } from '../entities/Player';
import { Product } from '../entities/Product';
import { PowerUp } from '../entities/PowerUp';
import { Toast } from '../ui/Toast';
import { LEVELS } from '../config/levels';
import { SCORING_CONFIG } from '../config/scoring';
import { seasonalCombinations } from '../config/seasons';
import { processCapture, calculateVitaScore } from '../systems/scoring-system';
import { checkWinCondition, checkLoseCondition } from '../systems/objective-system';
import { createSpawnConfig } from '../systems/spawn-system';
import { checkOverlap } from '../systems/collision-system';
import { StorageService } from '../services/storage-service';
import { AudioSystem } from '../systems/audio-system';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  MAX_LIVES,
  POWERUP_DURATION,
  POWERUP_SPEED_FACTOR,
  FLASH_DURATION,
  FLASH_OPACITY,
  REDUCED_MOTION_SPEED_FACTOR,
} from '../utils/constants';

/**
 * LevelScene — Core gameplay scene, parametrized by level ID (1, 2, or 3).
 *
 * Manages the game loop: spawning products, player movement, collision detection,
 * scoring, power-ups, win/lose conditions, and scene transitions.
 *
 * @see Requirements 1.1–1.7, 2.1–2.6, 3.1–3.5, 4.1–4.4, 5.1–5.5, 6.1–6.5, 7.1–7.5, 15.3, 15.6, 18.5
 */
export class LevelScene extends Phaser.Scene {
  // ─── Configuration ───────────────────────────────────────────────────────────
  private levelConfig!: LevelConfig;
  private seasonalConfig?: SeasonalCombination;

  // ─── Game State ──────────────────────────────────────────────────────────────
  private state!: GameState;

  // ─── Entities ────────────────────────────────────────────────────────────────
  private player!: Player;
  private productPool: Product[] = [];
  private powerUpPool: PowerUp[] = [];

  // ─── Input ───────────────────────────────────────────────────────────────────
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyEsc!: Phaser.Input.Keyboard.Key;
  private touchLeft = false;
  private touchRight = false;

  // ─── Timers & State ──────────────────────────────────────────────────────────
  private spawnTimer!: Phaser.Time.TimerEvent;
  private speedMultiplier = 1.0;
  private powerupActive = false;
  private powerupTimerEvent: Phaser.Time.TimerEvent | null = null;

  // ─── Audio ────────────────────────────────────────────────────────────────────
  private audioSystem = new AudioSystem();

  // ─── Visual Feedback ─────────────────────────────────────────────────────────
  private damageFlash!: Phaser.GameObjects.Rectangle;
  private reduceMotion = false;

  constructor() {
    super({ key: 'LevelScene' });
  }

  // ─── Scene Lifecycle ─────────────────────────────────────────────────────────

  init(data: { level: 1 | 2 | 3 }): void {
    const levelId = data.level || 1;
    this.levelConfig = LEVELS[levelId - 1];

    // Load settings
    const settings = StorageService.getSettings();
    this.reduceMotion = settings.reduceMotion;
    this.registry.set('reduceMotion', this.reduceMotion);

    // For Level 3: randomly select a seasonal combination
    if (levelId === 3) {
      const randomIndex = Math.floor(Math.random() * seasonalCombinations.length);
      this.seasonalConfig = seasonalCombinations[randomIndex];

      // Populate the objective's products array from the selected combination
      if (this.levelConfig.objective.type === 'seasonal') {
        this.levelConfig = {
          ...this.levelConfig,
          objective: {
            type: 'seasonal',
            products: [...this.seasonalConfig.targetProducts],
          },
        };
      }
    } else {
      this.seasonalConfig = undefined;
    }

    // Initialize game state
    this.state = {
      score: 0,
      lives: MAX_LIVES,
      timeLeft: this.levelConfig.duration,
      paused: false,
      won: false,
      gameOver: false,
      balance: 100,
      precision: 0,
      combo: 0,
      maxCombo: 0,
      errors: 0,
      totalCaptures: 0,
      correctCaptures: 0,
      uniqueItems: [],
      lastItemName: '',
      powerupActive: false,
      powerupTimeRemaining: 0,
      totalCaught: 0,
      vitaminCCaught: false,
      potassiumCaught: false,
      checklist: {},
    };

    // For Level 3: initialize checklist with target products set to false
    if (levelId === 3 && this.seasonalConfig) {
      for (const product of this.seasonalConfig.targetProducts) {
        this.state.checklist[product] = false;
      }
    }

    // Reset power-up state
    this.speedMultiplier = this.reduceMotion ? REDUCED_MOTION_SPEED_FACTOR : 1.0;
    this.powerupActive = false;
    this.powerupTimerEvent = null;
  }

  create(): void {
    // Reset touch state
    this.touchLeft = false;
    this.touchRight = false;

    // Clear any stale pools from previous scene execution
    // (shutdown() may not fire reliably in Phaser scene transitions)
    this.productPool = [];
    this.powerUpPool = [];

    // Ensure game state is clean
    this.state.paused = false;
    this.state.won = false;
    this.state.gameOver = false;

    // Register shutdown cleanup (Phaser scene event)
    this.events.once('shutdown', this.shutdown, this);

    // Initialize audio system with saved settings
    const settings = StorageService.getSettings();
    this.audioSystem.init(this, { musicEnabled: settings.musicEnabled, volume: settings.volume });
    if (settings.musicEnabled && !this.sound.mute) {
      this.audioSystem.playMusic('bgm-level');
    }

    // Create player with current outfit
    const progress = StorageService.getProgress();
    this.player = new Player(this, GAME_WIDTH / 2, GAME_HEIGHT - 50);
    this.player.setOutfit(progress.outfitLevel);

    // Setup keyboard input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keyA = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyEsc = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Create object pools
    this.createObjectPools();

    // Create damage flash overlay
    this.damageFlash = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0xff0000,
      0,
    );
    this.damageFlash.setDepth(100);

    // Start spawn timer
    this.spawnTimer = this.time.addEvent({
      delay: this.levelConfig.spawnInterval * 1000,
      callback: this.spawnProduct,
      callbackScope: this,
      loop: true,
    });

    // Share game state via registry
    this.registry.set('gameState', this.state);

    // Launch HUD scene in parallel
    this.scene.launch('HudScene', { state: this.state, levelConfig: this.levelConfig });

    // Setup pause on Escape key
    this.keyEsc.on('down', this.handlePause, this);

    // Create visible touch controls for touch devices
    this.createTouchControls();
  }

  update(_time: number, delta: number): void {
    if (this.state.paused || this.state.gameOver || this.state.won) return;

    const dt = delta;

    // ── Timer countdown ──
    this.state.timeLeft -= delta / 1000;
    if (this.state.timeLeft <= 0) {
      this.state.timeLeft = 0;
      this.handleTimeUp();
      return;
    }

    // ── Player input ──
    this.handlePlayerInput(dt);

    // ── Update player (touch handling) ──
    this.player.update();

    // ── Update products ──
    this.updateProducts(dt);

    // ── Collision detection ──
    this.checkCollisions();

    // ── Power-up countdown ──
    if (this.state.powerupActive && this.powerupTimerEvent) {
      this.state.powerupTimeRemaining = Math.max(0,
        (POWERUP_DURATION - this.powerupTimerEvent.elapsed) / 1000
      );
    }

    // ── Win/Lose conditions ──
    if (checkLoseCondition(this.state, this.state.timeLeft)) {
      this.handleLose();
      return;
    }

    if (checkWinCondition(this.state, this.levelConfig.objective)) {
      this.handleWin();
      return;
    }

    // ── Update registry for HudScene ──
    this.registry.set('gameState', this.state);
  }

  shutdown(): void {
    // Stop audio
    this.audioSystem.stopMusic();

    // Stop all tweens and timers
    this.tweens.killAll();
    if (this.spawnTimer) this.spawnTimer.destroy();
    if (this.powerupTimerEvent) this.powerupTimerEvent.destroy();

    // Destroy products in pool
    for (const product of this.productPool) {
      product.destroy();
    }
    for (const powerUp of this.powerUpPool) {
      powerUp.destroy();
    }
    this.productPool = [];
    this.powerUpPool = [];

    // Remove keyboard listeners
    this.keyEsc.off('down', this.handlePause, this);

    // Stop HUD scene unconditionally (covers active, paused, or sleeping states)
    this.scene.stop('HudScene');
  }

  // ─── Object Pool ─────────────────────────────────────────────────────────────

  private createObjectPools(): void {
    // Pre-create ~16 regular products and ~4 power-ups
    for (let i = 0; i < 16; i++) {
      const product = new Product(this, -100, -100);
      product.setActive(false);
      product.setVisible(false);
      this.productPool.push(product);
    }

    for (let i = 0; i < 4; i++) {
      const powerUp = new PowerUp(this, -100, -100);
      powerUp.setActive(false);
      powerUp.setVisible(false);
      this.powerUpPool.push(powerUp);
    }
  }

  private getInactiveProduct(): Product | null {
    for (const product of this.productPool) {
      if (!product.active) return product;
    }
    return null;
  }

  private getInactivePowerUp(): PowerUp | null {
    for (const powerUp of this.powerUpPool) {
      if (!powerUp.active) return powerUp;
    }
    return null;
  }

  // ─── Spawn System ────────────────────────────────────────────────────────────

  private spawnProduct(): void {
    const config: SpawnItemConfig = createSpawnConfig(this.levelConfig, this.seasonalConfig);

    if (config.type === 'powerup') {
      const powerUp = this.getInactivePowerUp();
      if (powerUp) {
        powerUp.reset(config);
      }
    } else {
      const product = this.getInactiveProduct();
      if (product) {
        product.reset(config);
      }
    }
  }

  // ─── Player Input ────────────────────────────────────────────────────────────

  private handlePlayerInput(dt: number): void {
    if (this.cursors.left.isDown || this.keyA.isDown || this.touchLeft) {
      this.player.moveLeft(dt);
    } else if (this.cursors.right.isDown || this.keyD.isDown || this.touchRight) {
      this.player.moveRight(dt);
    }
  }

  // ─── Touch Controls ──────────────────────────────────────────────────────────

  /**
   * Creates visible left/right arrow buttons at the bottom of the viewport
   * for touch devices. Buttons are 64×64px minimum, positioned at bottom corners.
   * Complements the existing touch-to-follow behavior in Player.ts.
   *
   * @see Requirements 14.3, 14.4
   */
  private createTouchControls(): void {
    if (!this.sys.game.device.input.touch) return;

    const btnSize = 64;
    const margin = 20;
    const y = GAME_HEIGHT - btnSize / 2 - margin;

    // ── Left arrow button ──
    const leftBtn = this.add.graphics();
    // Button background
    leftBtn.fillStyle(0xffffff, 0.3);
    leftBtn.fillRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 12);
    // Left-pointing arrow triangle
    leftBtn.fillStyle(0xffffff, 0.8);
    leftBtn.fillTriangle(-10, 0, 10, -15, 10, 15);
    leftBtn.setPosition(btnSize / 2 + margin, y);
    leftBtn.setInteractive(
      new Phaser.Geom.Rectangle(-btnSize / 2, -btnSize / 2, btnSize, btnSize),
      Phaser.Geom.Rectangle.Contains,
    );
    leftBtn.setDepth(50);

    leftBtn.on('pointerdown', () => {
      this.touchLeft = true;
    });
    leftBtn.on('pointerup', () => {
      this.touchLeft = false;
    });
    leftBtn.on('pointerout', () => {
      this.touchLeft = false;
    });

    // ── Right arrow button ──
    const rightBtn = this.add.graphics();
    // Button background
    rightBtn.fillStyle(0xffffff, 0.3);
    rightBtn.fillRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 12);
    // Right-pointing arrow triangle
    rightBtn.fillStyle(0xffffff, 0.8);
    rightBtn.fillTriangle(10, 0, -10, -15, -10, 15);
    rightBtn.setPosition(GAME_WIDTH - btnSize / 2 - margin, y);
    rightBtn.setInteractive(
      new Phaser.Geom.Rectangle(-btnSize / 2, -btnSize / 2, btnSize, btnSize),
      Phaser.Geom.Rectangle.Contains,
    );
    rightBtn.setDepth(50);

    rightBtn.on('pointerdown', () => {
      this.touchRight = true;
    });
    rightBtn.on('pointerup', () => {
      this.touchRight = false;
    });
    rightBtn.on('pointerout', () => {
      this.touchRight = false;
    });
  }

  // ─── Product Updates ─────────────────────────────────────────────────────────

  private updateProducts(dt: number): void {
    for (const product of this.productPool) {
      if (product.active) {
        product.update(dt, this.speedMultiplier);
      }
    }
    for (const powerUp of this.powerUpPool) {
      if (powerUp.active) {
        powerUp.update(dt, this.speedMultiplier);
      }
    }
  }

  // ─── Collision Detection ─────────────────────────────────────────────────────

  private checkCollisions(): void {
    const playerBounds = this.player.getBounds();
    const avatarBounds = {
      x: playerBounds.x,
      y: playerBounds.y,
      width: playerBounds.width,
      height: playerBounds.height,
    };

    // Check regular products
    for (const product of this.productPool) {
      if (!product.active) continue;

      const itemBounds = {
        x: product.x - 24,
        y: product.y - 24,
        width: 48,
        height: 48,
      };

      if (checkOverlap(avatarBounds, itemBounds)) {
        this.handleProductCapture(product);
      }
    }

    // Check power-ups
    for (const powerUp of this.powerUpPool) {
      if (!powerUp.active) continue;

      const itemBounds = {
        x: powerUp.x - 24,
        y: powerUp.y - 24,
        width: 48,
        height: 48,
      };

      if (checkOverlap(avatarBounds, itemBounds)) {
        this.handlePowerUpCapture(powerUp);
      }
    }
  }

  // ─── Capture Handling ────────────────────────────────────────────────────────

  private handleProductCapture(product: Product): void {
    const capturedItem: CapturedItemData = {
      type: product.type,
      name: product.productData.name,
      vitaminC: product.productData.vitaminC,
      potassium: product.productData.potassium,
    };

    // Process scoring
    const updates = processCapture(this.state, capturedItem, SCORING_CONFIG);
    Object.assign(this.state, updates);

    // Level 3: update checklist if product is in target products
    if (
      this.levelConfig.objective.type === 'seasonal' &&
      product.type === 'correct' &&
      this.levelConfig.objective.products.includes(product.productData.id)
    ) {
      this.state.checklist[product.productData.id] = true;
    }

    // Audio feedback based on capture type
    if (product.type === 'correct') {
      this.audioSystem.playSFX('sfx-correct');
    } else if (product.type === 'spoiled') {
      this.audioSystem.playSFX('sfx-spoiled');
    } else if (product.type === 'unsolicited') {
      this.audioSystem.playSFX('sfx-unsolicited');
    }

    // Toast feedback based on capture type
    if (product.type === 'correct') {
      const seasonText = this.levelConfig.id === 3 ? ' · Estacional ✓' : '';
      Toast.show(this, {
        text: `${product.productData.name} · ${product.productData.nutrient}${seasonText}`,
        subtext: `+${product.productData.points}`,
        color: '#4CAF50',
        x: this.player.x,
        y: this.player.y - 60,
      });
    } else if (product.type === 'spoiled') {
      Toast.show(this, {
        text: '¡Ese no estaba bien!',
        subtext: '-1 ❤️',
        color: '#f44336',
        x: this.player.x,
        y: this.player.y - 60,
      });
    } else if (product.type === 'unsolicited') {
      Toast.show(this, {
        text: `${product.productData.name} · No es de esta misión`,
        subtext: '',
        color: '#FF9800',
        x: this.player.x,
        y: this.player.y - 60,
      });
    }

    // Damage feedback for spoiled products
    if (product.type === 'spoiled') {
      this.showDamageFlash();
    }

    // Deactivate product
    product.setActive(false);
    product.setVisible(false);
  }

  private handlePowerUpCapture(powerUp: PowerUp): void {
    const capturedItem: CapturedItemData = {
      type: 'powerup',
      name: powerUp.productData.name,
      vitaminC: powerUp.productData.vitaminC,
      potassium: powerUp.productData.potassium,
    };

    // Process scoring (minimal impact for powerups)
    const updates = processCapture(this.state, capturedItem, SCORING_CONFIG);
    Object.assign(this.state, updates);

    // Activate power-up effect
    this.activatePowerUp();

    // Deactivate power-up entity
    powerUp.setActive(false);
    powerUp.setVisible(false);
  }

  // ─── Estrella Vita Power-Up ──────────────────────────────────────────────────

  private activatePowerUp(): void {
    this.powerupActive = true;
    this.speedMultiplier = POWERUP_SPEED_FACTOR;
    this.state.powerupActive = true;
    this.state.powerupTimeRemaining = POWERUP_DURATION / 1000;

    // Cancel existing power-up timer if any
    if (this.powerupTimerEvent) {
      this.powerupTimerEvent.destroy();
    }

    // Start expiry timer
    this.powerupTimerEvent = this.time.delayedCall(POWERUP_DURATION, () => {
      const baseSpeed = (this.registry.get('reduceMotion') as boolean)
        ? REDUCED_MOTION_SPEED_FACTOR
        : 1.0;
      this.speedMultiplier = baseSpeed;
      this.powerupActive = false;
      this.state.powerupActive = false;
      this.state.powerupTimeRemaining = 0;
      this.powerupTimerEvent = null;
    });
  }

  // ─── Damage Feedback ─────────────────────────────────────────────────────────

  private showDamageFlash(): void {
    if (this.reduceMotion) return;

    this.damageFlash.setAlpha(FLASH_OPACITY);
    this.tweens.add({
      targets: this.damageFlash,
      alpha: 0,
      duration: FLASH_DURATION,
      ease: 'Power2',
    });
  }

  // ─── Win/Lose Conditions ─────────────────────────────────────────────────────

  private handleWin(): void {
    this.state.won = true;
    this.state.paused = true;

    const vitaScore = calculateVitaScore(this.state, SCORING_CONFIG);

    this.scene.stop('HudScene');
    this.scene.start('VictoryScene', {
      level: this.levelConfig.id,
      state: this.state,
      vitaScore,
      levelConfig: this.levelConfig,
    });
  }

  private handleLose(): void {
    this.state.gameOver = true;
    this.state.paused = true;

    const vitaScore = calculateVitaScore(this.state, SCORING_CONFIG);

    this.scene.stop('HudScene');
    this.scene.start('GameOverScene', {
      level: this.levelConfig.id,
      state: this.state,
      vitaScore,
      levelConfig: this.levelConfig,
    });
  }

  private handleTimeUp(): void {
    // Check if objective was met
    if (checkWinCondition(this.state, this.levelConfig.objective)) {
      this.handleWin();
    } else {
      this.handleLose();
    }
  }

  // ─── Pause ───────────────────────────────────────────────────────────────────

  private handlePause(): void {
    if (this.state.gameOver || this.state.won) return;

    this.state.paused = true;
    this.scene.launch('PauseScene');
    this.scene.pause('LevelScene');
  }
}
