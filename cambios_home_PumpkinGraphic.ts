import Phaser from 'phaser';

/**
 * PumpkinGraphic ÔÇö Draws a friendly pumpkin (zapallo) using Phaser Graphics.
 *
 * Style: minimalista, coherente con el avatar del juego.
 * - Cuerpo naranja redondeado con surcos suaves
 * - Tallo verde corto
 * - Hoja verde peque├▒a
 * - Sin ojos, boca ni cara
 * - Aspecto amigable, limpio y moderno
 *
 * Usage:
 *   PumpkinGraphic.generateTexture(scene, 'zapallo-texture', 32);
 *   // Then use the texture key 'zapallo-texture' with an Image
 */
export class PumpkinGraphic {
  /** Texture key used for the zapallo product */
  static readonly TEXTURE_KEY = '__zapallo_gfx__';

  /**
   * Generate the pumpkin texture if it doesn't exist yet.
   * Call once during preload or scene creation.
   */
  static generateTexture(scene: Phaser.Scene, size = 32): void {
    if (scene.textures.exists(PumpkinGraphic.TEXTURE_KEY)) return;

    const s = size;
    const half = s / 2;
    const gfx = scene.add.graphics();

    // Body: three overlapping ellipses for the pumpkin shape with surcos
    const bodyColor = 0xf97316; // orange
    const darkOrange = 0xea580c; // darker orange for surcos
    const stemColor = 0x22c55e; // green

    // Back lobe (slightly darker for depth)
    gfx.fillStyle(darkOrange, 1);
    gfx.fillEllipse(half, half + 2, s * 0.85, s * 0.72);

    // Main body (center lobe)
    gfx.fillStyle(bodyColor, 1);
    gfx.fillEllipse(half, half + 2, s * 0.7, s * 0.68);

    // Left lobe
    gfx.fillStyle(darkOrange, 0.6);
    gfx.fillEllipse(half - s * 0.18, half + 2, s * 0.36, s * 0.6);

    // Right lobe
    gfx.fillStyle(darkOrange, 0.6);
    gfx.fillEllipse(half + s * 0.18, half + 2, s * 0.36, s * 0.6);

    // Surcos (vertical lines, subtle)
    gfx.lineStyle(1, darkOrange, 0.4);
    gfx.beginPath();
    gfx.arc(half, half + 2, s * 0.2, -Math.PI * 0.8, Math.PI * 0.8, false);
    gfx.strokePath();

    // Stem
    gfx.fillStyle(stemColor, 1);
    gfx.fillRoundedRect(half - 3, half - s * 0.38, 6, s * 0.18, 2);

    // Small leaf (teardrop shape using arc + lines)
    gfx.fillStyle(0x16a34a, 1);
    gfx.fillEllipse(half + s * 0.1, half - s * 0.35, s * 0.14, s * 0.07);

    // Generate texture from graphics
    gfx.generateTexture(PumpkinGraphic.TEXTURE_KEY, s, s);
    gfx.destroy();
  }

  /**
   * Create a pumpkin as a Container with a drawn graphic.
   * Useful for inline rendering where a texture isn't pre-generated.
   */
  static createContainer(scene: Phaser.Scene, x: number, y: number, size = 32): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);
    const gfx = scene.add.graphics();
    const s = size;
    const half = s / 2;

    const bodyColor = 0xf97316;
    const darkOrange = 0xea580c;
    const stemColor = 0x22c55e;

    // Back lobe
    gfx.fillStyle(darkOrange, 1);
    gfx.fillEllipse(0, 2, s * 0.85, s * 0.72);

    // Main body
    gfx.fillStyle(bodyColor, 1);
    gfx.fillEllipse(0, 2, s * 0.7, s * 0.68);

    // Left lobe
    gfx.fillStyle(darkOrange, 0.6);
    gfx.fillEllipse(-s * 0.18, 2, s * 0.36, s * 0.6);

    // Right lobe
    gfx.fillStyle(darkOrange, 0.6);
    gfx.fillEllipse(s * 0.18, 2, s * 0.36, s * 0.6);

    // Surco line
    gfx.lineStyle(1, darkOrange, 0.4);
    gfx.beginPath();
    gfx.arc(0, 2, s * 0.2, -Math.PI * 0.8, Math.PI * 0.8, false);
    gfx.strokePath();

    // Stem
    gfx.fillStyle(stemColor, 1);
    gfx.fillRoundedRect(-3, -half + 2, 6, s * 0.18, 2);

    // Small leaf (simple ellipse)
    gfx.fillStyle(0x16a34a, 1);
    gfx.fillEllipse(s * 0.1, -half + s * 0.08, s * 0.14, s * 0.07);

    container.add(gfx);
    container.setSize(s, s);
    return container;
  }
}
