import Phaser from 'phaser';
import type { ItemType, ProductConfig, SpawnItemConfig } from '../types/game.types';
import { GAME_HEIGHT } from '../utils/constants';

/**
 * Product entity — a falling item that the player can capture.
 * Extends Phaser.GameObjects.Container and uses object pooling (reset method)
 * to avoid GC spikes on low-end devices.
 *
 * Visual rendering uses Phaser Graphics + Text (emoji) since no sprite assets
 * are available yet. Spoiled products are differentiated by form distortion
 * AND a dark overlay texture (not color alone) for WCAG accessibility.
 *
 * @see Requirements 1.4, 1.5, 1.7, 15.5
 */
export class Product extends Phaser.GameObjects.Container {
  /** Current item type classification. */
  public type: ItemType = 'correct';

  /** Vertical fall speed in pixels per second. */
  public speed = 0;

  /** Rotation speed for gentle wobble effect (radians per second). */
  public rotationSpeed = 0;

  /** Configuration data for the current product. */
  public productData!: ProductConfig;

  /** Size of the product container (used for collision bounds). */
  private static readonly SIZE = 48;

  /** Maximum rotation angle for wobble (radians). */
  private static readonly MAX_ROTATION = 0.15;

  /** Background circle graphic. */
  private bg: Phaser.GameObjects.Graphics;

  /** Emoji text representing the product. */
  private emojiText: Phaser.GameObjects.Text;

  /** Optional image for products with custom texture (instead of emoji). */
  private customImage: Phaser.GameObjects.Image | null = null;

  /** Dark overlay for spoiled products (accessibility: texture differentiation). */
  private spoiledOverlay: Phaser.GameObjects.Graphics;

