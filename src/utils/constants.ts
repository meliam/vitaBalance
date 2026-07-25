/**
 * Game-wide constants for VitaBalance: Guardianes de las Estaciones.
 * No Phaser dependencies — used across systems, scenes, and UI components.
 */

/** Logical game resolution width in pixels. */
export const GAME_WIDTH = 1280 as const;

/** Logical game resolution height in pixels. */
export const GAME_HEIGHT = 520 as const;

/** Minimum touch target size in pixels (WCAG 2.5.5). */
export const MIN_TOUCH_TARGET = 44 as const;

/** Toast display duration in milliseconds. */
export const TOAST_DURATION = 1800 as const;

/** Estrella Vita power-up effect duration in milliseconds. */
export const POWERUP_DURATION = 3000 as const;

/** Speed multiplier applied during power-up (28% of normal). */
export const POWERUP_SPEED_FACTOR = 0.28 as const;

/** Starting lives per level. */
export const MAX_LIVES = 3 as const;

/** Damage screen flash duration in milliseconds. */
export const FLASH_DURATION = 350 as const;

/** Damage screen flash opacity (0–1). */
export const FLASH_OPACITY = 0.28 as const;

/** Speed multiplier when "Reducir movimiento" is active (same as power-up: 28% of normal). */
export const REDUCED_MOTION_SPEED_FACTOR = 0.28 as const;
