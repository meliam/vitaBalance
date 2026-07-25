import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { getReducedMotionSetting } from '../utils/accessibility';
import { StorageService } from '../services/storage-service';
import { PumpkinGraphic } from '../ui/PumpkinGraphic';

/**
 * PreloadScene — Loads all game assets (sprites, audio, UI, fonts) with
 * a visible progress bar. Handles retries and fallbacks gracefully.
 *
 * Requirements: 18.2, 18.3, 18.4
 */
export class PreloadScene extends Phaser.Scene {
  /** Max retry attempts for failed assets */
  private static readonly MAX_RETRIES = 2;

  /** Font loading timeout in milliseconds */
  private static readonly FONT_TIMEOUT_MS = 3000;

  /** Track retry counts per asset key */
  private retryCounts: Map<string, number> = new Map();

  /** Track keys of assets that ultimately failed */
  private failedAssets: Set<string> = new Set();

  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    this.createProgressBar();
    this.setupErrorHandling();
    this.loadSprites();
    this.loadAudio();
    this.loadUIAssets();
  }

  async create(): Promise<void> {
    this.generateFallbackTextures();

    // Generate custom product textures (zapallo pumpkin drawn with Graphics)
    PumpkinGraphic.generateTexture(this, 32);

    // Initialize reduceMotion in registry from settings or OS preference
    const settings = StorageService.getSettings();
    const reduceMotion = getReducedMotionSetting(settings);
    this.registry.set('reduceMotion', reduceMotion);

    // Load web fonts before transitioning (with timeout fallback)
    await PreloadScene.loadFonts();

    this.scene.start('MenuScene');
  }

  // ─── Progress Bar ────────────────────────────────────────────────────────────

  private createProgressBar(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;
    const barWidth = 400;
    const barHeight = 32;

    // Background bar
    const bgBar = this.add.graphics();
    bgBar.fillStyle(0x1b2838, 1);
    bgBar.fillRoundedRect(
      centerX - barWidth / 2,
      centerY - barHeight / 2,
      barWidth,
      barHeight,
      8,
    );

    // Fill bar (will be scaled on progress)
    const fillBar = this.add.graphics();

    // "Cargando..." label
    this.add
      .text(centerX, centerY - barHeight / 2 - 24, 'Cargando...', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Progress listener
    this.load.on('progress', (value: number) => {
      fillBar.clear();
      fillBar.fillStyle(0x4ecdc4, 1);
      fillBar.fillRoundedRect(
        centerX - barWidth / 2 + 4,
        centerY - barHeight / 2 + 4,
        (barWidth - 8) * value,
        barHeight - 8,
        6,
      );
    });
  }

  // ─── Error Handling & Retry ──────────────────────────────────────────────────

  private setupErrorHandling(): void {
    this.load.on(
      'loaderror',
      (fileObj: Phaser.Loader.File) => {
        const key = fileObj.key;
        const currentRetries = this.retryCounts.get(key) ?? 0;

        if (currentRetries < PreloadScene.MAX_RETRIES) {
          this.retryCounts.set(key, currentRetries + 1);

          // Re-queue the asset for another attempt
          const type = fileObj.type;
          const url = fileObj.url as string;

          if (type === 'image') {
            this.load.image(key, url);
          } else if (type === 'audio') {
            this.load.audio(key, url);
          } else if (type === 'spritesheet') {
            // Spritesheets would need frameConfig but we use image for simplicity
            this.load.image(key, url);
          }

          this.load.start();
        } else {
          // Mark as permanently failed after max retries
          this.failedAssets.add(key);
        }
      },
    );
  }

  // ─── Asset Loading ───────────────────────────────────────────────────────────

  private loadSprites(): void {
    // Placeholder sprite paths — actual files may not exist yet.
    // Fallback handling generates colored rectangles for missing ones.
    this.load.image('avatar-base', 'assets/sprites/avatar-base.png');
    this.load.image('avatar-cap', 'assets/sprites/avatar-cap.png');
    this.load.image('avatar-shirt', 'assets/sprites/avatar-shirt.png');
    this.load.image('avatar-cape', 'assets/sprites/avatar-cape.png');
    this.load.image('product-correct', 'assets/sprites/product-correct.png');
    this.load.image('product-spoiled', 'assets/sprites/product-spoiled.png');
    this.load.image('product-unsolicited', 'assets/sprites/product-unsolicited.png');
    this.load.image('estrella-vita', 'assets/sprites/estrella-vita.png');
  }

  private loadAudio(): void {
    this.load.audio('bgm-level', 'assets/audio/bgm-level.mp3');
    this.load.audio('sfx-correct', 'assets/audio/sfx-correct.mp3');
    this.load.audio('sfx-spoiled', 'assets/audio/sfx-spoiled.mp3');
    this.load.audio('sfx-unsolicited', 'assets/audio/sfx-unsolicited.mp3');
    this.load.audio('sfx-victory', 'assets/audio/sfx-victory.mp3');
    this.load.audio('sfx-gameover', 'assets/audio/sfx-gameover.mp3');
  }

  private loadUIAssets(): void {
    this.load.image('btn-play', 'assets/ui/btn-play.png');
    this.load.image('btn-settings', 'assets/ui/btn-settings.png');
    this.load.image('icon-pause', 'assets/ui/icon-pause.png');
    this.load.image('icon-heart', 'assets/ui/icon-heart.png');
    this.load.image('icon-lock', 'assets/ui/icon-lock.png');
  }

  // ─── Font Loading ────────────────────────────────────────────────────────────

  /**
   * Loads web fonts with a timeout. Called before transitioning scenes.
   * Falls back to system fonts if loading fails or times out.
   */
  static async loadFonts(): Promise<void> {
    const fonts = [
      { family: 'Fredoka One', weight: '400' },
      { family: 'Nunito', weight: '400' },
      { family: 'Space Mono', weight: '400' },
    ];

    const loadPromises = fonts.map((font) => {
      const fontFace = new FontFace(
        font.family,
        `url(assets/fonts/${font.family.replace(/\s+/g, '-').toLowerCase()}.woff2)`,
        { weight: font.weight },
      );

      return fontFace
        .load()
        .then((loaded) => {
          document.fonts.add(loaded);
        })
        .catch(() => {
          // Font failed to load — game proceeds with system fallback
        });
    });

    // Race all font loads against a timeout
    const timeout = new Promise<void>((resolve) => {
      setTimeout(resolve, PreloadScene.FONT_TIMEOUT_MS);
    });

    await Promise.race([Promise.allSettled(loadPromises), timeout]);
  }

  // ─── Fallback Textures ───────────────────────────────────────────────────────

  /**
   * For any sprites that failed to load after retries, generate simple
   * colored rectangle textures so the game can still run.
   */
  private generateFallbackTextures(): void {
    const fallbackColors: Record<string, number> = {
      'avatar-base': 0x4caf50,
      'avatar-cap': 0xff9800,
      'avatar-shirt': 0xff5722,
      'avatar-cape': 0x9c27b0,
      'product-correct': 0x66bb6a,
      'product-spoiled': 0x795548,
      'product-unsolicited': 0xffc107,
      'estrella-vita': 0x2196f3,
      'btn-play': 0x4ecdc4,
      'btn-settings': 0x78909c,
      'icon-pause': 0xeceff1,
      'icon-heart': 0xef5350,
      'icon-lock': 0x9e9e9e,
    };

    for (const key of this.failedAssets) {
      const color = fallbackColors[key] ?? 0xcccccc;

      // Only generate fallback if texture doesn't already exist
      if (!this.textures.exists(key)) {
        const size = key.startsWith('icon-') ? 32 : 64;
        const graphics = this.add.graphics();
        graphics.fillStyle(color, 1);
        graphics.fillRoundedRect(0, 0, size, size, 6);
        graphics.generateTexture(key, size, size);
        graphics.destroy();
      }
    }
  }
}
