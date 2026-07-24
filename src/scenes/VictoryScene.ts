import Phaser from 'phaser';
import type { GameState, LevelConfig } from '../types/game.types';
import { Button } from '../ui/Button';
import { ConfettiEffect } from '../ui/ConfettiEffect';
import { Toast } from '../ui/Toast';
import { StorageService } from '../services/storage-service';
import { RankingService } from '../services/ranking-service';
import { handleLevelComplete } from '../systems/progress-system';
import { AudioSystem } from '../systems/audio-system';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';

/**
 * VictoryScene — Results screen shown after completing a level.
 *
 * Displays confetti (respects reduceMotion), star rating, VitaScore,
 * detailed stats, unlocked reward, educational summary, alias input
 * for ranking submission, and navigation buttons.
 *
 * @see Requirements 11.1, 11.3, 11.5, 11.6, 11.7, 5.4, 6.4, 7.4, 9.2–9.5
 */
export class VictoryScene extends Phaser.Scene {
  private level!: 1 | 2 | 3;
  private state!: GameState;
  private vitaScore!: number;
  private levelConfig!: LevelConfig;
  private aliasValue = '';
  private audioSystem = new AudioSystem();

  // Keyboard navigation
  private focusableElements: Button[] = [];
  private focusIndex = 0;

  constructor() {
    super({ key: 'VictoryScene' });
  }

  init(data: { level: 1 | 2 | 3; state: GameState; vitaScore: number; levelConfig: LevelConfig }): void {
    this.level = data.level;
    this.state = data.state;
    this.vitaScore = data.vitaScore;
    this.levelConfig = data.levelConfig;
  }

  create(): void {
    // ── Initialize audio and play victory SFX ──
    const settings = StorageService.getSettings();
    this.audioSystem.init(this, { musicEnabled: settings.musicEnabled, volume: settings.volume });
    this.audioSystem.playSFX('sfx-victory');

    // ── Update progress ──
    this.updateProgress();

    // ── Background ──
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0d1b2a);

    // ── Confetti (respect reduceMotion) ──
    const reduceMotion = this.registry.get('reduceMotion') as boolean;
    ConfettiEffect.play(this, reduceMotion);

    // ── Star Rating ──
    const stars = this.calculateStars();
    const starText = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

    // ── Layout: Left column (stats), Right column (reward + educational + alias) ──
    const leftX = GAME_WIDTH * 0.28;
    const rightX = GAME_WIDTH * 0.72;

    // ── Title ──
    this.add.text(GAME_WIDTH / 2, 30, '¡Misión Completada!', {
      fontFamily: 'Fredoka One, Nunito, sans-serif',
      fontSize: '28px',
      color: '#ffd700',
      align: 'center',
    }).setOrigin(0.5, 0.5);

    // ── Star display ──
    this.add.text(GAME_WIDTH / 2, 62, starText, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '32px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5, 0.5);

    // ── VitaScore prominent display ──
    this.add.text(GAME_WIDTH / 2, 96, `VitaScore: ${this.vitaScore}`, {
      fontFamily: 'Fredoka One, Nunito, sans-serif',
      fontSize: '22px',
      color: '#44ff88',
      align: 'center',
    }).setOrigin(0.5, 0.5);

    // ── Stats Grid (left column) ──
    this.createStatsGrid(leftX, 130, stars);

    // ── Reward (right column top) ──
    this.createRewardSection(rightX, 130);

    // ── Educational section ──
    this.createEducationalSection(rightX, 230);

    // ── Alias input + submit (right column) ──
    this.createAliasSection(rightX, 330);

    // ── Navigation buttons (bottom center) ──
    this.createNavigationButtons();

    // ── Keyboard Navigation ──
    this.setupKeyboardNavigation();
  }

  // ─── Progress Update ─────────────────────────────────────────────────────────

  private updateProgress(): void {
    const progress = StorageService.getProgress();
    const newProgress = handleLevelComplete(this.level, true, progress);
    StorageService.saveProgress(newProgress);
  }

  // ─── Star Calculation ────────────────────────────────────────────────────────

