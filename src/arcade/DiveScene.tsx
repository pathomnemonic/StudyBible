import { useEffect, useRef } from 'react';

/**
 * The pixel ocean behind Basilion: a column of water that gets darker the deeper you are, drawn at a very low resolution and scaled up so the pixels stay hard.
 * The camera follows `depth` (metres). Light rays and waves at the top, marine snow and creatures in the middle, sand and rocks at the trench floor (7,000 m).
 * Nothing here is needed to play: it is a picture. Under reduced motion it draws once per depth change and does not animate.
 */
export const FLOOR_M = 7000;
export interface Zone { name: string; from: number }
/** the standard layers of the ocean */
export const ZONES: Zone[] = [{ name: 'Sunlight zone', from: 0 }, { name: 'Twilight zone', from: 200 }, { name: 'Midnight zone', from: 1000 }, { name: 'Abyssal zone', from: 4000 }, { name: 'Hadal zone', from: 6000 }];
export const TITANIC_M = 3800;
export const zoneAt = (m: number) => [...ZONES].reverse().find((z) => m >= z.from) ?? ZONES[0];

const W = 108, H = 192, SURFACE_Y = 24, M_PER_PX = 14;
const STOPS: [number, [number, number, number]][] = [[0, [62, 208, 255]], [200, [30, 160, 230]], [1000, [18, 98, 184]], [4000, [11, 47, 114]], [6000, [7, 26, 70]], [7000, [4, 17, 46]]];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const colourAt = (m: number): [number, number, number] => {
  for (let i = 1; i < STOPS.length; i++) if (m <= STOPS[i][0]) { const [m0, c0] = STOPS[i - 1], [m1, c1] = STOPS[i]; const t = (m - m0) / (m1 - m0); return [c0[0] + (c1[0] - c0[0]) * t, c0[1] + (c1[1] - c0[1]) * t, c0[2] + (c1[2] - c0[2]) * t]; }
  return STOPS[STOPS.length - 1][1];
};
// a small yellow submarine, one character per pixel
const SUB = [
  '.......kk.........',
  '......kyyk....k...',
  '.....kyyyyk..kyk..',
  '..kkkkyyyyykkkyyk.',
  '.kyyyyyyyyyyyyyyyk',
  'kyywwyyywwyyywwyyk',
  'kyywbyyywbyyywbyyk',
  'kyyyyyyyyyyyyyyyyk',
  '.kyyyyyyyyyyyyyyk.',
  '..kkkkkkkkkkkkkk..',
];
const SUB_COL: Record<string, string> = { k: '#3a2a10', y: '#ffd23f', w: '#e8f6ff', b: '#3fa9ff' };
const CREATURES = ['fish', 'turtle', 'dolphin', 'whale', 'octopus', 'spiral-shell', 'anchor', 'key'];
const base = (import.meta as unknown as { env: { BASE_URL: string } }).env.BASE_URL;

interface Mob { img: string; d: number; x: number; v: number; s: number; flip: boolean }

