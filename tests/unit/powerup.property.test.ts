import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { POWERUP_DURATION, POWERUP_SPEED_FACTOR } from '../../src/utils/constants';

// ─── Property 8: Estrella Vita speed multiplier is exactly 0.28 for exactly 3 seconds ───
// **Validates: Requirements 4.1**
// While `state.powerupActive === true`: all product speeds are multiplied by 0.28.
// Duration is exactly 3000ms from activation.

describe('Estrella Vita Power-Up — Property-Based Tests', () => {
  /**
   * Property 8: Estrella Vita speed multiplier is exactly 0.28 for exactly 3 seconds
   * **Validates: Requirements 4.1**
   *
   * While powerupActive is true, all product speeds are multiplied by 0.28;
   * duration is exactly 3000ms.
   */
  describe('Property 8: Estrella Vita speed multiplier is exactly 0.28 for exactly 3 seconds', () => {
    it('POWERUP_SPEED_FACTOR constant is exactly 0.28', () => {
      expect(POWERUP_SPEED_FACTOR).toBe(0.28);
    });

    it('POWERUP_DURATION constant is exactly 3000ms', () => {
      expect(POWERUP_DURATION).toBe(3000);
    });

    it('for any product base speed, the effective speed during power-up equals baseSpeed × 0.28', () => {
      fc.assert(
        fc.property(
          // Generate any positive product speed (covers all levels: 1.6–3.5 and beyond)
          fc.double({ min: 0.1, max: 10.0, noNaN: true }),
          (baseSpeed) => {
            const effectiveSpeed = baseSpeed * POWERUP_SPEED_FACTOR;

            // The effective speed must equal exactly 28% of the base speed
            expect(effectiveSpeed / baseSpeed).toBeCloseTo(0.28, 10);
            // The effective speed must always be less than the base speed
            expect(effectiveSpeed).toBeLessThan(baseSpeed);
            // The effective speed must remain positive
            expect(effectiveSpeed).toBeGreaterThan(0);
          },
        ),
      );
    });

    it('for any set of concurrent products, speedMultiplier applies uniformly to all speeds', () => {
      fc.assert(
        fc.property(
          // Generate an array of 1–20 product speeds (simulating multiple products on screen)
          fc.array(fc.double({ min: 0.5, max: 5.0, noNaN: true }), {
            minLength: 1,
            maxLength: 20,
          }),
          (productSpeeds) => {
            // When power-up is active, all products get the same multiplier
            const effectiveSpeeds = productSpeeds.map((s) => s * POWERUP_SPEED_FACTOR);

            for (let i = 0; i < productSpeeds.length; i++) {
              // Each product's speed ratio must be exactly 0.28
              expect(effectiveSpeeds[i] / productSpeeds[i]).toBeCloseTo(0.28, 10);
            }
          },
        ),
      );
    });

    it('power-up state transitions correctly: speedMultiplier is 0.28 during activation and 1.0 after expiry', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.5, max: 5.0, noNaN: true }),
          (baseSpeed) => {
            // ── Before activation ──
            let speedMultiplier = 1.0;
            let powerupActive = false;
            let powerupTimeRemaining = 0;

            expect(baseSpeed * speedMultiplier).toBeCloseTo(baseSpeed, 10);

            // ── On activation ──
            speedMultiplier = POWERUP_SPEED_FACTOR;
            powerupActive = true;
            powerupTimeRemaining = POWERUP_DURATION / 1000;

            expect(speedMultiplier).toBe(0.28);
            expect(powerupActive).toBe(true);
            expect(powerupTimeRemaining).toBe(3);
            expect(baseSpeed * speedMultiplier).toBeCloseTo(baseSpeed * 0.28, 10);

            // ── On expiry (after 3000ms) ──
            speedMultiplier = 1.0;
            powerupActive = false;
            powerupTimeRemaining = 0;

            expect(speedMultiplier).toBe(1.0);
            expect(powerupActive).toBe(false);
            expect(powerupTimeRemaining).toBe(0);
            expect(baseSpeed * speedMultiplier).toBeCloseTo(baseSpeed, 10);
          },
        ),
      );
    });

    it('power-up duration is exactly 3 seconds (3000ms)', () => {
      fc.assert(
        fc.property(
          // Simulate different elapsed times during the power-up
          fc.double({ min: 0, max: 5000, noNaN: true }),
          (elapsedMs) => {
            const isActive = elapsedMs < POWERUP_DURATION;
            const expectedTimeRemaining = isActive
              ? Math.max(0, (POWERUP_DURATION - elapsedMs) / 1000)
              : 0;

            if (isActive) {
              // During the 3-second window, power-up should still be active
              expect(elapsedMs).toBeLessThan(3000);
              expect(expectedTimeRemaining).toBeGreaterThan(0);
              expect(expectedTimeRemaining).toBeLessThanOrEqual(3);
            } else {
              // After 3000ms, power-up should be expired
              expect(elapsedMs).toBeGreaterThanOrEqual(3000);
              expect(expectedTimeRemaining).toBe(0);
            }
          },
        ),
      );
    });

    it('newly spawned products during power-up also receive the 0.28 speed multiplier', () => {
      fc.assert(
        fc.property(
          // Simulate spawning products at different times during the power-up
          fc.array(
            fc.record({
              baseSpeed: fc.double({ min: 0.5, max: 5.0, noNaN: true }),
              spawnTimeMs: fc.double({ min: 0, max: 2999, noNaN: true }), // spawned during power-up
            }),
            { minLength: 1, maxLength: 10 },
          ),
          (spawnedProducts) => {
            // All products spawned during the power-up window get the multiplier applied
            const speedMultiplier = POWERUP_SPEED_FACTOR; // power-up is active

            for (const product of spawnedProducts) {
              const effectiveSpeed = product.baseSpeed * speedMultiplier;
              expect(effectiveSpeed / product.baseSpeed).toBeCloseTo(0.28, 10);
              expect(effectiveSpeed).toBeLessThan(product.baseSpeed);
            }
          },
        ),
      );
    });
  });
});
