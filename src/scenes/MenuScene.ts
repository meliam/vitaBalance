import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, MIN_TOUCH_TARGET } from '../utils/constants';
import { Button } from '../ui/Button';
import { Player } from '../entities/Player';
import { StorageService } from '../services/storage-service';
import { isLevelUnlocked } from '../systems/progress-system';
import { LEVELS } from '../config/levels';
import { PRODUCTS } from '../config/products';
import { getReducedMotionSetting } from '../utils/accessibility';
import { computeHomeLayout } from './menu/HomeLayout';
import { HomeAnimations } from './menu/HomeAnimations';
import { HomeAccessibility } from './menu/HomeAccessibility';
import type { HomeLayoutResult } from './menu/HomeLayout';
import type { A11yButtonPosition } from './menu/HomeAccessibility';
import type { LevelConfig, ProgressData } from '../types/game.types';

/**
 * MenuScene — Main menu with inline sub-states:
 *   - 'menu': Animated Home with floating fruits, avatar, buttons
 *   - 'missionSelect': 3 level cards (locked/unlocked)
 *   - 'objectiveScreen': Level goal + start button
 *
 * Uses Scale.FIT with fixed 1280×520 canvas. All positions use GAME_WIDTH/GAME_HEIGHT.
 * The Home sub-state uses HomeLayout, HomeAnimations, and HomeAccessibility modules.
 * Cleanup is performed on sub-state transitions.
 */
export class MenuScene extends Phaser.Scene {
  private currentState: 'menu' | 'missionSelect' | 'objectiveScreen' = 'menu';
  private selectedLevel: LevelConfig | null = null;
  private progress!: ProgressData;
  private reduceMotion = false;

  // Home sub-state modules
  private homeAnimations: HomeAnimations | null = null;
  private homeAccessibility: HomeAccessibility | null = null;
  private homeLayout: HomeLayoutResult | null = null;

  // Home decorative elements (destroyed on sub-state exit)
  private homeDecorations: Phaser.GameObjects.GameObject[] = [];
  private homeFloatingFruits: Phaser.GameObjects.Text[] = [];
  private homeStars: Phaser.GameObjects.Text[] = [];
  private player: Player | null = null;

  // Home buttons (pointer-only, keyboard handled by HTML layer)
  private menuButtons: Button[] = [];

  // Mission select state
  private missionElements: Phaser.GameObjects.GameObject[] = [];
  private missionButtons: Button[] = [];

  // Objective screen state
  private objectiveElements: Phaser.GameObjects.GameObject[] = [];
  private objectiveButtons: Button[] = [];

  // Shared background
  private backgroundGfx: Phaser.GameObjects.Graphics | null = null;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.progress = StorageService.getProgress();
    const settings = StorageService.getSettings();
    this.reduceMotion = getReducedMotionSetting(settings);

    // Reset all arrays
    this.menuButtons = [];
    this.missionElements = [];
    this.missionButtons = [];
    this.objectiveElements = [];
    this.objectiveButtons = [];
    this.homeDecorations = [];
    this.homeFloatingFruits = [];
    this.homeStars = [];

