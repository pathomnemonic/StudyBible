import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/**
 * The 3D basilica behind Basilion (three.js, already used by the galaxy). Everything is built here from boxes, cylinders and lathes and textured with images drawn
 * on a canvas, so there are no model or image files and it works offline. A camera climbs a path up the building as `progress` goes from 0 (the piazza) to 1 (the
 * Cross), through a sky that turns from dusk to gold, with bloom on the lit windows, drifting clouds, doves and rays of light. It is only a picture.
 */
const tex = (draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number, srgb = true) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
};
const rnd = (seed: number) => { let s = seed; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; };

const stoneTexture = () => tex((g, w, h) => {
  const r = rnd(7);
  g.fillStyle = '#efe0c0'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { const a = r() * 0.1; g.fillStyle = `rgba(${r() < 0.5 ? '90,66,34' : '255,248,225'},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); }
  g.strokeStyle = 'rgba(110,84,50,0.22)'; g.lineWidth = 1.2;
  for (let y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); for (let x = ((y / 32) % 2) * 64; x < w; x += 128) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke(); } }
}, 512, 512);
const glowTex = (inner: string, mid: string) => tex((g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, inner); gr.addColorStop(0.25, mid); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, 256, 256);
const cloudTex = () => tex((g, w, h) => { const r = rnd(11); for (let i = 0; i < 34; i++) { const x = w * (0.2 + r() * 0.6), y = h * (0.45 + r() * 0.15), rad = 24 + r() * 46; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); } }, 512, 256);
const raysTex = () => tex((g, w, h) => {
  g.translate(w / 2, h / 2);
  for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2 + (i % 3) * 0.04, wdt = 0.05 + (i % 4) * 0.025; g.fillStyle = `rgba(255,244,200,${0.1 + (i % 5) * 0.045})`; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, w / 2, a, a + wdt); g.closePath(); g.fill(); }
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, w / 2); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = gr; g.fillRect(-w / 2, -h / 2, w, h);
}, 1024, 1024);
const archWindowTex = (glow = true) => tex((g, w, h) => {
  g.fillStyle = '#2a1a0d'; g.fillRect(0, 0, w, h);
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, glow ? '#ffd27a' : '#6b3a1d'); gr.addColorStop(1, glow ? '#ff9a3b' : '#3b1f0e');
  g.fillStyle = gr; g.beginPath(); g.moveTo(8, h - 6); g.lineTo(8, w / 2 + 8); g.arc(w / 2, w / 2 + 8, w / 2 - 8, Math.PI, 0); g.lineTo(w - 8, h - 6); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(60,36,12,0.85)'; g.lineWidth = 4; g.beginPath(); g.moveTo(w / 2, 14); g.lineTo(w / 2, h - 6); g.moveTo(8, h * 0.52); g.lineTo(w - 8, h * 0.52); g.stroke();
}, 128, 256);
const roseTex = () => tex((g, w, h) => {
  const cx = w / 2, cy = h / 2, R = w * 0.46, cols = ['#b3202f', '#1f4e9c', '#e7a21b', '#1f8a5b', '#7a2a8c', '#d4531e'];
  g.fillStyle = '#e6b43c'; g.beginPath(); g.arc(cx, cy, R + 14, 0, Math.PI * 2); g.fill(); g.fillStyle = '#241b3a'; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
  for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 12; i++) {
    const a0 = (i / 12) * Math.PI * 2, a1 = ((i + 1) / 12) * Math.PI * 2, r0 = ring ? R * 0.18 : R * 0.55, r1 = ring ? R * 0.55 : R * 0.97;
    g.fillStyle = cols[(i + ring * 2) % cols.length]; g.beginPath(); g.arc(cx, cy, r1, a0 + 0.02, a1 - 0.02); g.arc(cx, cy, r0, a1 - 0.02, a0 + 0.02, true); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,236,168,0.45)'; g.beginPath(); g.arc(cx, cy, (r0 + r1) / 2, a0 + 0.1, a1 - 0.1); g.lineTo(cx, cy); g.fill();
  }
  g.strokeStyle = '#2b2013'; g.lineWidth = 5; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * R * 0.18, cy + Math.sin(a) * R * 0.18); g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.stroke(); }
  g.beginPath(); g.arc(cx, cy, R * 0.55, 0, Math.PI * 2); g.stroke(); g.fillStyle = '#f1cf6b'; g.beginPath(); g.arc(cx, cy, R * 0.18, 0, Math.PI * 2); g.fill(); g.stroke();
}, 512, 512);
const doveTex = () => tex((g, w, h) => {
  g.translate(w / 2, h / 2); g.fillStyle = '#fffaf0'; g.shadowColor = 'rgba(255,230,160,0.9)'; g.shadowBlur = 14;
  g.beginPath(); g.moveTo(-8, 4); g.quadraticCurveTo(-30, -26, -52, -8); g.quadraticCurveTo(-30, -6, -18, 8); g.quadraticCurveTo(-4, 16, 14, 6); g.quadraticCurveTo(30, -2, 40, 2); g.quadraticCurveTo(26, 14, 8, 16); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(-8, 4); g.quadraticCurveTo(0, -34, 26, -30); g.quadraticCurveTo(10, -12, 8, 6); g.closePath(); g.fill();
}, 128, 96);

const sm = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/** the colour of the sky at the horizon for a height of the climb, the same ramp the sky shader uses, so the fog melts into it */
const horizon = (p: number) => {
  const h = 0.02, c = (r: number, g: number, b: number) => new THREE.Color(r, g, b), m = (x: THREE.Color, y: THREE.Color, t: number) => x.clone().lerp(y, t);
  const night = m(c(0.07, 0.05, 0.2), c(0.17, 0.12, 0.38), sm(-0.1, 0.6, h)), dusk = m(c(0.95, 0.5, 0.35), c(0.35, 0.2, 0.55), sm(0, 0.7, h)), gold = m(c(1, 0.85, 0.55), c(0.62, 0.74, 0.98), sm(0.05, 0.9, h)), holy = m(c(1, 0.97, 0.86), c(0.8, 0.88, 1), sm(0, 0.9, h));
  let out = m(night, dusk, sm(0, 0.25, p)); out = m(out, gold, sm(0.25, 0.62, p)); return m(out, holy, sm(0.62, 1, p)).convertSRGBToLinear();
};

export class BasilicaScene3D {
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(48, 1, 0.5, 3200);
  private clock = new THREE.Clock();
  private raf = 0;
  private disposed = false;
  private target = 0;
  private cur = 0;
  private still: boolean;
  private path: { pos: THREE.CatmullRomCurve3; look: THREE.CatmullRomCurve3 };
  private skyMat: THREE.ShaderMaterial;
  private fog: THREE.FogExp2;
  private sun: THREE.Sprite;
  private rays: THREE.Sprite;
  private stars: THREE.Points;
  private dust: THREE.Points;
  private clouds: THREE.Sprite[] = [];
  private doves: { s: THREE.Sprite; r: number; h: number; a: number; v: number }[] = [];
  private windows: THREE.MeshBasicMaterial[] = [];
  private cross: THREE.Group;
  private halo: THREE.Sprite;
  private dir: THREE.DirectionalLight;
  private hemi: THREE.HemisphereLight;
  private textures: THREE.Texture[] = [];
  private bloom: UnrealBloomPass;
  private top = 120;

  constructor(private canvas: HTMLCanvasElement, still: boolean) {
    this.still = still;
    const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !coarse, powerPreference: 'high-performance', alpha: false });
    this.renderer.setPixelRatio(Math.min(coarse ? 1.5 : 2, devicePixelRatio || 1));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const T = <X extends THREE.Texture>(t: X) => { this.textures.push(t); return t; };

    /* sky: a big inside-out sphere whose gradient follows the climb */
    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uP: { value: 0 } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `varying vec3 vP; uniform float uP;
        vec3 ramp(float h, float p){
          vec3 night = mix(vec3(0.07,0.05,0.2), vec3(0.17,0.12,0.38), smoothstep(-0.1,0.6,h));
          vec3 dusk  = mix(vec3(0.95,0.5,0.35), vec3(0.35,0.2,0.55), smoothstep(0.0,0.7,h));
          vec3 gold  = mix(vec3(1.0,0.85,0.55), vec3(0.62,0.74,0.98), smoothstep(0.05,0.9,h));
          vec3 holy  = mix(vec3(1.0,0.97,0.86), vec3(0.8,0.88,1.0), smoothstep(0.0,0.9,h));
          vec3 c = mix(night, dusk, smoothstep(0.0,0.25,p));
          c = mix(c, gold, smoothstep(0.25,0.62,p));
          return mix(c, holy, smoothstep(0.62,1.0,p));
        }
        void main(){ float h = clamp(vP.y, 0.0, 1.0); gl_FragColor = vec4(ramp(h, uP), 1.0); }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(2800, 32, 24), this.skyMat); sky.renderOrder = -10; this.scene.add(sky);
    this.fog = new THREE.FogExp2(0xc78aa0, 0.0021); this.scene.fog = this.fog;

    /* lights */
    this.hemi = new THREE.HemisphereLight(0xffe2c4, 0x5a4660, 0.9); this.scene.add(this.hemi);
    this.dir = new THREE.DirectionalLight(0xffd9a0, 2.6); this.dir.position.set(-60, 170, 130); this.dir.target.position.set(0, 120, 0);
    this.dir.castShadow = true; this.dir.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
    Object.assign(this.dir.shadow.camera, { left: -90, right: 90, top: 330, bottom: -20, near: 10, far: 700 }); this.dir.shadow.bias = -0.0006; this.dir.shadow.normalBias = 0.4;
    this.scene.add(this.dir, this.dir.target);

    /* materials */
    const stoneMap = T(stoneTexture()); stoneMap.wrapS = stoneMap.wrapT = THREE.RepeatWrapping;
    const stone = new THREE.MeshStandardMaterial({ color: 0xf7ecd2, map: stoneMap, roughness: 0.9, metalness: 0 });
    const trim = new THREE.MeshStandardMaterial({ color: 0xe9d6ac, roughness: 0.75 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xe6b43c, metalness: 0.8, roughness: 0.48, emissive: 0x4a2c04, emissiveIntensity: 0.12 });
    const lead = new THREE.MeshStandardMaterial({ color: 0x78aa9c, metalness: 0.55, roughness: 0.42 });
    const glow = (c: number) => { const m = new THREE.MeshBasicMaterial({ color: c, toneMapped: false }); this.windows.push(m); return m; };
    const stoneAt = (rx: number, ry: number) => { const m = stone.clone(); m.map = stoneMap.clone(); m.map.wrapS = m.map.wrapT = THREE.RepeatWrapping; m.map.repeat.set(rx, ry); m.map.needsUpdate = true; this.textures.push(m.map); return m; };
    const add = (g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, cast = true) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = cast; o.receiveShadow = true; this.scene.add(o); return o; };
    const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);

    /* the piazza and the steps */
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(2600, 64), new THREE.MeshStandardMaterial({ color: 0xe3d5b5, roughness: 1, map: (() => { const t = T(stoneTexture()); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(70, 70); return t; })() }));
    plaza.rotation.x = -Math.PI / 2; plaza.receiveShadow = true; this.scene.add(plaza);
    for (let i = 0; i < 6; i++) add(box(74 + (5 - i) * 4, 0.55, 14 + (5 - i) * 2.2), trim, 0, 0.28 + i * 0.55, 22 - (5 - i) * 1.2);

    /* the portico: a row of fluted columns in front of the three doors */
    const base0 = 3.3, porH = 21;
    add(box(66, porH, 16), stoneAt(6, 2), 0, base0 + porH / 2, 0);
    const colGeo = new THREE.CylinderGeometry(1.25, 1.4, porH - 3, 20);
    for (let i = 0; i < 11; i++) { const x = -30 + i * 6; add(colGeo, trim, x, base0 + (porH - 3) / 2 + 0.4, 9.2); add(box(3.6, 0.9, 3.6), trim, x, base0 + 0.45, 9.2); add(box(3.6, 1.1, 3.6), trim, x, base0 + porH - 1.8, 9.2); }
    add(box(68, 3.2, 19), trim, 0, base0 + porH + 0.2, 0.4); add(box(70, 0.7, 20), gold, 0, base0 + porH + 1.9, 0.4);
    const doorTex = T(archWindowTex(false));
    for (const [x, w, h] of [[-19, 6, 11], [0, 9, 15], [19, 6, 11]] as const) {
      const door = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: doorTex, roughness: 0.6, emissive: 0x2a1204, emissiveIntensity: 0.4 })); door.position.set(x, base0 + h / 2, 8.1); this.scene.add(door);
      add(box(w + 1.2, 0.8, 0.8), gold, x, base0 + h + 0.4, 8.2, false);
    }

    /* the loggias: a tall stack of storeys, each with seven arched windows that glow; a rose window on the first and the last */
    const logH = 17, TIERS = 9; let logY = base0 + porH + 3.6;
    const win = T(archWindowTex(true));
    for (let t = 0; t < TIERS; t++) {
      const wd = 60 - t * 0.8;
      add(box(wd, logH, 13), stoneAt(5, 2), 0, logY + logH / 2, -1);
      for (let i = 0; i < 7; i++) {
        const x = -24 + i * 8; if (i === 3 && (t === 0 || t === TIERS - 1)) continue;
        const w = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 9.4), new THREE.MeshBasicMaterial({ map: win, toneMapped: false })); w.position.set(x, logY + 8.4, 5.6); this.scene.add(w); this.windows.push(w.material as THREE.MeshBasicMaterial);
        add(new THREE.ConeGeometry(3.4, 1.8, 3), trim, x, logY + 14, 5.7, false); add(box(5.2, 0.6, 1.2), trim, x, logY + 3.3, 6, false);
      }
      for (let i = 0; i < 8; i++) add(box(1.4, logH - 1, 1.2), trim, -28 + i * 8, logY + logH / 2, 5.9);
      if (t === 0 || t === TIERS - 1) {
        const rose = new THREE.Mesh(new THREE.CircleGeometry(5.6, 48), new THREE.MeshBasicMaterial({ map: T(roseTex()), transparent: true, toneMapped: false })); rose.position.set(0, logY + 9, 5.75); this.scene.add(rose);
        add(new THREE.TorusGeometry(5.7, 0.42, 8, 48), gold, 0, logY + 9, 5.8, false);
      }
      add(box(wd + 2, 1.6, 15), trim, 0, logY + logH + 0.6, -0.4);
      if (t < TIERS - 1) { add(box(wd + 2.4, 0.5, 15.4), gold, 0, logY + logH + 1.5, -0.4, false); logY += logH + 1.6; }
    }

    /* the attic: a balustrade and the saints who stand on it, Christ in the middle */
    const atY = logY + logH + 1.4;
    add(box(60, 6, 12), stoneAt(5, 1), 0, atY + 3, -1);
    const post = new THREE.CylinderGeometry(0.22, 0.3, 2.2, 8);
    for (let i = 0; i < 61; i++) add(post, trim, -30 + i, atY + 7.1, 5.6, false);
    add(box(62, 0.55, 1.1), trim, 0, atY + 8.4, 5.6, false);
    const figure = (h: number) => { const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.1, h * 0.17, h * 0.72, 10), trim); body.position.y = h * 0.36; const head = new THREE.Mesh(new THREE.SphereGeometry(h * 0.085, 12, 10), trim); head.position.y = h * 0.8;
      const halo = new THREE.Mesh(new THREE.TorusGeometry(h * 0.12, h * 0.012, 6, 20), gold); halo.position.y = h * 0.96; halo.rotation.x = Math.PI / 2.2; [body, head].forEach((m) => { m.castShadow = true; }); g.add(body, head, halo); return g; };
    for (let i = 0; i < 13; i++) { const f = figure(i === 6 ? 8.4 : 6.2); f.position.set(-27.6 + i * 4.6, atY + 8.6, 5.6); this.scene.add(f); }

    /* the dome: drum with paired columns and glowing windows, a ribbed lead dome, a lantern, a ball and a cross */
    const drumY = atY + 6, drumR = 15, drumH = 24, dz = -8;
    add(new THREE.CylinderGeometry(drumR, drumR + 0.6, drumH, 48), stoneAt(8, 1.6), 0, drumY + drumH / 2, dz);
    const dcol = new THREE.CylinderGeometry(0.55, 0.65, drumH - 4, 10);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; const z = dz + Math.cos(a) * (drumR + 0.5); if (z < dz - 6) continue;
      for (const o of [-0.35, 0.35]) add(dcol, trim, Math.sin(a + o * 0.12) * (drumR + 0.5), drumY + drumH / 2 - 0.4, dz + Math.cos(a + o * 0.12) * (drumR + 0.5));
      const w = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 7), new THREE.MeshBasicMaterial({ map: win, toneMapped: false })); const aa = a + Math.PI / 16; w.position.set(Math.sin(aa) * (drumR + 0.55), drumY + 10, dz + Math.cos(aa) * (drumR + 0.55)); w.rotation.y = aa; this.scene.add(w); this.windows.push(w.material as THREE.MeshBasicMaterial); }
    add(new THREE.TorusGeometry(drumR + 0.4, 0.5, 8, 64), gold, 0, drumY + drumH, dz, false).rotation.x = Math.PI / 2;
    add(new THREE.TorusGeometry(drumR + 0.5, 0.45, 8, 64), gold, 0, drumY + 0.5, dz, false).rotation.x = Math.PI / 2;
    const prof: THREE.Vector2[] = []; const DR = drumR - 0.2, DH = 19;
    for (let i = 0; i <= 28; i++) { const t = (i / 28) * (Math.PI / 2); prof.push(new THREE.Vector2(Math.cos(t) * DR, Math.sin(Math.pow(t / (Math.PI / 2), 0.92) * (Math.PI / 2)) * DH)); }
    const domeY = drumY + drumH;
    add(new THREE.LatheGeometry(prof, 64), lead, 0, domeY, dz);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; const pts = prof.map((p) => new THREE.Vector3(Math.sin(a) * (p.x + 0.12), p.y, Math.cos(a) * (p.x + 0.12))); const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.22, 6), gold); tube.position.set(0, domeY, dz); tube.castShadow = true; this.scene.add(tube); }
    for (const yy of [5, 10.5, 14.5]) { const rg = new THREE.Mesh(new THREE.TorusGeometry(DR * Math.sqrt(1 - (yy / DH) ** 2) * 1.01, 0.2, 6, 64), gold); rg.rotation.x = Math.PI / 2; rg.position.set(0, domeY + yy, dz); this.scene.add(rg); }
    const lanY = domeY + DH - 0.4;
    add(new THREE.CylinderGeometry(3.4, 3.8, 8, 16), stoneAt(3, 1), 0, lanY + 4, dz);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; add(new THREE.CylinderGeometry(0.3, 0.34, 7, 8), trim, Math.sin(a) * 3.6, lanY + 4, dz + Math.cos(a) * 3.6, false); const w = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 4.4), new THREE.MeshBasicMaterial({ map: win, toneMapped: false })); const aa = a + Math.PI / 8; w.position.set(Math.sin(aa) * 3.5, lanY + 4, dz + Math.cos(aa) * 3.5); w.rotation.y = aa; this.scene.add(w); this.windows.push(w.material as THREE.MeshBasicMaterial); }
    add(new THREE.TorusGeometry(3.9, 0.35, 8, 32), gold, 0, lanY + 8.2, dz, false).rotation.x = Math.PI / 2;
    const cap: THREE.Vector2[] = []; for (let i = 0; i <= 12; i++) { const t = (i / 12) * (Math.PI / 2); cap.push(new THREE.Vector2(Math.cos(t) * 3.5, Math.sin(t) * 3.6)); }
    add(new THREE.LatheGeometry(cap, 24), lead, 0, lanY + 8.2, dz);
    this.cross = new THREE.Group(); this.cross.position.set(0, lanY + 12, dz);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(1.05, 20, 16), gold); ball.castShadow = true; this.cross.add(ball);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.42, 7, 0.42), gold); bar.position.y = 4.6; const arm = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.42, 0.42), gold); arm.position.y = 6.2; this.cross.add(bar, arm); this.scene.add(this.cross);
    this.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: T(glowTex('rgba(255,250,215,0.95)', 'rgba(255,214,120,0.45)')), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false })); this.halo.scale.set(46, 46, 1); this.halo.position.set(0, lanY + 15, dz + 1); this.scene.add(this.halo);

    /* the flanks: two small domes and the long roof of the nave behind */
    for (const sx of [-1, 1]) {
      const bx = sx * 33; add(box(14, 10, 14), stoneAt(2, 1), bx, base0 + 24, -2);
      const sp: THREE.Vector2[] = []; for (let i = 0; i <= 16; i++) { const t = (i / 16) * (Math.PI / 2); sp.push(new THREE.Vector2(Math.cos(t) * 6, Math.sin(t) * 7)); }
      add(new THREE.LatheGeometry(sp, 32), lead, bx, base0 + 29, -2); add(new THREE.SphereGeometry(0.6, 12, 10), gold, bx, base0 + 36.4, -2); add(box(0.25, 2.6, 0.25), gold, bx, base0 + 38, -2, false);
    }
    add(box(46, 30, 84), stoneAt(8, 4), 0, 28, -58);
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(26, 26, 84, 3).rotateX(-Math.PI / 2), lead); roof.position.set(0, 56, -58); roof.castShadow = true; roof.receiveShadow = true; this.scene.add(roof);

    this.top = lanY + 24;

    /* sun, rays, stars, clouds, doves and dust */
    this.sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: T(glowTex('rgba(255,248,210,1)', 'rgba(255,190,110,0.55)')), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
    this.sun.scale.set(520, 520, 1); this.sun.position.set(-40, 20, -700); this.scene.add(this.sun);
    this.rays = new THREE.Sprite(new THREE.SpriteMaterial({ map: T(raysTex()), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0, fog: false })); this.rays.scale.set(1500, 1500, 1); this.rays.position.copy(this.sun.position).add(new THREE.Vector3(0, 0, 40)); this.scene.add(this.rays);
    const sp = new Float32Array(420 * 3); const r = rnd(5); for (let i = 0; i < 420; i++) { const th = r() * Math.PI * 2, ph = Math.acos(0.15 + r() * 0.85); sp.set([Math.sin(ph) * Math.cos(th) * 2600, Math.cos(ph) * 2600, Math.sin(ph) * Math.sin(th) * 2600], i * 3); }
    const dotT = T(glowTex('rgba(255,250,225,1)', 'rgba(255,230,160,0.35)'));
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xfff3cf, map: dotT, size: 7, sizeAttenuation: false, transparent: true, opacity: 0.9, depthWrite: false, fog: false })); this.scene.add(this.stars);
    const cT = T(cloudTex());
    for (let i = 0; i < 16; i++) { const c = new THREE.Sprite(new THREE.SpriteMaterial({ map: cT, transparent: true, opacity: 0.55 + r() * 0.3, depthWrite: false, color: 0xffe6d2 })); const s = 80 + r() * 140; c.scale.set(s * 2, s, 1); c.position.set((r() - 0.5) * 520, 10 + r() * (this.top + 60), -150 - r() * 520); (c as THREE.Sprite & { vx: number }).vx = 0.6 + r() * 1.6; this.clouds.push(c); this.scene.add(c); }
    const dT = T(doveTex());
    for (let i = 0; i < 9; i++) { const d = new THREE.Sprite(new THREE.SpriteMaterial({ map: dT, transparent: true, depthWrite: false, fog: false })); d.scale.set(3.4, 2.5, 1); this.scene.add(d); this.doves.push({ s: d, r: 24 + r() * 30, h: 22 + r() * (this.top - 20), a: r() * 6.28, v: (0.12 + r() * 0.2) * (i % 2 ? 1 : -1) }); }
    const dp = new Float32Array(320 * 3); for (let i = 0; i < 320; i++) dp.set([(r() - 0.5) * 120, r() * this.top, 8 + r() * 50], i * 3);
    const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3)); this.dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xffe9a8, map: dotT, size: 1.3, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })); this.scene.add(this.dust);

    /* the climb: a smooth path for the camera and for what it looks at */
    {
      const top = this.top, n = 12, posPts: THREE.Vector3[] = [], lookPts: THREE.Vector3[] = [];
      for (let i = 0; i <= n; i++) { const t = i / n, y = 8 + t * (top - 26), sway = Math.sin(t * 7.5) * 20 * (1 - t * 0.3); posPts.push(new THREE.Vector3(sway, y, 112 + Math.sin(t * 3) * 6 + t * 10)); lookPts.push(new THREE.Vector3(0, y + 14 + t * 6, -6 * t)); }
      this.path = { pos: new THREE.CatmullRomCurve3(posPts), look: new THREE.CatmullRomCurve3(lookPts) };
    }

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.4, 0.55, 0.92); this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.resize();
    this.apply(0);
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  setProgress(p: number) { this.target = Math.max(0, Math.min(1, p)); if (this.still) this.frame(0.016, true); }

  resize() {
    const w = this.canvas.clientWidth || innerWidth, h = this.canvas.clientHeight || innerHeight;
    this.renderer.setSize(w, h, false); this.composer.setSize(w, h);
    this.camera.aspect = w / h; this.camera.fov = h > w ? 58 : 46; this.camera.updateProjectionMatrix();
  }

  private apply(p: number) {
    this.skyMat.uniforms.uP.value = p;
    this.fog.color.copy(horizon(p)); this.fog.density = 0.0021 - p * 0.0011;
    this.hemi.intensity = 0.75 + p * 0.25; this.dir.intensity = 2.3 + p * 0.5; this.dir.color.setHSL(0.09, 0.8, 0.7 + p * 0.15);
    (this.stars.material as THREE.PointsMaterial).opacity = Math.max(0, 0.95 - p * 2.6);
    (this.rays.material as THREE.SpriteMaterial).opacity = Math.max(0, Math.min(0.42, p * 0.6 - 0.1));
    this.sun.position.y = 10 + p * (this.top + 60); this.rays.position.y = this.sun.position.y; (this.sun.material as THREE.SpriteMaterial).opacity = 0.75 - p * 0.3;
    (this.halo.material as THREE.SpriteMaterial).opacity = 0.35 + p * 0.65; this.bloom.strength = 0.36 + p * 0.22; this.renderer.toneMappingExposure = 1.08 - p * 0.2;
    const win = 0.55 + (1 - p) * 0.5; this.windows.forEach((m) => m.color.setScalar(win + 0.55));
    const pos = this.path.pos.getPoint(p), look = this.path.look.getPoint(p);
    return { pos, look };
  }

  private frame(dt: number, instant = false) {
    this.cur += (this.target - this.cur) * (instant || this.still ? 1 : Math.min(1, dt * 1.7));
    const { pos, look } = this.apply(this.cur);
    pos.z *= this.camera.aspect < 1 ? 1 + (1 - this.camera.aspect) * 0.75 : 1;
    const t = this.clock.elapsedTime;
    if (!this.still) { pos.x += Math.sin(t * 0.21) * 1.3; pos.y += Math.cos(t * 0.17) * 0.7; look.x += Math.sin(t * 0.13) * 0.8; }
    this.camera.position.copy(pos); this.camera.lookAt(look);
    if (!this.still) {
      for (const c of this.clouds) { c.position.x += (c as THREE.Sprite & { vx: number }).vx * dt; if (c.position.x > 420) c.position.x = -420; }
      for (const d of this.doves) { d.a += d.v * dt; const wing = 1 + Math.sin(t * 9 + d.r) * 0.28; d.s.position.set(Math.cos(d.a) * d.r, d.h + Math.sin(t * 0.7 + d.r) * 2 + this.cur * 6, Math.sin(d.a) * d.r * 0.6 + 14); d.s.scale.set(3.4, 2.5 * wing, 1); (d.s.material as THREE.SpriteMaterial).opacity = 0.9; }
      const pos2 = this.dust.geometry.getAttribute('position') as THREE.BufferAttribute; for (let i = 0; i < pos2.count; i++) { let y = pos2.getY(i) + dt * (1.1 + (i % 5) * 0.3); if (y > this.top) y = 0; pos2.setY(i, y); pos2.setX(i, pos2.getX(i) + Math.sin(t + i) * dt * 0.4); } pos2.needsUpdate = true;
      this.rays.material.rotation += dt * 0.012; this.cross.rotation.y = Math.sin(t * 0.4) * 0.12;
      const pulse = 1 + Math.sin(t * 1.6) * 0.06; this.halo.scale.set(46 * pulse, 46 * pulse, 1);
    }
    this.composer.render();
  }

  private loop() {
    if (this.disposed) return;
    const dt = Math.min(0.05, this.clock.getDelta());
    if (this.still) { this.frame(dt, true); return; } // one picture, redrawn only when the height changes
    this.frame(dt); this.raf = requestAnimationFrame(this.loop);
  }

  dispose() {
    this.disposed = true; cancelAnimationFrame(this.raf);
    this.scene.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose?.(); const mat = m.material as THREE.Material | THREE.Material[] | undefined; (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose()); });
    this.textures.forEach((t) => t.dispose()); this.composer.dispose(); this.renderer.dispose();
  }
}
