import { GAME_WIDTH, GAME_HEIGHT, MIN_TOUCH_TARGET } from '../../utils/constants';

/**
 * HomeLayout — Calculates positions for the Home screen within the fixed
 * 1280×520 game canvas (Scale.FIT mode).
 *
 * Since the canvas has a fixed logical resolution, this module provides
 * a single layout optimized for the 1280×520 landscape aspect ratio.
 * Scale.FIT ensures the full canvas is always visible on any device.
 *
 * Call `computeHomeLayout()` once in create(). No resize recalculation needed
 * because Phaser's FIT mode handles scaling uniformly.
 */

export interface ElementLayout {
  x: number;
  y: number;
  scale: number;
  width?: number;
  height?: number;
}

export interface HomeLayoutResult {
  width: number;
  height: number;

  // Logo area
  logoLeaf: ElementLayout;
  logoText: ElementLayout;
  logoBolt: ElementLayout;
  subtitle: ElementLayout;

  // Avatar area
  avatar: ElementLayout & { size: number };
  fruitLeft: ElementLayout;
  fruitRight: ElementLayout;

  // Slogan
  slogan: ElementLayout;

  // Buttons
  playButton: ElementLayout & { width: number; height: number; fontSize: number };
  howToPlayButton: ElementLayout & { width: number; height: number; fontSize: number };
  settingsButton: ElementLayout & { width: number; height: number };

  // Floating fruits (decorative positions)
  floatingFruits: ElementLayout[];

  // Stars (decorative twinkle positions)
  stars: ElementLayout[];

  // Font sizes
  logoFontSize: number;
  subtitleFontSize: number;
  sloganFontSize: number;
}

/**
 * Compute the Home layout for the fixed 1280×520 canvas.
 */
export function computeHomeLayout(): HomeLayoutResult {
  const w = GAME_WIDTH;
  const h = GAME_HEIGHT;
  const centerX = w / 2;

  const logoFontSize = 48;
  const subtitleFontSize = 16;
  const sloganFontSize = 20;

  const topSection = h * 0.19;
  const avatarY = h * 0.46;
  const sloganY = h * 0.66;
  const buttonsStartY = h * 0.79;

  const playW = 240;
  const playH = 56;
  const howToW = 200;
  const howToH = MIN_TOUCH_TARGET;
  const settingsSize = MIN_TOUCH_TARGET;

  const avatarSize = 90;

  return {
    width: w,
    height: h,

    logoLeaf: { x: centerX - 175, y: topSection, scale: 1 },
    logoText: { x: centerX, y: topSection, scale: 1 },
    logoBolt: { x: centerX + 175, y: topSection, scale: 1 },
    subtitle: { x: centerX, y: topSection + 36, scale: 1 },

    avatar: { x: centerX, y: avatarY, scale: 1, size: avatarSize },
    fruitLeft: { x: centerX - 110, y: avatarY + 10, scale: 0.9 },
    fruitRight: { x: centerX + 110, y: avatarY + 10, scale: 0.9 },

    slogan: { x: centerX, y: sloganY, scale: 1 },

    playButton: {
      x: centerX, y: buttonsStartY,
      scale: 1, width: playW, height: playH, fontSize: 24,
    },
    howToPlayButton: {
      x: centerX, y: buttonsStartY + playH + 12,
      scale: 1, width: howToW, height: howToH, fontSize: 18,
    },
    settingsButton: {
      x: w - 40, y: 30,
      scale: 1, width: settingsSize, height: settingsSize,
    },

    floatingFruits: generateFloatingPositions(w, h),
    stars: generateStarPositions(w, h),

    logoFontSize,
    subtitleFontSize,
    sloganFontSize,
  };
}

/**
 * Deterministic positions for floating fruit decorations spread across canvas.
 */
function generateFloatingPositions(w: number, h: number): ElementLayout[] {
  const positions: ElementLayout[] = [];
  const count = 10;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const radiusX = w * 0.38 + (i % 3) * w * 0.05;
    const radiusY = h * 0.32 + (i % 2) * h * 0.08;
    const x = w / 2 + Math.cos(angle) * radiusX;
    const y = h / 2 + Math.sin(angle) * radiusY;

    const clampedX = Math.max(w * 0.04, Math.min(w * 0.96, x));
    const clampedY = Math.max(h * 0.06, Math.min(h * 0.94, y));

    const sizeVariation = 0.7 + (i % 3) * 0.2;
    positions.push({ x: clampedX, y: clampedY, scale: sizeVariation });
  }
  return positions;
}

/**
 * Deterministic positions for decorative stars.
 */
function generateStarPositions(w: number, h: number): ElementLayout[] {
  const positions: ElementLayout[] = [];
  const count = 5;
  for (let i = 0; i < count; i++) {
    const x = w * 0.55 + (i * 0.1 * w) % (w * 0.38);
    const y = h * 0.12 + (i * 0.18 * h) % (h * 0.55);
    const sizeVariation = 0.6 + (i % 3) * 0.25;
    positions.push({ x, y, scale: sizeVariation });
  }
  return positions;
}
