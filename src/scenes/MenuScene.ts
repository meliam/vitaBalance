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
 * Buttons are NOT nested inside sub-containers to avoid Phaser hit-test issues.
 * Instead, buttons are managed in arrays with manual visibility control.
 *
 * @see Requirements 13.1–13.5, 15.1, 22.6
 */
export class MenuScene extends Phaser.Scene {
  private currentState: 'menu' | 'missionSelect' | 'objectiveScreen' = 'menu';
  private selectedLevel: LevelConfig | null = null;
  private progress!: ProgressData;

  // Visual-only containers (backgrounds, text — NO interactive elements)
  private menuBg!: Phaser.GameObjects.Graphics;
  private missionBg!: Phaser.GameObjects.Graphics;
  private objectiveBg!: Phaser.GameObjects.Graphics;

  // Player avatar (decorative)
  private player!: Player;

  // Buttons per state (managed independently, not in containers)
  private menuButtons: Button[] = [];
  private missionButtons: Button[] = [];
  private objectiveButtons: Button[] = [];
  private navButtons: Phaser.GameObjects.Container[] = [];

  // Non-interactive display elements per state
  private menuElements: Phaser.GameObjects.GameObject[] = [];
  private missionElements: Phaser.GameObjects.GameObject[] = [];
  private objectiveElements: Phaser.GameObjects.GameObject[] = [];

  // Focusable elements for keyboard navigation
  private focusableElements: Button[] = [];
  private focusIndex = 0;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.progress = StorageService.getProgress();

    // Reset button/element arrays (scene may be restarted, clearing stale references)
    this.menuButtons = [];
    this.missionButtons = [];
    this.objectiveButtons = [];
    this.objectiveElements = [];
    this.menuElements = [];
    this.missionElements = [];
    this.navButtons = [];
    this.focusableElements = [];
    this.focusIndex = 0;

    this.createBackgrounds();
    this.createNavBar();
    this.createMainMenu();
    this.createMissionSelect();

