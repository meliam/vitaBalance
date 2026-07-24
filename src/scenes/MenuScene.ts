import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, MIN_TOUCH_TARGET } from '../utils/constants';
import { Button } from '../ui/Button';
import { Player } from '../entities/Player';
import { StorageService } from '../services/storage-service';
import { isLevelUnlocked } from '../systems/progress-system';
import { LEVELS } from '../config/levels';
import type { LevelConfig, ProgressData } from '../types/game.types';

/**
 * MenuScene — Main menu with inline sub-states:
 *   - 'menu': Title, avatar, play/how-to-play buttons
 *   - 'missionSelect': 3 level cards (locked/unlocked)
 *   - 'objectiveScreen': Level goal + start button
 *
 * Supports full keyboard navigation (Tab/Enter) with visible focus rings.
 *
 * @see Requirements 13.1–13.5, 15.1, 22.6
 */
export class MenuScene extends Phaser.Scene {
  private currentState: 'menu' | 'missionSelect' | 'objectiveScreen' = 'menu';
  private selectedLevel: LevelConfig | null = null;
  private progress!: ProgressData;

  // Containers for sub-states
  private menuContainer!: Phaser.GameObjects.Container;
  private missionSelectContainer!: Phaser.GameObjects.Container;
  private objectiveContainer!: Phaser.GameObjects.Container;
  private navBarContainer!: Phaser.GameObjects.Container;

  // Player avatar (decorative)
  private player!: Player;

  // Focusable elements for keyboard navigation
  private focusableElements: Button[] = [];
  private focusIndex = 0;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.progress = StorageService.getProgress();

    this.createNavBar();
    this.createMainMenu();
    this.createMissionSelect();
    this.createObjectiveScreen();

