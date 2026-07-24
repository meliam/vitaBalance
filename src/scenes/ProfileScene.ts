import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Button } from '../ui/Button';
import { StorageService } from '../services/storage-service';
import { LEVELS } from '../config/levels';
import { isLevelUnlocked } from '../systems/progress-system';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import type { ProgressData } from '../types/game.types';

/**
 * ProfileScene — Player profile screen showing avatar, stats, outfit collection,
 * and level progression.
 *
 * Displays the player's accumulated VitaScore, total points, nickname (editable),
 * current outfit at progress level with idle bob animation, outfit collection grid
 * (locked vs unlocked), and level progression indicators.
 *
 * @see Requirements 20.1–20.6
 */
export class ProfileScene extends Phaser.Scene {
  private player!: Player;
  private nicknameText!: Phaser.GameObjects.Text;
  private nicknameValue = '';
  private editingNickname = false;
  private editIcon!: Phaser.GameObjects.Text;
  private inputBg!: Phaser.GameObjects.Graphics;
  private bobTween: Phaser.Tweens.Tween | null = null;

  // Keyboard navigation
  private focusableElements: Button[] = [];
  private focusIndex = 0;

  constructor() {
    super({ key: 'ProfileScene' });
  }

  create(): void {
    const progress = StorageService.getProgress();
    const profile = StorageService.getProfile();
    this.nicknameValue = profile.nickname;

    // ── Background ──
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0d1b2a);

    // ── Title ──
    this.add.text(GAME_WIDTH / 2, 30, 'Mi Perfil', {
      fontFamily: 'Fredoka One, Nunito, sans-serif',
      fontSize: '26px',
      color: '#ffd700',
      align: 'center',
    }).setOrigin(0.5, 0.5);

    // ── Layout columns ──
    const leftX = GAME_WIDTH * 0.22;
    const centerX = GAME_WIDTH * 0.5;
    const rightX = GAME_WIDTH * 0.78;

    // ── Player Avatar (left column) ──
    this.createAvatarSection(leftX, 180, progress.outfitLevel);

    // ── Nickname + Stats (center column) ──
    this.createNicknameSection(centerX, 80);
    this.createStatsSection(centerX, 160, profile);

    // ── Outfit Collection Grid (center column) ──
    this.createOutfitCollection(centerX, 280, progress.levelsCompleted);

    // ── Level Progression (right column) ──
    this.createLevelProgression(rightX, 130, progress);

