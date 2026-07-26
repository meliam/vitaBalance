import Phaser from 'phaser';
import type { ButtonConfig } from '../types/game.types';
import { MIN_TOUCH_TARGET } from '../utils/constants';

/**
 * Accessible pill-shaped button component.
 *
 * Uses a Phaser Zone for the hit area (best practice for reliable click detection)
 * with Graphics for visual rendering. This avoids the Container hit-test issues
 * that occur with nested containers in Phaser 3.
 *
 * Features:
 *   - Enforces minimum 44├ù44 touch target (WCAG 2.5.5).
 *   - Supports keyboard navigation with visible focus indicator.
 *   - Enter AND Space activate when focused.
 *   - 'outline' variant: transparent bg with colored border + colored text.
 *   - 'disableKeyboard' option: skips Phaser keyboard listeners when HTML a11y
 *     layer handles keyboard externally.
 *   - Proper cleanup on destroy (removes all listeners).
 */
export class Button extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private focusRing: Phaser.GameObjects.Graphics;
  private hitZone: Phaser.GameObjects.Zone;

  private btnWidth: number;
  private btnHeight: number;
  private btnColor: number;
  private btnColorHex: string;
  private variant: 'filled' | 'outline';
  private enabled = true;
  private focused = false;
  private pressCallback: (() => void) | null = null;
  private keyboardEnabled: boolean;

  private static readonly DEFAULT_COLOR = '#4CAF50';
  private static readonly DISABLED_COLOR = 0x9e9e9e;
  private static readonly FOCUS_RING_WIDTH = 4;
  private static readonly HOVER_SCALE = 1.05;
  private static readonly ACTIVE_SCALE = 0.95;

  constructor(scene: Phaser.Scene, config: ButtonConfig) {
    super(scene, config.x, config.y);

    this.variant = config.variant ?? 'filled';
    this.keyboardEnabled = !(config.disableKeyboard ?? false);
    this.btnColorHex = config.color ?? Button.DEFAULT_COLOR;

    // Enforce minimum touch target size
    this.btnWidth = Math.max(config.width ?? 160, MIN_TOUCH_TARGET);
    this.btnHeight = Math.max(config.height ?? 48, MIN_TOUCH_TARGET);
    this.btnColor = Phaser.Display.Color.HexStringToColor(this.btnColorHex).color;

    // Create focus ring (drawn behind background)
    this.focusRing = new Phaser.GameObjects.Graphics(scene);
    this.add(this.focusRing);

    // Create pill-shaped background
    this.bg = new Phaser.GameObjects.Graphics(scene);
    this.drawBackground(this.btnColor);
    this.add(this.bg);

    // Create centered text label
    const textColor = this.variant === 'outline' ? this.btnColorHex : '#ffffff';
    this.label = new Phaser.GameObjects.Text(scene, 0, 0, config.text, {
      fontSize: `${config.fontSize ?? 20}px`,
      fontFamily: 'Arial, sans-serif',
      color: textColor,
      fontStyle: 'bold',
      align: 'center',
    });
    this.label.setOrigin(0.5, 0.5);
    this.add(this.label);

    // Use a Zone for reliable hit detection (Phaser best practice for Containers)
    this.hitZone = new Phaser.GameObjects.Zone(scene, 0, 0, this.btnWidth, this.btnHeight);
    this.hitZone.setInteractive({ useHandCursor: true });
    this.add(this.hitZone);

    // Pointer event handlers on the zone
    this.hitZone.on('pointerdown', this.handlePointerDown, this);
    this.hitZone.on('pointerover', this.handlePointerOver, this);
    this.hitZone.on('pointerout', this.handlePointerOut, this);

    // Register initial onClick if provided
    if (config.onClick) {
      this.pressCallback = config.onClick;
    }

    // Listen for keyboard events (Enter + Space) when not disabled
    if (this.keyboardEnabled) {
      scene.input.keyboard?.on('keydown-ENTER', this.handleKeyActivate, this);
      scene.input.keyboard?.on('keydown-SPACE', this.handleKeyActivate, this);
    }

    // Add to scene display list
    scene.add.existing(this);
  }

  /**
   * Register a callback for press/click/tap events.
   */
  onPress(callback: () => void): this {
    this.pressCallback = callback;
    return this;
  }

  /**
   * Enable or disable the button.
   * Disabled buttons appear grayed out and do not respond to input.
   */
  setEnabled(enabled: boolean): this {
    this.enabled = enabled;

    if (enabled) {
      this.drawBackground(this.btnColor);
      this.label.setAlpha(1);
      this.hitZone.setInteractive({ useHandCursor: true });
    } else {
      this.drawBackground(Button.DISABLED_COLOR);
      this.label.setAlpha(0.5);
      this.hitZone.disableInteractive();
      this.setScale(1);
    }

    return this;
  }

  /**
   * Set the focused state for keyboard navigation.
   * Shows a visible 4px focus ring when focused.
   */
  setFocused(focused: boolean): this {
    this.focused = focused;
    this.drawFocusRing();
    return this;
  }

  /**
   * Override setVisible to also toggle interactivity.
   */
  setVisible(value: boolean): this {
    super.setVisible(value);
    if (value) {
      if (this.enabled) {
        this.hitZone.setInteractive({ useHandCursor: true });
      }
    } else {
      this.hitZone.disableInteractive();
    }
    return this;
  }

  /**
   * Get the configured width of this button.
   */
  getWidth(): number {
    return this.btnWidth;
  }

  /**
   * Get the configured height of this button.
   */
  getHeight(): number {
    return this.btnHeight;
  }

  /**
   * Clean up all listeners on destroy.
   */
  destroy(fromScene?: boolean): void {
    if (this.keyboardEnabled) {
      this.scene?.input.keyboard?.off('keydown-ENTER', this.handleKeyActivate, this);
      this.scene?.input.keyboard?.off('keydown-SPACE', this.handleKeyActivate, this);
    }
    super.destroy(fromScene);
  }

  // ÔöÇÔöÇÔöÇ Private Methods ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

  private drawBackground(color: number): void {
    this.bg.clear();
    const radius = this.btnHeight / 2;

    if (this.variant === 'outline') {
      // Transparent background with colored border
      this.bg.fillStyle(color, 0.12);
      this.bg.fillRoundedRect(
        -this.btnWidth / 2, -this.btnHeight / 2,
        this.btnWidth, this.btnHeight, radius,
      );
      this.bg.lineStyle(2, color, 1);
      this.bg.strokeRoundedRect(
        -this.btnWidth / 2, -this.btnHeight / 2,
        this.btnWidth, this.btnHeight, radius,
      );
    } else {
      // Solid filled background
      this.bg.fillStyle(color, 1);
      this.bg.fillRoundedRect(
        -this.btnWidth / 2, -this.btnHeight / 2,
        this.btnWidth, this.btnHeight, radius,
      );
    }
  }

  private drawFocusRing(): void {
    this.focusRing.clear();

    if (!this.focused) return;

    const ringOffset = Button.FOCUS_RING_WIDTH;
    const ringWidth = this.btnWidth + ringOffset * 2;
    const ringHeight = this.btnHeight + ringOffset * 2;
    const radius = ringHeight / 2;

    this.focusRing.lineStyle(Button.FOCUS_RING_WIDTH, 0xffcc00, 1);
    this.focusRing.strokeRoundedRect(
      -ringWidth / 2, -ringHeight / 2,
      ringWidth, ringHeight, radius,
    );
  }

  private handlePointerDown(): void {
    if (!this.enabled) return;
    this.setScale(Button.ACTIVE_SCALE);
    this.scene.time.delayedCall(80, () => {
      if (this.scene) this.setScale(1);
    });
    this.pressCallback?.();
  }

  private handlePointerOver(): void {
    if (!this.enabled) return;
    this.setScale(Button.HOVER_SCALE);
  }

  private handlePointerOut(): void {
    if (!this.enabled) return;
    this.setScale(1);
  }

  private handleKeyActivate(): void {
    if (!this.enabled || !this.focused) return;
    this.setScale(Button.ACTIVE_SCALE);
    this.scene.time.delayedCall(100, () => {
      if (this.scene) this.setScale(1);
    });
    this.pressCallback?.();
  }
}
