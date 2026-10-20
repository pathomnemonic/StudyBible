import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { BOOKS, GROUPS } from '../../lib/canon';

/**
 * A walkable galaxy of the 73 books. The Old Testament and the New wind out as two long arms of the same spiral; each kind of
 * book is a stretch of the arm. Everything here is drawing: what the books are, and how they are bound, comes from the app's data.
 */
export interface GalaxyEvents {
  onSelect: (id: string | null) => void;
  onGroup: (name: string | null) => void;
}

const GROUP_COLOR: Record<string, string> = {
  Pentateuch: '#ffc46b', 'Historical Books': '#ff8f7a', 'Wisdom Books': '#7be0c3', Prophets: '#c19bff',
  Gospels: '#8ec9ff', Acts: '#ffe08a', 'Pauline Letters': '#7aa5ff', 'General Letters': '#8ff0ff', Revelation: '#ff7fd0',
};
const R0 = 46, R1 = 300, TWIST = 2.7;
const armPoint = (arm: number, s: number, lateral = 0, y = 0) => {
  const th = arm * (Math.PI / 2) + s * TWIST;
  const r = R0 + s * (R1 - R0) + lateral;
  return new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r);
};

const glowTexture = (inner: string, outer: string) => {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, inner);
  gr.addColorStop(0.18, inner);
  gr.addColorStop(0.5, outer);
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
const cloudTexture = (hue: number) => {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  for (let i = 0; i < 70; i++) {
    const x = 128 + (Math.random() - 0.5) * 150, y = 128 + (Math.random() - 0.5) * 150, r = 20 + Math.random() * 50;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `hsla(${hue + (Math.random() - 0.5) * 40},80%,55%,0.12)`);
    gr.addColorStop(1, 'hsla(0,0%,0%,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 256, 256);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

const STAR_VERT = `
attribute float aSize; attribute float aSeed; attribute vec3 aColor;
uniform float uTime; uniform float uScale; varying vec3 vColor; varying float vTw;
void main(){
  vColor = aColor;
  vTw = 0.75 + 0.25 * sin(uTime * (0.6 + aSeed * 1.4) + aSeed * 40.0);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = clamp(aSize * uScale / -mv.z, 1.0, 14.0);
  vTw *= smoothstep(6.0, 40.0, -mv.z);
  gl_Position = projectionMatrix * mv;
}`;
const STAR_FRAG = `
varying vec3 vColor; varying float vTw;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = smoothstep(1.0, 0.0, d); a = a * a;
  gl_FragColor = vec4(vColor * (0.5 + a * 0.5), a * vTw * 0.32);
}`;

export class Galaxy {
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer | null = null;
  private scene = new THREE.Scene();
  private cam = new THREE.PerspectiveCamera(60, 1, 0.5, 4000);
  private raf = 0;
  private clock = new THREE.Clock();
  private disc = new THREE.Group();
  private stars: THREE.Points;
  private starMat: THREE.ShaderMaterial;
  private books = new Map<string, { pos: THREE.Vector3; core: THREE.Sprite; halo: THREE.Sprite; group: string; label: HTMLDivElement; base: number }>();
  private groupPos = new Map<string, THREE.Vector3>();
  private groupLabels = new Map<string, HTMLDivElement>();
  private labelBox: HTMLDivElement;
  private nebulae: THREE.Sprite[] = [];
  private arcs = new THREE.Group();
  private arcPoints: { pts: THREE.Points; a: THREE.Vector3; b: THREE.Vector3; c: THREE.Vector3; n: number }[] = [];
  yaw = 0; pitch = 0;
  private fly: { t: number; dur: number; p0: THREE.Vector3; p1: THREE.Vector3; y0: number; y1: number; x0: number; x1: number; lift: number } | null = null;
  private selected: string | null = null;
  private focusGroup: string | null = null;
  private pointer = { down: false, x: 0, y: 0, moved: 0, id: -1 };
  private pinch = new Map<number, { x: number; y: number }>();
  private pinchD = 0;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private idle = 0;
  private disposed = false;

  constructor(private host: HTMLElement, private ev: GalaxyEvents, private links: (id: string) => string[]) {
    const canvas = document.createElement('canvas');
    canvas.className = 'galaxy-canvas';
    host.appendChild(canvas);
    this.labelBox = document.createElement('div');
    this.labelBox.className = 'galaxy-labels';
    host.appendChild(this.labelBox);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false });
    this.renderer.setClearColor(0x03030a, 1);
    const coarse = matchMedia('(pointer: coarse)').matches;
    this.renderer.setPixelRatio(Math.min(coarse ? 1.5 : 2, devicePixelRatio || 1));
    this.scene.fog = new THREE.FogExp2(0x03030a, 0.0006);
    this.starMat = new THREE.ShaderMaterial({ vertexShader: STAR_VERT, fragmentShader: STAR_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 }, uScale: { value: 400 } } });
    this.stars = this.buildStars();
    this.disc.add(this.stars);
    this.scene.add(this.disc);
    this.buildNebulae();
    this.buildBackdrop();
    this.buildBooks();
    this.scene.add(this.arcs);
    this.setupPost();
    this.resize();
    this.overview(true);
    this.bind(canvas);
    this.loop();
  }

  private buildStars() {
    const N = 16000;
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N), seed = new Float32Array(N);
    const core = new THREE.Color('#ffd9a0'), edge = new THREE.Color('#7fa8ff'), tmp = new THREE.Color();
    const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
    for (let i = 0; i < N; i++) {
      let p: THREE.Vector3, f: number;
      if (i < 3200) {
        p = new THREE.Vector3(gauss() * 55, gauss() * 22, gauss() * 55);
        f = 0;
      } else {
        const arm = Math.floor(Math.random() * 4);
        const s = Math.pow(Math.random(), 0.8);
        p = armPoint(arm, s, gauss() * (14 + s * 34), gauss() * (3 + (1 - s) * 7));
        f = s;
      }
      pos.set([p.x, p.y, p.z], i * 3);
      tmp.copy(core).lerp(edge, Math.min(1, f * 1.2 + Math.random() * 0.15));
      col.set([tmp.r, tmp.g, tmp.b], i * 3);
      size[i] = 3 + Math.random() * Math.random() * 26;
      seed[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const pts = new THREE.Points(g, this.starMat);
    pts.frustumCulled = false;
    return pts;
  }

  private buildNebulae() {
    const hues = [265, 215, 320, 190, 30];
    const maps = hues.map(cloudTexture);
    for (let i = 0; i < 46; i++) {
      const arm = (i % 2) * 2 + (Math.random() < 0.3 ? 1 : 0);
      const s = 0.08 + Math.random() * 0.9;
      const m = new THREE.SpriteMaterial({ map: maps[i % maps.length], transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending });
      const sp = new THREE.Sprite(m);
      sp.position.copy(armPoint(arm, s, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 12));
      const sc = 70 + Math.random() * 130;
      sp.scale.set(sc, sc, 1);
      this.disc.add(sp);
      this.nebulae.push(sp);
    }
  }

  private buildBackdrop() {
    const N = 2600;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(1500 + Math.random() * 400);
      pos.set([v.x, v.y, v.z], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ color: 0xaab6ff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0.7, depthWrite: false, fog: false });
    this.scene.add(new THREE.Points(g, m));
  }

  private buildBooks() {
    const core = glowTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0.35)');
    const halo = glowTexture('rgba(255,255,255,0.55)', 'rgba(255,255,255,0.10)');
    const place = (list: typeof BOOKS, arm: number) => {
      list.forEach((b, i) => {
        const s = 0.07 + (i / Math.max(1, list.length - 1)) * 0.9;
        const jitter = Math.sin(i * 12.9898) * 9;
        const pos = armPoint(arm, s, jitter, Math.cos(i * 4.1) * 6);
        const col = new THREE.Color(GROUP_COLOR[b.group] ?? '#ffffff');
        const c = new THREE.Sprite(new THREE.SpriteMaterial({ map: core, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
        const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
        const base = 3.2 + Math.sqrt(b.chapters) * 0.55;
        c.position.copy(pos);
        h.position.copy(pos);
        c.scale.setScalar(base);
        h.scale.setScalar(base * 4);
        this.scene.add(h, c);
        const label = document.createElement('div');
        label.className = 'galaxy-label';
        label.textContent = b.name;
        label.style.setProperty('--c', GROUP_COLOR[b.group] ?? '#fff');
        this.labelBox.appendChild(label);
        this.books.set(b.id, { pos, core: c, halo: h, group: b.group, label, base });
      });
    };
    place(BOOKS.filter((b) => b.testament === 'OT'), 0);
    place(BOOKS.filter((b) => b.testament === 'NT'), 2);
    for (const g of GROUPS) {
      const v = new THREE.Vector3();
      g.books.forEach((b) => v.add(this.books.get(b.id)!.pos));
      v.multiplyScalar(1 / g.books.length);
      this.groupPos.set(g.name, v);
      const d = document.createElement('div');
      d.className = 'galaxy-group';
      d.textContent = g.name;
      d.style.setProperty('--c', GROUP_COLOR[g.name] ?? '#fff');
      this.labelBox.appendChild(d);
      this.groupLabels.set(g.name, d);
    }
  }

  private setupPost() {
    try {
      const c = new EffectComposer(this.renderer);
      c.addPass(new RenderPass(this.scene, this.cam));
      c.addPass(new UnrealBloomPass(new THREE.Vector2(512, 512), 0.45, 0.5, 0.78));
      c.addPass(new OutputPass());
      this.composer = c;
    } catch {
      this.composer = null;
    }
  }

  resize = () => {
    const w = this.host.clientWidth || 800, h = this.host.clientHeight || 600;
    this.renderer.setSize(w, h, false);
    this.composer?.setSize(w, h);
    this.cam.aspect = w / h;
    this.cam.fov = w / h < 0.8 ? 75 : 60;
    this.cam.updateProjectionMatrix();
    this.starMat.uniforms.uScale.value = h * 0.45;
  };

  private applyCamera() {
    this.cam.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }
  private aim(from: THREE.Vector3, to: THREE.Vector3) {
    const d = to.clone().sub(from).normalize();
    return { yaw: Math.atan2(-d.x, -d.z), pitch: Math.asin(d.y) };
  }
  private flyTo(p: THREE.Vector3, look: THREE.Vector3, dur = 2.6) {
    const a = this.aim(p, look);
    let dy = a.yaw - this.yaw;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    const dist = p.distanceTo(this.cam.position);
    if (this.reduced) {
      this.cam.position.copy(p);
      this.yaw = a.yaw;
      this.pitch = a.pitch;
      this.applyCamera();
      this.fly = null;
      return;
    }
    this.fly = { t: 0, dur: Math.min(4.2, dur + dist / 400), p0: this.cam.position.clone(), p1: p.clone(), y0: this.yaw, y1: this.yaw + dy, x0: this.pitch, x1: a.pitch, lift: Math.min(60, dist * 0.12) };
  }

  overview(instant = false) {
    this.select(null, false);
    this.focusGroup = null;
    this.ev.onGroup(null);
    const p = new THREE.Vector3(0, 330, 520);
    if (this.cam.aspect < 0.8) p.multiplyScalar(1.45);
    const was = this.reduced;
    if (instant) this.reduced = true;
    this.flyTo(p, new THREE.Vector3(0, 0, 0), 3);
    this.reduced = was;
  }

  openBook(id: string) {
    const b = this.books.get(id);
    if (!b) return;
    this.select(id, true);
    const out = b.pos.clone().setY(0).normalize();
    const side = new THREE.Vector3(-out.z, 0, out.x);
    const cp = b.pos.clone().addScaledVector(out, 30).addScaledVector(side, 14).add(new THREE.Vector3(0, 9, 0));
    this.flyTo(cp, b.pos);
  }

  openGroup(name: string) {
    const g = GROUPS.find((x) => x.name === name);
    const c = this.groupPos.get(name);
    if (!g || !c) return;
    this.select(null, false);
    this.focusGroup = name;
    this.ev.onGroup(name);
    const out = c.clone().setY(0).normalize();
    const side = new THREE.Vector3(-out.z, 0, out.x);
    const spread = g.books.length;
    this.flyTo(c.clone().addScaledVector(out, 40 + spread * 3).addScaledVector(side, 20).add(new THREE.Vector3(0, 22 + spread, 0)), c);
  }

  private select(id: string | null, emit: boolean) {
    this.selected = id;
    this.arcs.clear();
    this.arcPoints = [];
    if (id) {
      const me = this.books.get(id)!;
      const mat = new THREE.PointsMaterial({ size: 2.6, color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending, map: glowTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0.25)') });
      for (const other of this.links(id)) {
        const o = this.books.get(other);
        if (!o) continue;
        const mid = me.pos.clone().add(o.pos).multiplyScalar(0.5);
        const c = mid.multiplyScalar(0.55).add(new THREE.Vector3(0, 28, 0));
        const curve = new THREE.QuadraticBezierCurve3(me.pos, c, o.pos);
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(60)), new THREE.LineBasicMaterial({ color: new THREE.Color(GROUP_COLOR[o.group] ?? '#fff'), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
        this.arcs.add(line);
        const n = 26;
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
        const pts = new THREE.Points(g, mat);
        pts.frustumCulled = false;
        this.arcs.add(pts);
        this.arcPoints.push({ pts, a: me.pos, b: o.pos, c, n });
      }
    }
    if (emit) this.ev.onSelect(id);
  }

  private bind(canvas: HTMLCanvasElement) {
    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId);
      this.pinch.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pinch.size === 2) { const [a, b] = [...this.pinch.values()]; this.pinchD = Math.hypot(a.x - b.x, a.y - b.y); }
      this.pointer = { down: true, x: e.clientX, y: e.clientY, moved: 0, id: e.pointerId };
      this.idle = 0;
    });
    canvas.addEventListener('pointermove', (e) => {
      if (this.pinch.has(e.pointerId)) this.pinch.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pinch.size === 2) {
        const [a, b] = [...this.pinch.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        this.move((d - this.pinchD) * 0.9);
        this.pinchD = d;
        this.pointer.moved += 99;
        return;
      }
      if (!this.pointer.down || e.pointerId !== this.pointer.id) return;
      const dx = e.clientX - this.pointer.x, dy = e.clientY - this.pointer.y;
      this.pointer.moved += Math.abs(dx) + Math.abs(dy);
      this.pointer.x = e.clientX;
      this.pointer.y = e.clientY;
      if (this.pointer.moved > 5) {
        this.fly = null;
        this.yaw += dx * 0.0042;
        this.pitch = Math.max(-1.4, Math.min(1.4, this.pitch + dy * 0.0042));
        this.idle = 0;
      }
    });
    const up = (e: PointerEvent) => {
      this.pinch.delete(e.pointerId);
      if (e.pointerId === this.pointer.id && this.pointer.down) {
        this.pointer.down = false;
        if (this.pointer.moved < 6) this.click(e);
      }
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); this.move(-e.deltaY * 0.25); this.idle = 0; }, { passive: false });
    addEventListener('resize', this.resize);
  }

  move(d: number) {
    this.fly = null;
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(this.cam.rotation);
    this.cam.position.addScaledVector(dir, d);
    if (this.cam.position.length() > 700) this.cam.position.setLength(700);
  }
  look(dyaw: number, dpitch: number) {
    this.yaw += dyaw;
    this.pitch = Math.max(-1.4, Math.min(1.4, this.pitch + dpitch));
  }

  private screen(v: THREE.Vector3) {
    const p = v.clone().project(this.cam);
    return { x: (p.x * 0.5 + 0.5) * this.host.clientWidth, y: (-p.y * 0.5 + 0.5) * this.host.clientHeight, z: p.z };
  }
  private click(e: PointerEvent) {
    const r = this.host.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    let best: string | null = null, bd = 34;
    this.books.forEach((b, id) => {
      const s = this.screen(b.pos);
      if (s.z > 1) return;
      const d = Math.hypot(s.x - x, s.y - y);
      if (d < bd) { bd = d; best = id; }
    });
    if (best) this.openBook(best);
    else if (this.selected) { this.select(null, true); }
  }

  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, this.clock.getDelta());
    const t = this.clock.elapsedTime;
    this.starMat.uniforms.uTime.value = t;
    if (!this.reduced) this.disc.rotation.y += dt * 0.004;
    if (this.fly) {
      const f = this.fly;
      f.t += dt / f.dur;
      const k = Math.min(1, f.t);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      this.cam.position.lerpVectors(f.p0, f.p1, e).y += Math.sin(Math.PI * e) * f.lift;
      this.yaw = f.y0 + (f.y1 - f.y0) * e;
      this.pitch = f.x0 + (f.x1 - f.x0) * e;
      if (k >= 1) this.fly = null;
    } else if (!this.reduced && !this.selected && !this.pointer.down) {
      this.idle += dt;
      if (this.idle > 4) this.yaw += dt * 0.012;
    } else if (!this.reduced && this.selected && !this.pointer.down) {
      this.cam.position.y += Math.sin(t * 0.6) * dt * 0.4;
    }
    this.applyCamera();
    this.cam.updateMatrixWorld();

    for (const n of this.nebulae) {
      const d = n.getWorldPosition(new THREE.Vector3()).distanceTo(this.cam.position);
      (n.material as THREE.SpriteMaterial).opacity = 0.16 * Math.min(1, Math.max(0, (d - 30) / 110));
    }
    // selected book breathes
    this.books.forEach((b, id) => {
      const sel = id === this.selected;
      const dim = this.focusGroup && b.group !== this.focusGroup ? 0.35 : 1;
      const pulse = sel ? 1.1 + Math.sin(t * 2.2) * 0.1 : 1;
      b.core.scale.setScalar(b.base * (sel ? 1.25 : 1) * (sel ? 1 + Math.sin(t * 2.2) * 0.08 : 1));
      b.halo.scale.setScalar(b.base * 4 * pulse);
      (b.halo.material as THREE.SpriteMaterial).opacity = (sel ? 0.6 : 0.8) * dim;
      (b.core.material as THREE.SpriteMaterial).opacity = dim;
    });
    for (const a of this.arcPoints) {
      const arr = (a.pts.geometry.getAttribute('position') as THREE.BufferAttribute);
      for (let i = 0; i < a.n; i++) {
        const u = (i / a.n + t * 0.12) % 1, w = 1 - u;
        arr.setXYZ(i, w * w * a.a.x + 2 * w * u * a.c.x + u * u * a.b.x, w * w * a.a.y + 2 * w * u * a.c.y + u * u * a.b.y, w * w * a.a.z + 2 * w * u * a.c.z + u * u * a.b.z);
      }
      arr.needsUpdate = true;
    }
    this.updateLabels();
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.cam);
  };

  private updateLabels() {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    const cp = this.cam.position;
    const near: { id: string; d: number }[] = [];
    this.books.forEach((b, id) => near.push({ id, d: b.pos.distanceTo(cp) }));
    near.sort((a, b) => a.d - b.d);
    const show = new Set(near.slice(0, 16).filter((n) => n.d < 150).map((n) => n.id));
    if (this.selected) show.add(this.selected);
    this.links(this.selected ?? '').forEach((l) => show.add(l));
    this.books.forEach((b, id) => {
      const s = this.screen(b.pos);
      const on = show.has(id) && s.z < 1 && s.x > -40 && s.x < w + 40 && s.y > -20 && s.y < h + 20;
      b.label.style.opacity = on ? (id === this.selected ? '1' : String(Math.max(0.25, 1 - near.find((n) => n.id === id)!.d / 170))) : '0';
      b.label.style.transform = `translate(${s.x}px, ${s.y + 16}px) translateX(-50%)`;
      b.label.classList.toggle('sel', id === this.selected);
    });
    const far = cp.length() > 160 && !this.selected;
    this.groupLabels.forEach((d, name) => {
      const s = this.screen(this.groupPos.get(name)!);
      const on = (far || this.focusGroup === name) && s.z < 1;
      d.style.opacity = on ? '0.9' : '0';
      d.style.transform = `translate(${s.x}px, ${s.y - 22 + (name === 'Acts' ? 16 : 0)}px) translateX(-50%)`;
    });
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    removeEventListener('resize', this.resize);
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => { (x as THREE.SpriteMaterial).map?.dispose?.(); x.dispose(); });
    });
    this.composer?.dispose();
    this.renderer.dispose();
    this.host.innerHTML = '';
  }
}