    // ── Back Button ──
    const backBtn = new Button(this, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 50,
      text: '← Volver al Menú',
      color: '#607D8B',
      width: 200,
      height: 44,
      fontSize: 16,
      onClick: () => this.scene.start('MenuScene'),
    });
    this.focusableElements.push(backBtn);

    // ── Keyboard Navigation ──
    this.setupKeyboardNavigation();
  }

  // ─── Avatar Section ──────────────────────────────────────────────────────────

  private createAvatarSection(x: number, y: number, outfitLevel: number): void {
    this.player = new Player(this, x, y);
    this.player.setOutfit(outfitLevel);

    // Idle bob animation (gentle y oscillation)
    const reduceMotion = this.registry.get('reduceMotion') as boolean;

    if (!reduceMotion) {
      this.bobTween = this.tweens.add({
        targets: this.player,
        y: y - 6,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Outfit name label
    const outfitName = this.getOutfitName(outfitLevel);
    this.add.text(x, y + 60, outfitName, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '14px',
      color: '#cccccc',
      align: 'center',
    }).setOrigin(0.5, 0.5);
  }

  private getOutfitName(outfitLevel: number): string {
    switch (outfitLevel) {
      case 1: return '🧢 Gorra Cítrica';
      case 2: return '👕 Remera VitaBalance';
      case 3: return '🦸 Capa VitaHero';
      default: return 'Sin accesorios';
    }
  }

  // ─── Nickname Section ────────────────────────────────────────────────────────

  private createNicknameSection(x: number, y: number): void {
    this.nicknameText = this.add.text(x, y, this.nicknameValue, {
      fontFamily: 'Fredoka One, Nunito, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5, 0.5);

    // Edit icon (shown if nickname is default "Jugador")
    this.editIcon = this.add.text(x + this.nicknameText.width / 2 + 16, y, '✏️', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });

    this.editIcon.on('pointerdown', () => this.startEditing(x, y));

    // Input background (hidden initially)
    this.inputBg = this.add.graphics();
    this.inputBg.setVisible(false);
  }

  private startEditing(x: number, y: number): void {
    if (this.editingNickname) return;
    this.editingNickname = true;

    // Show input background
    const inputWidth = 200;
    const inputHeight = 32;
    this.inputBg.clear();
    this.inputBg.fillStyle(0x1a2a3a, 1);
    this.inputBg.fillRoundedRect(x - inputWidth / 2, y - inputHeight / 2, inputWidth, inputHeight, 8);
    this.inputBg.lineStyle(2, 0x4488ff, 1);
    this.inputBg.strokeRoundedRect(x - inputWidth / 2, y - inputHeight / 2, inputWidth, inputHeight, 8);
    this.inputBg.setVisible(true);

    // Hide edit icon during editing
    this.editIcon.setVisible(false);

    // Change text style to indicate editing
    this.nicknameText.setColor('#44ff88');

    // Add cursor blink effect
    const cursorBlink = this.time.addEvent({
      delay: 500,
      callback: () => {
        const showCursor = this.nicknameText.text.endsWith('|');
        this.nicknameText.setText(
          showCursor ? this.nicknameValue : this.nicknameValue + '|',
        );
      },
      loop: true,
    });

    // Keyboard input handling
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === 'Escape') {
        this.finishEditing(cursorBlink);
        return;
      }

      if (event.key === 'Backspace') {
        this.nicknameValue = this.nicknameValue.slice(0, -1);
      } else if (event.key.length === 1 && this.nicknameValue.length < 16) {
        if (/^[a-zA-Z0-9 áéíóúñÁÉÍÓÚÑ]$/.test(event.key)) {
          this.nicknameValue += event.key;
        }
      }

      this.nicknameText.setText(this.nicknameValue + '|');
    };

    this.input.keyboard?.on('keydown', keyHandler);

    // Store handler reference for cleanup
    (this as unknown as Record<string, unknown>)._keyHandler = keyHandler;
  }

  private finishEditing(cursorBlink: Phaser.Time.TimerEvent): void {
    this.editingNickname = false;
    cursorBlink.destroy();

    // Remove keyboard handler
    const keyHandler = (this as unknown as Record<string, unknown>)._keyHandler as
      ((event: KeyboardEvent) => void) | undefined;
    if (keyHandler) {
      this.input.keyboard?.off('keydown', keyHandler);
    }

    // If empty, reset to default
    if (this.nicknameValue.trim().length === 0) {
      this.nicknameValue = 'Jugador';
    }

    // Update display
    this.nicknameText.setText(this.nicknameValue);
    this.nicknameText.setColor('#ffffff');
    this.inputBg.setVisible(false);
    this.editIcon.setVisible(true);

    // Update edit icon position
    this.editIcon.setX(
      this.nicknameText.x + this.nicknameText.width / 2 + 16,
    );

    // Persist to localStorage
    const profile = StorageService.getProfile();
    profile.nickname = this.nicknameValue;
    StorageService.saveProfile(profile);
  }

  // ─── Stats Section ───────────────────────────────────────────────────────────

  private createStatsSection(x: number, y: number, profile: { totalVitaScore: number; totalPoints: number }): void {
    this.add.text(x, y, `⭐ VitaScore Total: ${profile.totalVitaScore}`, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '16px',
      color: '#44ff88',
      align: 'center',
    }).setOrigin(0.5, 0.5);

    this.add.text(x, y + 30, `🏆 Puntos Totales: ${profile.totalPoints}`, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '16px',
      color: '#ffcc44',
      align: 'center',
    }).setOrigin(0.5, 0.5);
  }

  // ─── Outfit Collection ───────────────────────────────────────────────────────

  private createOutfitCollection(x: number, y: number, levelsCompleted: number[]): void {
    this.add.text(x, y, 'Colección de Accesorios', {
      fontFamily: 'Fredoka One, Nunito, sans-serif',
      fontSize: '15px',
      color: '#aaccff',
      align: 'center',
    }).setOrigin(0.5, 0.5);

    const rewards = LEVELS.map((level) => ({
      level: level.id,
      name: level.reward.name,
      emoji: level.reward.emoji,
      unlocked: levelsCompleted.includes(level.id),
    }));

    const gridStartX = x - 120;
    const gridY = y + 40;
    const cellWidth = 120;

    rewards.forEach((reward, index) => {
      const cellX = gridStartX + index * cellWidth;

      // Background card
      const cardGfx = this.add.graphics();
      const cardColor = reward.unlocked ? 0x1a3a2a : 0x1a1a2a;
      cardGfx.fillStyle(cardColor, 1);
      cardGfx.fillRoundedRect(cellX - 45, gridY - 30, 90, 80, 8);

      if (reward.unlocked) {
        cardGfx.lineStyle(2, 0x44ff88, 0.6);
      } else {
        cardGfx.lineStyle(1, 0x444466, 0.4);
      }
      cardGfx.strokeRoundedRect(cellX - 45, gridY - 30, 90, 80, 8);

      // Emoji/icon
      const displayEmoji = reward.unlocked ? reward.emoji : '🔒';
      this.add.text(cellX, gridY, displayEmoji, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        align: 'center',
      }).setOrigin(0.5, 0.5);

      // Name
      const nameColor = reward.unlocked ? '#ffffff' : '#999999';
      this.add.text(cellX, gridY + 30, reward.name, {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '11px',
        color: nameColor,
        align: 'center',
        wordWrap: { width: 80 },
      }).setOrigin(0.5, 0.5);
    });
  }

  // ─── Level Progression ───────────────────────────────────────────────────────

  private createLevelProgression(x: number, y: number, progress: ProgressData): void {
    this.add.text(x, y, 'Progreso de Niveles', {
      fontFamily: 'Fredoka One, Nunito, sans-serif',
      fontSize: '15px',
      color: '#aaccff',
      align: 'center',
    }).setOrigin(0.5, 0.5);

    const reduceMotion = this.registry.get('reduceMotion') as boolean;

    LEVELS.forEach((level, index) => {
      const levelY = y + 40 + index * 70;
      const completed = progress.levelsCompleted.includes(level.id);
      const unlocked = isLevelUnlocked(level.id, progress);
      const isNext = unlocked && !completed;

      // Level indicator circle
      const circleGfx = this.add.graphics();
      const circleRadius = 18;

      if (completed) {
        // Completed: green with checkmark
        circleGfx.fillStyle(0x22c55e, 1);
        circleGfx.fillCircle(x - 50, levelY, circleRadius);

        this.add.text(x - 50, levelY, '✓', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '20px',
          color: '#ffffff',
          fontStyle: 'bold',
          align: 'center',
        }).setOrigin(0.5, 0.5);
      } else if (isNext) {
        // Next available: highlighted/pulsing
        circleGfx.fillStyle(0xfbbf24, 1);
        circleGfx.fillCircle(x - 50, levelY, circleRadius);

        const pulseCircle = this.add.graphics();
        pulseCircle.fillStyle(0xfbbf24, 1);
        pulseCircle.fillCircle(x - 50, levelY, circleRadius);

        if (!reduceMotion) {
          this.tweens.add({
            targets: pulseCircle,
            alpha: { from: 1, to: 0.4 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        }

        this.add.text(x - 50, levelY, `${level.id}`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          color: '#000000',
          fontStyle: 'bold',
          align: 'center',
        }).setOrigin(0.5, 0.5);
      } else {
        // Locked: gray
        circleGfx.fillStyle(0x444466, 1);
        circleGfx.fillCircle(x - 50, levelY, circleRadius);

        this.add.text(x - 50, levelY, '🔒', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          align: 'center',
        }).setOrigin(0.5, 0.5);
      }

      // Level title
      const titleColor = completed ? '#44ff88' : unlocked ? '#fbbf24' : '#999999';
      this.add.text(x - 20, levelY, level.title.replace('Nivel ', 'N'), {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '13px',
        color: titleColor,
        align: 'left',
      }).setOrigin(0, 0.5);
    });
  }

  // ─── Keyboard Navigation ───────────────────────────────────────────────────

  private setupKeyboardNavigation(): void {
    this.input.keyboard?.on('keydown-TAB', (event: KeyboardEvent) => {
      event.preventDefault();
      this.cycleFocus(event.shiftKey ? -1 : 1);
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });

    // Set initial focus
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].setFocused(true);
    }
  }

  private cycleFocus(direction: number): void {
    if (this.focusableElements.length === 0) return;

    this.focusableElements[this.focusIndex]?.setFocused(false);

    this.focusIndex += direction;
    if (this.focusIndex < 0) {
      this.focusIndex = this.focusableElements.length - 1;
    } else if (this.focusIndex >= this.focusableElements.length) {
      this.focusIndex = 0;
    }

    this.focusableElements[this.focusIndex]?.setFocused(true);
  }

  // ─── Cleanup ─────────────────────────────────────────────────────────────────

  shutdown(): void {
    if (this.bobTween) {
      this.bobTween.destroy();
      this.bobTween = null;
    }
  }
}
