/**
 * IntroAnimation — Marvel-style comic intro that sets up the game's narrative.
 *
 * Story: The seasons are out of balance. Fruits and vegetables are falling
 * from the sky in chaos. Only a VitaGuardian can restore order by collecting
 * the right seasonal products. The mystery: Who disrupted the seasons?
 *
 * Uses HTML/CSS overlay on top of Phaser canvas for rich text animation.
 * Dismissable with click or Enter key.
 */

import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';

export class IntroAnimation {
  private overlay: HTMLDivElement | null = null;
  private onComplete: () => void;
  private currentPanel = 0;
  private panels: HTMLDivElement[] = [];

  private static readonly PANELS = [
    {
      bg: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 100%)',
      image: '🌍',
      title: '',
      text: 'Las estaciones siempre mantuvieron el equilibrio de la naturaleza...',
      accent: '#4ecdc4',
    },
    {
      bg: 'linear-gradient(135deg, #2d0a0a 0%, #4a1a0a 100%)',
      image: '⚡',
      title: '¡CRISIS!',
      text: 'Pero algo salió mal. Las frutas y verduras caen del cielo sin control. Las estaciones se mezclaron.',
      accent: '#ff4444',
    },
    {
      bg: 'linear-gradient(135deg, #0a2a0a 0%, #0a3a2a 100%)',
      image: '🦸',
      title: '',
      text: '¿Quién desequilibró las estaciones? Solo un VitaGuardián puede descubrirlo...',
      accent: '#ffd700',
    },
    {
      bg: 'linear-gradient(135deg, #0f2744 0%, #0a3d1a 100%)',
      image: '🎮',
      title: 'TU MISIÓN',
      text: 'Recolectá los productos correctos, evitá los deteriorados y restaurá el balance nutricional de cada estación.',
      accent: '#4CAF50',
    },
  ];

  constructor(onComplete: () => void) {
    this.onComplete = onComplete;
  }

  show(): void {
    this.createOverlay();
    this.createPanels();
    this.showPanel(0);
    this.setupInput();
  }

  private createOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.id = 'intro-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #000;
      font-family: 'Arial', sans-serif;
      cursor: pointer;
      overflow: hidden;
    `;
    document.body.appendChild(this.overlay);
  }

  private createPanels(): void {
    for (const panelData of IntroAnimation.PANELS) {
      const panel = document.createElement('div');
      panel.style.cssText = `
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: ${panelData.bg};
        opacity: 0;
        transition: opacity 0.6s ease-in-out;
        padding: 40px;
        text-align: center;
      `;

      // Comic-style border frame
      const frame = document.createElement('div');
      frame.style.cssText = `
        border: 4px solid ${panelData.accent};
        border-radius: 12px;
        padding: 48px 64px;
        max-width: 800px;
        position: relative;
        box-shadow: 0 0 40px ${panelData.accent}44, inset 0 0 20px ${panelData.accent}22;
      `;

      // Emoji/image
      const img = document.createElement('div');
      img.style.cssText = `
        font-size: 72px;
        margin-bottom: 20px;
        filter: drop-shadow(0 0 20px ${panelData.accent});
        animation: float 2s ease-in-out infinite;
      `;
      img.textContent = panelData.image;
      frame.appendChild(img);

      // Title (if exists)
      if (panelData.title) {
        const title = document.createElement('h1');
        title.style.cssText = `
          font-size: 42px;
          font-weight: 900;
          color: ${panelData.accent};
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 4px;
          text-shadow: 0 0 20px ${panelData.accent}, 0 2px 4px rgba(0,0,0,0.8);
          font-style: italic;
        `;
        title.textContent = panelData.title;
        frame.appendChild(title);
      }

      // Text
      const text = document.createElement('p');
      text.style.cssText = `
        font-size: 20px;
        color: #e0e0e0;
        line-height: 1.6;
        max-width: 600px;
        text-shadow: 0 1px 3px rgba(0,0,0,0.8);
      `;
      text.textContent = panelData.text;
      frame.appendChild(text);

      panel.appendChild(frame);

      // "Click to continue" hint
      const hint = document.createElement('div');
      hint.style.cssText = `
        position: absolute;
        bottom: 30px;
        color: #888;
        font-size: 14px;
        animation: pulse 1.5s ease-in-out infinite;
      `;
      hint.textContent = '▶ Click o Enter para continuar';
      panel.appendChild(hint);

      this.overlay!.appendChild(panel);
      this.panels.push(panel);
    }

    // Add CSS animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  private showPanel(index: number): void {
    // Hide all panels
    for (const panel of this.panels) {
      panel.style.opacity = '0';
      panel.style.pointerEvents = 'none';
    }

    if (index >= this.panels.length) {
      this.complete();
      return;
    }

    // Show target panel
    this.panels[index].style.opacity = '1';
    this.panels[index].style.pointerEvents = 'auto';
    this.currentPanel = index;
  }

  private advance(): void {
    this.showPanel(this.currentPanel + 1);
  }

  private complete(): void {
    if (this.overlay) {
      this.overlay.style.transition = 'opacity 0.5s';
      this.overlay.style.opacity = '0';
      setTimeout(() => {
        this.overlay?.remove();
        this.overlay = null;
      }, 500);
    }
    this.onComplete();
  }

  private setupInput(): void {
    // Click advances
    this.overlay?.addEventListener('click', () => this.advance());

    // Enter/Space advances
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.advance();
      }
      // Escape skips all
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', keyHandler);
        this.complete();
      }
    };
    document.addEventListener('keydown', keyHandler);
  }
}