  private calculateStars(): number {
    if (this.state.errors === 0) return 3;
    if (this.state.errors <= 3) return 2;
    return 1;
  }

  // ─── Stats Grid ──────────────────────────────────────────────────────────────

  private createStatsGrid(x: number, startY: number, stars: number): void {
    const stats = [
      { label: 'Balance', value: `${this.state.balance}` },
      { label: 'Precisión', value: `${this.state.precision.toFixed(1)}%` },
      { label: 'Variedad', value: `${this.state.uniqueItems.length}` },
      { label: 'Tiempo extra', value: `${Math.max(0, this.state.timeLeft).toFixed(1)}s` },
      { label: 'Errores', value: `${this.state.errors}` },
      { label: 'Combo máx', value: `${this.state.maxCombo}` },
      { label: 'Puntuación', value: `${this.state.score}` },
      { label: 'Estrellas', value: `${'⭐'.repeat(stars)}` },
    ];

    const lineHeight = 28;

    this.add.text(x, startY, 'Estadísticas', {
      fontFamily: 'Fredoka One, Nunito, sans-serif',
      fontSize: '16px',
      color: '#aaccff',
      align: 'center',
    }).setOrigin(0.5, 0.5);

    stats.forEach((stat, index) => {
      const y = startY + 28 + index * lineHeight;

      this.add.text(x - 100, y, stat.label, {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '14px',
        color: '#cccccc',
        align: 'left',
      }).setOrigin(0, 0.5);

      this.add.text(x + 100, y, stat.value, {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
        align: 'right',
      }).setOrigin(1, 0.5);
    });
  }

  // ─── Reward Section ──────────────────────────────────────────────────────────

  private createRewardSection(x: number, y: number): void {
    const reward = this.levelConfig.reward;

    this.add.text(x, y, '🎁 Recompensa desbloqueada', {
      fontFamily: 'Fredoka One, Nunito, sans-serif',
      fontSize: '15px',
      color: '#ffd700',
      align: 'center',
    }).setOrigin(0.5, 0.5);

    this.add.text(x, y + 30, `${reward.emoji} ${reward.name}`, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5, 0.5);
  }

  // ─── Educational Section ─────────────────────────────────────────────────────

