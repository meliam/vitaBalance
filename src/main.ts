import Phaser from 'phaser';
import { GAME_CONFIG } from './config/game-config';
import { IntroAnimation } from './ui/IntroAnimation';

// Global error boundaries — catch any unhandled errors so they never reach the user.
// Requirements: 12.4, 17.4, 18.4
window.addEventListener('unhandledrejection', (event) => {
  event.preventDefault();
  console.warn('[VitaBalance] Unhandled promise rejection caught:', event.reason);
});

window.addEventListener('error', (event) => {
  event.preventDefault();
  console.warn('[VitaBalance] Uncaught error caught:', event.error);
});

// Check if intro was already shown this session
const introShown = sessionStorage.getItem('vitabalance_intro_shown');

if (!introShown) {
  // Show Marvel-style intro first, then start Phaser
  const intro = new IntroAnimation(() => {
    sessionStorage.setItem('vitabalance_intro_shown', '1');
    new Phaser.Game(GAME_CONFIG);
  });
  intro.show();
} else {
  // Intro already seen — start game directly
  new Phaser.Game(GAME_CONFIG);
}
