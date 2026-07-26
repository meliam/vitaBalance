import type Phaser from 'phaser';

/**
 * HomeAnimations — Manages all decorative tweens for the Home screen.
 *
 * Responsibilities:
 *   - Floating fruit gentle oscillation (Y + slight rotation)
 *   - Avatar idle bob animation
 *   - Star twinkle (alpha oscillation)
 *   - Progressive entrance (fade-in + slide-up, staggered)
 *
 * All tweens respect reduceMotion:
 *   - When active: no loops, no parallax, no pulsations.
 *   - Entrance animations become instant (alpha set directly).
 *   - Functional feedback (focus, activation) is preserved elsewhere.
 *
 * Usage:
 *   const anims = new HomeAnimations(scene, reduceMotion);
 *   anims.floatFruits(fruitObjects);
 *   anims.idleAvatar(avatarContainer);
 *   anims.twinkleStars(starObjects);
 *   anims.entranceSequence(elements);
 *   // On cleanup:
 *   anims.stopAll();
 */

interface EntranceTarget {
  gameObject: Phaser.GameObjects.GameObject & { setAlpha: (a: number) => void; y: number };
  delay: number;
}

export class HomeAnimations {
  private scene: Phaser.Scene;
  private reduceMotion: boolean;
  private tweens: Phaser.Tweens.Tween[] = [];
  private destroyed = false;

  constructor(scene: Phaser.Scene, reduceMotion: boolean) {
    this.scene = scene;
    this.reduceMotion = reduceMotion;
  }

  /**
   * Animate floating fruit/vegetable elements with gentle vertical oscillation
   * and subtle rotation. Each fruit gets a unique phase offset.
   */
  floatFruits(fruits: Phaser.GameObjects.GameObject[]): void {
    if (this.reduceMotion || this.destroyed) return;

    fruits.forEach((fruit, index) => {
      const target = fruit as Phaser.GameObjects.GameObject & { y: number; angle: number };
      const baseY = target.y;
      const duration = 2800 + index * 400;
      const delay = index * 300;

      const tween = this.scene.tweens.add({
        targets: target,
        y: baseY - 12 - (index % 3) * 4,
        angle: (index % 2 === 0 ? 5 : -5),
        duration,
        delay,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.tweens.push(tween);
    });
  }

  /**
   * Avatar idle animation: gentle vertical bob (±6px).
   */
  idleAvatar(avatar: Phaser.GameObjects.Container): void {
    if (this.reduceMotion || this.destroyed) return;

    const baseY = avatar.y;
    const tween = this.scene.tweens.add({
      targets: avatar,
      y: baseY - 6,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.tweens.push(tween);
  }

  /**
   * Star twinkle: gentle alpha oscillation.
   */
  twinkleStars(stars: Phaser.GameObjects.GameObject[]): void {
    if (this.reduceMotion || this.destroyed) return;

    stars.forEach((star, index) => {
      const target = star as Phaser.GameObjects.GameObject & { setAlpha: (a: number) => void };
      const duration = 1500 + index * 400;
      const delay = index * 350;

      const tween = this.scene.tweens.add({
        targets: target,
        alpha: { from: 0.3, to: 1 },
        duration,
        delay,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.tweens.push(tween);
    });
  }

  /**
   * Progressive entrance animation: elements fade in and slide up with staggered delays.
   *
   * If reduceMotion is active, elements are shown instantly at full opacity
   * without any animation.
   */
  entranceSequence(targets: EntranceTarget[]): void {
    if (this.destroyed) return;

    for (const { gameObject, delay } of targets) {
      if (this.reduceMotion) {
        // Instant: set final state directly
        gameObject.setAlpha(1);
        return;
      }

      // Start hidden and offset
      gameObject.setAlpha(0);
      const finalY = gameObject.y;
      gameObject.y = finalY + 20;

      const tween = this.scene.tweens.add({
        targets: gameObject,
        alpha: 1,
        y: finalY,
        duration: 350,
        delay,
        ease: 'Quad.easeOut',
      });

      this.tweens.push(tween);
    }
  }

  /**
   * Stop and destroy all managed tweens. Safe to call multiple times.
   * Must be called on sub-state exit and scene shutdown.
   */
  stopAll(): void {
    this.destroyed = true;

    for (const tween of this.tweens) {
      if (tween && tween.isPlaying()) {
        tween.stop();
      }
      // Tweens are auto-removed from scene when stopped, but remove explicitly
      if (tween) {
        tween.destroy();
      }
    }

    this.tweens = [];
  }

  /**
   * Whether this instance has been destroyed.
   */
  isDestroyed(): boolean {
    return this.destroyed;
  }
}
