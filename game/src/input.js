// input.js — keyboard and mouse state, read fresh every frame by the game.

export class Input {
  constructor(canvas) {
    this.up = false;
    this.down = false;
    this.left = false;
    this.right = false;
    this.run = false;
    this.sneak = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.clicked = null; // {x, y} in canvas pixels, consumed once per frame
    this.anyKey = null; // last key pressed, for menu shortcuts
    this._keys = new Set();

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      this._keys.add(e.code);
      this.anyKey = e.code;
      this.refresh();
    });
    window.addEventListener('keyup', (e) => {
      this._keys.delete(e.code);
      this.refresh();
    });
    window.addEventListener('blur', () => {
      this._keys.clear();
      this.refresh();
    });
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
      this.mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
    });
    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.clicked = {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
      };
    });
  }

  refresh() {
    const k = this._keys;
    this.up = k.has('KeyW') || k.has('ArrowUp');
    this.down = k.has('KeyS') || k.has('ArrowDown');
    this.left = k.has('KeyA') || k.has('ArrowLeft');
    this.right = k.has('KeyD') || k.has('ArrowRight');
    this.run = k.has('ShiftLeft') || k.has('ShiftRight');
    this.sneak = k.has('KeyC') || k.has('ControlLeft') || k.has('ControlRight');
  }

  takeClick() {
    const c = this.clicked;
    this.clicked = null;
    return c;
  }

  takeKey() {
    const k = this.anyKey;
    this.anyKey = null;
    return k;
  }
}
