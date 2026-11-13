// A throwaway preview server the test can switch off, so "offline" really means nothing answers (Playwright's offline switch does not reach the service worker).
import { spawn } from 'node:child_process';
export async function startServer(port = 4199) {
  const proc = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], { stdio: 'ignore', detached: true });
  const base = `http://localhost:${port}`;
  for (let i = 0; i < 40; i++) { try { if ((await fetch(base)).ok) break; } catch { /* not up yet */ } await new Promise((r) => setTimeout(r, 250)); }
  return { base, stop: () => { try { process.kill(-proc.pid); } catch { /* already gone */ } } };
}
