// gadgets.js — the smoke veil: a thrown vial that blooms into a grey
// cloud for six seconds. Guards and cameras cannot see through smoke, and
// a burglar standing inside a cloud cannot be seen at all — the way to
// walk straight across a lit gallery, or to vanish mid-chase. Two veils
// per heist; spend them where a cone cannot be dodged.

export class SmokeField {
  constructor() {
    this.clouds = []; // {x, y, r, ttl}
  }

  throwAt(x, y) {
    this.clouds.push({ x, y, r: 78, ttl: 6, max: 6 });
  }

  update(dt) {
    for (const c of this.clouds) c.ttl -= dt;
    this.clouds = this.clouds.filter((c) => c.ttl > 0);
  }

  // Is the point inside any cloud?
  covers(px, py) {
    return this.clouds.some((c) => Math.hypot(px - c.x, py - c.y) < c.r);
  }

  // Does the segment (x0,y0)-(x1,y1) pass through any cloud? Sampled,
  // like line of sight: a cone that crosses smoke is blind past it.
  blocks(x0, y0, x1, y1) {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(dist / 8));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      if (this.covers(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return true;
    }
    return false;
  }

  draw(ctx) {
    for (const c of this.clouds) {
      // Fade out over the last 1.5 seconds so the veil's end is readable.
      const fade = Math.min(1, c.ttl / 1.5);
      const puffs = [
        [0, 0, 46], [-30, -14, 34], [30, -12, 32],
        [-26, 18, 30], [28, 16, 34], [0, -26, 28], [4, 26, 26],
      ];
      for (const [ox, oy, r] of puffs) {
        const g = ctx.createRadialGradient(c.x + ox, c.y + oy, 2, c.x + ox, c.y + oy, r);
        g.addColorStop(0, `rgba(190, 196, 205, ${0.55 * fade})`);
        g.addColorStop(1, 'rgba(190, 196, 205, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(c.x + ox, c.y + oy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      // A pale rim and a label, so the veil reads as a gadget, not fog.
      ctx.strokeStyle = `rgba(226, 232, 240, ${0.5 * fade})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = `rgba(8, 10, 18, ${0.85 * fade})`;
      ctx.strokeText('SMOKE', c.x, c.y - c.r - 6);
      ctx.fillStyle = `rgba(226, 232, 240, ${0.95 * fade})`;
      ctx.fillText('SMOKE', c.x, c.y - c.r - 6);
    }
  }
}
