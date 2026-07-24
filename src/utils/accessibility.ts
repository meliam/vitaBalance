import type { SettingsData } from '../types/game.types';

/**
 * Checks the OS-level prefers-reduced-motion media query.
 * Returns false in SSR/test environments where window or matchMedia is not available.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Returns the effective reduced-motion setting.
 * If the user has manually enabled reduceMotion in settings, returns true.
 * Otherwise, falls back to the OS preference via prefersReducedMotion().
 */
export function getReducedMotionSetting(settings: SettingsData): boolean {
  if (settings.reduceMotion) {
    return true;
  }
  return prefersReducedMotion();
}
