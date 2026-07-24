import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, MIN_TOUCH_TARGET } from '../utils/constants';

/**
 * Player avatar entity with layered outfit rendering.
 * Extends Phaser.GameObjects.Container; renders using Phaser graphics
 * primitives (shapes/text) since no sprite assets exist yet.
 *
 * Outfit levels are cumulative:
 *   0 = base green body (no accessories)
 *   1 = +Gorra Cítrica (orange cap with yellow pom-pom)
 *   2 = +Remera VitaBalance (orange body with "VB" text)
 *   3 = +Capa VitaHero (purple cape with gold star)
 *
 * @see Requirements 1.1, 1.2, 9.1–9.5
 */
export class Player extends Phaser.GameObjects.Container {
  private static readonly SPEED = 14;
  private static readonly BODY_WIDTH = 48;
  private static readonly BODY_HEIGHT = 64;

  private bodyGfx: Phaser.GameObjects.Graphics;
  private capGfx: Phaser.GameObjects.Graphics;
  private shirtGfx: Phaser.GameObjects.Graphics;
  private capeGfx: Phaser.GameObjects.Graphics;
  private shirtLabel: Phaser.GameObjects.Text;

  private outfitLevel = 0;
  private touchActive = false;
  private touchTargetX = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // Create layers in rendering order (bottom to top)
    this.capeGfx = new Phaser.GameObjects.Graphics(scene);
    this.bodyGfx = new Phaser.GameObjects.Graphics(scene);
    this.shirtGfx = new Phaser.GameObjects.Graphics(scene);
    this.capGfx = new Phaser.GameObjects.Graphics(scene);
    this.shirtLabel = new Phaser.GameObjects.Text(scene, 0, 0, '', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
    });
    this.shirtLabel.setOrigin(0.5, 0.5);
    this.shirtLabel.setVisible(false);

    // Add in draw order: cape behind, then body, shirt overlay, cap on top
    this.add(this.capeGfx);
    this.add(this.bodyGfx);
    this.add(this.shirtGfx);
    this.add(this.shirtLabel);
    this.add(this.capGfx);

    // Set interactive size for touch (minimum 44×44)
    const interactiveWidth = Math.max(Player.BODY_WIDTH, MIN_TOUCH_TARGET);
    const interactiveHeight = Math.max(Player.BODY_HEIGHT, MIN_TOUCH_TARGET);
    this.setSize(interactiveWidth, interactiveHeight);

    // Draw initial appearance
    this.drawOutfit();

    // Setup touch input
    this.setupTouchInput();

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Shows accumulated outfit items based on progress level.
   * Outfit items are additive — higher levels include all previous items.
   */
  setOutfit(level: number): void {
    this.outfitLevel = Math.max(0, Math.min(3, level));
    this.drawOutfit();
  }

  /**
   * Moves the player to the left at 14 px/frame, clamped within game bounds.
   * @param _dt - Delta time (unused; movement is frame-based at fixed 14px)
   */
  moveLeft(_dt: number): void {
    const halfWidth = Player.BODY_WIDTH / 2;
    this.x = Math.max(halfWidth, this.x - Player.SPEED);
  }

  /**
   * Moves the player to the right at 14 px/frame, clamped within game bounds.
   * @param _dt - Delta time (unused; movement is frame-based at fixed 14px)
   */
  moveRight(_dt: number): void {
    const halfWidth = Player.BODY_WIDTH / 2;
    this.x = Math.min(GAME_WIDTH - halfWidth, this.x + Player.SPEED);
  }

  /**
   * Returns the collision bounding rectangle for overlap detection.
   * Coordinates are in world space.
   */
  getBounds(): Phaser.Geom.Rectangle {
    const halfW = Player.BODY_WIDTH / 2;
    const halfH = Player.BODY_HEIGHT / 2;
    return new Phaser.Geom.Rectangle(
      this.x - halfW,
      this.y - halfH,
      Player.BODY_WIDTH,
      Player.BODY_HEIGHT,
    );
  }

  /**
   * Update method to be called each frame for touch input handling.
   */
  update(): void {
    if (this.touchActive) {
      const halfWidth = Player.BODY_WIDTH / 2;
      const targetX = Phaser.Math.Clamp(this.touchTargetX, halfWidth, GAME_WIDTH - halfWidth);

      // Move toward touch position at player speed
      const diff = targetX - this.x;
      if (Math.abs(diff) > Player.SPEED) {
        this.x += Math.sign(diff) * Player.SPEED;
      } else {
        this.x = targetX;
      }
    }
  }

  /**
   * Clean up touch input listeners on destroy.
   */
  destroy(fromScene?: boolean): void {
    this.scene?.input.off('pointerdown', this.handlePointerDown, this);
    this.scene?.input.off('pointermove', this.handlePointerMove, this);
    this.scene?.input.off('pointerup', this.handlePointerUp, this);
    super.destroy(fromScene);
  }

  // ─── Private Methods ─────────────────────────────────────────────────────────

  private setupTouchInput(): void {
    this.scene.input.on('pointerdown', this.handlePointerDown, this);
    this.scene.input.on('pointermove', this.handlePointerMove, this);
    this.scene.input.on('pointerup', this.handlePointerUp, this);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    // Only respond to touches in the lower half of the screen
    if (pointer.y > GAME_HEIGHT / 2) {
      this.touchActive = true;
      this.touchTargetX = pointer.x;
    }
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.touchActive && pointer.isDown && pointer.y > GAME_HEIGHT / 2) {
      this.touchTargetX = pointer.x;
    }
  }

  private handlePointerUp(): void {
    this.touchActive = false;
  }

  private drawOutfit(): void {
    this.drawBody();
    this.drawCap();
    this.drawShirt();
    this.drawCape();
  }

  private drawBody(): void {
    this.bodyGfx.clear();

    const halfW = Player.BODY_WIDTH / 2;
    const halfH = Player.BODY_HEIGHT / 2;

    // Base body color depends on outfit level
    // Level 2+ changes body to orange (remera), otherwise green
    const bodyColor = this.outfitLevel >= 2 ? 0xf97316 : 0x22c55e;

    // Draw rounded body shape
    this.bodyGfx.fillStyle(bodyColor, 1);
    this.bodyGfx.fillRoundedRect(-halfW, -halfH, Player.BODY_WIDTH, Player.BODY_HEIGHT, 12);

    // Draw head (circle on top)
    this.bodyGfx.fillStyle(0xfbbf24, 1); // warm skin tone
    this.bodyGfx.fillCircle(0, -halfH - 12, 14);

    // Draw eyes
    this.bodyGfx.fillStyle(0x1f2937, 1);
    this.bodyGfx.fillCircle(-5, -halfH - 14, 3);
    this.bodyGfx.fillCircle(5, -halfH - 14, 3);

    // Draw smile
    this.bodyGfx.lineStyle(2, 0x1f2937, 1);
    this.bodyGfx.beginPath();
    this.bodyGfx.arc(0, -halfH - 10, 6, 0, Math.PI, false);
    this.bodyGfx.strokePath();
  }

  private drawCap(): void {
    this.capGfx.clear();
    this.capGfx.setVisible(this.outfitLevel >= 1);

    if (this.outfitLevel < 1) return;

    const halfH = Player.BODY_HEIGHT / 2;

    // Orange cap (gorra)
    this.capGfx.fillStyle(0xf97316, 1);
    this.capGfx.fillRoundedRect(-16, -halfH - 26, 32, 12, 6);

    // Cap brim
    this.capGfx.fillStyle(0xea580c, 1);
    this.capGfx.fillRect(-18, -halfH - 16, 36, 4);

    // Yellow pom-pom on top
    this.capGfx.fillStyle(0xfbbf24, 1);
    this.capGfx.fillCircle(0, -halfH - 28, 5);
  }

  private drawShirt(): void {
    this.shirtGfx.clear();
    this.shirtGfx.setVisible(this.outfitLevel >= 2);
    this.shirtLabel.setVisible(this.outfitLevel >= 2);

    if (this.outfitLevel < 2) return;

    const halfW = Player.BODY_WIDTH / 2;

    // "VB" text overlay on the orange body (shirt effect)
    this.shirtLabel.setText('VB');
    this.shirtLabel.setPosition(0, 0);

    // White band at bottom of shirt
    this.shirtGfx.fillStyle(0xffffff, 0.3);
    this.shirtGfx.fillRect(-halfW + 4, 16, Player.BODY_WIDTH - 8, 8);
  }

  private drawCape(): void {
    this.capeGfx.clear();
    this.capeGfx.setVisible(this.outfitLevel >= 3);

    if (this.outfitLevel < 3) return;

    const halfW = Player.BODY_WIDTH / 2;
    const halfH = Player.BODY_HEIGHT / 2;

    // Purple cape flowing behind
    this.capeGfx.fillStyle(0x7c3aed, 1);
    this.capeGfx.beginPath();
    this.capeGfx.moveTo(-halfW - 6, -halfH + 8);
    this.capeGfx.lineTo(-halfW - 12, halfH + 8);
    this.capeGfx.lineTo(halfW + 12, halfH + 8);
    this.capeGfx.lineTo(halfW + 6, -halfH + 8);
    this.capeGfx.closePath();
    this.capeGfx.fillPath();

    // Gold star on cape
    this.capeGfx.fillStyle(0xfbbf24, 1);
    this.drawStar(this.capeGfx, 0, halfH - 4, 8, 4, 5);
  }

  /**
   * Draws a star shape on the given graphics object.
   */
  private drawStar(
    graphics: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    outerRadius: number,
    innerRadius: number,
    points: number,
  ): void {
    const step = Math.PI / points;

    graphics.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = i * step - Math.PI / 2;
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;

      if (i === 0) {
        graphics.moveTo(px, py);
      } else {
        graphics.lineTo(px, py);
      }
    }
    graphics.closePath();
    graphics.fillPath();
  }
}
