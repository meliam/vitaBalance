/**
 * HomeAccessibility — Manages the HTML accessible layer for the Home screen.
 *
 * Strategy to avoid double-activation and duplicated controls:
 *
 *   1. Phaser buttons handle POINTER interactions (mouse click, touch tap).
 *      They do NOT handle keyboard — Phaser keyboard listeners for Enter/Space
 *      are removed from Button instances in the Home.
 *
 *   2. HTML buttons (in #a11y-layer) handle KEYBOARD and SCREEN READER interactions.
 *      They are the single source of truth for Tab navigation, Enter, and Space.
 *      They are styled as transparent overlays, matching canvas button positions.
 *
 *   3. HTML buttons have `pointer-events: none` on the layer by default.
 *      Individual buttons get `pointer-events: auto` ONLY for keyboard/SR focus.
 *      Mouse/touch events pass through to the canvas via CSS.
 *      The HTML buttons use `onkeydown` (Enter/Space) but NOT `onclick` —
 *      this prevents pointer clicks from triggering both canvas and HTML actions.
 *
 *   4. Synchronization:
 *      - Positions are recalculated on resize using the canvas element's
 *        actual rendered size and position (getBoundingClientRect).
 *      - Buttons are destroyed and recreated when sub-state changes.
 *
 *   5. Focus management:
 *      - Tab navigation uses native browser behavior (no custom Tab interception).
 *      - Focus order follows DOM order (Play → How to play → Settings).
 *      - Focus ring is visible via CSS `:focus-visible`.
 *      - Phaser buttons show a matching visual focus ring when the paired
 *        HTML button receives focus (via focus/blur event listeners).
 *
 * Usage:
 *   const a11y = new HomeAccessibility(scene);
 *   a11y.createButtons(actions, layout);
 *   a11y.syncPositions(layout);   // call on resize
 *   a11y.destroy();               // call on sub-state exit / scene shutdown
 */

export interface A11yButtonDef {
  id: string;
  label: string;
  action: () => void;
  /** Called when the HTML button gains focus */
  onFocus?: () => void;
  /** Called when the HTML button loses focus */
  onBlur?: () => void;
}

export interface A11yButtonPosition {
  /** Center X in game coordinates */
  x: number;
  /** Center Y in game coordinates */
  y: number;
  /** Width in game coordinates */
  width: number;
  /** Height in game coordinates */
  height: number;
}

export class HomeAccessibility {
  private scene: Phaser.Scene;
  private layerEl: HTMLElement | null = null;
  private buttons: HTMLButtonElement[] = [];
  private positions: Map<string, A11yButtonPosition> = new Map();
  private destroyed = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.layerEl = document.getElementById('a11y-layer');
  }

  /**
   * Create accessible HTML buttons for the current sub-state.
   * Clears any previously created buttons first.
   */
  createButtons(defs: A11yButtonDef[], positions: Map<string, A11yButtonPosition>): void {
    if (this.destroyed || !this.layerEl) return;

    // Clear previous buttons
    this.clearButtons();

    this.positions = positions;

    // Add a screen-reader heading for context
    const heading = document.createElement('h2');
    heading.className = 'sr-only';
    heading.textContent = 'VitaBalance — Pantalla principal';
    heading.id = 'home-a11y-heading';
    this.layerEl.appendChild(heading);

    for (const def of defs) {
      const btn = document.createElement('button');
      btn.id = `a11y-btn-${def.id}`;
      btn.setAttribute('aria-label', def.label);
      btn.textContent = def.label; // For SR fallback
      btn.style.pointerEvents = 'auto';

      // Keyboard activation only — NOT click.
      // This prevents double-activation when pointer events also hit the canvas.
      btn.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          def.action();
        }
      });

      // Prevent click from triggering action (pointer goes to canvas)
      btn.addEventListener('click', (e: MouseEvent) => {
        // Only activate on click if it came from keyboard (detail === 0)
        if (e.detail === 0) {
          // Keyboard-triggered click (assistive tech) — allow
          def.action();
        }
        // Pointer-triggered click (detail > 0) — ignore, canvas handles it
      });

      // Focus/blur sync with Phaser visual
      if (def.onFocus) {
        btn.addEventListener('focus', def.onFocus);
      }
      if (def.onBlur) {
        btn.addEventListener('blur', def.onBlur);
      }

      this.layerEl.appendChild(btn);
      this.buttons.push(btn);
    }

    // Position buttons according to current layout
    this.syncPositions(positions);
  }

  /**
   * Update button positions to match the canvas layout.
   * Converts game coordinates to pixel positions relative to the a11y-layer
   * (which is a sibling of the canvas inside #game-container).
   */
  syncPositions(positions: Map<string, A11yButtonPosition>): void {
    if (this.destroyed || !this.layerEl) return;

    this.positions = positions;

    const canvas = this.scene.game.canvas;
    if (!canvas) return;

    // With Scale.FIT, the canvas may be smaller than the container due to
    // aspect ratio. We need the canvas's actual rendered size and its offset
    // within the container.
    const canvasRect = canvas.getBoundingClientRect();
    const layerRect = this.layerEl.getBoundingClientRect();

    // Offset of canvas relative to the a11y-layer
    const offsetX = canvasRect.left - layerRect.left;
    const offsetY = canvasRect.top - layerRect.top;

    const scaleX = canvasRect.width / this.scene.scale.width;
    const scaleY = canvasRect.height / this.scene.scale.height;

    this.buttons.forEach((btn) => {
      const id = btn.id.replace('a11y-btn-', '');
      const pos = positions.get(id);
      if (!pos) return;

      // Convert game coords to pixel coords relative to a11y-layer
      const pixelX = offsetX + pos.x * scaleX;
      const pixelY = offsetY + pos.y * scaleY;
      const pixelW = pos.width * scaleX;
      const pixelH = pos.height * scaleY;

      btn.style.left = `${pixelX - pixelW / 2}px`;
      btn.style.top = `${pixelY - pixelH / 2}px`;
      btn.style.width = `${Math.max(pixelW, 44)}px`;
      btn.style.height = `${Math.max(pixelH, 44)}px`;
    });
  }

  /**
   * Remove all HTML buttons from the layer. Called on sub-state exit.
   */
  clearButtons(): void {
    if (!this.layerEl) return;

    for (const btn of this.buttons) {
      btn.remove();
    }
    this.buttons = [];

    // Remove heading if present
    const heading = document.getElementById('home-a11y-heading');
    if (heading) heading.remove();
  }

  /**
   * Fully destroy: clear buttons and mark as destroyed.
   * Safe to call multiple times.
   */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.clearButtons();
    this.positions.clear();
  }

  /**
   * Whether this instance has been destroyed.
   */
  isDestroyed(): boolean {
    return this.destroyed;
  }
}
