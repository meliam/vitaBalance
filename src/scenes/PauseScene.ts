import Phaser from 'phaser';
import type { GameState } from '../types/game.types';
import { Button } from '../ui/Button';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';

/**
 * PauseScene — Overlay scene displayed when the game is paused.
 *
 * Launched as an overlay on top of LevelScene. Displays a centered panel with
 * three buttons: "Continuar", "Reiniciar", and "Menú principal".
 * Supports keyboard navigation (Tab cycles buttons, Enter activates, Escape resumes).
 *
 * @see Requirements 10.1–10.5
 */
export class PauseScene extends Phaser.Scene {
  // ─── UI Elements ─────────────────────────────────────────────────────────────
  private buttons: Button[] = [];
  private focusIndex = 0;

  // ─── Keyboard ────────────────────────────────────────────────────────────────
  private keyEsc!: Phaser.Input.Keyboard.Key;
  private keyTab!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'PauseScene' });
  }

  // ─── Scene Lifecycle ─────────────────────────────────────────────────────────

  create(): void {
    this.buttons = [];
    this.focusIndex = 0;

    // Semi-transparent dark overlay
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.7,
    );
    overlay.setDepth(0);

    // Panel background
    const panelWidth = 320;
    const panelHeight = 280;
    const panelX = GAME_WIDTH / 2;
    const panelY = GAME_HEIGHT / 2;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x1b2838, 0.95);
    panelBg.fillRoundedRect(
      panelX - panelWidth / 2,
      panelY - panelHeight / 2,
      panelWidth,
      panelHeight,
      16,
    );
    panelBg.setDepth(1);

    // Title
    const title = this.add.text(panelX, panelY - 100, 'Pausado', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
    });
    title.setOrigin(0.5, 0.5);
    title.setDepth(2);

    // Buttons
    const btnSpacing = 60;
    const btnStartY = panelY - 20;

    const continueBtn = new Button(this, {
      x: panelX,
      y: btnStartY,
      text: 'Continuar',
      width: 220,
      height: 48,
      color: '#4CAF50',
      onClick: () => this.handleContinue(),
    });
    continueBtn.setDepth(2);
    this.buttons.push(continueBtn);

    const restartBtn = new Button(this, {
      x: panelX,
      y: btnStartY + btnSpacing,
      text: 'Reiniciar',
      width: 220,
      height: 48,
      color: '#FF9800',
      onClick: () => this.handleRestart(),
    });
    restartBtn.setDepth(2);
    this.buttons.push(restartBtn);

    const menuBtn = new Button(this, {
      x: panelX,
      y: btnStartY + btnSpacing * 2,
      text: 'Menú principal',
      width: 220,
      height: 48,
      color: '#F44336',
      onClick: () => this.handleMenu(),
    });
    menuBtn.setDepth(2);
    this.buttons.push(menuBtn);

    // Set initial focus
    this.updateFocus();

    // Keyboard navigation
    this.keyEsc = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.keyTab = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);

    this.keyEsc.on('down', this.handleContinue, this);
    this.keyTab.on('down', this.handleTab, this);
  }

  shutdown(): void {
    // Clean up keyboard listeners
    this.keyEsc.off('down', this.handleContinue, this);
    this.keyTab.off('down', this.handleTab, this);

    // Destroy buttons
    for (const btn of this.buttons) {
      btn.destroy();
    }
    this.buttons = [];
  }

  // ─── Navigation ──────────────────────────────────────────────────────────────

  private handleTab(): void {
    this.focusIndex = (this.focusIndex + 1) % this.buttons.length;
    this.updateFocus();
  }

  private updateFocus(): void {
    for (let i = 0; i < this.buttons.length; i++) {
      this.buttons[i].setFocused(i === this.focusIndex);
    }
  }

  // ─── Button Actions ──────────────────────────────────────────────────────────

  private handleContinue(): void {
    // Update game state
    const state = this.registry.get('gameState') as GameState | undefined;
    if (state) {
      state.paused = false;
      this.registry.set('gameState', state);
    }

    this.scene.stop('PauseScene');
    this.scene.resume('LevelScene');
  }

  private handleRestart(): void {
    // Determine current level from LevelScene data
    const currentLevel = this.getCurrentLevel();

    this.scene.stop('PauseScene');
    this.scene.stop('HudScene');
    this.scene.start('LevelScene', { level: currentLevel });
  }

  private handleMenu(): void {
    this.scene.stop('PauseScene');
    this.scene.stop('HudScene');
    this.scene.stop('LevelScene');
    this.scene.start('MenuScene');
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private getCurrentLevel(): 1 | 2 | 3 {
    const state = this.registry.get('gameState') as GameState | undefined;
    // The LevelScene stores the level in its scene data via registry
    // We can also try to get it from the LevelScene's settings
    const levelScene = this.scene.get('LevelScene');
    if (levelScene) {
      // LevelScene receives { level } in init data, stored as scene settings
      const settings = levelScene.scene.settings.data as { level?: 1 | 2 | 3 } | undefined;
      if (settings?.level) {
        return settings.level;
      }
    }

    // Fallback: default to level 1
    return (state as unknown as { level?: 1 | 2 | 3 })?.level ?? 1;
  }
}
