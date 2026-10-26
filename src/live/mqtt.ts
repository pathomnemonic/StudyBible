/**
 * A very small MQTT 3.1.1 client over WebSocket, enough for class sessions: connect, subscribe to exact topics, publish at
 * QoS 0, keep alive, and reconnect (trying the next broker) with the subscriptions put back. Public brokers carry the messages;
 * everything sent through them is encrypted by the caller.
 */
const enc = new TextEncoder();
const dec = new TextDecoder();

function varint(n: number): number[] { const out: number[] = []; do { let b = n % 128; n = Math.floor(n / 128); if (n > 0) b |= 128; out.push(b); } while (n > 0); return out; }
function str(s: string): number[] { const b = enc.encode(s); return [b.length >> 8, b.length & 255, ...b]; }
function packet(first: number, body: Uint8Array | number[]): Uint8Array { const b = body instanceof Uint8Array ? body : Uint8Array.from(body); return Uint8Array.from([first, ...varint(b.length), ...b]); }

export type MqttState = 'connecting' | 'open' | 'closed';
export class Mqtt {
  private ws: WebSocket | null = null;
  private subs = new Map<string, Set<(payload: Uint8Array) => void>>();
  private buf: number[] = [];
  private ping: ReturnType<typeof setInterval> | null = null;
  private retry: ReturnType<typeof setTimeout> | null = null;
  private tries = 0;
  private wantOpen = true;
  private waiters: { ok: () => void; fail: (e: Error) => void }[] = [];
  state: MqttState = 'connecting';
  onState: (s: MqttState) => void = () => undefined;
  private id = `sb-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  private pid = 1;

  constructor(private urls: string[], private WS: typeof WebSocket = globalThis.WebSocket) { this.open(); }

  private set(s: MqttState) { this.state = s; this.onState(s); }
  private open() {
    if (!this.wantOpen) return;
    const url = this.urls[this.tries % this.urls.length];
    this.tries++;
    this.set('connecting');
    let ws: WebSocket;
    try { ws = new this.WS(url, 'mqtt'); } catch { this.scheduleRetry(); return; }
    ws.binaryType = 'arraybuffer';
    this.ws = ws; this.buf = [];
    ws.onopen = () => ws.send(packet(0x10, [...str('MQTT'), 4, 2, 0, 60, ...str(this.id)]));
    ws.onmessage = (e) => { this.buf.push(...new Uint8Array(e.data as ArrayBuffer)); this.drain(); };
    const lost = () => { if (this.ws !== ws) return; this.ws = null; if (this.ping) clearInterval(this.ping); this.set('closed'); for (const w of this.waiters.splice(0)) w.fail(new Error('Could not reach a class server.')); this.scheduleRetry(); };
    ws.onclose = lost; ws.onerror = () => { try { ws.close(); } catch { /* already closed */ } };
  }
  private scheduleRetry() { if (!this.wantOpen || this.retry) return; this.retry = setTimeout(() => { this.retry = null; this.open(); }, Math.min(8000, 400 * this.tries)); }

  private drain() {
    for (;;) {
      if (this.buf.length < 2) return;
      let mult = 1, len = 0, i = 1, b = 0;
      do { if (i >= this.buf.length) return; b = this.buf[i++]; len += (b & 127) * mult; mult *= 128; } while (b & 128 && i < 5);
      if (this.buf.length < i + len) return;
      const first = this.buf[0], body = Uint8Array.from(this.buf.slice(i, i + len));
      this.buf.splice(0, i + len);
      this.handle(first, body);
    }
  }
  private handle(first: number, body: Uint8Array) {
    const type = first >> 4;
    if (type === 2) { // CONNACK
      if (body[1] !== 0) { try { this.ws?.close(); } catch { /* closed */ } return; }
      this.tries = 0; this.set('open');
      for (const t of this.subs.keys()) this.sendSub(t);
      if (this.ping) clearInterval(this.ping);
      this.ping = setInterval(() => this.ws?.readyState === 1 && this.ws.send(Uint8Array.from([0xc0, 0])), 30_000);
      for (const w of this.waiters.splice(0)) w.ok();
    } else if (type === 3) { // PUBLISH
      const tl = (body[0] << 8) | body[1];
      const topic = dec.decode(body.slice(2, 2 + tl));
      let off = 2 + tl;
      if ((first >> 1) & 3) off += 2; // a packet id, if QoS > 0
      const payload = body.slice(off);
      for (const f of this.subs.get(topic) ?? []) f(payload);
    }
  }
  private sendSub(topic: string) { if (this.ws?.readyState === 1) this.ws.send(packet(0x82, [this.pid >> 8, this.pid++ & 255, ...str(topic), 0])); }

  /** Resolves when connected; rejects if the first attempt fails. */
  ready(timeoutMs = 7000): Promise<void> {
    if (this.state === 'open') return Promise.resolve();
    return new Promise((ok, fail) => {
      const t = setTimeout(() => { this.waiters = this.waiters.filter((w) => w.ok !== done.ok); fail(new Error('Could not reach a class server.')); }, timeoutMs);
      const done = { ok: () => { clearTimeout(t); ok(); }, fail: (e: Error) => { clearTimeout(t); fail(e); } };
      this.waiters.push(done);
    });
  }
  subscribe(topic: string, fn: (payload: Uint8Array) => void): () => void {
    let set = this.subs.get(topic);
    if (!set) { set = new Set(); this.subs.set(topic, set); this.sendSub(topic); }
    set.add(fn);
    return () => { set!.delete(fn); };
  }
  publish(topic: string, payload: Uint8Array | string, retain = false) {
    if (this.ws?.readyState !== 1 || this.state !== 'open') return false;
    const p = typeof payload === 'string' ? enc.encode(payload) : payload;
    this.ws.send(packet(0x30 | (retain ? 1 : 0), [...str(topic), ...p]));
    return true;
  }
  close() { this.wantOpen = false; if (this.retry) clearTimeout(this.retry); if (this.ping) clearInterval(this.ping); try { this.ws?.send(Uint8Array.from([0xe0, 0])); this.ws?.close(); } catch { /* closed */ } this.set('closed'); }
}

export const DEFAULT_BROKERS = ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt', 'wss://test.mosquitto.org:8081/mqtt', 'wss://mqtt.eclipseprojects.io:443/mqtt'];
export function brokers(): string[] {
  try { const o = localStorage.getItem('sb:live:brokers'); if (o) { const j = o.startsWith('[') ? JSON.parse(o) : [o]; if (Array.isArray(j) && j.length) return j; } } catch { /* storage unavailable */ }
  return DEFAULT_BROKERS;
}
