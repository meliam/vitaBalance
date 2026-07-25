import type { Bounds } from '../types/game.types';

/**
 * AABB overlap detection — pure function, no Phaser dependencies.
 *
 * Two rectangles overlap when they are NOT separated on either axis.
 * They are separated when one is entirely to the left, right, above, or below the other.
 */
export function checkOverlap(avatar: Bounds, item: Bounds): boolean {
  const avatarRight = avatar.x + avatar.width;
  const avatarBottom = avatar.y + avatar.height;
  const itemRight = item.x + item.width;
  const itemBottom = item.y + item.height;

  // Separated if one is entirely to the left, right, above, or below the other
  if (avatar.x >= itemRight) return false;
  if (avatarRight <= item.x) return false;
  if (avatar.y >= itemBottom) return false;
  if (avatarBottom <= item.y) return false;

  return true;
}
