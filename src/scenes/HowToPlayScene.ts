import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { Button } from '../ui/Button';

/**
 * HowToPlayScene — "Cómo jugar" instructions screen.
 * Displays control instructions, game objectives, and product type explanations.
 *
 * @see Requirements 19.1
 */
export class HowToPlayScene extends Phaser.Scene {
  private focusableElements: Button[] = [];
  private focusIndex = 0;

  constructor() {
    super({ key: 'HowToPlayScene' });
  }

  create(): void {
    this.createBackground();
    this.createTitle();
    this.createControlsSection();
    this.createObjectivesSection();
    this.createProductTypesSection();
    this.createBackButton();
    this.setupKeyboardNavigation();
  }

  // ─── Background ────────────────────────────────────────────────────────────

  private createBackground(): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f2744, 0x0f2744, 0x1a2a3a, 0x1a2a3a, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  // ─── Title ─────────────────────────────────────────────────────────────────

  private createTitle(): void {
    const title = this.add.text(GAME_WIDTH / 2, 36, 'Cómo Jugar', {
      fontFamily: 'Fredoka One, sans-serif',
      fontSize: '32px',
      color: '#4ecdc4',
      fontStyle: 'bold',
      align: 'center',
    });
    title.setOrigin(0.5, 0.5);
  }

  // ─── Controls Section ──────────────────────────────────────────────────────

  private createControlsSection(): void {
    const sectionX = 60;
    const startY = 70;

    this.addSectionHeader(sectionX, startY, '🎮 Controles');

    const controlLines = [
      'Desktop: ← → o A/D para mover, Escape para pausar',
      'Táctil: Tocar en la mitad inferior para mover',
    ];

    controlLines.forEach((line, i) => {
      this.add.text(sectionX + 16, startY + 26 + i * 22, line, {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '14px',
        color: '#c0c0c0',
      });
    });
  }

  // ─── Objectives Section ────────────────────────────────────────────────────

  private createObjectivesSection(): void {
    const sectionX = 60;
    const startY = 155;

    this.addSectionHeader(sectionX, startY, '🎯 Objetivo');

    const objectives = [
      'Nivel 1: Capturá 8 productos frescos',
      'Nivel 2: Combiná vitamina C + potasio + 5 productos diferentes',
      'Nivel 3: Recolectá los 5 productos de la estación objetivo',
    ];

    objectives.forEach((line, i) => {
      this.add.text(sectionX + 16, startY + 26 + i * 22, line, {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '14px',
        color: '#c0c0c0',
      });
    });
  }

  // ─── Product Types Section ─────────────────────────────────────────────────

  private createProductTypesSection(): void {
    const sectionX = 60;
    const startY = 260;

    this.addSectionHeader(sectionX, startY, '📦 Tipos de productos');

    const products = [
      { emoji: '🍎', label: 'Producto correcto', desc: 'Suma puntos, incrementa combo', color: '#4CAF50' },
      { emoji: '🟡', label: 'Producto no solicitado', desc: 'No suma puntos, corta combo, no resta vida', color: '#FFC107' },
      { emoji: '🟤', label: 'Producto deteriorado', desc: 'Resta una vida, corta combo ¡Evitalo!', color: '#f44336' },
      { emoji: '⭐', label: 'Estrella Vita', desc: 'Reduce velocidad de caída por 3 segundos', color: '#FFD700' },
    ];

    products.forEach((product, i) => {
      const y = startY + 28 + i * 44;

      // Emoji indicator
      this.add.text(sectionX + 16, y, product.emoji, {
        fontSize: '20px',
      });

      // Product label
      this.add.text(sectionX + 48, y, product.label, {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '15px',
        color: product.color,
        fontStyle: 'bold',
      });

      // Description
      this.add.text(sectionX + 48, y + 20, product.desc, {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '13px',
        color: '#a0a0a0',
      });
    });
  }

  // ─── Back Button ───────────────────────────────────────────────────────────

  private createBackButton(): void {
    const backBtn = new Button(this, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 36,
      text: '← Volver al menú',
      color: '#455A64',
      width: 200,
      height: 48,
      fontSize: 18,
      onClick: () => this.scene.start('MenuScene'),
    });
    this.focusableElements.push(backBtn);
    backBtn.setFocused(true);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private addSectionHeader(x: number, y: number, text: string): void {
    this.add.text(x, y, text, {
      fontFamily: 'Fredoka One, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
    });
  }

  // ─── Keyboard Navigation ───────────────────────────────────────────────────

  private setupKeyboardNavigation(): void {
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });

    this.input.keyboard?.on('keydown-TAB', (event: KeyboardEvent) => {
      event.preventDefault();
      this.cycleFocus(event.shiftKey ? -1 : 1);
    });
  }

  private cycleFocus(direction: number): void {
    if (this.focusableElements.length === 0) return;

    this.focusableElements[this.focusIndex]?.setFocused(false);

    this.focusIndex += direction;
    if (this.focusIndex < 0) {
      this.focusIndex = this.focusableElements.length - 1;
    } else if (this.focusIndex >= this.focusableElements.length) {
      this.focusIndex = 0;
    }

    this.focusableElements[this.focusIndex]?.setFocused(true);
  }
}
