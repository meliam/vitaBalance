import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { Button } from '../ui/Button';
import { Toggle } from '../ui/Toggle';
import { StorageService } from '../services/storage-service';
import type { SettingsData } from '../types/game.types';

/**
 * SettingsScene — Configuration screen for accessibility, audio, and controls.
 *
 * Features:
 * - "Reducir movimiento" toggle (persists to localStorage, updates registry)
 * - Music on/off toggle (persists, ready for AudioSystem integration)
 * - Volume control with +/- buttons (persists)
 * - Keyboard control reference
 * - Accessibility information block
 * - Nutritional disclaimer
 * - Back button to return to MenuScene
 *
 * @see Requirements 15.7, 19.2, 19.3, 19.4, 21.7, 21.8, 21.9
 */
export class SettingsScene extends Phaser.Scene {
  private settings!: SettingsData;
  private volumeText!: Phaser.GameObjects.Text;
  private focusableElements: (Button | Toggle)[] = [];
  private focusIndex = 0;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create(): void {
    this.settings = StorageService.getSettings();

    // Sync reduceMotion with registry (which may reflect OS preference)
    const registryReduceMotion = this.registry.get('reduceMotion') as boolean | undefined;
    if (registryReduceMotion !== undefined) {
      this.settings.reduceMotion = registryReduceMotion;
    }

    this.createBackground();
    this.createTitle();
    this.createSettingsPanel();
    this.createKeyboardReference();
    this.createAccessibilityInfo();
    this.createDisclaimer();
    this.createBackButton();
    this.setupKeyboardNavigation();
  }

  // ─── Background ──────────────────────────────────────────────────────────────

  private createBackground(): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f2744, 0x0f2744, 0x1a2a3a, 0x1a2a3a, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  // ─── Title ───────────────────────────────────────────────────────────────────

  private createTitle(): void {
    const title = this.add.text(GAME_WIDTH / 2, 36, '⚙️ Ajustes', {
      fontFamily: 'Fredoka One, sans-serif',
      fontSize: '32px',
      color: '#ffffff',
      align: 'center',
    });
    title.setOrigin(0.5, 0.5);
  }

  // ─── Settings Panel (Toggles + Volume) ───────────────────────────────────────

  private createSettingsPanel(): void {
    const panelX = 80;
    let y = 80;

    // ── Reducir movimiento toggle
    const reduceMotionLabel = this.add.text(panelX, y, 'Reducir movimiento', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '18px',
      color: '#e0e0e0',
    });
    reduceMotionLabel.setOrigin(0, 0.5);

    const reduceMotionToggle = new Toggle(this, {
      x: panelX + 320,
      y,
      value: this.settings.reduceMotion,
      onChange: (value: boolean) => {
        this.settings.reduceMotion = value;
        this.saveSettings();
        this.registry.set('reduceMotion', value);
        // Update the OS-level CSS class to signal reduced motion
        document.documentElement.classList.toggle('reduce-motion', value);
      },
    });
    this.focusableElements.push(reduceMotionToggle);

    y += 50;