    this.showState('menu');
    this.setupKeyboardNavigation();
  }

  // ─── Navigation Bar ──────────────────────────────────────────────────────────

  private createNavBar(): void {
    this.navBarContainer = this.add.container(0, 0);

    const barBg = this.add.graphics();
    barBg.fillStyle(0x1b2838, 0.9);
    barBg.fillRect(0, 0, GAME_WIDTH, 48);
    this.navBarContainer.add(barBg);

    // Profile icon button
    const profileBtn = this.createIconButton(GAME_WIDTH - 180, 24, '👤', 'Perfil', () => {
      this.scene.start('ProfileScene');
    });
    this.navBarContainer.add(profileBtn);

    // Ranking icon button
    const rankingBtn = this.createIconButton(GAME_WIDTH - 120, 24, '🏆', 'Ranking', () => {
      this.scene.start('RankingScene');
    });
    this.navBarContainer.add(rankingBtn);

    // Settings icon button
    const settingsBtn = this.createIconButton(GAME_WIDTH - 60, 24, '⚙️', 'Ajustes', () => {
      this.scene.start('SettingsScene');
    });
    this.navBarContainer.add(settingsBtn);
  }

  private createIconButton(
    x: number,
    y: number,
    emoji: string,
    _label: string,
    onClick: () => void,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const size = MIN_TOUCH_TARGET;

    // Background circle
    const bg = this.add.graphics();
    bg.fillStyle(0x2a3a4a, 1);
    bg.fillCircle(0, 0, size / 2);
    container.add(bg);

    // Emoji text
    const icon = this.add.text(0, 0, emoji, {
      fontSize: '20px',
      align: 'center',
    });
    icon.setOrigin(0.5, 0.5);
    container.add(icon);

    // Hit area
    container.setSize(size, size);
    container.setInteractive(
      new Phaser.Geom.Circle(0, 0, size / 2),
      Phaser.Geom.Circle.Contains,
    );
    container.on('pointerup', onClick);

    return container;
  }

  // ─── Main Menu State ─────────────────────────────────────────────────────────

  private createMainMenu(): void {
    this.menuContainer = this.add.container(0, 0);

    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f2744, 0x0f2744, 0x0a3d1a, 0x0a3d1a, 1);
    bg.fillRect(0, 48, GAME_WIDTH, GAME_HEIGHT - 48);
    this.menuContainer.add(bg);

    // Game title
    const title = this.add.text(GAME_WIDTH / 2, 110, 'VitaBalance', {
      fontFamily: 'Fredoka One, sans-serif',
      fontSize: '48px',
      color: '#4ecdc4',
      fontStyle: 'bold',
      align: 'center',
    });
    title.setOrigin(0.5, 0.5);
    this.menuContainer.add(title);

    const subtitle = this.add.text(
      GAME_WIDTH / 2,
      155,
      'Guardianes de las Estaciones',
      {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '22px',
        color: '#a0d8d0',
        align: 'center',
      },
    );
    subtitle.setOrigin(0.5, 0.5);
    this.menuContainer.add(subtitle);

    // Player avatar (decorative display)
    this.player = new Player(this, GAME_WIDTH / 2, 260);
    this.player.setOutfit(this.progress.outfitLevel);
    // Disable touch input by removing event listeners set by Player constructor
    this.input.off('pointerdown');
    this.input.off('pointermove');
    this.input.off('pointerup');
    this.menuContainer.add(this.player);

    // "¡Jugar!" button
    const playBtn = new Button(this, {
      x: GAME_WIDTH / 2,
      y: 370,
      text: '¡Jugar!',
      color: '#4CAF50',
      width: 200,
      height: 56,
      fontSize: 24,
      onClick: () => this.showState('missionSelect'),
    });
    this.menuContainer.add(playBtn);

    // "Cómo jugar" button
    const howToPlayBtn = new Button(this, {
      x: GAME_WIDTH / 2,
      y: 440,
      text: 'Cómo jugar',
      color: '#2196F3',
      width: 200,
      height: 50,
      fontSize: 20,
      onClick: () => this.scene.start('HowToPlayScene'),
    });
    this.menuContainer.add(howToPlayBtn);

    // Settings button (text-based, bottom-right)
    const settingsBtnMenu = new Button(this, {
      x: GAME_WIDTH / 2,
      y: 500,
      text: '⚙️ Ajustes',
      color: '#607D8B',
      width: 160,
      height: 44,
      fontSize: 16,
      onClick: () => this.scene.start('SettingsScene'),
    });
    this.menuContainer.add(settingsBtnMenu);
  }

  // ─── Mission Select Sub-State ────────────────────────────────────────────────

  private createMissionSelect(): void {
    this.missionSelectContainer = this.add.container(0, 0);

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f2744, 0x0f2744, 0x1a2a3a, 0x1a2a3a, 1);
    bg.fillRect(0, 48, GAME_WIDTH, GAME_HEIGHT - 48);
    this.missionSelectContainer.add(bg);

    // Title
    const title = this.add.text(GAME_WIDTH / 2, 90, 'Seleccionar Misión', {
      fontFamily: 'Fredoka One, sans-serif',
      fontSize: '32px',
      color: '#ffffff',
      align: 'center',
    });
    title.setOrigin(0.5, 0.5);
    this.missionSelectContainer.add(title);

    // Level cards
    const cardWidth = 320;
    const cardHeight = 300;
    const gap = 40;
    const totalWidth = cardWidth * 3 + gap * 2;
    const startX = (GAME_WIDTH - totalWidth) / 2 + cardWidth / 2;

    LEVELS.forEach((level, index) => {
      const x = startX + index * (cardWidth + gap);
      const y = 280;
      const unlocked = isLevelUnlocked(level.id, this.progress);

      const card = this.createLevelCard(x, y, cardWidth, cardHeight, level, unlocked);
      this.missionSelectContainer.add(card);
    });

    // Back button
    const backBtn = new Button(this, {
      x: 100,
      y: GAME_HEIGHT - 40,
      text: '← Volver',
      color: '#455A64',
      width: 140,
      height: 44,
      fontSize: 16,
      onClick: () => this.showState('menu'),
    });
    this.missionSelectContainer.add(backBtn);
  }

  private createLevelCard(
    x: number,
    y: number,
    width: number,
    height: number,
    level: LevelConfig,
    unlocked: boolean,
  ): Phaser.GameObjects.Container {
    const card = this.add.container(x, y);

    const gfx = this.add.graphics();
    const color = unlocked
      ? Phaser.Display.Color.HexStringToColor(level.color).color
      : 0x4a4a4a;

    // Card background
    gfx.fillStyle(color, unlocked ? 0.85 : 0.4);
    gfx.fillRoundedRect(-width / 2, -height / 2, width, height, 16);

    // Border
    gfx.lineStyle(3, unlocked ? 0xffffff : 0x666666, unlocked ? 0.6 : 0.3);
    gfx.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);
    card.add(gfx);

    // Level title
    const titleText = this.add.text(0, -height / 2 + 30, level.title, {
      fontFamily: 'Fredoka One, sans-serif',
      fontSize: '18px',
      color: unlocked ? '#ffffff' : '#999999',
      align: 'center',
      wordWrap: { width: width - 30 },
    });
    titleText.setOrigin(0.5, 0);
    card.add(titleText);

    // Description
    const descText = this.add.text(0, -height / 2 + 80, level.description, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '14px',
      color: unlocked ? '#e0e0e0' : '#999999',
      align: 'center',
      wordWrap: { width: width - 40 },
    });
    descText.setOrigin(0.5, 0);
    card.add(descText);

    // Reward info
    const rewardText = this.add.text(
      0,
      height / 2 - 70,
      `${level.reward.emoji} ${level.reward.name}`,
      {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '15px',
        color: unlocked ? '#ffd54f' : '#999999',
        align: 'center',
      },
    );
    rewardText.setOrigin(0.5, 0.5);
    card.add(rewardText);

    if (unlocked) {
      // Interactive card — select level
      const selectBtn = new Button(this, {
        x: 0,
        y: height / 2 - 30,
        text: 'Seleccionar',
        color: level.color,
        width: 160,
        height: 44,
        fontSize: 16,
        onClick: () => {
          this.selectedLevel = level;
          this.showState('objectiveScreen');
        },
      });
      card.add(selectBtn);
    } else {
      // Lock icon
      const lockGfx = this.add.graphics();
      lockGfx.fillStyle(0x333333, 0.7);
      lockGfx.fillCircle(0, height / 2 - 30, 24);
      card.add(lockGfx);

      const lockIcon = this.add.text(0, height / 2 - 30, '🔒', {
        fontSize: '24px',
        align: 'center',
      });
      lockIcon.setOrigin(0.5, 0.5);
      card.add(lockIcon);
    }

    return card;
  }

  // ─── Objective Screen Sub-State ──────────────────────────────────────────────

  private createObjectiveScreen(): void {
    this.objectiveContainer = this.add.container(0, 0);

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f2744, 0x0f2744, 0x1a3a2a, 0x1a3a2a, 1);
    bg.fillRect(0, 48, GAME_WIDTH, GAME_HEIGHT - 48);
    this.objectiveContainer.add(bg);
  }

  private refreshObjectiveScreen(): void {
    // Clear existing children except background (first child)
    const children = this.objectiveContainer.getAll();
    for (let i = children.length - 1; i > 0; i--) {
      const child = children[i];
      if (child instanceof Phaser.GameObjects.Container) {
        child.destroy();
      } else {
        (child as Phaser.GameObjects.GameObject).destroy();
      }
    }

    if (!this.selectedLevel) return;

    const level = this.selectedLevel;

    // Level title
    const title = this.add.text(GAME_WIDTH / 2, 110, level.title, {
      fontFamily: 'Fredoka One, sans-serif',
      fontSize: '36px',
      color: '#ffffff',
      align: 'center',
    });
    title.setOrigin(0.5, 0.5);
    this.objectiveContainer.add(title);

    // Objective description
    const objectiveText = this.getObjectiveDescription(level);
    const desc = this.add.text(GAME_WIDTH / 2, 200, objectiveText, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '20px',
      color: '#e0e0e0',
      align: 'center',
      wordWrap: { width: 600 },
      lineSpacing: 8,
    });
    desc.setOrigin(0.5, 0.5);
    this.objectiveContainer.add(desc);

    // Level details
    const details = this.add.text(
      GAME_WIDTH / 2,
      290,
      `⏱ ${level.duration}s  |  🎯 ${level.reward.emoji} ${level.reward.name}`,
      {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '16px',
        color: '#a0d8d0',
        align: 'center',
      },
    );
    details.setOrigin(0.5, 0.5);
    this.objectiveContainer.add(details);

    // "¡Comenzar!" button
    const startBtn = new Button(this, {
      x: GAME_WIDTH / 2,
      y: 380,
      text: '¡Comenzar!',
      color: '#4CAF50',
      width: 220,
      height: 56,
      fontSize: 24,
      onClick: () => {
        this.scene.start('LevelScene', { level: level.id });
      },
    });
    this.objectiveContainer.add(startBtn);

    // Back button
    const backBtn = new Button(this, {
      x: GAME_WIDTH / 2,
      y: 450,
      text: '← Volver a misiones',
      color: '#455A64',
      width: 220,
      height: 44,
      fontSize: 16,
      onClick: () => this.showState('missionSelect'),
    });
    this.objectiveContainer.add(backBtn);
  }

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

  // ─── State Management ────────────────────────────────────────────────────────

  private showState(state: 'menu' | 'missionSelect' | 'objectiveScreen'): void {
    this.currentState = state;

    this.menuContainer.setVisible(state === 'menu');
    this.missionSelectContainer.setVisible(state === 'missionSelect');
    this.objectiveContainer.setVisible(state === 'objectiveScreen');

    // Nav bar visible in all sub-states
    this.navBarContainer.setVisible(true);

    if (state === 'objectiveScreen') {
      this.refreshObjectiveScreen();
    }

    // Reset focus
    this.focusIndex = 0;
    this.updateFocusableElements();
  }

  // ─── Keyboard Navigation ─────────────────────────────────────────────────────

  private setupKeyboardNavigation(): void {
    this.input.keyboard?.on('keydown-TAB', (event: KeyboardEvent) => {
      event.preventDefault();
      this.cycleFocus(event.shiftKey ? -1 : 1);
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      // Enter is handled by the Button class when focused
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      // ESC goes back one level
      if (this.currentState === 'objectiveScreen') {
        this.showState('missionSelect');
      } else if (this.currentState === 'missionSelect') {
        this.showState('menu');
      }
    });
  }

  private updateFocusableElements(): void {
    // Clear previous focus
    this.focusableElements.forEach((btn) => btn.setFocused(false));
    this.focusableElements = [];

    // Collect all visible Button instances from the active container
    const activeContainer = this.getActiveContainer();
    if (!activeContainer) return;

    this.collectButtons(activeContainer);

    // Set initial focus
    if (this.focusableElements.length > 0) {
      this.focusIndex = 0;
      this.focusableElements[0].setFocused(true);
    }
  }

  private collectButtons(container: Phaser.GameObjects.Container): void {
    container.getAll().forEach((child) => {
      if (child instanceof Button) {
        this.focusableElements.push(child);
      } else if (child instanceof Phaser.GameObjects.Container) {
        this.collectButtons(child);
      }
    });
  }

  private getActiveContainer(): Phaser.GameObjects.Container | null {
    switch (this.currentState) {
      case 'menu':
        return this.menuContainer;
      case 'missionSelect':
        return this.missionSelectContainer;
      case 'objectiveScreen':
        return this.objectiveContainer;
      default:
        return null;
    }
  }

  private cycleFocus(direction: number): void {
    if (this.focusableElements.length === 0) return;

    // Remove current focus
    this.focusableElements[this.focusIndex]?.setFocused(false);

    // Move index
    this.focusIndex += direction;
    if (this.focusIndex < 0) {
      this.focusIndex = this.focusableElements.length - 1;
    } else if (this.focusIndex >= this.focusableElements.length) {
      this.focusIndex = 0;
    }

    // Apply new focus
    this.focusableElements[this.focusIndex]?.setFocused(true);
  }
}
