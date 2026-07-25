import { describe, it, expect } from 'vitest';
import { checkOverlap } from '../../src/systems/collision-system';
import type { Bounds } from '../../src/types/game.types';

describe('Collision System — checkOverlap', () => {
  describe('overlapping rectangles return true', () => {
    it('returns true when rectangles fully overlap (identical bounds)', () => {
      const a: Bounds = { x: 10, y: 10, width: 50, height: 50 };
      const b: Bounds = { x: 10, y: 10, width: 50, height: 50 };
      expect(checkOverlap(a, b)).toBe(true);
    });

    it('returns true when one rectangle is inside the other', () => {
      const avatar: Bounds = { x: 0, y: 0, width: 100, height: 100 };
      const item: Bounds = { x: 25, y: 25, width: 20, height: 20 };
      expect(checkOverlap(avatar, item)).toBe(true);
    });

    it('returns true when rectangles partially overlap horizontally', () => {
      const avatar: Bounds = { x: 0, y: 0, width: 50, height: 50 };
      const item: Bounds = { x: 30, y: 0, width: 50, height: 50 };
      expect(checkOverlap(avatar, item)).toBe(true);
    });

    it('returns true when rectangles partially overlap vertically', () => {
      const avatar: Bounds = { x: 0, y: 0, width: 50, height: 50 };
      const item: Bounds = { x: 0, y: 30, width: 50, height: 50 };
      expect(checkOverlap(avatar, item)).toBe(true);
    });

    it('returns true when rectangles overlap at a corner', () => {
      const avatar: Bounds = { x: 0, y: 0, width: 50, height: 50 };
      const item: Bounds = { x: 40, y: 40, width: 50, height: 50 };
      expect(checkOverlap(avatar, item)).toBe(true);
    });
  });

  describe('non-overlapping rectangles return false', () => {
    it('returns false when item is entirely to the right', () => {
      const avatar: Bounds = { x: 0, y: 0, width: 50, height: 50 };
      const item: Bounds = { x: 100, y: 0, width: 50, height: 50 };
      expect(checkOverlap(avatar, item)).toBe(false);
    });

    it('returns false when item is entirely to the left', () => {
      const avatar: Bounds = { x: 100, y: 0, width: 50, height: 50 };
      const item: Bounds = { x: 0, y: 0, width: 50, height: 50 };
      expect(checkOverlap(avatar, item)).toBe(false);
    });

    it('returns false when item is entirely above', () => {
      const avatar: Bounds = { x: 0, y: 100, width: 50, height: 50 };
      const item: Bounds = { x: 0, y: 0, width: 50, height: 50 };
      expect(checkOverlap(avatar, item)).toBe(false);
    });

    it('returns false when item is entirely below', () => {
      const avatar: Bounds = { x: 0, y: 0, width: 50, height: 50 };
      const item: Bounds = { x: 0, y: 100, width: 50, height: 50 };
      expect(checkOverlap(avatar, item)).toBe(false);
    });

    it('returns false when separated diagonally', () => {
      const avatar: Bounds = { x: 0, y: 0, width: 30, height: 30 };
      const item: Bounds = { x: 50, y: 50, width: 30, height: 30 };
      expect(checkOverlap(avatar, item)).toBe(false);
    });
  });

  describe('edge-touching rectangles (boundary behavior)', () => {
    it('returns false when edges touch on the right (no overlap)', () => {
      const avatar: Bounds = { x: 0, y: 0, width: 50, height: 50 };
      const item: Bounds = { x: 50, y: 0, width: 50, height: 50 };
      expect(checkOverlap(avatar, item)).toBe(false);
    });

    it('returns false when edges touch on the bottom (no overlap)', () => {
      const avatar: Bounds = { x: 0, y: 0, width: 50, height: 50 };
      const item: Bounds = { x: 0, y: 50, width: 50, height: 50 };
      expect(checkOverlap(avatar, item)).toBe(false);
    });

    it('returns false when edges touch at a single corner point', () => {
      const avatar: Bounds = { x: 0, y: 0, width: 50, height: 50 };
      const item: Bounds = { x: 50, y: 50, width: 50, height: 50 };
      expect(checkOverlap(avatar, item)).toBe(false);
    });

    it('returns true when rectangles overlap by 1 pixel', () => {
      const avatar: Bounds = { x: 0, y: 0, width: 50, height: 50 };
      const item: Bounds = { x: 49, y: 0, width: 50, height: 50 };
      expect(checkOverlap(avatar, item)).toBe(true);
    });
  });
});
