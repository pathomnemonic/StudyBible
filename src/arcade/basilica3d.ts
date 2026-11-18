import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/**
 * The 3D basilica behind Basilion (three.js, already used by the galaxy). Everything is built here from boxes, cylinders, lathes and extruded arches, with every
 * texture drawn on a canvas, so there are no model or image files and it works offline. A very tall front of nine different storeys (arcaded windows, niches
 * with saints, open loggias, round windows) rises between two bell towers behind an oval piazza with colonnades, an obelisk and fountains; a ribbed dome, lantern
 * and cross crown it. A camera climbs a path up the building as `progress` goes from 0 (the piazza) to 1 (the Cross), through a sky that turns from dusk to gold,
 * with clouds that drift past the camera, doves, rays of light, soft shadows, reflections on the gold and lead, and bloom on the lit glass. It is only a picture.
 */
const tex = (draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number, srgb = true) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
};
const rnd = (seed: number) => { let s = seed; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; };

const stoneTexture = (tint = '#efe0c0') => tex((g, w, h) => {
  const r = rnd(7);
  g.fillStyle = tint; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 5200; i++) { const a = r() * 0.1; g.fillStyle = `rgba(${r() < 0.5 ? '90,66,34' : '255,248,225'},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); }
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(110,90,60,${0.03 + r() * 0.05})`; g.fillRect(r() * w, r() * h, 18 + r() * 60, 8 + r() * 26); }
  g.strokeStyle = 'rgba(110,84,50,0.3)'; g.lineWidth = 1.4;
  for (let y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); for (let x = ((y / 32) % 2) * 64; x < w; x += 128) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke(); } }
}, 512, 512);
const glowTex = (inner: string, mid: string) => tex((g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, inner); gr.addColorStop(0.25, mid); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, 256, 256);
const cloudTex = () => tex((g, w, h) => { const r = rnd(11); for (let i = 0; i < 46; i++) { const x = w * (0.18 + r() * 0.64), y = h * (0.42 + r() * 0.2), rad = 22 + r() * 52; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(255,255,255,0.46)'); gr.addColorStop(0.6, 'rgba(255,250,245,0.16)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); } }, 512, 256);
const raysTex = () => tex((g, w, h) => {
  g.translate(w / 2, h / 2);
  for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2 + (i % 3) * 0.04, wdt = 0.05 + (i % 4) * 0.025; g.fillStyle = `rgba(255,244,200,${0.1 + (i % 5) * 0.045})`; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, w / 2, a, a + wdt); g.closePath(); g.fill(); }
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, w / 2); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = gr; g.fillRect(-w / 2, -h / 2, w, h);
}, 1024, 1024);
const shaftTex = () => tex((g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,240,190,0)'); gr.addColorStop(0.5, 'rgba(255,240,190,0.9)'); gr.addColorStop(1, 'rgba(255,240,190,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); const v = g.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.35, 'rgba(0,0,0,1)'); v.addColorStop(1, 'rgba(0,0,0,0)'); g.globalCompositeOperation = 'destination-in'; g.fillStyle = v; g.fillRect(0, 0, w, h); }, 64, 256);
const ogWinTex = (kind: number, glow = true) => tex((g, w, h) => {
  const pal = [['#ffd27a', '#ff9a3b'], ['#c4d6ff', '#4a62c8'], ['#ffb9a6', '#c43a52']][kind % 3];
  g.fillStyle = '#2a1a0d'; g.fillRect(0, 0, w, h);
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, glow ? pal[0] : '#6b3a1d'); gr.addColorStop(1, glow ? pal[1] : '#3b1f0e');
  g.fillStyle = gr; g.beginPath(); g.moveTo(8, h - 6); g.lineTo(8, h * 0.42); g.quadraticCurveTo(8, h * 0.1, w / 2, 6); g.quadraticCurveTo(w - 8, h * 0.1, w - 8, h * 0.42); g.lineTo(w - 8, h - 6); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(50,30,10,0.9)'; g.lineWidth = 4; g.beginPath(); g.moveTo(w / 2, h * 0.36); g.lineTo(w / 2, h - 6); g.moveTo(8, h * 0.58); g.lineTo(w - 8, h * 0.58); g.stroke();
  g.beginPath(); g.arc(w / 2, h * 0.24, w * 0.15, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(w / 4 + 2, h * 0.4, w * 0.12, Math.PI, 0); g.arc(w * 0.75 - 2, h * 0.4, w * 0.12, Math.PI, 0); g.stroke();
}, 128, 256);
const roundWindowTex = () => tex((g, w, h) => {
  const cx = w / 2, cy = h / 2, R = w * 0.46; g.fillStyle = '#2a1a0d'; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
  const gr = g.createRadialGradient(cx, cy, 0, cx, cy, R); gr.addColorStop(0, '#fff0b8'); gr.addColorStop(1, '#ff9a3b'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R - 8, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(60,36,12,0.9)'; g.lineWidth = 5; for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI; g.beginPath(); g.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.lineTo(cx - Math.cos(a) * R, cy - Math.sin(a) * R); g.stroke(); }
  g.beginPath(); g.arc(cx, cy, R * 0.5, 0, Math.PI * 2); g.stroke();
}, 128, 128);
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
/** the paving of the piazza: rings and rays of pale and warm stone around the obelisk */
const pavingTex = () => tex((g, w, h) => {
  const r = rnd(3); g.fillStyle = '#e4d6b4'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '120,96,60' : '255,250,235'},${r() * 0.09})`; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); }
  const cx = w / 2, cy = h / 2; g.strokeStyle = 'rgba(120,90,52,0.55)';
  for (let k = 1; k <= 11; k++) { g.lineWidth = k % 3 === 0 ? 5 : 2; g.beginPath(); g.ellipse(cx, cy, (w / 2) * (k / 11), (h / 2) * (k / 11), 0, 0, Math.PI * 2); g.stroke(); }
  g.lineWidth = 2; for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * w * 0.05, cy + Math.sin(a) * h * 0.05); g.lineTo(cx + Math.cos(a) * w * 0.5, cy + Math.sin(a) * h * 0.5); g.stroke(); }
  const gr = g.createRadialGradient(cx, cy, w * 0.3, cx, cy, w * 0.5); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(120,96,64,0.55)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
}, 1024, 1024);

const sm = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/** the colour of the sky at the horizon for a height of the climb, the same ramp the sky shader uses, so the fog melts into it */
const horizon = (p: number) => {
  const h = 0.02, c = (r: number, g: number, b: number) => new THREE.Color(r, g, b), m = (x: THREE.Color, y: THREE.Color, t: number) => x.clone().lerp(y, t);
  const night = m(c(0.07, 0.05, 0.2), c(0.17, 0.12, 0.38), sm(-0.1, 0.6, h)), dusk = m(c(0.95, 0.5, 0.35), c(0.35, 0.2, 0.55), sm(0, 0.7, h)), gold = m(c(1, 0.85, 0.55), c(0.62, 0.74, 0.98), sm(0.05, 0.9, h)), holy = m(c(1, 0.97, 0.86), c(0.8, 0.88, 1), sm(0, 0.9, h));
  let out = m(night, dusk, sm(0, 0.25, p)); out = m(out, gold, sm(0.25, 0.62, p)); return m(out, holy, sm(0.62, 1, p)).convertSRGBToLinear();
};

/** many copies of one shape drawn in a single call */
class Inst {
  mesh: THREE.InstancedMesh; n = 0; private d = new THREE.Object3D(); private tint = new THREE.Color();
  constructor(geo: THREE.BufferGeometry, mat: THREE.Material, max: number, scene: THREE.Scene, shadows = true) {
    this.mesh = new THREE.InstancedMesh(geo, mat, max); this.mesh.castShadow = shadows; this.mesh.receiveShadow = true; this.mesh.frustumCulled = false; scene.add(this.mesh);
  }
  add(x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, ry = 0, rz = 0, color?: number) {
    this.d.position.set(x, y, z); this.d.scale.set(sx, sy, sz); this.d.rotation.set(0, ry, rz); this.d.updateMatrix(); this.mesh.setMatrixAt(this.n, this.d.matrix);
    if (color !== undefined) this.mesh.setColorAt(this.n, this.tint.setHex(color));
    this.n++;
  }
  done() { this.mesh.count = this.n; this.mesh.instanceMatrix.needsUpdate = true; if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true; }
}
const archShape = (w: number, h: number, hole = 0) => {
  const s = new THREE.Shape(); const r = w / 2;
  s.moveTo(-r, 0); s.lineTo(-r, h - r); s.absarc(0, h - r, r, Math.PI, 0, true); s.lineTo(r, 0); s.lineTo(-r, 0);
  if (hole > 0) { const p = new THREE.Path(); const ri = r - hole; p.moveTo(-ri, 0); p.lineTo(ri, 0); p.lineTo(ri, h - r); p.absarc(0, h - r, ri, 0, Math.PI, false); p.lineTo(-ri, 0); s.holes.push(p); }
  return s;
};

export class BasilicaScene3D {
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(48, 1, 0.5, 3600);
  private clock = new THREE.Clock();
  private raf = 0;
  private disposed = false;
  private target = 0;
  private cur = 0;
  private still: boolean;
  private path!: { pos: THREE.CatmullRomCurve3; look: THREE.CatmullRomCurve3 };
  private skyMat: THREE.ShaderMaterial;
  private fog: THREE.FogExp2;
  private sun: THREE.Sprite;
  private rays: THREE.Sprite;
  private glory: THREE.Sprite;
  private stars: THREE.Points;
  private dust: THREE.Points;
  private clouds: (THREE.Sprite & { vx: number })[] = [];
  private doves: { s: THREE.Sprite; r: number; h: number; a: number; v: number }[] = [];
  private winMats: THREE.MeshBasicMaterial[] = [];
  private winInst: Inst[] = [];
  private shafts: THREE.Mesh[] = [];
  private cross: THREE.Group;
  private halo: THREE.Sprite;
  private dir: THREE.DirectionalLight;
  private hemi: THREE.HemisphereLight;
  private textures: THREE.Texture[] = [];
  private bloom: UnrealBloomPass;
  private top = 120;
  private pmrem: THREE.PMREMGenerator;

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

    /* lights, and a soft environment so the gold and the lead pick up reflections */
    this.hemi = new THREE.HemisphereLight(0xffe2c4, 0x5a4660, 0.9); this.scene.add(this.hemi);
    this.dir = new THREE.DirectionalLight(0xffd9a0, 2.6); this.dir.position.set(-70, 170, 140); this.dir.target.position.set(0, 160, 0);
    this.dir.castShadow = true; this.dir.shadow.mapSize.set(coarse ? 2048 : 4096, coarse ? 2048 : 4096);
    Object.assign(this.dir.shadow.camera, { left: -110, right: 110, top: 400, bottom: -20, near: 10, far: 760 }); this.dir.shadow.bias = -0.0005; this.dir.shadow.normalBias = 0.35; this.dir.shadow.radius = 3;
    this.scene.add(this.dir, this.dir.target);
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    {
      const env = new THREE.Scene(); const e = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }', fragmentShader: 'varying vec3 vP; void main(){ float h = vP.y*0.5+0.5; vec3 c = mix(vec3(0.55,0.4,0.35), vec3(1.0,0.86,0.6), smoothstep(0.2,0.7,h)); c = mix(c, vec3(0.7,0.8,1.0), smoothstep(0.75,1.0,h)); gl_FragColor = vec4(c,1.0); }' }));
      env.add(e); const rt = this.pmrem.fromScene(env, 0.04); this.scene.environment = rt.texture; this.scene.environmentIntensity = 0.32;
    }

    /* materials */
    const stoneMap = T(stoneTexture()); stoneMap.wrapS = stoneMap.wrapT = THREE.RepeatWrapping;
    const stoneAt = (rx: number, ry: number, tintHex = 0xeadcb8) => { const m = new THREE.MeshStandardMaterial({ color: tintHex, map: stoneMap.clone(), bumpMap: stoneMap, bumpScale: 1.2, roughness: 0.92, metalness: 0 }); m.map!.wrapS = m.map!.wrapT = THREE.RepeatWrapping; m.map!.repeat.set(rx, ry); m.map!.needsUpdate = true; this.textures.push(m.map!); return m; };
    const stone = new THREE.MeshStandardMaterial({ color: 0xe9d9b4, map: stoneMap, bumpMap: stoneMap, bumpScale: 0.9, roughness: 0.88 });
    const trim = new THREE.MeshStandardMaterial({ color: 0xebd9b0, roughness: 0.72, bumpMap: stoneMap, bumpScale: 0.5 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x2a1a0d, roughness: 0.9 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xe9b743, metalness: 1, roughness: 0.32, emissive: 0x4a2c04, emissiveIntensity: 0.1 });
    const lead = new THREE.MeshStandardMaterial({ color: 0x79ab9d, metalness: 0.65, roughness: 0.36 });
    const glowMat = (map: THREE.Texture) => { const m = new THREE.MeshBasicMaterial({ map, toneMapped: false }); this.winMats.push(m); return m; };
    const add = (g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, cast = true) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = cast; o.receiveShadow = true; this.scene.add(o); return o; };
    const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);

    /* shared shapes, drawn many times */
    const ogShape = (w: number, h: number, hole = 0) => { // a pointed (Gothic) arch, optionally with its opening cut out
      const r = w / 2, hs = h - r * 1.3, s = new THREE.Shape();
      s.moveTo(-r, 0); s.lineTo(-r, hs); s.quadraticCurveTo(-r, hs + r * 0.9, 0, h); s.quadraticCurveTo(r, hs + r * 0.9, r, hs); s.lineTo(r, 0); s.lineTo(-r, 0);
      if (hole > 0) { const ri = r - hole, p = new THREE.Path(); p.moveTo(-ri, 0); p.lineTo(-ri, hs); p.quadraticCurveTo(-ri, hs + ri * 0.9, 0, h - hole * 1.5); p.quadraticCurveTo(ri, hs + ri * 0.9, ri, hs); p.lineTo(ri, 0); p.lineTo(-ri, 0); s.holes.push(p); }
      return s;
    };
    const ogFrame = new THREE.ExtrudeGeometry(ogShape(5.6, 12, 0.55), { depth: 0.9, bevelEnabled: false });
    const ogSolid = new THREE.ExtrudeGeometry(ogShape(5.6, 12), { depth: 0.3, bevelEnabled: false });
    const gableGeo = new THREE.ExtrudeGeometry((() => { const s = new THREE.Shape(); s.moveTo(-3.6, 0); s.lineTo(3.6, 0); s.lineTo(0, 5); s.lineTo(-3.6, 0); return s; })(), { depth: 1.0, bevelEnabled: false });
    const colGeo = new THREE.CylinderGeometry(0.62, 0.72, 1, 14);
    const unit = box(1, 1, 1);
    const coneGeo = new THREE.ConeGeometry(0.5, 1, 6); coneGeo.translate(0, 0.5, 0);
    const post = new THREE.CylinderGeometry(0.2, 0.28, 2.1, 8);
    const bodyGeo = new THREE.CylinderGeometry(0.1, 0.17, 0.72, 10); bodyGeo.translate(0, 0.36, 0);
    const headGeo = new THREE.SphereGeometry(0.09, 12, 10); headGeo.translate(0, 0.8, 0);
    const haloGeo = new THREE.TorusGeometry(0.12, 0.014, 6, 20); haloGeo.rotateX(Math.PI / 2.2); haloGeo.translate(0, 0.97, 0);
    const winGeo = new THREE.PlaneGeometry(1, 1);
    const winA = new Inst(winGeo, glowMat(T(ogWinTex(0))), 900, this.scene, false), winB = new Inst(winGeo, glowMat(T(ogWinTex(1))), 900, this.scene, false), winC = new Inst(winGeo, glowMat(T(ogWinTex(2))), 900, this.scene, false);
    this.winInst.push(winA, winB, winC);
    const roundI = new Inst(winGeo, glowMat(T(roundWindowTex())), 200, this.scene, false);
    const ogI = new Inst(ogFrame, trim, 1800, this.scene), recessI = new Inst(ogSolid, dark, 600, this.scene, false), gableI = new Inst(gableGeo, trim, 200, this.scene);
    const colI = new Inst(colGeo, trim, 1800, this.scene), unitI = new Inst(unit, trim, 9000, this.scene), goldI = new Inst(unit, gold, 2400, this.scene), coneI = new Inst(coneGeo, trim, 4000, this.scene);
    const postI = new Inst(post, trim, 1600, this.scene, false), bodyI = new Inst(bodyGeo, trim, 700, this.scene), headI = new Inst(headGeo, trim, 700, this.scene), haloI = new Inst(haloGeo, gold, 700, this.scene, false);
    const darkI = new Inst(unit, dark, 600, this.scene, false);
    const fruitI = new Inst(new THREE.SphereGeometry(0.5, 14, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.25 }), 400, this.scene);
    const ringI = new Inst(new THREE.TorusGeometry(4.2, 0.4, 8, 32), gold, 100, this.scene);
    const FRUIT = [0xc2392b, 0xe8832a, 0x3f9a5a, 0x2f6fb5, 0xe9c443, 0x8a3fa0];
    const copper = new THREE.MeshStandardMaterial({ color: 0xc9733f, metalness: 0.7, roughness: 0.38 }), verdi = new THREE.MeshStandardMaterial({ color: 0x5f9c8a, metalness: 0.6, roughness: 0.4 });
    const wins = [winA, winB, winC];
    const figure = (x: number, y: number, z: number, h: number, ry = 0) => { bodyI.add(x, y, z, h, h, h, ry); headI.add(x, y, z, h, h, h, ry); haloI.add(x, y, z, h, h, h, ry); };
    /** a pointed window with a frame, a sill and a lit pane; y is the sill */
    const lancet = (x: number, y: number, z: number, w: number, h: number, k: number, ry = 0) => {
      wins[k % 3].add(x, y + h * 0.48, z - 0.05, w * 0.84, h * 0.94, 1, ry, 0, 0xffffff); ogI.add(x, y, z - 0.35, w / 5.6, h / 12, 1, ry);
      if (ry === 0) unitI.add(x, y - 0.3, z + 0.1, w + 1.2, 0.7, 1.5);
    };
    const pin = (x: number, y: number, z: number, s = 1) => { unitI.add(x, y + 1.2 * s, z, 1.2 * s, 2.4 * s, 1.2 * s); coneI.add(x, y + 2.4 * s, z, 1.5 * s, 3.4 * s, 1.5 * s); goldI.add(x, y + 5.9 * s, z, 0.5 * s, 0.5 * s, 0.5 * s); };
    /** a steep gable with a row of crockets up each slope and a coloured finial */
    const gable = (x: number, y: number, z: number, w: number, h: number, c = 0) => {
      gableI.add(x, y, z - 0.4, w / 7.2, h / 5, 1);
      for (let k = 1; k <= 5; k++) for (const s of [-1, 1]) { const u = k / 6; coneI.add(x + s * (w / 2) * (1 - u), y + h * u + 0.2, z + 0.7, 0.5, 1.5, 0.5); }
      coneI.add(x, y + h, z + 0.4, 0.9, 2.8, 0.9); fruitI.add(x, y + h + 3.2, z + 0.4, 1.1, 1.1, 1.1, 0, 0, FRUIT[c % FRUIT.length]);
    };
    /** a tower: stages that narrow as they rise, lit lancets on every face, gold bands, then a tall lead or copper spire hung with crockets and tipped with mosaic fruit */
    const spireGeo = (r: number, H: number, seg: number) => { const pts: THREE.Vector2[] = []; for (let i = 0; i <= 18; i++) { const t = i / 18; pts.push(new THREE.Vector2(Math.max(0.03, r * Math.pow(1 - t, 1.7)), t * H)); } return new THREE.LatheGeometry(pts, seg); };
    const tower = (x: number, z: number, y0: number, w: number, stages: number, sh: number, spireH: number, spMat: THREE.Material, oct: boolean, tint: number, fr: number) => {
      const mat = stoneAt(2, 3, tint); let y = y0, wi = w;
      for (let i = 0; i < stages; i++) {
        wi = w * (1 - 0.06 * i); const k = (i + fr) % 3;
        if (oct) {
          const g = new THREE.CylinderGeometry(wi * 0.55, wi * 0.59, sh, 8); g.rotateY(Math.PI / 8); add(g, mat, x, y + sh / 2, z);
          for (let f = 0; f < 8; f++) { const a = f * Math.PI / 4; if (Math.cos(a) < -0.3) continue; lancet(x + Math.sin(a) * (wi * 0.545 + 0.1), y + sh * 0.2, z + Math.cos(a) * (wi * 0.545 + 0.1), wi * 0.3, sh * 0.6, k + f, a); }
          for (let f = 0; f < 8; f++) { const a = f * Math.PI / 4 + Math.PI / 8; coneI.add(x + Math.sin(a) * wi * 0.56, y + sh, z + Math.cos(a) * wi * 0.56, 0.9, 2.6, 0.9); }
        } else {
          add(box(wi, sh, wi), mat, x, y + sh / 2, z);
          lancet(x, y + sh * 0.2, z + wi / 2 + 0.12, wi * 0.34, sh * 0.6, k); lancet(x - wi / 2 - 0.12, y + sh * 0.2, z, wi * 0.34, sh * 0.6, k + 1, -Math.PI / 2); lancet(x + wi / 2 + 0.12, y + sh * 0.2, z, wi * 0.34, sh * 0.6, k + 2, Math.PI / 2);
          for (const cx of [-1, 1]) for (const cz of [-1, 1]) pin(x + cx * (wi / 2 + 0.2), y + sh, z + cz * (wi / 2 + 0.2), 0.7);
        }
        goldI.add(x, y + sh, z, wi + 1, 0.45, wi + 1); y += sh;
      }
      const N = oct ? 8 : 4, rot = oct ? Math.PI / 8 : Math.PI / 4, r0 = wi * (oct ? 0.5 : 0.62);
      const sg = spireGeo(r0, spireH, N); sg.rotateY(rot); add(sg, spMat, x, y, z);
      for (let k = 1; k * 6 < spireH - 4; k++) { const t = (k * 6) / spireH, rt = r0 * Math.pow(1 - t, 1.7), s = 0.4 + rt * 0.1; for (let j = 0; j < N; j++) { const phi = (j * Math.PI * 2) / N + rot; coneI.add(x + Math.sin(phi) * rt, y + k * 6, z + Math.cos(phi) * rt, s, s * 2.6, s, phi - Math.PI / 2, -1.15); } }
      fruitI.add(x, y + spireH - 1.2, z, 1.7, 1.7, 1.7, 0, 0, FRUIT[fr % FRUIT.length]); goldI.add(x, y + spireH + 1.4, z, 0.3, 4.6, 0.3); goldI.add(x, y + spireH + 2.2, z, 1.8, 0.3, 0.3);
      return y + spireH;
    };

    /* the piazza: a paved oval with an obelisk, two fountains and a curved colonnade on each side */
    const ground = new THREE.Mesh(new THREE.CircleGeometry(2600, 64), new THREE.MeshStandardMaterial({ color: 0xcdbf9d, roughness: 1, map: (() => { const t = T(stoneTexture('#d8ccaa')); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(90, 90); return t; })() }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05; ground.receiveShadow = true; this.scene.add(ground);
    const piazza = new THREE.Mesh(new THREE.CircleGeometry(150, 96), new THREE.MeshStandardMaterial({ map: T(pavingTex()), roughness: 0.9 })); piazza.rotation.x = -Math.PI / 2; piazza.scale.set(1, 0.78, 1); piazza.position.set(0, 0.02, 92); piazza.receiveShadow = true; this.scene.add(piazza);
    const tapered = new THREE.CylinderGeometry(1.1, 1.9, 42, 4); tapered.rotateY(Math.PI / 4); add(tapered, stoneAt(1, 8, 0xd9b9a0), 0, 22, 92); add(new THREE.ConeGeometry(1.2, 2.4, 4).rotateY(Math.PI / 4), gold, 0, 44.4, 92); add(box(5.4, 4, 5.4), trim, 0, 2, 92); add(box(7.4, 1.2, 7.4), trim, 0, 0.6, 92);
    add(new THREE.SphereGeometry(0.7, 12, 10), gold, 0, 46.2, 92); add(box(0.2, 2.2, 0.2), gold, 0, 47.4, 92);
    for (const fx of [-44, 44]) { add(new THREE.CylinderGeometry(7, 7.6, 1.4, 40), trim, fx, 0.7, 98); add(new THREE.CylinderGeometry(6.4, 6.4, 1.1, 40), new THREE.MeshStandardMaterial({ color: 0x6fa8c8, roughness: 0.15, metalness: 0.2 }), fx, 1.45, 98, false); add(new THREE.CylinderGeometry(0.7, 1.1, 5, 12), trim, fx, 3.5, 98); add(new THREE.CylinderGeometry(3, 2.4, 0.9, 24), trim, fx, 6.1, 98); add(new THREE.ConeGeometry(2.2, 1.4, 20), new THREE.MeshStandardMaterial({ color: 0xb8dff0, roughness: 0.1, transparent: true, opacity: 0.8 }), fx, 7.1, 98, false); }
    for (const sx of [-1, 1]) for (let i = 0; i <= 26; i++) {
      const a = (i / 26) * Math.PI * 0.92 + 0.15; const ex = sx * (56 + 64 * Math.sin(a) * 0.95), ez = 26 + 112 * (1 - Math.cos(a)) * 0.62;
      if (ez > 140) continue; const tang = Math.atan2(-(112 * Math.sin(a) * 0.62), sx * 64 * Math.cos(a) * 0.95);
      for (const o of [-1, 1]) colI.add(ex + Math.sin(tang) * o * 3.4, 7.6, ez + Math.cos(tang) * o * 3.4, 1.7, 15, 1.7);
      unitI.add(ex, 15.9, ez, 9.5, 1.6, 6.2, tang); goldI.add(ex, 16.9, ez, 10, 0.3, 6.6, tang);
      if (i % 2 === 0) figure(ex, 17, ez, 5.6, tang);
    }

    /* the steps and the great west portals: three pointed doors under rings of carved arches, with saints beside them */
    for (let i = 0; i < 7; i++) unitI.add(0, 0.28 + i * 0.55, 22 - (6 - i) * 1.3, 78 + (6 - i) * 5, 0.56, 14 + (6 - i) * 2.4);
    const base0 = 3.8, porH = 21, FZ = 6.2;
    add(box(66, porH, 16), stoneAt(6, 2), 0, base0 + porH / 2, 0);
    const doorTex = T(ogWinTex(0, false));
    for (const [x, w, h, c] of [[-20, 7, 13, 1], [0, 11, 19, 0], [20, 7, 13, 2]] as const) {
      const door = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: doorTex, roughness: 0.55, emissive: 0x3a1a08, emissiveIntensity: 0.55 })); door.position.set(x, base0 + h / 2, 8.1); this.scene.add(door);
      for (let k = 0; k < 5; k++) ogI.add(x, base0, 8.15 + k * 0.28, (w + 0.4 + k * 1.5) / 5.6, (h + 0.7 + k * 1.3) / 12, 1);
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { figure(x + s * (w / 2 + 0.9 + k * 1.5), base0 + 3.2 + k * 0.4, 9.2, 2.6 - k * 0.2); unitI.add(x + s * (w / 2 + 0.9 + k * 1.5), base0 + 2.8 + k * 0.4, 9.2, 1.3, 0.5, 1.3); }
      gable(x, base0 + h + 5.4, 8.4, w + 8, 6 + w * 0.28, c + 2);
      roundI.add(x, base0 + h + 3.4, 8.9, 3.3, 3.3, 1); ringI.add(x, base0 + h + 3.4, 8.95, 0.39, 0.39, 0.5);
      figure(x, base0 + h + 8.2, 8.9, 2.6);
    }
    for (const px of [-30, -10, 10, 30]) { unitI.add(px, base0 + porH / 2, 9, 2.4, porH, 3); goldI.add(px, base0 + porH + 0.2, 9, 3, 0.4, 3.6); pin(px, base0 + porH + 0.4, 9, 1.1); }
    add(box(68, 3.2, 19), trim, 0, base0 + porH + 0.2, 0.4); goldI.add(0, base0 + porH + 1.9, 0.4, 70, 0.7, 20);
    for (let i = 0; i < 40; i++) unitI.add(-33.5 + i * 1.7, base0 + porH - 0.6, 10, 0.8, 0.9, 0.8);

    /* the front: eight storeys that narrow as they rise, each with its own windows, stone and rhythm, crowded with pinnacles, gables and statues */
    const HT = [20, 19, 19, 18, 18, 17, 16, 16], WD = [62, 58, 54, 48, 42, 36, 30, 24];
    const TINT = [0xeadcb8, 0xe6d2b0, 0xf0e2c4, 0xdcc7a4, 0xeadcb8, 0xe2cdb0, 0xf0e0c0, 0xe8d6b2];
    const KINDS = ['rose', 'lanc', 'niche', 'oculi', 'lanc', 'rose', 'niche', 'lanc'] as const;
    let logY = base0 + porH + 3.6; const tierY: number[] = [], tierTop: number[] = [];
    for (let t = 0; t < 8; t++) {
      const wd = WD[t], hT = HT[t], kind = KINDS[t], y0 = logY; tierY.push(y0);
      add(box(wd, hT, 13), stoneAt(5, 2, TINT[t]), 0, y0 + hT / 2, -1);
      const n = Math.max(3, Math.floor((wd - 6) / 7.5)), sp = (wd - 10) / (n - 1), xs = Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * sp);
      for (let i = 0; i <= n; i++) { const x = (i - n / 2) * sp; if (Math.abs(x) > wd / 2 - 0.5) continue; unitI.add(x, y0 + hT / 2, FZ + 0.1, 1.5, hT - 1, 1.6); pin(x, y0 + hT - 0.4, FZ + 0.3, 0.7); }
      if (kind === 'lanc') xs.forEach((x, i) => { const c = Math.abs(x) < 1; lancet(x, y0 + 2.4, FZ + 0.4, c ? 5.4 : 4.4, hT - 5.4 - (c ? 0 : 2.4), t + i); if (c || i % 2 === 0) gable(x, y0 + hT - 3.4, FZ + 0.3, c ? 7.4 : 6, 3.2, t + i); });
      if (kind === 'rose') { const R = Math.min(7.4, hT * 0.38), cy = y0 + hT * 0.5; const rose = new THREE.Mesh(new THREE.CircleGeometry(R, 48), new THREE.MeshBasicMaterial({ map: T(roseTex()), transparent: true, toneMapped: false })); rose.position.set(0, cy, FZ - 0.1); this.scene.add(rose); add(new THREE.TorusGeometry(R + 0.15, 0.42, 8, 48), gold, 0, cy, FZ, false); for (let a = 0; a < 12; a++) coneI.add(Math.sin(a * Math.PI / 6) * (R + 0.9), cy + Math.cos(a * Math.PI / 6) * (R + 0.9), FZ + 0.4, 0.55, 1.4, 0.55, 0, -a * Math.PI / 6);
        xs.forEach((x, i) => { if (Math.abs(x) > R + 4) lancet(x, y0 + 2.2, FZ + 0.4, 4.4, hT - 4.6, t + i); }); }
      if (kind === 'niche') xs.forEach((x, i) => { recessI.add(x, y0 + 2.4, FZ + 0.05, 4.6 / 5.6, (hT - 6) / 12, 1); unitI.add(x, y0 + 2.2, FZ + 0.5, 5.4, 0.7, 1.6); figure(x, y0 + 2.6, FZ + 0.7, i === Math.floor(n / 2) ? 8 : 6.8); ogI.add(x, y0 + 2.4, FZ - 0.25, 5.4 / 5.6, (hT - 5.4) / 12, 1); gable(x, y0 + hT - 3.2, FZ + 0.3, 5.6, 2.6, t + i); });
      if (kind === 'oculi') { xs.forEach((x, i) => { if (i % 2 === 0) { roundI.add(x, y0 + hT * 0.58, FZ - 0.1, 8, 8, 1); ringI.add(x, y0 + hT * 0.58, FZ, 0.95, 0.95, 0.9); } else { lancet(x, y0 + 2.2, FZ + 0.4, 3.2, hT - 5, t + i); } }); }
      add(box(wd + 2, 1.6, 15), trim, 0, y0 + hT + 0.6, -0.4); goldI.add(0, y0 + hT + 1.5, -0.4, wd + 2.4, 0.5, 15.4);
      for (let i = 0; i < Math.floor(wd / 1.6); i++) unitI.add(-wd / 2 + 1 + i * 1.6, y0 + hT - 0.4, FZ + 1.2, 0.8, 0.9, 0.9);
      for (let i = 0; i < Math.floor(wd / 3); i++) coneI.add(-wd / 2 + 1 + i * 3, y0 + hT + 1.4, FZ + 1.4, 0.45, 1.6, 0.45);
      for (const sx of [-1, 1]) pin(sx * (wd / 2 + 0.4), y0 + hT + 1.2, FZ + 1, 1.5);
      logY += hT + 1.6; tierTop.push(logY);
    }

    /* tall corner towers of different shapes and spires, and slim ones that grow out of the front as it narrows */
    for (const sx of [-1, 1]) {
      tower(sx * 40, 2, 0, 10, 11, 19, 62, verdi, false, 0xe8d6b0, 0);
      tower(sx * 51, 2, 0, 7.2, 8, 17, 48, copper, true, 0xe2cdb0, 3);
      for (const [ti, h, fr] of [[1, 5, 1], [3, 5, 2], [5, 4, 4]] as const) { const bx = sx * (WD[ti] / 2 - 2.4); tower(bx, 2, tierY[ti], 4.4, h, 12, 34, ti % 2 ? copper : verdi, ti % 2 === 1, 0xeadcb8, fr); }
      // flying buttresses between the great towers and the front
      for (const ti of [2, 4, 6]) { const edge = WD[ti] / 2 + 1, span = 35 - edge; if (span < 4) continue; const R = span / 2, arc = add(new THREE.TorusGeometry(R, 0.75, 6, 22, Math.PI), trim, sx * (35 + edge) / 2, tierTop[ti] - 7, 2); arc.scale.y = 0.85; unitI.add(sx * (edge + 0.2), tierTop[ti] - 9, 2, 1.4, 4, 3); }
    }
    const topFrontY = logY;

    /* the crown: an eight-sided lantern, a second stage ringed by four small spires, and a great central spire with a cross */
    const dz = 0; let yc = topFrontY;
    add(box(24, 3, 13), trim, 0, yc + 1.2, 0); goldI.add(0, yc + 2.8, 0, 25, 0.5, 14); yc += 2.4;
    const stageMat = stoneAt(3, 3, 0xefe0c0);
    for (const [r, h, cols] of [[8, 24, 8], [6, 20, 8]] as const) {
      const g = new THREE.CylinderGeometry(r * 0.94, r, h, 8); g.rotateY(Math.PI / 8); add(g, stageMat, 0, yc + h / 2, dz);
      for (let f = 0; f < 8; f++) { const a = f * Math.PI / 4; lancet(Math.sin(a) * (r * 0.93 + 0.2), yc + h * 0.2, dz + Math.cos(a) * (r * 0.93 + 0.2), r * 0.42, h * 0.62, f, a); }
      for (let f = 0; f < cols; f++) { const a = f * Math.PI / 4 + Math.PI / 8; coneI.add(Math.sin(a) * r, yc + h, dz + Math.cos(a) * r, 1.2, 3.4, 1.2); }
      add(new THREE.TorusGeometry(r + 0.3, 0.4, 8, 32), gold, 0, yc + h, dz, false).rotation.x = Math.PI / 2; yc += h;
    }
    for (const [px, pz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) tower(px * 8.4, pz * 5 + 1, topFrontY + 2.4, 3.4, 4, 12, 26, ((px + pz) & 2) ? copper : verdi, true, 0xefe0c0, px + pz + 3);
    const sSp = spireGeo(5.6, 78, 8); sSp.rotateY(Math.PI / 8); add(sSp, lead, 0, yc, dz);
    for (let k = 1; k * 6 < 74; k++) { const t = (k * 6) / 78, rt = 5.6 * Math.pow(1 - t, 1.7), s = 0.5 + rt * 0.1; for (let j = 0; j < 8; j++) { const phi = (j * Math.PI * 2) / 8 + Math.PI / 8; coneI.add(Math.sin(phi) * rt, yc + k * 6, dz + Math.cos(phi) * rt, s, s * 2.6, s, phi - Math.PI / 2, -1.15); } }
    const lanY = yc + 78 - 12;

    this.cross = new THREE.Group(); this.cross.position.set(0, lanY + 12, dz);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(1.05, 20, 16), gold); ball.castShadow = true; this.cross.add(ball);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.42, 7, 0.42), gold); bar.position.y = 4.6; const arm = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.42, 0.42), gold); arm.position.y = 6.2; this.cross.add(bar, arm); this.scene.add(this.cross);
    this.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: T(glowTex('rgba(255,250,215,0.95)', 'rgba(255,214,120,0.45)')), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false })); this.halo.scale.set(46, 46, 1); this.halo.position.set(0, lanY + 15, dz + 1); this.scene.add(this.halo);
    this.glory = new THREE.Sprite(new THREE.SpriteMaterial({ map: T(raysTex()), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.5, fog: false })); this.glory.scale.set(150, 150, 1); this.glory.position.set(0, lanY + 15, dz - 2); this.scene.add(this.glory);

    /* the flanks: the long roof of the nave behind, and a smaller dome over each side chapel */
    add(box(46, 30, 84), stoneAt(8, 4), 0, 28, -58);
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(26, 26, 84, 3).rotateX(-Math.PI / 2), lead); roof.position.set(0, 56, -58); roof.castShadow = true; roof.receiveShadow = true; this.scene.add(roof);
    this.top = lanY + 24;

    /* sun, rays, stars, clouds, doves and dust */
    this.sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: T(glowTex('rgba(255,248,210,1)', 'rgba(255,190,110,0.55)')), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
    this.sun.scale.set(520, 520, 1); this.sun.position.set(-40, 20, -700); this.scene.add(this.sun);
    this.rays = new THREE.Sprite(new THREE.SpriteMaterial({ map: T(raysTex()), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0, fog: false })); this.rays.scale.set(1500, 1500, 1); this.rays.position.copy(this.sun.position).add(new THREE.Vector3(0, 0, 40)); this.scene.add(this.rays);
    const r = rnd(5);
    const sp = new Float32Array(420 * 3); for (let i = 0; i < 420; i++) { const th = r() * Math.PI * 2, ph = Math.acos(0.15 + r() * 0.85); sp.set([Math.sin(ph) * Math.cos(th) * 2600, Math.cos(ph) * 2600, Math.sin(ph) * Math.sin(th) * 2600], i * 3); }
    const dotT = T(glowTex('rgba(255,250,225,1)', 'rgba(255,230,160,0.35)'));
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xfff3cf, map: dotT, size: 7, sizeAttenuation: false, transparent: true, opacity: 0.9, depthWrite: false, fog: false })); this.scene.add(this.stars);
    const cT = T(cloudTex());
    // far banks and near clouds: the near ones pass between the camera and the building as it climbs, which is what makes the height felt
    for (let i = 0; i < 34; i++) {
      const near = i >= 16; const c = new THREE.Sprite(new THREE.SpriteMaterial({ map: cT, transparent: true, opacity: near ? 0.14 + r() * 0.2 : 0.55 + r() * 0.3, depthWrite: false, color: 0xffe6d2 })) as THREE.Sprite & { vx: number };
      const s = near ? 40 + r() * 80 : 80 + r() * 140; c.scale.set(s * 2, s, 1);
      c.position.set((r() - 0.5) * (near ? 230 : 520), 10 + r() * (this.top + 60), near ? 24 + r() * 80 : -150 - r() * 520); c.vx = (near ? 1.2 : 0.6) + r() * 1.6; this.clouds.push(c); this.scene.add(c);
    }
    const dT = T(doveTex());
    for (let i = 0; i < 14; i++) { const d = new THREE.Sprite(new THREE.SpriteMaterial({ map: dT, transparent: true, depthWrite: false, fog: false })); d.scale.set(3.4, 2.5, 1); this.scene.add(d); this.doves.push({ s: d, r: 22 + r() * 40, h: 22 + r() * (this.top - 20), a: r() * 6.28, v: (0.12 + r() * 0.2) * (i % 2 ? 1 : -1) }); }
    const dp = new Float32Array(380 * 3); for (let i = 0; i < 380; i++) dp.set([(r() - 0.5) * 140, r() * this.top, 8 + r() * 60], i * 3);
    const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3)); this.dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xffe9a8, map: dotT, size: 1.3, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })); this.scene.add(this.dust);
    // slanting shafts of light across the front
    const shT = T(shaftTex());
    for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(10 + (i % 3) * 5, 240), new THREE.MeshBasicMaterial({ map: shT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); m.position.set(-60 + i * 24, this.top * 0.55, 16 + (i % 2) * 8); m.rotation.z = -0.5; this.scene.add(m); this.shafts.push(m); }

    // every instanced window gets its own brightness, so the front does not glow evenly
    for (const w of [winA, winB, winC, roundI]) { const rr = rnd(w.n + 3); const col = new THREE.Color(); for (let i = 0; i < w.n; i++) { col.setScalar(0.75 + rr() * 0.5); w.mesh.setColorAt(i, col); } }
    [ringI, winA, winB, winC, roundI, ogI, recessI, gableI, coneI, fruitI, colI, unitI, goldI, postI, bodyI, headI, haloI, darkI].forEach((i) => i.done());

    /* the climb: a smooth path for the camera and for what it looks at */
    {
      const top = this.top, n = 12, posPts: THREE.Vector3[] = [], lookPts: THREE.Vector3[] = [];
      for (let i = 0; i <= n; i++) { const t = i / n, y = 8 + t * (top - 26), sway = Math.sin(t * 7.5) * 20 * (1 - t * 0.3); posPts.push(new THREE.Vector3(sway + 16 * (1 - t), y, 148 + Math.sin(t * 3) * 6 + t * 14)); lookPts.push(new THREE.Vector3(0, y + 14 + t * 6, -6 * t)); }
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
    this.camera.aspect = w / h; this.camera.fov = h > w ? 54 : 40; this.camera.updateProjectionMatrix();
  }

  private apply(p: number) {
    this.skyMat.uniforms.uP.value = p;
    this.fog.color.copy(horizon(p)); this.fog.density = 0.0015 - p * 0.0007;
    this.hemi.intensity = 0.55 + p * 0.15; this.dir.intensity = 2.0 + p * 0.25; this.dir.color.setHSL(0.09, 0.8, 0.7 + p * 0.15);
    (this.stars.material as THREE.PointsMaterial).opacity = Math.max(0, 0.95 - p * 2.6);
    (this.rays.material as THREE.SpriteMaterial).opacity = Math.max(0, Math.min(0.42, p * 0.6 - 0.1));
    this.sun.position.y = 10 + p * (this.top + 60); this.rays.position.y = this.sun.position.y; (this.sun.material as THREE.SpriteMaterial).opacity = 0.75 - p * 0.3;
    (this.halo.material as THREE.SpriteMaterial).opacity = 0.35 + p * 0.65; (this.glory.material as THREE.SpriteMaterial).opacity = 0.18 + p * 0.5;
    this.bloom.strength = 0.34 + p * 0.16; this.renderer.toneMappingExposure = 1.0 - p * 0.2;
    const win = 0.55 + (1 - p) * 0.5; this.winMats.forEach((m) => m.color.setScalar(win + 0.55));
    for (const s of this.shafts) (s.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.05 + p * 0.1);
    return { pos: this.path.pos.getPoint(p), look: this.path.look.getPoint(p) };
  }

  private frame(dt: number, instant = false) {
    this.cur += (this.target - this.cur) * (instant || this.still ? 1 : Math.min(1, dt * 1.7));
    const { pos, look } = this.apply(this.cur);
    pos.z *= this.camera.aspect < 1 ? 1 + (1 - this.camera.aspect) * 0.75 : 1;
    const t = this.clock.elapsedTime;
    if (!this.still) { pos.x += Math.sin(t * 0.21) * 1.3; pos.y += Math.cos(t * 0.17) * 0.7; look.x += Math.sin(t * 0.13) * 0.8; }
    this.camera.position.copy(pos); this.camera.lookAt(look);
    if (!this.still) {
      for (const c of this.clouds) { c.position.x += c.vx * dt; if (c.position.x > 420) c.position.x = -420; }
      for (const d of this.doves) { d.a += d.v * dt; const wing = 1 + Math.sin(t * 9 + d.r) * 0.28; d.s.position.set(Math.cos(d.a) * d.r, d.h + Math.sin(t * 0.7 + d.r) * 2 + this.cur * 6, Math.sin(d.a) * d.r * 0.6 + 14); d.s.scale.set(3.4, 2.5 * wing, 1); (d.s.material as THREE.SpriteMaterial).opacity = 0.9; }
      const pos2 = this.dust.geometry.getAttribute('position') as THREE.BufferAttribute; for (let i = 0; i < pos2.count; i++) { let y = pos2.getY(i) + dt * (1.1 + (i % 5) * 0.3); if (y > this.top) y = 0; pos2.setY(i, y); pos2.setX(i, pos2.getX(i) + Math.sin(t + i) * dt * 0.4); } pos2.needsUpdate = true;
      this.rays.material.rotation += dt * 0.012; this.glory.material.rotation -= dt * 0.02; this.cross.rotation.y = Math.sin(t * 0.4) * 0.12;
      const pulse = 1 + Math.sin(t * 1.6) * 0.06; this.halo.scale.set(46 * pulse, 46 * pulse, 1);
      this.shafts.forEach((s, i) => { s.position.x += Math.sin(t * 0.1 + i) * dt * 1.2; });
      // candle-like flicker: a few windows brighten and dim
      for (const w of this.winInst) { const ic = w.mesh.instanceColor; if (!ic) continue; for (let i = (Math.floor(t * 2) % 5); i < w.n; i += 5) { const v = 0.78 + 0.42 * (0.5 + 0.5 * Math.sin(t * (0.8 + (i % 7) * 0.13) + i)); ic.setXYZ(i, v, v, v); } ic.needsUpdate = true; }
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
    this.textures.forEach((t) => t.dispose()); this.pmrem.dispose(); this.composer.dispose(); this.renderer.dispose();
  }
}