export default function DiveScene({ depth, sub = true }: { depth: number; sub?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const target = useRef(0);
  target.current = Math.max(0, Math.min(FLOOR_M, depth));
  const showSub = useRef(sub);
  showSub.current = sub;

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'none';
    const imgs = new Map<string, HTMLImageElement>();
    for (const n of CREATURES) { const i = new Image(); i.src = `${base}arcade/pixel/${n}.png`; imgs.set(n, i); }
    let cam = target.current;
    let t = 0;
    // creatures drift across at fixed places in the water column, so the same ones are met again on the way back up
    const mobs: Mob[] = Array.from({ length: 46 }, (_, i) => {
      const r = (k: number) => { const x = Math.sin(i * 91.7 + k * 13.3) * 43758.5453; return x - Math.floor(x); };
      return { img: CREATURES[Math.floor(r(1) * (CREATURES.length - 2))], d: 120 + r(2) * (FLOOR_M - 400), x: r(3) * W, v: (r(4) < 0.5 ? -1 : 1) * (0.1 + r(5) * 0.35), s: 0.55 + r(6) * 0.5, flip: r(4) >= 0.5 };
    });
    const snow = Array.from({ length: 48 }, (_, i) => ({ x: (i * 37) % W, y: (i * 53) % H, sp: 0.15 + ((i * 7) % 5) * 0.05 }));
    const bubbles: { x: number; y: number; life: number }[] = [];
    const img = ctx.createImageData(W, H);
    let raf = 0;
    let last = 0;

    const draw = (time: number) => {
      const dt = Math.min(0.05, (time - last) / 1000 || 0.016); last = time;
      t += dt;
      const moving = Math.abs(target.current - cam) > 0.5;
      cam += (target.current - cam) * (still ? 1 : Math.min(1, dt * 1.6));
      // the water: banded colour with an ordered dither so the bands look like pixel art, not a smooth gradient
      const data = img.data;
      for (let y = 0; y < H; y++) {
        const m = cam + (y - SURFACE_Y) * M_PER_PX;
        for (let x = 0; x < W; x++) {
          const o = (y * W + x) * 4;
          if (m < 0) {
            // above the surface: sky
            const k = Math.max(0, 1 - y / SURFACE_Y); data[o] = 190 + 50 * k; data[o + 1] = 230 + 20 * k; data[o + 2] = 255; data[o + 3] = 255; continue;
          }
          const c = colourAt(m);
          const steps = 14;
          const th = BAYER[(y & 3) * 4 + (x & 3)] / 16;
          const q = (v: number) => Math.round((v / 255) * steps + th - 0.5) / steps * 255;
          let r = q(c[0]), g = q(c[1]), b = q(c[2]);
          if (m < 450) { // slanting rays of light that sway
            const ray = Math.sin((x + y * 0.6) * 0.45 + t * 0.6) * Math.sin((x - y * 0.4) * 0.17 + t * 0.2);
            if (ray > 0.62) { const k = (1 - m / 450) * 26; r += k; g += k; b += k; }
          }
          if (m > FLOOR_M - 90) { // sand
            const f = (m - (FLOOR_M - 90)) / 90; const sand = [214, 170, 100]; const mix = Math.max(0, f * 1.4 - 0.2);
            r = r + (sand[0] * 0.45 - r) * mix; g = g + (sand[1] * 0.4 - g) * mix; b = b + (sand[2] * 0.35 - b) * mix;
          }
          data[o] = Math.max(0, Math.min(255, r)); data[o + 1] = Math.max(0, Math.min(255, g)); data[o + 2] = Math.max(0, Math.min(255, b)); data[o + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;

      // waves along the surface
      const sy = SURFACE_Y - cam / M_PER_PX;
      if (sy > -6 && sy < H) {
        for (let x = 0; x < W; x++) {
          const wy = Math.round(sy + Math.sin(x * 0.35 + t * 2) * 1.4);
          ctx.fillStyle = '#e9fbff'; ctx.fillRect(x, wy, 1, 1);
          ctx.fillStyle = '#b8ecff'; ctx.fillRect(x, wy + 1, 1, 1);
        }
        // a sun in the corner
        ctx.fillStyle = '#fff3b0'; ctx.fillRect(W - 24, sy - 22, 10, 10); ctx.fillStyle = '#ffe27a'; ctx.fillRect(W - 22, sy - 20, 6, 6);
      }

      // the creatures: dimmer the deeper they are, and they turn to silhouettes in the dark
      for (const m of mobs) {
        m.x += m.v * (still ? 0 : dt * 22);
        if (m.x > W + 20) m.x = -20; if (m.x < -20) m.x = W + 20;
        const y = SURFACE_Y + (m.d - cam) / M_PER_PX;
        if (y < -20 || y > H + 20) continue;
        const sp = imgs.get(m.img); if (!sp || !sp.complete) continue;
        const size = Math.round(32 * m.s);
        ctx.globalAlpha = Math.max(0.25, 0.95 - m.d / 9000);
        ctx.save();
        if (m.flip) { ctx.translate(Math.round(m.x) + size, Math.round(y)); ctx.scale(-1, 1); ctx.drawImage(sp, 0, 0, size, size); } else ctx.drawImage(sp, Math.round(m.x), Math.round(y), size, size);
        ctx.restore();
        ctx.globalAlpha = 1;
      }
      // the Titanic, as a dark shape on the floor of its own depth
      const ty = SURFACE_Y + (TITANIC_M - cam) / M_PER_PX;
      if (ty > -20 && ty < H + 20) { ctx.globalAlpha = 0.55; ctx.fillStyle = '#05102a'; ctx.fillRect(W * 0.55, ty, 34, 6); ctx.fillRect(W * 0.55 + 4, ty - 6, 24, 6); ctx.fillRect(W * 0.55 + 10, ty - 12, 3, 6); ctx.fillRect(W * 0.55 + 18, ty - 12, 3, 6); ctx.globalAlpha = 1; }

      // marine snow
      if (cam > 150) {
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        for (const s of snow) { s.y -= (still ? 0 : dt * 10 * s.sp * 4) + (moving ? dt * 40 : 0); if (s.y < -2) { s.y = H + 2; s.x = (s.x * 13 + 7) % W; } ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1); }
      }
      // the sea floor
      const floorY = SURFACE_Y + (FLOOR_M - cam) / M_PER_PX;
      if (floorY < H) { ctx.fillStyle = '#2a2236'; for (let x = 0; x < W; x += 6) ctx.fillRect(x, Math.round(floorY + 4 + ((x * 7) % 5)), 6, H); ctx.fillStyle = '#4a3a50'; for (let x = 2; x < W; x += 11) ctx.fillRect(x, Math.round(floorY + 2 + ((x * 3) % 4)), 3, 2); }

      // the submarine, with a trail of bubbles
      const sx = Math.round(W / 2 - SUB[0].length / 2 + Math.sin(t * 1.3) * 1.5), sub_y = Math.round(SURFACE_Y + 5 + Math.sin(t * 1.9) * 1.2);
      if (showSub.current) SUB.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') { ctx.fillStyle = SUB_COL[ch]; ctx.fillRect(sx + i, sub_y + j, 1, 1); } }));
      if (showSub.current) { ctx.fillStyle = 'rgba(255,255,230,0.8)'; ctx.fillRect(sx - 2 - 4, sub_y + 5, 4, 2); } // the lamp
      if (showSub.current && !still && Math.random() < dt * 4) bubbles.push({ x: sx + 14 + Math.random() * 3, y: sub_y + 2, life: 0 });
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; b.y -= dt * 18; b.x += Math.sin(b.y) * 0.1; b.life += dt; if (b.life > 2.2) { bubbles.splice(i, 1); continue; } ctx.fillRect(Math.round(b.x), Math.round(b.y), 1, 1); }

      if (!still) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    // under reduced motion the picture is redrawn when the depth changes
    let watch = 0;
    if (still) watch = window.setInterval(() => { if (Math.abs(target.current - cam) > 0.5) draw(performance.now()); }, 300);
    return () => { cancelAnimationFrame(raf); window.clearInterval(watch); };
  }, []);

  return <canvas ref={ref} className="dive-scene" width={W} height={H} aria-hidden="true" />;
}
