import Phaser from 'phaser';
import { GAME_WIDTH } from '../utils/constants';

/**
 * Particle-based confetti effect triggered on victory.
 * Respects reduced-motion preference: when reduceMotion is true,
 * the effect is skipped entirely (WCAG 2.3.3 / prefers-reduced-motion).
 */
export class ConfettiEffect {
  /** Festive colors used for confetti particles. */
  private static readonly COLORS: number[] = [
    0xffd700, // gold
    0xff4444, // red
    0x4488ff, // blue
    0x44cc44, // green
    0x9944cc, // purple
    0xff8800, // orange
  ];

  /** Number of confetti particles to spawn. */
  private static readonly PARTICLE_COUNT = 60;

  /** Confetti particle size in pixels. */
  private static readonly PARTICLE_SIZE = 8;

  /** Duration of the confetti animation in milliseconds. */
  private static readonly DURATION = 2500;

  /** Texture key for the confetti particle. */
  private static readonly TEXTURE_KEY = '__confetti_particle__';

  /**
   * Play the confetti effect on the given scene.
   * If reduceMotion is true, returns immediately without any animation.
   *
   * @param scene - The active Phaser scene to attach the effect to.
   * @param reduceMotion - Whether reduced-motion is enabled.
   */
  static play(scene: Phaser.Scene, reduceMotion?: boolean): void {
    if (reduceMotion) {
      return;
    }

    // Generate the particle texture if it doesn't already exist
    ConfettiEffect.ensureTexture(scene);

    const particles: Phaser.GameObjects.Rectangle[] = [];
    const centerX = GAME_WIDTH / 2;

    for (let i = 0; i < ConfettiEffect.PARTICLE_COUNT; i++) {
      const color = ConfettiEffect.COLORS[i % ConfettiEffect.COLORS.length];
      const size = ConfettiEffect.PARTICLE_SIZE + Math.random() * 4;

      // Start position: spread across the top/center area
      const startX = centerX + (Math.random() - 0.5) * GAME_WIDTH * 0.8;
      const startY = -10 - Math.random() * 40;

      const particle = scene.add.rectangle(startX, startY, size, size * 0.6, color);
      particle.setAlpha(0.9 + Math.random() * 0.1);
      particle.setAngle(Math.random() * 360);
      particle.setDepth(1000);
      particles.push(particle);

      // Animate each particle falling with drift and rotation
      const targetX = startX + (Math.random() - 0.5) * 200;
      const targetY = scene.scale.height + 50;
      const duration = ConfettiEffect.DURATION + Math.random() * 800;
      const delay = Math.random() * 300;

      scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        angle: particle.angle + (Math.random() - 0.5) * 720,
        alpha: { from: 1, to: 0.3 },
        duration,
        delay,
        ease: 'Quad.easeIn',
      });
    }

    // Clean up all particles after the animation completes
    scene.time.delayedCall(
      ConfettiEffect.DURATION + 1100,
      () => {
        for (const particle of particles) {
          particle.destroy();
        }
      },
      [],
      scene,
    );
  }

  /**
   * Ensures the confetti texture exists in the scene's texture manager.
   * Creates a small colored square via Graphics if not already present.
   */
  private static ensureTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists(ConfettiEffect.TEXTURE_KEY)) {
      return;
    }

    const graphics = scene.add.graphics();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, ConfettiEffect.PARTICLE_SIZE, ConfettiEffect.PARTICLE_SIZE);
    graphics.generateTexture(
      ConfettiEffect.TEXTURE_KEY,
      ConfettiEffect.PARTICLE_SIZE,
      ConfettiEffect.PARTICLE_SIZE,
    );
    graphics.destroy();
  }
}
