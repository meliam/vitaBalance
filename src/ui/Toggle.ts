import Phaser from 'phaser';
import { MIN_TOUCH_TARGET } from '../utils/constants';

/**
 * Configuration for the Toggle component.
 */
export interface ToggleConfig {
  x: number;
  y: number;
  value?: boolean;
  label?: string;
  onChange?: (value: boolean) => void;
}

/**
 * Accessible switch-style toggle component.
 * Extends Phaser.GameObjects.Container; acts as role="switch" with aria-checked equivalent via visual state.
 * Supports keyboard navigation with visible focus indicator.
 * Minimum touch target of 44×44 pixels (WCAG 2.5.5).
 */
export class Toggle extends Phaser.GameObjects.Container {
  private track: Phaser.GameObjects.Graphics;
  private knob: Phaser.GameObjects.Graphics;
  private focusRing: Phaser.GameObjects.Graphics;
  private labelText: Phaser.GameObjects.Text | null = null;

  private value: boolean;
  private focused = false;
  private changeCallbacks: Array<(value: boolean) => void> = [];

  // Track dimensions
  private static readonly TRACK_WIDTH = 52;
  private static readonly TRACK_HEIGHT = 28;
  private static readonly TRACK_RADIUS = 14;

  // Knob dimensions
  private static readonly KNOB_RADIUS = 10;
  private static readonly KNOB_PADDING = 4;

  // Colors
  private static readonly ON_COLOR = 0x4caf50;
  private static readonly OFF_COLOR = 0x9e9e9e;
  private static readonly KNOB_COLOR = 0xffffff;
  private static readonly FOCUS_RING_COLOR = 0xffcc00;
  private static readonly FOCUS_RING_WIDTH = 4;

  // Animation
  private static readonly TWEEN_DURATION = 150;

  // Label spacing
  private static readonly LABEL_GAP = 12;

  constructor(scene: Phaser.Scene, config: ToggleConfig) {
    super(scene, config.x, config.y);

    this.value = config.value ?? false;

    // Create focus ring (drawn behind track)
    this.focusRing = new Phaser.GameObjects.Graphics(scene);
    this.add(this.focusRing);

    // Create track background
    this.track = new Phaser.GameObjects.Graphics(scene);
    this.add(this.track);

    // Create knob
    this.knob = new Phaser.GameObjects.Graphics(scene);
    this.add(this.knob);

    // Optional label text
    if (config.label) {
      this.labelText = new Phaser.GameObjects.Text(
        scene,
        Toggle.TRACK_WIDTH / 2 + Toggle.LABEL_GAP,
        0,
        config.label,
        {
          fontSize: '18px',
          fontFamily: 'Arial, sans-serif',
          color: '#ffffff',
          fontStyle: 'bold',
        },
      );
      this.labelText.setOrigin(0, 0.5);
      this.add(this.labelText);
    }

    // Register initial onChange callback if provided
    if (config.onChange) {
      this.changeCallbacks.push(config.onChange);
    }

    // Draw initial state
    this.drawTrack();
    this.drawKnob();

    // Set interactive hit area using a Zone for reliable click detection
    const hitWidth = Math.max(Toggle.TRACK_WIDTH, MIN_TOUCH_TARGET);
    const hitHeight = Math.max(Toggle.TRACK_HEIGHT, MIN_TOUCH_TARGET);
    this.setSize(hitWidth, hitHeight);

    const hitZone = new Phaser.GameObjects.Zone(scene, 0, 0, hitWidth, hitHeight);
    hitZone.setInteractive({ useHandCursor: true });
    hitZone.on('pointerdown', this.handlePointerDown, this);
    this.add(hitZone);

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Returns the current toggle state.
   */
  getValue(): boolean {
    return this.value;
  }

  /**
   * Sets the toggle state and updates the visual.
   */
  setValue(value: boolean): this {
    if (this.value === value) return this;

    this.value = value;
    this.drawTrack();
    this.animateKnob();

    return this;
  }

  /**
   * Registers a change listener that is called whenever the toggle value changes.
   */
  onChange(callback: (value: boolean) => void): this {
    this.changeCallbacks.push(callback);
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
   * Programmatically activate (toggle) the switch. Used by parent scenes for keyboard handling.
   */
  activate(): void {
    this.toggle();
  }

  /**
   * Clean up keyboard listener on destroy.
   */
  destroy(fromScene?: boolean): void {
    super.destroy(fromScene);
  }

  // ─── Private Methods ─────────────────────────────────────────────────────────

  private drawTrack(): void {
    this.track.clear();
    const color = this.value ? Toggle.ON_COLOR : Toggle.OFF_COLOR;
    this.track.fillStyle(color, 1);
    this.track.fillRoundedRect(
      -Toggle.TRACK_WIDTH / 2,
      -Toggle.TRACK_HEIGHT / 2,
      Toggle.TRACK_WIDTH,
      Toggle.TRACK_HEIGHT,
      Toggle.TRACK_RADIUS,
    );
  }

  private drawKnob(): void {
    this.knob.clear();
    this.knob.fillStyle(Toggle.KNOB_COLOR, 1);
    const x = this.getKnobX();
    this.knob.fillCircle(x, 0, Toggle.KNOB_RADIUS);
  }

  private getKnobX(): number {
    const halfTrack = Toggle.TRACK_WIDTH / 2;
    const offset = halfTrack - Toggle.KNOB_PADDING - Toggle.KNOB_RADIUS;
    return this.value ? offset : -offset;
  }

  private animateKnob(): void {
    const targetX = this.getKnobX();

    // Guard: if scene was destroyed, just redraw without animation
    if (!this.scene) {
      this.drawKnob();
      return;
    }

    // Use a tween to animate knob position
    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: Toggle.TWEEN_DURATION,
      ease: 'Quad.easeInOut',
      onUpdate: (tween) => {
        const progress = tween.getValue() ?? 0;
        const startX = this.value
          ? -(Toggle.TRACK_WIDTH / 2 - Toggle.KNOB_PADDING - Toggle.KNOB_RADIUS)
          : Toggle.TRACK_WIDTH / 2 - Toggle.KNOB_PADDING - Toggle.KNOB_RADIUS;
        const currentX = Phaser.Math.Linear(startX, targetX, progress);

        this.knob.clear();
        this.knob.fillStyle(Toggle.KNOB_COLOR, 1);
        this.knob.fillCircle(currentX, 0, Toggle.KNOB_RADIUS);
      },
    });
  }

  private drawFocusRing(): void {
    this.focusRing.clear();

    if (!this.focused) {
      return;
    }

    const ringOffset = Toggle.FOCUS_RING_WIDTH;
    const ringWidth = Toggle.TRACK_WIDTH + ringOffset * 2;
    const ringHeight = Toggle.TRACK_HEIGHT + ringOffset * 2;
    const radius = ringHeight / 2;

    this.focusRing.lineStyle(Toggle.FOCUS_RING_WIDTH, Toggle.FOCUS_RING_COLOR, 1);
    this.focusRing.strokeRoundedRect(
      -ringWidth / 2,
      -ringHeight / 2,
      ringWidth,
      ringHeight,
      radius,
    );
  }

  private toggle(): void {
    this.value = !this.value;
    this.drawTrack();
    this.animateKnob();
    this.notifyChange();
  }

  private notifyChange(): void {
    for (const callback of this.changeCallbacks) {
      callback(this.value);
    }
  }

  private handlePointerDown(): void {
    this.toggle();
  }

  private handleKeyActivate(): void {
    if (!this.focused) return;
    this.toggle();
  }
}