    this.showState('menu');
    this.setupKeyboardNavigation();
  }

  // ─── Backgrounds ─────────────────────────────────────────────────────────────

  private createBackgrounds(): void {
    this.menuBg = this.add.graphics();
    this.menuBg.fillGradientStyle(0x0f2744, 0x0f2744, 0x0a3d1a, 0x0a3d1a, 1);
    this.menuBg.fillRect(0, 48, GAME_WIDTH, GAME_HEIGHT - 48);

    this.missionBg = this.add.graphics();
    this.missionBg.fillGradientStyle(0x0f2744, 0x0f2744, 0x1a2a3a, 0x1a2a3a, 1);
    this.missionBg.fillRect(0, 48, GAME_WIDTH, GAME_HEIGHT - 48);

    this.objectiveBg = this.add.graphics();
    this.objectiveBg.fillGradientStyle(0x0f2744, 0x0f2744, 0x1a3a2a, 0x1a3a2a, 1);
    this.objectiveBg.fillRect(0, 48, GAME_WIDTH, GAME_HEIGHT - 48);
  }

  // ─── Navigation Bar ──────────────────────────────────────────────────────────

  private createNavBar(): void {
    const barBg = this.add.graphics();
    barBg.fillStyle(0x1b2838, 0.9);
    barBg.fillRect(0, 0, GAME_WIDTH, 48);
    barBg.setDepth(10);

    const navDefs = [
      { x: GAME_WIDTH - 180, emoji: '👤', action: () => this.scene.start('ProfileScene') },
      { x: GAME_WIDTH - 120, emoji: '🏆', action: () => this.scene.start('RankingScene') },
      { x: GAME_WIDTH - 60, emoji: '⚙️', action: () => this.scene.start('SettingsScene') },
    ];

    for (const def of navDefs) {
      const container = this.add.container(def.x, 24);
      const size = MIN_TOUCH_TARGET;

      const bg = this.add.graphics();
      bg.fillStyle(0x2a3a4a, 1);
      bg.fillCircle(0, 0, size / 2);
      container.add(bg);

      const icon = this.add.text(0, 0, def.emoji, { fontSize: '20px' });
      icon.setOrigin(0.5, 0.5);
      container.add(icon);

      container.setSize(size, size);
      container.setInteractive(
        new Phaser.Geom.Circle(0, 0, size / 2),
        Phaser.Geom.Circle.Contains,
      );
      container.on('pointerdown', def.action);
      container.setDepth(10);
      this.navButtons.push(container);
    }
  }

  // ─── Main Menu State ─────────────────────────────────────────────────────────

  private createMainMenu(): void {
    const title = this.add.text(GAME_WIDTH / 2, 110, 'VitaBalance', {
      fontFamily: 'Fredoka One, sans-serif',
      fontSize: '48px',
      color: '#4ecdc4',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.menuElements.push(title);

    const subtitle = this.add.text(GAME_WIDTH / 2, 155, 'Guardianes de las Estaciones', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '22px',
      color: '#a0d8d0',
    }).setOrigin(0.5, 0.5);
    this.menuElements.push(subtitle);

    // Player avatar (decorative)
    this.player = new Player(this, GAME_WIDTH / 2, 260);
    this.player.setOutfit(this.progress.outfitLevel);
    this.player.disableTouchInput();
    this.menuElements.push(this.player);

    // Buttons (direct children of scene, NOT in a container)
    this.menuButtons.push(new Button(this, {
      x: GAME_WIDTH / 2, y: 370, text: '¡Jugar!',
      color: '#4CAF50', width: 200, height: 56, fontSize: 24,
      onClick: () => this.showState('missionSelect'),
    }));

    this.menuButtons.push(new Button(this, {
      x: GAME_WIDTH / 2, y: 440, text: 'Cómo jugar',
      color: '#2196F3', width: 200, height: 50, fontSize: 20,
      onClick: () => this.scene.start('HowToPlayScene'),
    }));

    this.menuButtons.push(new Button(this, {
      x: GAME_WIDTH / 2, y: 500, text: '⚙️ Ajustes',
      color: '#607D8B', width: 160, height: 44, fontSize: 16,
      onClick: () => this.scene.start('SettingsScene'),
    }));
  }

  // ─── Mission Select Sub-State ────────────────────────────────────────────────

  private createMissionSelect(): void {
    const title = this.add.text(GAME_WIDTH / 2, 90, 'Seleccionar Misión', {
      fontFamily: 'Fredoka One, sans-serif',
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5);
    this.missionElements.push(title);

    // Level cards (visual only — buttons are separate)
    const cardWidth = 320;
    const cardHeight = 300;
    const gap = 40;
    const totalWidth = cardWidth * 3 + gap * 2;
    const startX = (GAME_WIDTH - totalWidth) / 2 + cardWidth / 2;

    LEVELS.forEach((level, index) => {
      const x = startX + index * (cardWidth + gap);
      const y = 280;
      const unlocked = isLevelUnlocked(level.id, this.progress);

      // Card background (visual, non-interactive)
      const gfx = this.add.graphics();
      const color = unlocked ? Phaser.Display.Color.HexStringToColor(level.color).color : 0x4a4a4a;
      gfx.fillStyle(color, unlocked ? 0.85 : 0.4);
      gfx.fillRoundedRect(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight, 16);
      gfx.lineStyle(3, unlocked ? 0xffffff : 0x666666, unlocked ? 0.6 : 0.3);
      gfx.strokeRoundedRect(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight, 16);
      this.missionElements.push(gfx);

      // Card text
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
        // Button at ABSOLUTE position (not inside card container)
        const selectBtn = new Button(this, {
          x, y: y + cardHeight / 2 - 30, text: 'Seleccionar',
          color: level.color, width: 160, height: 44, fontSize: 16,
          onClick: () => { this.selectedLevel = level; this.showState('objectiveScreen'); },
        });
        this.missionButtons.push(selectBtn);
      } else {
        const lockGfx = this.add.graphics();
        lockGfx.fillStyle(0x333333, 0.7);
        lockGfx.fillCircle(x, y + cardHeight / 2 - 30, 24);
        this.missionElements.push(lockGfx);

        const lockIcon = this.add.text(x, y + cardHeight / 2 - 30, '🔒', { fontSize: '24px' }).setOrigin(0.5, 0.5);
        this.missionElements.push(lockIcon);
      }
    });

    // Back button
    this.missionButtons.push(new Button(this, {
      x: 100, y: GAME_HEIGHT - 40, text: '← Volver',
      color: '#455A64', width: 140, height: 44, fontSize: 16,
      onClick: () => this.showState('menu'),
    }));
  }

  // ─── Objective Screen Sub-State ──────────────────────────────────────────────

  private showObjectiveScreen(): void {
    // Destroy previous objective elements
    for (const el of this.objectiveElements) el.destroy();
    this.objectiveElements = [];
    for (const btn of this.objectiveButtons) btn.destroy();
    this.objectiveButtons = [];

    if (!this.selectedLevel) return;
    const level = this.selectedLevel;

    const title = this.add.text(GAME_WIDTH / 2, 110, level.title, {
      fontFamily: 'Fredoka One, sans-serif', fontSize: '36px', color: '#ffffff',
    }).setOrigin(0.5, 0.5);
    this.objectiveElements.push(title);

    const objectiveText = this.getObjectiveDescription(level);
    const desc = this.add.text(GAME_WIDTH / 2, 200, objectiveText, {
      fontFamily: 'Nunito, sans-serif', fontSize: '20px', color: '#e0e0e0',
      align: 'center', wordWrap: { width: 600 }, lineSpacing: 8,
    }).setOrigin(0.5, 0.5);
    this.objectiveElements.push(desc);

    const details = this.add.text(GAME_WIDTH / 2, 290,
      `⏱ ${level.duration}s  |  🎯 ${level.reward.emoji} ${level.reward.name}`, {
      fontFamily: 'Nunito, sans-serif', fontSize: '16px', color: '#a0d8d0',
    }).setOrigin(0.5, 0.5);
    this.objectiveElements.push(details);

    // Buttons (absolute position, direct scene children)
    this.objectiveButtons.push(new Button(this, {
      x: GAME_WIDTH / 2, y: 380, text: '¡Comenzar!',
      color: '#4CAF50', width: 220, height: 56, fontSize: 24,
      onClick: () => this.scene.start('LevelScene', { level: level.id }),
    }));

    this.objectiveButtons.push(new Button(this, {
      x: GAME_WIDTH / 2, y: 450, text: '← Volver a misiones',
      color: '#455A64', width: 220, height: 44, fontSize: 16,
      onClick: () => this.showState('missionSelect'),
    }));
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

    // Hide/show backgrounds
    this.menuBg.setVisible(state === 'menu');
    this.missionBg.setVisible(state === 'missionSelect');
    this.objectiveBg.setVisible(state === 'objectiveScreen');

    // Hide/show non-interactive elements
    const setGroupVisible = (elements: Phaser.GameObjects.GameObject[], visible: boolean) => {
      for (const el of elements) {
        (el as unknown as { setVisible: (v: boolean) => void }).setVisible(visible);
      }
    };
    setGroupVisible(this.menuElements, state === 'menu');
    setGroupVisible(this.missionElements, state === 'missionSelect');
    setGroupVisible(this.objectiveElements, state === 'objectiveScreen');

    // Hide/show buttons (setVisible override handles interactivity automatically)
    const setButtonsActive = (buttons: Button[], active: boolean) => {
      for (const btn of buttons) {
        if (!btn || !btn.scene) continue;
        btn.setVisible(active);
      }
    };
    setButtonsActive(this.menuButtons, state === 'menu');
    setButtonsActive(this.missionButtons, state === 'missionSelect');
    setButtonsActive(this.objectiveButtons, state === 'objectiveScreen');

    // Create objective screen elements dynamically
    if (state === 'objectiveScreen') {
      this.showObjectiveScreen();
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

    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.currentState === 'objectiveScreen') {
        this.showState('missionSelect');
      } else if (this.currentState === 'missionSelect') {
        this.showState('menu');
      }
    });
  }

  private updateFocusableElements(): void {
    this.focusableElements.forEach((btn) => btn.setFocused(false));
    this.focusableElements = [];

    // Get the active button group
    let activeButtons: Button[] = [];
    switch (this.currentState) {
      case 'menu': activeButtons = this.menuButtons; break;
      case 'missionSelect': activeButtons = this.missionButtons; break;
      case 'objectiveScreen': activeButtons = this.objectiveButtons; break;
    }

    this.focusableElements = [...activeButtons];

    if (this.focusableElements.length > 0) {
      this.focusIndex = 0;
      this.focusableElements[0].setFocused(true);
    }
  }

  private cycleFocus(direction: number): void {
    if (this.focusableElements.length === 0) return;

    this.focusableElements[this.focusIndex]?.setFocused(false);

    this.focusIndex += direction;
    if (this.focusIndex < 0) this.focusIndex = this.focusableElements.length - 1;
    else if (this.focusIndex >= this.focusableElements.length) this.focusIndex = 0;

    this.focusableElements[this.focusIndex]?.setFocused(true);
  }
}
