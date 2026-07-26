/**
 * DomInput — Creates a real HTML input element overlaid on the Phaser canvas.
 *
 * This solves the problem of Phaser's keyboard capture not working reliably
 * for text input. A native <input> element allows proper typing, pasting,
 * selection, and works with mobile keyboards.
 *
 * The input is positioned relative to the game canvas using Phaser's scale manager.
 */
export class DomInput {
  private inputElement: HTMLInputElement;
  private scene: Phaser.Scene;

  constructor(
    scene: Phaser.Scene,
    options: {
      x: number;
      y: number;
      width: number;
      height: number;
      placeholder?: string;
      initialValue?: string;
      maxLength?: number;
    },
  ) {
    this.scene = scene;

    // Create the input element
    this.inputElement = document.createElement('input');
    this.inputElement.type = 'text';
    this.inputElement.maxLength = options.maxLength ?? 16;
    this.inputElement.value = options.initialValue ?? '';
    this.inputElement.placeholder = options.placeholder ?? '';
    this.inputElement.autocomplete = 'off';
    this.inputElement.spellcheck = false;

    // Style to match game aesthetic
    Object.assign(this.inputElement.style, {
      position: 'absolute',
      background: '#1a2a3a',
      border: '2px solid #4488ff',
      borderRadius: '8px',
      color: '#ffffff',
      fontFamily: 'Nunito, sans-serif',
      fontSize: '14px',
      textAlign: 'center',
      outline: 'none',
      padding: '0 8px',
      zIndex: '1000',
    });

    // Focus styles
    this.inputElement.addEventListener('focus', () => {
      this.inputElement.style.borderColor = '#66aaff';
      this.inputElement.style.boxShadow = '0 0 8px rgba(68, 136, 255, 0.4)';
    });
    this.inputElement.addEventListener('blur', () => {
      this.inputElement.style.borderColor = '#4488ff';
      this.inputElement.style.boxShadow = 'none';
    });

    // Only allow alphanumeric + spaces (matching game validation)
    this.inputElement.addEventListener('input', () => {
      this.inputElement.value = this.inputElement.value.replace(/[^a-zA-Z0-9 ]/g, '');
    });

    // Prevent Phaser from capturing keys while input is focused
    this.inputElement.addEventListener('keydown', (e) => {
      e.stopPropagation();
    });
    this.inputElement.addEventListener('keyup', (e) => {
      e.stopPropagation();
    });

    // Append to game container (parent of canvas)
    const parent = this.scene.game.canvas.parentElement;
    if (parent) {
      parent.style.position = 'relative';
      parent.appendChild(this.inputElement);
    }

    // Position the input over the canvas
    this.updatePosition(options.x, options.y, options.width, options.height);

    // Update position on resize
    this.scene.scale.on('resize', () => {
      this.updatePosition(options.x, options.y, options.width, options.height);
    });

    // Clean up when scene shuts down
    this.scene.events.on('shutdown', () => this.destroy());
    this.scene.events.on('destroy', () => this.destroy());
  }

  /**
   * Converts game coordinates to DOM pixel coordinates relative to the canvas parent.
   */
  private updatePosition(gameX: number, gameY: number, gameWidth: number, gameHeight: number): void {
    const canvas = this.scene.game.canvas;
    const canvasRect = canvas.getBoundingClientRect();
    const parentRect = canvas.parentElement?.getBoundingClientRect();

    if (!parentRect) return;

    // Calculate scale factor (game coords → screen pixels)
    const scaleX = canvasRect.width / this.scene.scale.width;
    const scaleY = canvasRect.height / this.scene.scale.height;

    // Canvas offset within parent
    const offsetX = canvasRect.left - parentRect.left;
    const offsetY = canvasRect.top - parentRect.top;

    // Convert game coordinates to pixel position (centered origin)
    const pixelX = offsetX + (gameX - gameWidth / 2) * scaleX;
    const pixelY = offsetY + gameY * scaleY;
    const pixelWidth = gameWidth * scaleX;
    const pixelHeight = gameHeight * scaleY;

    Object.assign(this.inputElement.style, {
      left: `${pixelX}px`,
      top: `${pixelY}px`,
      width: `${pixelWidth}px`,
      height: `${pixelHeight}px`,
      fontSize: `${Math.max(12, 14 * scaleY)}px`,
    });
  }

  /**
   * Gets the current trimmed value of the input.
   */
  getValue(): string {
    return this.inputElement.value.trim();
  }

  /**
   * Sets the input value programmatically.
   */
  setValue(value: string): void {
    this.inputElement.value = value;
  }

  /**
   * Removes the DOM element and cleans up event listeners.
   */
  destroy(): void {
    if (this.inputElement.parentElement) {
      this.inputElement.parentElement.removeChild(this.inputElement);
    }
  }
}
