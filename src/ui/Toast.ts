import Phaser from 'phaser';
import { TOAST_DURATION, GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import type { ToastConfig } from '../types/game.types';

/**
 * Toast — Floating educational feedback notification.
 * Displays product name + nutrient + points for ~1.8s above the Player_Avatar.
 * Stacks vertically with 12px offset on rapid successive captures.
 * Positioned clamped to at least 80px from game area edges.
 */

const EDGE_PADDING = 80;
const STACK_OFFSET = 12;
const TOAST_WIDTH = 260;
const TOAST_HEIGHT = 56;
const BORDER_RADIUS = 14;
const FADE_IN_DURATION = 150;
const FADE_OUT_DURATION = 300;

/** Key used to store active toasts on the scene's data manager. */
const ACTIVE_TOASTS_KEY = '__activeToasts';

export class Toast extends Phaser.GameObjects.Container {
  /**
   * Show a toast notification above the player avatar.
   * Handles stacking when multiple toasts appear in rapid succession.
   */
  static show(scene: Phaser.Scene, config: ToastConfig): void {
    const toast = new Toast(scene, config);
    scene.add.existing(toast);
  }

  private constructor(scene: Phaser.Scene, config: ToastConfig) {
    // Clamp position to at least 80px from edges
    const clampedX = Phaser.Math.Clamp(config.x, EDGE_PADDING, GAME_WIDTH - EDGE_PADDING);
    const clampedY = Phaser.Math.Clamp(config.y, EDGE_PADDING, GAME_HEIGHT - EDGE_PADDING);

    super(scene, clampedX, clampedY);

    // Track active toasts on the scene for stacking
    const activeToasts = this.getActiveToasts();
    const stackIndex = activeToasts.length;
    const stackYOffset = stackIndex * (TOAST_HEIGHT + STACK_OFFSET);

    // Shift upward to stack above the avatar
    this.y -= stackYOffset;

    // Register this toast
    activeToasts.push(this);
    scene.data.set(ACTIVE_TOASTS_KEY, activeToasts);

    // Build visual elements
    this.buildVisuals(config);

    // Start with alpha 0, fade in
    this.setAlpha(0);
    this.setDepth(1000 + stackIndex);

    // Fade-in tween
    scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: FADE_IN_DURATION,
      ease: 'Quad.easeOut',
    });

    // Auto-fade out after TOAST_DURATION
    scene.time.delayedCall(TOAST_DURATION - FADE_OUT_DURATION, () => {
      scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: FADE_OUT_DURATION,
        ease: 'Quad.easeIn',
        onComplete: () => {
          this.removeSelf();
          this.destroy();
        },
      });
    });
  }

  /**
   * Build the background rectangle and text elements.
   */
  private buildVisuals(config: ToastConfig): void {
    // Semi-transparent background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.72);
    bg.fillRoundedRect(
      -TOAST_WIDTH / 2,
      -TOAST_HEIGHT / 2,
      TOAST_WIDTH,
      TOAST_HEIGHT,
      BORDER_RADIUS,
    );
    this.add(bg);

    // Main text (product name + nutrient) — white
    const mainText = this.scene.add.text(0, -8, config.text, {
      fontFamily: 'Fredoka One, Nunito, sans-serif',
      fontSize: '14px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: TOAST_WIDTH - 24 },
    });
    mainText.setOrigin(0.5, 0.5);
    this.add(mainText);

    // Subtext (points) — colored accent
    const subtext = this.scene.add.text(0, 12, config.subtext, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '13px',
      color: config.color,
      align: 'center',
      fontStyle: 'bold',
    });
    subtext.setOrigin(0.5, 0.5);
    this.add(subtext);
  }

  /**
   * Get active toasts tracked on this scene.
   */
  private getActiveToasts(): Toast[] {
    const toasts = this.scene.data.get(ACTIVE_TOASTS_KEY) as Toast[] | undefined;
    return toasts ?? [];
  }

  /**
   * Remove this toast from the active toasts tracking array.
   */
  private removeSelf(): void {
    const activeToasts = this.getActiveToasts();
    const idx = activeToasts.indexOf(this);
    if (idx !== -1) {
      activeToasts.splice(idx, 1);
    }
    this.scene.data.set(ACTIVE_TOASTS_KEY, activeToasts);
  }
}
