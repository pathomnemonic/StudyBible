// A tiny MQTT-over-WebSocket broker for tests and for trying live classes on a local network:  node scripts/dev/mini-broker.mjs [port]
// Supports what the app uses: CONNECT, SUBSCRIBE (exact topics), PUBLISH at QoS 0, PINGREQ, DISCONNECT. Not for production use.
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';

export function startBroker(port = 0) {
  const clients = new Set();
  const server = createServer((_, res) => { res.writeHead(426).end(); });
  server.on('upgrade', (req, socket) => {
    const key = req.headers['sec-websocket-key'];
    socket.write(['HTTP/1.1 101 Switching Protocols', 'Upgrade: websocket', 'Connection: Upgrade', `Sec-WebSocket-Accept: ${createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64')}`, 'Sec-WebSocket-Protocol: mqtt', '', ''].join('\r\n'));
    const c = { socket, subs: new Set(), buf: Buffer.alloc(0), mq: Buffer.alloc(0) };
    clients.add(c);
    const wsSend = (data) => {
      const len = data.length; let head;
      if (len < 126) head = Buffer.from([0x82, len]); else if (len < 65536) head = Buffer.from([0x82, 126, len >> 8, len & 255]); else { head = Buffer.alloc(10); head[0] = 0x82; head[1] = 127; head.writeBigUInt64BE(BigInt(len), 2); }
      socket.write(Buffer.concat([head, data]));
    };
    const handleMqtt = (first, body) => {
      const type = first >> 4;
      if (type === 1) wsSend(Buffer.from([0x20, 2, 0, 0]));
      else if (type === 8) { let o = 2; const out = []; while (o < body.length) { const l = body.readUInt16BE(o); c.subs.add(body.toString('utf8', o + 2, o + 2 + l)); o += 2 + l + 1; out.push(0); } wsSend(Buffer.from([0x90, 2 + out.length, body[0], body[1], ...out])); }
      else if (type === 3) {
        const l = body.readUInt16BE(0); const topic = body.toString('utf8', 2, 2 + l);
        const rem = []; let n = body.length; do { let b = n % 128; n = Math.floor(n / 128); if (n > 0) b |= 128; rem.push(b); } while (n > 0);
        const pkt = Buffer.concat([Buffer.from([0x30, ...rem]), body]);
        for (const o of clients) if (o.subs.has(topic)) { const len = pkt.length; let head; if (len < 126) head = Buffer.from([0x82, len]); else if (len < 65536) head = Buffer.from([0x82, 126, len >> 8, len & 255]); else { head = Buffer.alloc(10); head[0] = 0x82; head[1] = 127; head.writeBigUInt64BE(BigInt(len), 2); } o.socket.write(Buffer.concat([head, pkt])); }
      } else if (type === 12) wsSend(Buffer.from([0xd0, 0]));
    };
    const drainMqtt = () => {
      for (;;) {
        if (c.mq.length < 2) return;
        let mult = 1, len = 0, i = 1, b;
        do { if (i >= c.mq.length) return; b = c.mq[i++]; len += (b & 127) * mult; mult *= 128; } while (b & 128);
        if (c.mq.length < i + len) return;
        handleMqtt(c.mq[0], c.mq.subarray(i, i + len)); c.mq = c.mq.subarray(i + len);
      }
    };
    socket.on('data', (d) => {
      c.buf = Buffer.concat([c.buf, d]);
      for (;;) {
        if (c.buf.length < 2) return;
        const op = c.buf[0] & 15; let len = c.buf[1] & 127, off = 2;
        if (len === 126) { if (c.buf.length < 4) return; len = c.buf.readUInt16BE(2); off = 4; } else if (len === 127) { if (c.buf.length < 10) return; len = Number(c.buf.readBigUInt64BE(2)); off = 10; }
        const masked = c.buf[1] & 128; if (masked) off += 4;
        if (c.buf.length < off + len) return;
        const payload = Buffer.from(c.buf.subarray(off, off + len));
        if (masked) for (let k = 0; k < payload.length; k++) payload[k] ^= c.buf[off - 4 + (k % 4)];
        c.buf = c.buf.subarray(off + len);
        if (op === 8) { socket.end(); return; }
        if (op === 2) { c.mq = Buffer.concat([c.mq, payload]); drainMqtt(); }
      }
    });
    socket.on('close', () => clients.delete(c));
    socket.on('error', () => clients.delete(c));
  });
  return new Promise((res) => server.listen(port, '127.0.0.1', () => res({ port: server.address().port, close: () => { for (const c of clients) c.socket.destroy(); server.close(); } })));
}
if (import.meta.url === `file://${process.argv[1]}`) startBroker(+(process.argv[2] ?? 1883)).then((b) => console.log(`mini broker on ws://127.0.0.1:${b.port}`));
