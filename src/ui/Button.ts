import Phaser from 'phaser';
import type { ButtonConfig } from '../types/game.types';
import { MIN_TOUCH_TARGET } from '../utils/constants';

/**
 * Accessible pill-shaped button component.
 * Extends Phaser.GameObjects.Container with configurable text, color, and size.
 * Enforces minimum 44×44 touch target (WCAG 2.5.5).
 * Supports keyboard navigation with visible focus indicator.
 */
export class Button extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private focusRing: Phaser.GameObjects.Graphics;

  private btnWidth: number;
  private btnHeight: number;
  private btnColor: number;
  private enabled = true;
  private focused = false;
  private pressCallback: (() => void) | null = null;

  private static readonly DEFAULT_COLOR = '#4CAF50';
  private static readonly DISABLED_COLOR = 0x9e9e9e;
  private static readonly FOCUS_RING_WIDTH = 4;
  private static readonly HOVER_SCALE = 1.05;
  private static readonly ACTIVE_SCALE = 0.95;

  constructor(scene: Phaser.Scene, config: ButtonConfig) {
    super(scene, config.x, config.y);

    // Enforce minimum touch target size
    this.btnWidth = Math.max(config.width ?? 160, MIN_TOUCH_TARGET);
    this.btnHeight = Math.max(config.height ?? 48, MIN_TOUCH_TARGET);
    this.btnColor = Phaser.Display.Color.HexStringToColor(
      config.color ?? Button.DEFAULT_COLOR,
    ).color;

    // Create focus ring (drawn behind background)
    this.focusRing = new Phaser.GameObjects.Graphics(scene);
    this.add(this.focusRing);

    // Create pill-shaped background
    this.bg = new Phaser.GameObjects.Graphics(scene);
    this.drawBackground(this.btnColor);
    this.add(this.bg);

    // Create centered text label
    this.label = new Phaser.GameObjects.Text(scene, 0, 0, config.text, {
      fontSize: `${config.fontSize ?? 20}px`,
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
    });
    this.label.setOrigin(0.5, 0.5);
    this.add(this.label);

    // Set interactive hit area
    this.setSize(this.btnWidth, this.btnHeight);
    this.setInteractive(
      new Phaser.Geom.Rectangle(
        -this.btnWidth / 2,
        -this.btnHeight / 2,
        this.btnWidth,
        this.btnHeight,
      ),
      Phaser.Geom.Rectangle.Contains,
    );

    // Pointer event handlers
    this.on('pointerdown', this.handlePointerDown, this);
    this.on('pointerup', this.handlePointerUp, this);
    this.on('pointerover', this.handlePointerOver, this);
    this.on('pointerout', this.handlePointerOut, this);

    // Register initial onClick if provided
    if (config.onClick) {
      this.pressCallback = config.onClick;
    }

    // Listen for keyboard events (Enter key when focused)
    scene.input.keyboard?.on('keydown-ENTER', this.handleKeyEnter, this);

    // Add to scene
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
      this.setInteractive();
    } else {
      this.drawBackground(Button.DISABLED_COLOR);
      this.label.setAlpha(0.5);
      this.disableInteractive();
      // Reset visual state
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
   * Clean up keyboard listener on destroy.
   */
  destroy(fromScene?: boolean): void {
    this.scene?.input.keyboard?.off('keydown-ENTER', this.handleKeyEnter, this);
    super.destroy(fromScene);
  }

  // ─── Private Methods ─────────────────────────────────────────────────────────

  private drawBackground(color: number): void {
    this.bg.clear();
    this.bg.fillStyle(color, 1);
    // Pill shape: rounded rectangle with radius = half the height
    const radius = this.btnHeight / 2;
    this.bg.fillRoundedRect(
      -this.btnWidth / 2,
      -this.btnHeight / 2,
      this.btnWidth,
      this.btnHeight,
      radius,
    );
  }

  private drawFocusRing(): void {
    this.focusRing.clear();

    if (!this.focused) {
      return;
    }

    const ringOffset = Button.FOCUS_RING_WIDTH;
    const ringWidth = this.btnWidth + ringOffset * 2;
    const ringHeight = this.btnHeight + ringOffset * 2;
    const radius = ringHeight / 2;

    this.focusRing.lineStyle(Button.FOCUS_RING_WIDTH, 0xffcc00, 1);
    this.focusRing.strokeRoundedRect(
      -ringWidth / 2,
      -ringHeight / 2,
      ringWidth,
      ringHeight,
      radius,
    );
  }

  private handlePointerDown(): void {
    if (!this.enabled) return;
    this.setScale(Button.ACTIVE_SCALE);
  }

  private handlePointerUp(): void {
    if (!this.enabled) return;
    this.setScale(1);
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

  private handleKeyEnter(): void {
    if (!this.enabled || !this.focused) return;

    // Visual feedback for keyboard activation
    this.setScale(Button.ACTIVE_SCALE);
    this.scene.time.delayedCall(100, () => {
      this.setScale(1);
    });

    this.pressCallback?.();
  }
}