  private createEducationalSection(x: number, y: number): void {
    const educationalText = this.getEducationalText();

    this.add.text(x, y, '📚 Lo que aprendiste:', {
      fontFamily: 'Fredoka One, Nunito, sans-serif',
      fontSize: '14px',
      color: '#88ccff',
      align: 'center',
    }).setOrigin(0.5, 0.5);

    this.add.text(x, y + 26, educationalText, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '13px',
      color: '#dddddd',
      align: 'center',
      wordWrap: { width: 280 },
    }).setOrigin(0.5, 0);
  }

  private getEducationalText(): string {
    switch (this.level) {
      case 1:
        return 'Aprendiste a identificar frutas y verduras frescas y a distinguirlas de las que están en mal estado.';
      case 2:
        return 'Descubriste cómo combinar alimentos para obtener distintos nutrientes como vitamina C y potasio.';
      case 3:
        return 'Conociste qué frutas y verduras están disponibles en cada estación del año en nuestra región.';
      default:
        return '';
    }
  }

  // ─── Alias Input Section ─────────────────────────────────────────────────────

  private createAliasSection(x: number, y: number): void {
    // Pre-fill from profile
    const profile = StorageService.getProfile();
    this.aliasValue = profile.nickname || '';

    this.add.text(x, y, 'Alias para ranking:', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '13px',
      color: '#aaaaaa',
      align: 'center',
    }).setOrigin(0.5, 0.5);

    // Simulated text input using Phaser text + keyboard capture
    const inputBg = this.add.graphics();
    const inputWidth = 200;
    const inputHeight = 32;
    const inputX = x - inputWidth / 2;
    const inputY = y + 14;

    inputBg.fillStyle(0x1a2a3a, 1);
    inputBg.fillRoundedRect(inputX, inputY, inputWidth, inputHeight, 8);
    inputBg.lineStyle(2, 0x4488ff, 1);
    inputBg.strokeRoundedRect(inputX, inputY, inputWidth, inputHeight, 8);

    const aliasDisplay = this.add.text(x, inputY + inputHeight / 2, this.aliasValue, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '14px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5, 0.5);

    // Keyboard input handling
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Backspace') {
        this.aliasValue = this.aliasValue.slice(0, -1);
      } else if (event.key.length === 1 && this.aliasValue.length < 16) {
        // Allow alphanumeric + spaces
        if (/^[a-zA-Z0-9 ]$/.test(event.key)) {
          this.aliasValue += event.key;
        }
      }
      aliasDisplay.setText(this.aliasValue);
    });

    // Submit button
    const submitBtn = new Button(this, {
      x,
      y: inputY + inputHeight + 28,
      text: 'Enviar al ranking',
      color: '#2196F3',
      width: 180,
      height: 36,
      fontSize: 14,
      onClick: () => this.handleSubmitRanking(),
    });
    this.focusableElements.push(submitBtn);
  }

  // ─── Ranking Submission ──────────────────────────────────────────────────────

  private async handleSubmitRanking(): Promise<void> {
    const alias = this.aliasValue.trim();

    // Validate alias: 1–16 chars, alphanumeric + spaces
    if (alias.length < 1 || alias.length > 16 || !/^[a-zA-Z0-9 ]+$/.test(alias)) {
      Toast.show(this, {
        text: 'Alias inválido',
        subtext: '1–16 caracteres (letras, números, espacios)',
        color: '#ff6644',
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT / 2,
      });
      return;
    }

    // Save alias to profile
    const profile = StorageService.getProfile();
    profile.nickname = alias;
    StorageService.saveProfile(profile);

    try {
      await RankingService.submit({
        alias,
        level: this.level,
        vitaScore: this.vitaScore,
        precision: this.state.precision,
        variety: this.state.uniqueItems.length,
      });

      Toast.show(this, {
        text: '¡Puntaje enviado!',
        subtext: 'Tu score está en el ranking',
        color: '#44ff88',
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT / 2,
      });
    } catch {
      Toast.show(this, {
        text: 'Ranking temporalmente no disponible',
        subtext: 'Intentá más tarde',
        color: '#ff8844',
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT / 2,
      });
    }
  }

  // ─── Navigation Buttons ──────────────────────────────────────────────────────

  private createNavigationButtons(): void {
    const buttonY = GAME_HEIGHT - 44;

    // "Continuar" button
    const continueText = this.level < 3 ? 'Continuar' : 'Menú';
    const continueBtn = new Button(this, {
      x: GAME_WIDTH / 2 - 110,
      y: buttonY,
      text: continueText,
      color: '#4CAF50',
      width: 160,
      height: 44,
      fontSize: 16,
      onClick: () => this.handleContinue(),
    });
    this.focusableElements.push(continueBtn);

    // "Repetir" button
    const repeatBtn = new Button(this, {
      x: GAME_WIDTH / 2 + 110,
      y: buttonY,
      text: 'Repetir',
      color: '#FF9800',
      width: 160,
      height: 44,
      fontSize: 16,
      onClick: () => this.handleRepeat(),
    });
    this.focusableElements.push(repeatBtn);

    // Set initial focus on first element
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].setFocused(true);
    }
  }

  private handleContinue(): void {
    if (this.level < 3) {
      const nextLevel = (this.level + 1) as 1 | 2 | 3;
      this.scene.start('LevelScene', { level: nextLevel });
    } else {
      this.scene.start('MenuScene');
    }
  }

  private handleRepeat(): void {
    this.scene.start('LevelScene', { level: this.level });
  }

  // ─── Keyboard Navigation ─────────────────────────────────────────────────────

  private setupKeyboardNavigation(): void {
    this.input.keyboard?.on('keydown-TAB', (event: KeyboardEvent) => {
      event.preventDefault();
      this.cycleFocus(event.shiftKey ? -1 : 1);
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });
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
}
