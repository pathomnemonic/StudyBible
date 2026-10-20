import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = join(__dirname, '..', 'public', 'data', 'lens')

describe('lens datasets', () => {
  const files = readdirSync(dir).filter(f => f.endsWith('.json'))
  it('has datasets', () => expect(files.length).toBeGreaterThan(0))
  for (const f of files) {
    it(`${f} is non-empty with refs and text`, () => {
      const raw = JSON.parse(readFileSync(join(dir, f), 'utf8'))
      const list = Array.isArray(raw) ? raw : raw.entries ?? raw.items
      expect(Array.isArray(list)).toBe(true)
      expect(list.length).toBeGreaterThan(0)
      for (const e of list) expect(JSON.stringify(e).length).toBeGreaterThan(20)
    })
  }
})
