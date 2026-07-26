import Phaser from 'phaser';
import type { GameState, LevelConfig } from '../types/game.types';
import { Button } from '../ui/Button';
import { DomInput } from '../ui/DomInput';
import { Toast } from '../ui/Toast';
import { StorageService } from '../services/storage-service';
import { RankingService } from '../services/ranking-service';
import { AudioSystem } from '../systems/audio-system';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';

/**
 * GameOverScene — Results screen shown when the player loses a level.
 *
 * Displays a motivational non-punitive message, partial VitaScore,
 * session stats, optional alias input for ranking submission,
 * and navigation buttons (Reintentar / Menú).
 *
 * @see Requirements 11.2, 11.4
 */
export class GameOverScene extends Phaser.Scene {
  private level!: 1 | 2 | 3;
  private state!: GameState;
  private vitaScore!: number;
  private levelConfig!: LevelConfig;
  private aliasInput!: DomInput;
  private audioSystem = new AudioSystem();
<<<<<<< HEAD
  private isSubmitting = false;
=======
  private matchId!: string;
  private submitted = false;
>>>>>>> 0c944d18c8a21c693c142ee2347134fc3eac066f

  // Keyboard navigation
  private focusableElements: Button[] = [];
  private focusIndex = 0;

  // Transition scheduling
  private transitionBlocked = false;
  private pendingTransition: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: { level: 1 | 2 | 3; state: GameState; vitaScore: number; levelConfig: LevelConfig }): void {
    this.level = data.level;
    this.state = data.state;
    this.vitaScore = data.vitaScore;
    this.levelConfig = data.levelConfig;
<<<<<<< HEAD
    this.isSubmitting = false;
    this.focusableElements = [];
    this.focusIndex = 0;
=======
    this.matchId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    this.submitted = false;
    this.focusableElements = [];
    this.focusIndex = 0;
    this.transitionBlocked = false;
    this.pendingTransition = null;
    this.aliasValue = '';
>>>>>>> 0c944d18c8a21c693c142ee2347134fc3eac066f
  }

  create(): void {
    // ── Initialize audio and play game-over SFX ──
    const settings = StorageService.getSettings();
    this.audioSystem.init(this, { musicEnabled: settings.musicEnabled, volume: settings.volume });
    this.audioSystem.playSFX('sfx-gameover');

    // ── Background (darker/subdued) ──
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a1420);

    // ── Layout ──
    const leftX = GAME_WIDTH * 0.3;
    const rightX = GAME_WIDTH * 0.7;

    // ── Motivational message ──
    const message = this.getMotivationalMessage();
    this.add.text(GAME_WIDTH / 2, 36, message, {
      fontFamily: 'Fredoka One, Nunito, sans-serif',
      fontSize: '26px',
      color: '#ff9966',
      align: 'center',
    }).setOrigin(0.5, 0.5);

    // ── VitaScore (partial) ──
    this.add.text(GAME_WIDTH / 2, 76, `VitaScore parcial: ${this.vitaScore}`, {
      fontFamily: 'Fredoka One, Nunito, sans-serif',
      fontSize: '20px',
      color: '#88bbdd',
      align: 'center',
    }).setOrigin(0.5, 0.5);

    // ── Stats Grid (left column) ──
    this.createStatsGrid(leftX, 120);

    // ── Alias input + submit (right column) ──
    this.createAliasSection(rightX, 140);

    // ── Navigation buttons (bottom center) ──
    this.createNavigationButtons();

    // ── Keyboard Navigation ──
    this.setupKeyboardNavigation();
  }

  // ─── Motivational Messages ───────────────────────────────────────────────────

  private getMotivationalMessage(): string {
    const messages = [
      '¡Buen intento!',
      '¡No te rindas, podés lograrlo!',
      '¡Casi lo lográs!',
      '¡Seguí practicando!',
      '¡La próxima va a ser la buena!',
    ];
    const index = Math.floor(Math.random() * messages.length);
    return messages[index];
  }

  // ─── Stats Grid ──────────────────────────────────────────────────────────────

  private createStatsGrid(x: number, startY: number): void {
    const stats = [
      { label: 'Puntuación', value: `${this.state.score}` },
      { label: 'Errores', value: `${this.state.errors}` },
      { label: 'Combo máx', value: `${this.state.maxCombo}` },
      { label: 'Capturas correctas', value: `${this.state.correctCaptures}` },
      { label: 'Balance', value: `${this.state.balance}` },
      { label: 'Precisión', value: `${this.state.precision.toFixed(1)}%` },
    ];

    const lineHeight = 28;

    this.add.text(x, startY, 'Estadísticas', {
      fontFamily: 'Fredoka One, Nunito, sans-serif',
      fontSize: '16px',
      color: '#99aabb',
      align: 'center',
    }).setOrigin(0.5, 0.5);

    stats.forEach((stat, index) => {
      const y = startY + 28 + index * lineHeight;

      this.add.text(x - 110, y, stat.label, {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '14px',
        color: '#999999',
        align: 'left',
      }).setOrigin(0, 0.5);

      this.add.text(x + 110, y, stat.value, {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '14px',
        color: '#cccccc',
        fontStyle: 'bold',
        align: 'right',
      }).setOrigin(1, 0.5);
    });
  }

  // ─── Alias Input Section ─────────────────────────────────────────────────────

  private createAliasSection(x: number, y: number): void {
    // Pre-fill from profile
    const profile = StorageService.getProfile();
    const initialAlias = profile.nickname || '';

    this.add.text(x, y, 'Alias para ranking (puntaje parcial):', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '13px',
      color: '#888888',
      align: 'center',
    }).setOrigin(0.5, 0.5);

    const inputWidth = 200;
    const inputHeight = 32;
    const inputY = y + 14;

    // Real HTML input overlaid on canvas
    this.aliasInput = new DomInput(this, {
      x,
      y: inputY,
      width: inputWidth,
      height: inputHeight,
      placeholder: 'Tu alias...',
      initialValue: initialAlias,
      maxLength: 16,
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

<<<<<<< HEAD
  private async handleSubmitRanking(): Promise<void> {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    const alias = this.aliasInput.getValue();
=======
  private handleSubmitRanking(): void {
    const alias = this.aliasValue.trim();
>>>>>>> 0c944d18c8a21c693c142ee2347134fc3eac066f

    // Validate alias: 1–16 chars, alphanumeric + spaces
    if (alias.length < 1 || alias.length > 16 || !/^[a-zA-Z0-9 ]+$/.test(alias)) {
      Toast.show(this, {
        text: 'Alias inválido',
        subtext: '1–16 caracteres (letras, números, espacios)',
        color: '#ff6644',
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT / 2,
      });
      this.isSubmitting = false;
      return;
    }

    // Deduplication: check in-memory flag
    if (this.submitted) {
      Toast.show(this, {
        text: 'Ya registrado',
        subtext: 'Este resultado ya fue enviado',
        color: '#ff8844',
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT / 2,
      });
      return;
    }

    // Deduplication: check localStorage
    if (RankingService.isAlreadySubmitted(this.matchId)) {
      Toast.show(this, {
        text: 'Ya registrado',
        subtext: 'Este resultado ya fue enviado',
        color: '#ff8844',
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT / 2,
      });
      return;
    }

    // Save alias to profile
    const profile = StorageService.getProfile();
    profile.nickname = alias;
    StorageService.saveProfile(profile);

<<<<<<< HEAD
    const success = await RankingService.submit({
=======
    // Build submission object
    const submission = {
>>>>>>> 0c944d18c8a21c693c142ee2347134fc3eac066f
      alias,
      level: this.level,
      vitaScore: this.vitaScore,
      precision: this.state.precision,
      variety: this.state.uniqueItems.length,
<<<<<<< HEAD
    });

    if (success) {
      Toast.show(this, {
        text: '¡Puntaje enviado!',
        subtext: 'Mirá tu posición en el ranking',
        color: '#44ff88',
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT / 2,
      });

      // Navigate to ranking screen after a short delay so the user sees the toast
      this.time.delayedCall(1500, () => {
        this.scene.start('RankingScene', { level: this.level });
      });
    } else {
=======
    };

    // Persist locally — wrap in try/catch to detect save failure
    try {
      RankingService.saveLocal(submission, this.matchId);
    } catch {
      Toast.show(this, {
        text: 'No se pudo guardar',
        subtext: 'Intentá de nuevo más tarde',
        color: '#ff6644',
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT / 2,
      });
      return;
    }

    // Verify save succeeded by checking localStorage
    if (!RankingService.isAlreadySubmitted(this.matchId)) {
>>>>>>> 0c944d18c8a21c693c142ee2347134fc3eac066f
      Toast.show(this, {
        text: 'No se pudo guardar',
        subtext: 'Intentá de nuevo más tarde',
        color: '#ff6644',
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT / 2,
      });
<<<<<<< HEAD
      this.isSubmitting = false;
=======
      return;
>>>>>>> 0c944d18c8a21c693c142ee2347134fc3eac066f
    }

    this.submitted = true;

    // Show confirmation toast
    Toast.show(this, {
      text: '¡Puntaje enviado!',
      subtext: 'Tu score parcial está en el ranking',
      color: '#44ff88',
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2,
    });

    // Fire-and-forget remote submit (don't await before scheduling transition)
    RankingService.submit(submission);

    // Schedule navigation to RankingScene
    this.scheduleRankingTransition();
  }

  // ─── Transition Scheduling ───────────────────────────────────────────────────

  private scheduleRankingTransition(): void {
    // Disable all interactive buttons
    this.focusableElements.forEach((btn) => btn.setEnabled(false));
    this.transitionBlocked = true;

    // Schedule navigation after 2000ms delay
    this.pendingTransition = this.time.delayedCall(2000, () => {
      this.scene.start('RankingScene', { level: this.level });
    });
  }

  // ─── Navigation Buttons ──────────────────────────────────────────────────────

  private createNavigationButtons(): void {
    const buttonY = GAME_HEIGHT - 44;

    // "Reintentar" button
    const retryBtn = new Button(this, {
      x: GAME_WIDTH / 2 - 110,
      y: buttonY,
      text: 'Reintentar',
      color: '#FF9800',
      width: 160,
      height: 44,
      fontSize: 16,
      onClick: () => this.handleRetry(),
    });
    this.focusableElements.push(retryBtn);

    // "Menú" button
    const menuBtn = new Button(this, {
      x: GAME_WIDTH / 2 + 110,
      y: buttonY,
      text: 'Menú',
      color: '#607D8B',
      width: 160,
      height: 44,
      fontSize: 16,
      onClick: () => this.handleMenu(),
    });
    this.focusableElements.push(menuBtn);

    // Set initial focus on first element
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].setFocused(true);
    }
  }

  private handleRetry(): void {
    this.scene.start('LevelScene', { level: this.level });
  }

  private handleMenu(): void {
    this.scene.start('MenuScene');
  }

  // ─── Keyboard Navigation ─────────────────────────────────────────────────────

  private setupKeyboardNavigation(): void {
    this.input.keyboard?.on('keydown-TAB', (event: KeyboardEvent) => {
      if (this.transitionBlocked) return;
      event.preventDefault();
      this.cycleFocus(event.shiftKey ? -1 : 1);
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.transitionBlocked) return;
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

  // ─── Scene Lifecycle ─────────────────────────────────────────────────────────

  shutdown(): void {
    if (this.pendingTransition) {
      this.pendingTransition.remove(false);
      this.pendingTransition = null;
    }
  }
}
