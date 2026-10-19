import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const RAW = join(ROOT, 'data/raw');
export const PUBLIC_DATA = join(ROOT, 'public/data');
export const REGISTRY = join(ROOT, 'data/registry');
export const CURATED = join(ROOT, 'data/curated');
export const PROVENANCE = join(ROOT, 'data/provenance');

export const sha256 = (buf: Uint8Array | string) => createHash('sha256').update(buf).digest('hex');

export function readJson<T = any>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

export function writeJson(path: string, data: unknown, pretty = false) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, pretty ? JSON.stringify(data, null, 1) + '\n' : JSON.stringify(data));
}

export function writeText(path: string, text: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}

export function readText(path: string) {
  return readFileSync(path, 'utf8');
}

export const exists = existsSync;

/** Collects warnings/errors during a build so they end up in a report instead of scrolling past. */
export class Report {
  warnings: string[] = [];
  errors: string[] = [];
  stats: Record<string, unknown> = {};
  warn = (m: string) => {
    this.warnings.push(m);
  };
  error = (m: string) => {
    this.errors.push(m);
  };
}

export const today = () => new Date().toISOString().slice(0, 10);
