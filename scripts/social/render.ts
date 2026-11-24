// Draws a daily card with the SAME code the app uses (src/lib/dayCard/draw.ts), in a headless browser, so a post and a user's card are the same picture.
import { readFileSync } from 'node:fs';
import { buildSync } from 'esbuild';
import { chromium, type Browser } from 'playwright';
import type { DayCardSpec } from '../../src/lib/dayCard/draw';

let bundle: string | null = null;
const code = () => (bundle ??= buildSync({ entryPoints: [new URL('../../src/lib/dayCard/draw.ts', import.meta.url).pathname], bundle: true, format: 'iife', globalName: 'DC', write: false, target: 'es2020' }).outputFiles[0].text);

export interface RenderJob { /** a picture behind the words makes a big PNG; JPEG is a tenth of the size and what the platforms re-encode to anyway */ format?: 'png' | 'jpeg'; spec: DayCardSpec; w: number; h: number; /** a picture file on disk (jpg or png), or none for the flat colour */ imagePath?: string | null; dim?: number }
export interface Rendered { png: Buffer; fit: number }

export async function withRenderer<T>(use: (render: (j: RenderJob) => Promise<Rendered>) => Promise<T>): Promise<T> {
  const browser: Browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent('<html><body style="margin:0"><canvas id="c"></canvas></body></html>');
    await page.addScriptTag({ content: code() });
    return await use(async (j) => {
      const dataUrl = j.imagePath ? `data:image/${/\.png$/i.test(j.imagePath) ? 'png' : 'jpeg'};base64,${readFileSync(j.imagePath).toString('base64')}` : null;
      const r = await page.evaluate(async ({ spec, w, h, dataUrl, dim, format }) => {
        const c = document.getElementById('c') as HTMLCanvasElement;
        c.width = w; c.height = h;
        let img: HTMLImageElement | null = null;
        if (dataUrl) { img = new Image(); img.src = dataUrl; await img.decode(); }
        const res = (window as any).DC.drawDayCard(c.getContext('2d')!, w, h, spec, { img, dim });
        return { url: format === 'jpeg' ? c.toDataURL('image/jpeg', 0.9) : c.toDataURL('image/png'), fit: res.fit };
      }, { spec: j.spec, w: j.w, h: j.h, dataUrl, dim: j.dim, format: j.format ?? 'png' });
      return { png: Buffer.from(r.url.split(',')[1], 'base64'), fit: r.fit };
    });
  } finally { await browser.close(); }
}
