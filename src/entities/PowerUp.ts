import Phaser from 'phaser';
import type { SpawnItemConfig } from '../types/game.types';
import { Product } from './Product';

/**
 * Estrella Vita power-up entity.
 * Extends Product with a pulsing blue glow particle effect to make it
 * visually distinct from regular falling products.
 *
 * The glow uses a tween-based pulsing circle that oscillates in alpha
 * and scale, creating a "breathing" blue aura around the ⭐ emoji.
 * Respects reduced-motion preference by disabling the pulse animation.
 */
export class PowerUp extends Product {
  private glowGraphics: Phaser.GameObjects.Graphics;
  private glowTween: Phaser.Tweens.Tween | null = null;
  private glowAlpha = 0.6;
  private glowScale = 1.0;

  private static readonly GLOW_COLOR = 0x42a5f5;
  private static readonly GLOW_RADIUS = 28;
  private static readonly GLOW_MIN_ALPHA = 0.3;
  private static readonly GLOW_MAX_ALPHA = 0.8;
  private static readonly GLOW_MIN_SCALE = 0.9;
  private static readonly GLOW_MAX_SCALE = 1.3;
  private static readonly GLOW_PULSE_DURATION = 600;

  constructor(scene: Phaser.Scene, x = 0, y = 0) {
    super(scene, x, y);

    // Create the glow graphics layer behind the emoji
    this.glowGraphics = new Phaser.GameObjects.Graphics(scene);
    this.addAt(this.glowGraphics, 0);

    this.drawGlow();
  }

  /**
   * Reconfigure for reuse from the object pool.
   * Starts the pulsing blue glow animation.
   */
  override reset(config: SpawnItemConfig): void {
    super.reset(config);
    this.glowAlpha = PowerUp.GLOW_MAX_ALPHA;
    this.glowScale = 1.0;
    this.drawGlow();
    this.startPulse();
  }

  /**
   * Apply gravity, rotation, and update the glow visual each frame.
   */
  override update(dt: number, speedMultiplier: number): void {
    super.update(dt, speedMultiplier);
    this.drawGlow();
  }

  /**
   * Clean up tweens on destroy.
   */
  override destroy(fromScene?: boolean): void {
    this.stopPulse();
    super.destroy(fromScene);
  }

  // ─── Private Methods ─────────────────────────────────────────────────────────

  /**
   * Draw the blue glow circle at the current alpha and scale.
   */
  private drawGlow(): void {
    this.glowGraphics.clear();

    const radius = PowerUp.GLOW_RADIUS * this.glowScale;

    // Outer soft glow
    this.glowGraphics.fillStyle(PowerUp.GLOW_COLOR, this.glowAlpha * 0.3);
    this.glowGraphics.fillCircle(0, 0, radius + 8);

    // Inner bright glow
    this.glowGraphics.fillStyle(PowerUp.GLOW_COLOR, this.glowAlpha);
    this.glowGraphics.fillCircle(0, 0, radius);
  }

  /**
   * Start the pulsing tween animation.
   * The glow oscillates between min/max alpha and scale values,
   * creating a breathing effect that draws the player's attention.
   */
  private startPulse(): void {
    this.stopPulse();

    // Guard: if scene was destroyed, skip animation
    if (!this.scene) return;

    // Check for reduced-motion preference
    if (this.scene.registry.get('reduceMotion') === true) {
      // Static glow without animation
      this.glowAlpha = PowerUp.GLOW_MAX_ALPHA;
      this.glowScale = 1.0;
      this.drawGlow();
      return;
    }

    this.glowTween = this.scene.tweens.add({
      targets: this,
      glowAlpha: {
        from: PowerUp.GLOW_MIN_ALPHA,
        to: PowerUp.GLOW_MAX_ALPHA,
      },
      glowScale: {
        from: PowerUp.GLOW_MIN_SCALE,
        to: PowerUp.GLOW_MAX_SCALE,
      },
      duration: PowerUp.GLOW_PULSE_DURATION,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Stop and clean up the pulsing tween.
   */
  private stopPulse(): void {
    if (this.glowTween) {
      this.glowTween.destroy();
      this.glowTween = null;
    }
  }
}