  /** Distortion graphics for spoiled products (form differentiation). */
  private spoiledDistortion: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x = 0, y = 0) {
    super(scene, x, y);

    // Background circle
    this.bg = new Phaser.GameObjects.Graphics(scene);
    this.add(this.bg);

    // Spoiled distortion lines (drawn behind emoji, hidden by default)
    this.spoiledDistortion = new Phaser.GameObjects.Graphics(scene);
    this.spoiledDistortion.setVisible(false);
    this.add(this.spoiledDistortion);

    // Emoji text centered in container
    this.emojiText = new Phaser.GameObjects.Text(scene, 0, 0, '', {
      fontSize: '32px',
      align: 'center',
    });
    this.emojiText.setOrigin(0.5, 0.5);
    this.add(this.emojiText);

    // Dark overlay for spoiled (drawn on top, hidden by default)
    this.spoiledOverlay = new Phaser.GameObjects.Graphics(scene);
    this.spoiledOverlay.setVisible(false);
    this.add(this.spoiledOverlay);

    // Set container size for hit area / collision
    this.setSize(Product.SIZE, Product.SIZE);

    // Deactivate initially (pool pattern — activate on reset)
    this.setActive(false);
    this.setVisible(false);

    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
  }

  /**
   * Reconfigure this product for reuse from the object pool.
   * Resets position, visuals, and physics properties based on the spawn config.
   */
  reset(config: SpawnItemConfig): void {
    this.type = config.type;
    this.productData = config.productConfig;
    this.speed = config.speed;
    this.rotationSpeed = (Math.random() * 0.6 + 0.4) * (Math.random() > 0.5 ? 1 : -1);

    // Position at spawn x, above the visible area
    this.setPosition(config.x, -Product.SIZE);
    this.setRotation(0);
    this.setScale(1);

    // Update emoji or custom texture
    if (config.productConfig.textureKey && this.scene.textures.exists(config.productConfig.textureKey)) {
      // Use custom drawn texture instead of emoji
      this.emojiText.setVisible(false);
      if (!this.customImage) {
        this.customImage = new Phaser.GameObjects.Image(this.scene, 0, 0, config.productConfig.textureKey);
        this.customImage.setOrigin(0.5, 0.5);
        this.add(this.customImage);
        // Move it behind the spoiled overlay but above bg
        this.moveTo(this.customImage, this.getIndex(this.emojiText));
      }
      this.customImage.setTexture(config.productConfig.textureKey);
      this.customImage.setVisible(true);
    } else {
      // Use emoji text
      this.emojiText.setText(config.productConfig.emoji);
      this.emojiText.setVisible(true);
      if (this.customImage) {
        this.customImage.setVisible(false);
      }
    }

    // Draw background based on type
    this.drawBackground();

    // Handle spoiled visual differentiation
    if (config.type === 'spoiled') {
      this.drawSpoiledDistortion();
      this.drawSpoiledOverlay();
      this.spoiledDistortion.setVisible(true);
      this.spoiledOverlay.setVisible(true);
    } else {
      this.spoiledDistortion.setVisible(false);
      this.spoiledOverlay.setVisible(false);
    }

    // Activate for rendering and updates
    this.setActive(true);
    this.setVisible(true);
  }

  /**
   * Update the product each frame — applies gravity (vertical fall)
   * and a gentle wobble rotation (disabled when reduceMotion is active).
   *
   * @param dt - Delta time in milliseconds
   * @param speedMultiplier - Speed factor (0.28 during Estrella Vita, 1.0 normally)
   */
  update(dt: number, speedMultiplier: number): void {
    if (!this.active) return;

    const dtSeconds = dt / 1000;

    // Apply gravity (move downward)
    this.y += this.speed * speedMultiplier * dtSeconds * 60;

    // Apply gentle wobble rotation only when reduced motion is not active
    const reduceMotion = this.scene.registry.get('reduceMotion') as boolean;
    if (!reduceMotion) {
      const rotationDelta = this.rotationSpeed * dtSeconds;
      const newRotation = this.rotation + rotationDelta;

      // Reverse wobble direction at bounds
      if (Math.abs(newRotation) > Product.MAX_ROTATION) {
        this.rotationSpeed = -this.rotationSpeed;
      }
      this.rotation += this.rotationSpeed * dtSeconds;
    }

    // Deactivate if fallen below screen
    if (this.y > GAME_HEIGHT + Product.SIZE) {
      this.setActive(false);
      this.setVisible(false);
    }
  }

  // ─── Private Methods ─────────────────────────────────────────────────────────

  /**
   * Draw the circular background based on item type.
   */
  private drawBackground(): void {
    this.bg.clear();

    const radius = Product.SIZE / 2;
    let color: number;

    switch (this.type) {
      case 'correct':
        color = 0xc8e6c9; // light green
        break;
      case 'spoiled':
        color = 0x8d6e63; // brownish (muted, but NOT the only differentiator)
        break;
      case 'unsolicited':
        color = 0xfff9c4; // light yellow
        break;
      case 'powerup':
        color = 0xbbdefb; // light blue
        break;
    }

    this.bg.fillStyle(color, 0.85);
    this.bg.fillCircle(0, 0, radius);
    this.bg.lineStyle(2, 0x424242, 0.3);
    this.bg.strokeCircle(0, 0, radius);
  }

  /**
   * Draw distortion lines/marks for spoiled products.
   * Uses cross-hatch pattern and irregular marks to convey bad state
   * through FORM, independent of color (WCAG 15.5).
   */
  private drawSpoiledDistortion(): void {
    this.spoiledDistortion.clear();

    const radius = Product.SIZE / 2;

    // Draw irregular "bruise" marks — small dark spots
    this.spoiledDistortion.fillStyle(0x3e2723, 0.6);
    this.spoiledDistortion.fillCircle(-8, -6, 4);
    this.spoiledDistortion.fillCircle(6, 8, 3);
    this.spoiledDistortion.fillCircle(10, -4, 2.5);

    // Draw cross-hatch lines to indicate damage/rot
    this.spoiledDistortion.lineStyle(1.5, 0x4e342e, 0.5);
    this.spoiledDistortion.beginPath();
    this.spoiledDistortion.moveTo(-radius * 0.5, -radius * 0.3);
    this.spoiledDistortion.lineTo(-radius * 0.1, radius * 0.2);
    this.spoiledDistortion.moveTo(radius * 0.2, -radius * 0.5);
    this.spoiledDistortion.lineTo(radius * 0.5, radius * 0.1);
    this.spoiledDistortion.moveTo(-radius * 0.3, radius * 0.3);
    this.spoiledDistortion.lineTo(radius * 0.1, radius * 0.6);
    this.spoiledDistortion.strokePath();
  }

  /**
   * Draw a semi-transparent dark overlay texture on spoiled products.
   * This provides an additional non-color visual cue (WCAG 15.5).
   */
  private drawSpoiledOverlay(): void {
    this.spoiledOverlay.clear();

    const radius = Product.SIZE / 2;

    // Semi-transparent dark overlay
    this.spoiledOverlay.fillStyle(0x000000, 0.25);
    this.spoiledOverlay.fillCircle(0, 0, radius);

    // Diagonal stripe texture pattern to convey "bad" through texture
    this.spoiledOverlay.lineStyle(1, 0x000000, 0.2);
    for (let i = -radius; i <= radius; i += 8) {
      this.spoiledOverlay.beginPath();
      this.spoiledOverlay.moveTo(i, -radius);
      this.spoiledOverlay.lineTo(i + radius, 0);
      this.spoiledOverlay.strokePath();
    }
  }
}