    // ── Music toggle
    const musicLabel = this.add.text(panelX, y, 'Música', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '18px',
      color: '#e0e0e0',
    });
    musicLabel.setOrigin(0, 0.5);

    const musicToggle = new Toggle(this, {
      x: panelX + 320,
      y,
      value: this.settings.musicEnabled,
      onChange: (value: boolean) => {
        this.settings.musicEnabled = value;
        this.saveSettings();
        // Apply music toggle globally: mute/unmute the Phaser sound manager
        this.sound.mute = !value;
        this.registry.set('musicEnabled', value);
      },
    });
    this.focusableElements.push(musicToggle);

    y += 50;

    // ── Volume control
    const volumeLabel = this.add.text(panelX, y, 'Volumen', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '18px',
      color: '#e0e0e0',
    });
    volumeLabel.setOrigin(0, 0.5);

    const minusBtn = new Button(this, {
      x: panelX + 280,
      y,
      text: '−',
      color: '#455A64',
      width: 44,
      height: 44,
      fontSize: 24,
      onClick: () => this.adjustVolume(-0.1),
    });
    this.focusableElements.push(minusBtn);

    this.volumeText = this.add.text(
      panelX + 340,
      y,
      this.formatVolume(this.settings.volume),
      {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '18px',
        color: '#ffffff',
        align: 'center',
      },
    );
    this.volumeText.setOrigin(0.5, 0.5);

    const plusBtn = new Button(this, {
      x: panelX + 400,
      y,
      text: '+',
      color: '#455A64',
      width: 44,
      height: 44,
      fontSize: 24,
      onClick: () => this.adjustVolume(0.1),
    });
    this.focusableElements.push(plusBtn);
  }

  // ─── Keyboard Reference ──────────────────────────────────────────────────────

  private createKeyboardReference(): void {
    const panelX = GAME_WIDTH / 2 + 60;
    let y = 80;

    const header = this.add.text(panelX, y, '🎮 Controles de teclado', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '18px',
      color: '#a0d8d0',
      fontStyle: 'bold',
    });
    header.setOrigin(0, 0.5);

    y += 32;

    const controls = [
      '← → / A D: Mover avatar',
      'Escape: Pausar/volver',
      'Tab: Navegar menú',
      'Enter: Seleccionar',
    ];

    for (const line of controls) {
      const text = this.add.text(panelX + 10, y, line, {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '15px',
        color: '#cccccc',
      });
      text.setOrigin(0, 0.5);
      y += 26;
    }
  }

  // ─── Accessibility Info ──────────────────────────────────────────────────────

  private createAccessibilityInfo(): void {
    const panelX = GAME_WIDTH / 2 + 60;
    const y = 250;

    const header = this.add.text(panelX, y, '♿ Accesibilidad', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '18px',
      color: '#a0d8d0',
      fontStyle: 'bold',
    });
    header.setOrigin(0, 0.5);

    const infoLines = [
      '• Navegación completa con teclado',
      '• Contraste AA en textos y controles',
      '• Opción de reducir movimiento',
      '• Áreas de toque mínimas de 44px',
      '• Pausa disponible en cualquier momento',
    ];

    const infoText = this.add.text(panelX + 10, y + 24, infoLines.join('\n'), {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '14px',
      color: '#bbbbbb',
      lineSpacing: 6,
    });
    infoText.setOrigin(0, 0);
  }

  // ─── Nutritional Disclaimer ──────────────────────────────────────────────────

  private createDisclaimer(): void {
    const disclaimer = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 40,
      'La información nutricional es orientativa y educativa. No reemplaza el consejo de un profesional de la salud.',
      {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '13px',
        color: '#999999',
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 100 },
      },
    );
    disclaimer.setOrigin(0.5, 0.5);
  }

  // ─── Back Button ─────────────────────────────────────────────────────────────

  private createBackButton(): void {
    const backBtn = new Button(this, {
      x: 100,
      y: GAME_HEIGHT - 80,
      text: '← Volver',
      color: '#455A64',
      width: 140,
      height: 44,
      fontSize: 16,
      onClick: () => this.scene.start('MenuScene'),
    });
    this.focusableElements.push(backBtn);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private adjustVolume(delta: number): void {
    const newVolume = Math.round(Math.max(0, Math.min(1, this.settings.volume + delta)) * 10) / 10;
    this.settings.volume = newVolume;
    this.volumeText.setText(this.formatVolume(newVolume));
    this.saveSettings();
    // Apply volume change globally to the Phaser sound manager
    this.sound.volume = newVolume;
  }

  private formatVolume(volume: number): string {
    return `${Math.round(volume * 100)}%`;
  }

  private saveSettings(): void {
    StorageService.saveSettings(this.settings);
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
