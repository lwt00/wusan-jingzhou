/* Continuous procedural cloud banks. No downloaded textures or GPU dependency. */
class CloudFog {
  constructor(container) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'cloud-canvas';
    this.canvas.width = 480;
    this.canvas.height = 600;
    container.append(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.mask = document.createElement('canvas');
    this.mask.width = 544; this.mask.height = 664;
    this.maskCtx = this.mask.getContext('2d');
    this.current = Array(20).fill(1);
    this.target = Array(20).fill(1);
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
    this.texture = this.makeTexture();
    this.pattern = this.ctx.createPattern(this.texture, 'repeat');
    this.last = 0; this.time = 0; this.frame = null;
    this.paused = false; this.maskDirty = true;
    this.tick = this.tick.bind(this);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stop(); else this.wake();
    });
    this.reduced.addEventListener('change', () => this.wake());
    this.wake();
  }

  makeTexture() {
    const size = 384;
    const texture = document.createElement('canvas');
    texture.width = texture.height = size;
    const context = texture.getContext('2d');
    const pixels = context.createImageData(size, size);
    let seed = 73921;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const lattices = [4, 8, 16, 32, 64].map(n => ({ n, values: Float32Array.from({ length: n * n }, random) }));
    const smooth = x => x * x * (3 - 2 * x);
    const noise = (x, y, layer) => {
      const { n, values } = layer;
      x = ((x % 1) + 1) % 1 * n; y = ((y % 1) + 1) % 1 * n;
      const ix = Math.floor(x), iy = Math.floor(y), tx = smooth(x - ix), ty = smooth(y - iy);
      const a = values[iy * n + ix], b = values[iy * n + (ix + 1) % n];
      const c = values[((iy + 1) % n) * n + ix], d = values[((iy + 1) % n) * n + (ix + 1) % n];
      return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
    };
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      // Warp the cloud contours so no circular puffs or rectangular tiles remain.
      const wx = u + .16 * noise(u + .3, v, lattices[1]);
      const wy = v + .19 * noise(u, v + .6, lattices[1]);
      let density = 0, weight = .53;
      for (const layer of lattices) { density += noise(wx, wy, layer) * weight; weight *= .5; }
      const billow = smooth(Math.max(0, Math.min(1, (density - .24) / .46)));
      const light = Math.min(1, billow * .78 + noise(wx, wy - .025, lattices[2]) * .22);
      const i = (y * size + x) * 4;
      pixels.data[i] = 184 + 58 * light;
      pixels.data[i + 1] = 199 + 46 * light;
      pixels.data[i + 2] = 187 + 49 * light;
      pixels.data[i + 3] = Math.round(255 * billow * .96);
    }
    context.putImageData(pixels, 0, 0);
    return texture;
  }

  update(revealed, paused) {
    this.target = this.target.map((_, i) => revealed.has(i) ? 0 : 1);
    this.paused = paused;
    if (paused) this.stop(); else this.wake();
  }

  stop() {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null; this.last = 0;
  }

  wake() {
    if (!this.paused && !document.hidden && this.frame === null) this.frame = requestAnimationFrame(this.tick);
  }

  tick(now) {
    this.frame = null;
    if (document.hidden || this.paused) { this.last = 0; return; }
    if (this.last && now - this.last < 40) { this.wake(); return; }
    const dt = this.last ? Math.min((now - this.last) / 1000, .1) : .04;
    this.last = now;
    if (!this.reduced.matches) this.time += dt;
    let transitioning = false;
    for (let i = 0; i < 20; i++) {
      const delta = this.target[i] - this.current[i];
      if (Math.abs(delta) > .002) {
        this.current[i] += delta * Math.min(1, dt * 3.2);
        transitioning = true; this.maskDirty = true;
      } else if (this.current[i] !== this.target[i]) {
        this.current[i] = this.target[i]; this.maskDirty = true;
      }
    }
    this.draw();
    const hasCloud = this.current.some(value => value > 0);
    if (transitioning || (hasCloud && !this.reduced.matches)) this.wake(); else this.last = 0;
  }

  draw() {
    const ctx = this.ctx, t = this.time;
    ctx.clearRect(0, 0, 480, 600);
    if (!this.current.some(value => value > 0)) return;
    // Broad, slow banks and a finer counter-drifting layer provide depth.
    const layers = [
      { scale: 1.85, x: t * 5, y: 38 + Math.sin(t / 18) * 14, alpha: .94 },
      { scale: 1.2, x: 143 - t * 3.1, y: 193 + t * 1.4, alpha: .72 },
      { scale: .74, x: 62 + t * 1.9, y: 310 - t * 1.1, alpha: .23 }
    ];
    for (const layer of layers) {
      ctx.save();
      ctx.globalAlpha = layer.alpha;
      this.pattern.setTransform(new DOMMatrix().translate(layer.x, layer.y).scale(layer.scale));
      ctx.fillStyle = this.pattern; ctx.fillRect(0, 0, 480, 600);
      ctx.restore();
    }
    if (this.maskDirty) {
      const m = this.maskCtx;
      m.clearRect(0, 0, 544, 664);
      for (let i = 0; i < 20; i++) {
        if (!this.current[i]) continue;
        const x = i % 4, y = Math.floor(i / 4);
        // Extend exterior cells beyond the canvas, preserving cloud at board edges.
        m.fillStyle = `rgba(255,255,255,${this.current[i]})`;
        m.fillRect(32 + x * 120 - (x === 0 ? 32 : 0), 32 + y * 120 - (y === 0 ? 32 : 0),
          120 + (x === 0 || x === 3 ? 32 : 0), 120 + (y === 0 || y === 4 ? 32 : 0));
      }
      this.maskDirty = false;
    }
    // A feathered reveal acts on the whole cloud field, never on individual tiles.
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in'; ctx.filter = 'blur(13px)';
    ctx.drawImage(this.mask, -32, -32); ctx.restore();
  }
}
