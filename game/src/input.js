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
    this.clickedRight = null; // right-click: throw a coin lure instead
    this.coinKey = false; // X pressed: throw a coin lure at the mouse
    this.smokeKey = false; // Q pressed: throw a smoke veil at the mouse
    this.dashKey = false; // E pressed: shadow dash, a silent burst forward
    this.anyKey = null; // last key pressed, for menu shortcuts
    this._keys = new Set();

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      this._keys.add(e.code);
      this.anyKey = e.code;
      if (e.code === 'KeyX') this.coinKey = true;
      if (e.code === 'KeyQ') this.smokeKey = true;
      if (e.code === 'KeyE') this.dashKey = true;
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
      const at = {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
      };
      if (e.button === 2) this.clickedRight = at;
      else this.clicked = at;
    });
    // Right-click is a game action, not a menu.
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
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

  takeRightClick() {
    const c = this.clickedRight;
    this.clickedRight = null;
    return c;
  }

  takeCoinKey() {
    const k = this.coinKey;
    this.coinKey = false;
    return k;
  }

  takeSmokeKey() {
    const k = this.smokeKey;
    this.smokeKey = false;
    return k;
  }

  takeDashKey() {
    const k = this.dashKey;
    this.dashKey = false;
    return k;
  }

  takeKey() {
    const k = this.anyKey;
    this.anyKey = null;
    return k;
  }
}