    this.showState('menu');
  }

  // ─── State Management ────────────────────────────────────────────────────────

  private showState(state: 'menu' | 'missionSelect' | 'objectiveScreen'): void {
    this.cleanupCurrentState();
    this.currentState = state;

    switch (state) {
      case 'menu':
        this.createHome();
        break;
      case 'missionSelect':
        this.createMissionSelect();
        break;
      case 'objectiveScreen':
        this.createObjectiveScreen();
        break;
    }
  }

  private cleanupCurrentState(): void {
    switch (this.currentState) {
      case 'menu':
        this.cleanupHome();
        break;
      case 'missionSelect':
        this.cleanupMissionSelect();
        break;
      case 'objectiveScreen':
        this.cleanupObjectiveScreen();
        break;
    }
    if (this.backgroundGfx) {
      this.backgroundGfx.destroy();
      this.backgroundGfx = null;
    }
  }

  // ─── Home Sub-State ──────────────────────────────────────────────────────────

  private createHome(): void {
    this.homeLayout = computeHomeLayout();
    const layout = this.homeLayout;

    // Background gradient
    this.backgroundGfx = this.add.graphics();
    this.backgroundGfx.fillGradientStyle(0x0d1b2a, 0x1a3a5c, 0x0d2a1a, 0x0d1b2a, 1);
    this.backgroundGfx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.createFloatingFruits(layout);
    this.createStars(layout);
    this.createLogo(layout);
    this.createAvatar(layout);
    this.createSlogan(layout);
    this.createHomeButtons(layout);

    // Animations
    this.homeAnimations = new HomeAnimations(this, this.reduceMotion);
    this.homeAnimations.floatFruits(this.homeFloatingFruits);
    this.homeAnimations.twinkleStars(this.homeStars);
    if (this.player) {
      this.homeAnimations.idleAvatar(this.player);
    }

    // Entrance animation
    const entranceTargets = this.homeDecorations
      .filter((obj): obj is Phaser.GameObjects.GameObject & { setAlpha: (a: number) => void; y: number } =>
        'setAlpha' in obj && 'y' in obj)
      .map((obj, i) => ({ gameObject: obj, delay: i * 80 }));
    this.homeAnimations.entranceSequence(entranceTargets);

    // Accessible HTML layer
    this.homeAccessibility = new HomeAccessibility(this);
    this.setupHomeAccessibility(layout);

    // Escape listener (no-op on Home, no parent state)
    this.input.keyboard?.on('keydown-ESC', this.handleHomeEscape, this);
  }

  private createFloatingFruits(layout: HomeLayoutResult): void {
    const fruitEmojis = PRODUCTS
      .filter((p) => p.emoji.length > 0)
      .slice(0, layout.floatingFruits.length)
      .map((p) => p.emoji);

    layout.floatingFruits.forEach((pos, i) => {
      const emoji = fruitEmojis[i % fruitEmojis.length];
      const fontSize = Math.max(16, 24 * pos.scale);
      const fruit = this.add.text(pos.x, pos.y, emoji, { fontSize: `${fontSize}px` });
      fruit.setOrigin(0.5, 0.5);
      fruit.setAlpha(0.12);
      fruit.setDepth(0);
      this.homeFloatingFruits.push(fruit);
    });
  }

  private createStars(layout: HomeLayoutResult): void {
    layout.stars.forEach((pos) => {
      const fontSize = Math.max(10, 14 * pos.scale);
      const star = this.add.text(pos.x, pos.y, '★', {
        fontSize: `${fontSize}px`,
        color: '#ffd700',
      });
      star.setOrigin(0.5, 0.5);
      star.setAlpha(0.5);
      star.setDepth(0);
      this.homeStars.push(star);
    });
  }

  private createLogo(layout: HomeLayoutResult): void {
    const leaf = this.add.text(layout.logoLeaf.x, layout.logoLeaf.y, '🌿', {
      fontSize: '32px',
    }).setOrigin(0.5, 0.5);
    this.homeDecorations.push(leaf);

    const title = this.add.text(layout.logoText.x, layout.logoText.y, 'VitaBalance', {
      fontFamily: 'Fredoka One, sans-serif',
      fontSize: `${layout.logoFontSize}px`,
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.homeDecorations.push(title);

    const bolt = this.add.text(layout.logoBolt.x, layout.logoBolt.y, '⚡', {
      fontSize: '32px',
    }).setOrigin(0.5, 0.5);
    this.homeDecorations.push(bolt);

    const subtitle = this.add.text(
      layout.subtitle.x, layout.subtitle.y,
      'GUARDIANES DE LAS ESTACIONES', {
        fontFamily: 'Nunito, sans-serif',
        fontSize: `${layout.subtitleFontSize}px`,
        color: '#4ecdc4',
        letterSpacing: 3,
      },
    ).setOrigin(0.5, 0.5);
    this.homeDecorations.push(subtitle);
  }

  private createAvatar(layout: HomeLayoutResult): void {
    this.player = new Player(this, layout.avatar.x, layout.avatar.y);
    this.player.setOutfit(this.progress.outfitLevel);
    this.player.disableTouchInput();
    this.player.setScale(layout.avatar.size / 80);
    this.homeDecorations.push(this.player);

    const leftFruit = this.add.text(
      layout.fruitLeft.x, layout.fruitLeft.y, '🍊',
      { fontSize: `${Math.max(20, 30 * layout.fruitLeft.scale)}px` },
    ).setOrigin(0.5, 0.5);
    this.homeDecorations.push(leftFruit);
    this.homeFloatingFruits.push(leftFruit);

    const rightFruit = this.add.text(
      layout.fruitRight.x, layout.fruitRight.y, '🥦',
      { fontSize: `${Math.max(20, 30 * layout.fruitRight.scale)}px` },
    ).setOrigin(0.5, 0.5);
    this.homeDecorations.push(rightFruit);
    this.homeFloatingFruits.push(rightFruit);
  }

  private createSlogan(layout: HomeLayoutResult): void {
    const slogan = this.add.text(
      layout.slogan.x, layout.slogan.y,
      '"No atrapás todo. Tomás decisiones."', {
        fontFamily: 'Fredoka One, sans-serif',
        fontSize: `${layout.sloganFontSize}px`,
        color: '#ffd700',
        fontStyle: 'bold',
        align: 'center',
      },
    ).setOrigin(0.5, 0.5);
    this.homeDecorations.push(slogan);
  }

  private createHomeButtons(layout: HomeLayoutResult): void {
    // Play button — solid orange, keyboard disabled (HTML handles it)
    const playBtn = new Button(this, {
      x: layout.playButton.x,
      y: layout.playButton.y,
      text: '▶  ¡Jugar!',
      color: '#f97316',
      width: layout.playButton.width,
      height: layout.playButton.height,
      fontSize: layout.playButton.fontSize,
      disableKeyboard: true,
      onClick: () => this.showState('missionSelect'),
    });
    this.menuButtons.push(playBtn);

    // How to play — outline green
    const howToBtn = new Button(this, {
      x: layout.howToPlayButton.x,
      y: layout.howToPlayButton.y,
      text: '?  Cómo jugar',
      color: '#22c55e',
      width: layout.howToPlayButton.width,
      height: layout.howToPlayButton.height,
      fontSize: layout.howToPlayButton.fontSize,
      variant: 'outline',
      disableKeyboard: true,
      onClick: () => this.scene.start('HowToPlayScene'),
    });
    this.menuButtons.push(howToBtn);

    // Settings button (top-right corner)
    const settingsBtn = new Button(this, {
      x: layout.settingsButton.x,
      y: layout.settingsButton.y,
      text: '⚙️',
      color: '#455A64',
      width: layout.settingsButton.width,
      height: layout.settingsButton.height,
      fontSize: 20,
      disableKeyboard: true,
      onClick: () => this.scene.start('SettingsScene'),
    });
    settingsBtn.setDepth(5);
    this.menuButtons.push(settingsBtn);
  }

  private setupHomeAccessibility(layout: HomeLayoutResult): void {
    if (!this.homeAccessibility) return;

    const positions = new Map<string, A11yButtonPosition>();
    positions.set('play', {
      x: layout.playButton.x, y: layout.playButton.y,
      width: layout.playButton.width, height: layout.playButton.height,
    });
    positions.set('howtoplay', {
      x: layout.howToPlayButton.x, y: layout.howToPlayButton.y,
      width: layout.howToPlayButton.width, height: layout.howToPlayButton.height,
    });
    positions.set('settings', {
      x: layout.settingsButton.x, y: layout.settingsButton.y,
      width: layout.settingsButton.width, height: layout.settingsButton.height,
    });

    this.homeAccessibility.createButtons([
      {
        id: 'play',
        label: 'Jugar — Iniciar selección de misión',
        action: () => this.showState('missionSelect'),
        onFocus: () => this.menuButtons[0]?.setFocused(true),
        onBlur: () => this.menuButtons[0]?.setFocused(false),
      },
      {
        id: 'howtoplay',
        label: 'Cómo jugar — Ver instrucciones',
        action: () => this.scene.start('HowToPlayScene'),
        onFocus: () => this.menuButtons[1]?.setFocused(true),
        onBlur: () => this.menuButtons[1]?.setFocused(false),
      },
      {
        id: 'settings',
        label: 'Configuración — Abrir ajustes',
        action: () => this.scene.start('SettingsScene'),
        onFocus: () => this.menuButtons[2]?.setFocused(true),
        onBlur: () => this.menuButtons[2]?.setFocused(false),
      },
    ], positions);
  }

  private cleanupHome(): void {
    if (this.homeAnimations) {
      this.homeAnimations.stopAll();
      this.homeAnimations = null;
    }
    if (this.homeAccessibility) {
      this.homeAccessibility.destroy();
      this.homeAccessibility = null;
    }
    for (const obj of this.homeDecorations) {
      if (obj && obj.scene) obj.destroy();
    }
    this.homeDecorations = [];
    for (const obj of this.homeFloatingFruits) {
      if (obj && obj.scene) obj.destroy();
    }
    this.homeFloatingFruits = [];
    for (const obj of this.homeStars) {
      if (obj && obj.scene) obj.destroy();
    }
    this.homeStars = [];
    for (const btn of this.menuButtons) {
      if (btn && btn.scene) btn.destroy();
    }
    this.menuButtons = [];
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
    this.homeLayout = null;
    this.input.keyboard?.off('keydown-ESC', this.handleHomeEscape, this);
  }

  private handleHomeEscape = (): void => {
    // No-op: Home has no parent state
  };

  // ─── Mission Select Sub-State ────────────────────────────────────────────────

  private createMissionSelect(): void {
    // Background
    this.backgroundGfx = this.add.graphics();
    this.backgroundGfx.fillGradientStyle(0x0f2744, 0x0f2744, 0x1a2a3a, 0x1a2a3a, 1);
    this.backgroundGfx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const title = this.add.text(GAME_WIDTH / 2, 60, 'Seleccionar Misión', {
      fontFamily: 'Fredoka One, sans-serif',
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5);
    this.missionElements.push(title);

    const cardWidth = 320;
    const cardHeight = 300;
    const gap = 40;
    const totalWidth = cardWidth * 3 + gap * 2;
    const startX = (GAME_WIDTH - totalWidth) / 2 + cardWidth / 2;

    LEVELS.forEach((level, index) => {
      const x = startX + index * (cardWidth + gap);
      const y = 260;
      const unlocked = isLevelUnlocked(level.id, this.progress);

      const gfx = this.add.graphics();
      const color = unlocked
        ? Phaser.Display.Color.HexStringToColor(level.color).color
        : 0x4a4a4a;
      gfx.fillStyle(color, unlocked ? 0.85 : 0.4);
      gfx.fillRoundedRect(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight, 16);
      gfx.lineStyle(3, unlocked ? 0xffffff : 0x666666, unlocked ? 0.6 : 0.3);
      gfx.strokeRoundedRect(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight, 16);
      this.missionElements.push(gfx);

      const titleText = this.add.text(x, y - cardHeight / 2 + 30, level.title, {
        fontFamily: 'Fredoka One, sans-serif', fontSize: '18px',
        color: unlocked ? '#ffffff' : '#999999', align: 'center',
        wordWrap: { width: cardWidth - 30 },
      }).setOrigin(0.5, 0);
      this.missionElements.push(titleText);

      const descText = this.add.text(x, y - cardHeight / 2 + 80, level.description, {
        fontFamily: 'Nunito, sans-serif', fontSize: '14px',
        color: unlocked ? '#e0e0e0' : '#999999', align: 'center',
        wordWrap: { width: cardWidth - 40 },
      }).setOrigin(0.5, 0);
      this.missionElements.push(descText);

      const rewardText = this.add.text(x, y + cardHeight / 2 - 70,
        `${level.reward.emoji} ${level.reward.name}`, {
          fontFamily: 'Nunito, sans-serif', fontSize: '15px',
          color: unlocked ? '#ffd54f' : '#999999',
        }).setOrigin(0.5, 0.5);
      this.missionElements.push(rewardText);

      if (unlocked) {
        const selectBtn = new Button(this, {
          x, y: y + cardHeight / 2 - 30, text: 'Seleccionar',
          color: level.color, width: 160, height: MIN_TOUCH_TARGET, fontSize: 16,
          onClick: () => { this.selectedLevel = level; this.showState('objectiveScreen'); },
        });
        this.missionButtons.push(selectBtn);
      } else {
        const lockIcon = this.add.text(x, y + cardHeight / 2 - 30, '🔒', {
          fontSize: '24px',
        }).setOrigin(0.5, 0.5);
        this.missionElements.push(lockIcon);
      }
    });

    // Back button
    const backBtn = new Button(this, {
      x: 100, y: GAME_HEIGHT - 40, text: '← Volver',
      color: '#455A64', width: 140, height: MIN_TOUCH_TARGET, fontSize: 16,
      onClick: () => this.showState('menu'),
    });
    this.missionButtons.push(backBtn);

    this.setupMissionKeyboard();
  }

  private cleanupMissionSelect(): void {
    for (const el of this.missionElements) {
      if (el && el.scene) el.destroy();
    }
    this.missionElements = [];
    for (const btn of this.missionButtons) {
      if (btn && btn.scene) btn.destroy();
    }
    this.missionButtons = [];
    this.missionFocusIndex = 0;
    this.input.keyboard?.off('keydown-ESC', this.handleMissionEscape, this);
    this.input.keyboard?.off('keydown-TAB', this.handleMissionTab, this);
  }

  private setupMissionKeyboard(): void {
    this.input.keyboard?.on('keydown-ESC', this.handleMissionEscape, this);
    this.input.keyboard?.on('keydown-TAB', this.handleMissionTab, this);
    if (this.missionButtons.length > 0) {
      this.missionButtons[0].setFocused(true);
    }
  }

  private handleMissionEscape = (): void => { this.showState('menu'); };
  private missionFocusIndex = 0;
  private handleMissionTab = (event: KeyboardEvent): void => {
    event.preventDefault();
    if (this.missionButtons.length === 0) return;
    this.missionButtons[this.missionFocusIndex]?.setFocused(false);
    this.missionFocusIndex += event.shiftKey ? -1 : 1;
    if (this.missionFocusIndex < 0) this.missionFocusIndex = this.missionButtons.length - 1;
    if (this.missionFocusIndex >= this.missionButtons.length) this.missionFocusIndex = 0;
    this.missionButtons[this.missionFocusIndex]?.setFocused(true);
  };

  // ─── Objective Screen Sub-State ──────────────────────────────────────────────

  private createObjectiveScreen(): void {
    if (!this.selectedLevel) { this.showState('missionSelect'); return; }
    const level = this.selectedLevel;

    this.backgroundGfx = this.add.graphics();
    this.backgroundGfx.fillGradientStyle(0x0f2744, 0x0f2744, 0x1a3a2a, 0x1a3a2a, 1);
    this.backgroundGfx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const title = this.add.text(GAME_WIDTH / 2, 80, level.title, {
      fontFamily: 'Fredoka One, sans-serif', fontSize: '36px', color: '#ffffff',
    }).setOrigin(0.5, 0.5);
    this.objectiveElements.push(title);

    const objectiveText = this.getObjectiveDescription(level);
    const desc = this.add.text(GAME_WIDTH / 2, 200, objectiveText, {
      fontFamily: 'Nunito, sans-serif', fontSize: '20px', color: '#e0e0e0',
      align: 'center', wordWrap: { width: 600 }, lineSpacing: 8,
    }).setOrigin(0.5, 0.5);
    this.objectiveElements.push(desc);

    const details = this.add.text(GAME_WIDTH / 2, 300,
      `⏱ ${level.duration}s  |  🎯 ${level.reward.emoji} ${level.reward.name}`, {
        fontFamily: 'Nunito, sans-serif', fontSize: '16px', color: '#a0d8d0',
      }).setOrigin(0.5, 0.5);
    this.objectiveElements.push(details);

    this.objectiveButtons.push(new Button(this, {
      x: GAME_WIDTH / 2, y: 380, text: '¡Comenzar!',
      color: '#4CAF50', width: 220, height: 56, fontSize: 24,
      onClick: () => this.scene.start('LevelScene', { level: level.id }),
    }));
    this.objectiveButtons.push(new Button(this, {
      x: GAME_WIDTH / 2, y: 450, text: '← Volver a misiones',
      color: '#455A64', width: 220, height: MIN_TOUCH_TARGET, fontSize: 16,
      onClick: () => this.showState('missionSelect'),
    }));

    this.setupObjectiveKeyboard();
  }

  private cleanupObjectiveScreen(): void {
    for (const el of this.objectiveElements) {
      if (el && el.scene) el.destroy();
    }
    this.objectiveElements = [];
    for (const btn of this.objectiveButtons) {
      if (btn && btn.scene) btn.destroy();
    }
    this.objectiveButtons = [];
    this.objectiveFocusIndex = 0;
    this.input.keyboard?.off('keydown-ESC', this.handleObjectiveEscape, this);
    this.input.keyboard?.off('keydown-TAB', this.handleObjectiveTab, this);
  }

  private setupObjectiveKeyboard(): void {
    this.input.keyboard?.on('keydown-ESC', this.handleObjectiveEscape, this);
    this.input.keyboard?.on('keydown-TAB', this.handleObjectiveTab, this);
    if (this.objectiveButtons.length > 0) {
      this.objectiveButtons[0].setFocused(true);
    }
  }

  private handleObjectiveEscape = (): void => { this.showState('missionSelect'); };
  private objectiveFocusIndex = 0;
  private handleObjectiveTab = (event: KeyboardEvent): void => {
    event.preventDefault();
    if (this.objectiveButtons.length === 0) return;
    this.objectiveButtons[this.objectiveFocusIndex]?.setFocused(false);
    this.objectiveFocusIndex += event.shiftKey ? -1 : 1;
    if (this.objectiveFocusIndex < 0) this.objectiveFocusIndex = this.objectiveButtons.length - 1;
    if (this.objectiveFocusIndex >= this.objectiveButtons.length) this.objectiveFocusIndex = 0;
    this.objectiveButtons[this.objectiveFocusIndex]?.setFocused(true);
  };

  private getObjectiveDescription(level: LevelConfig): string {
    const obj = level.objective;
    switch (obj.type) {
      case 'count':
        return `Capturá ${obj.target} productos correctos antes de que\nse acabe el tiempo. ¡Evitá los productos en mal estado!`;
      case 'combine':
        return `Combiná distintos productos:\n• Al menos 1 con Vitamina C\n• Al menos 1 con Potasio\n• Al menos ${obj.variety} productos diferentes`;
      case 'seasonal':
        return `Recolectá los 5 productos de la estación objetivo.\n¡Cuidado con los distractores de otras estaciones!`;
      default:
        return level.description;
    }
  }

  // ─── Scene Lifecycle ─────────────────────────────────────────────────────────

  shutdown(): void {
    this.cleanupCurrentState();
  }
}
