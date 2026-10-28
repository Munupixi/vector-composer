import { afterEach, expect, it, vi } from 'vitest';
import { publicUrl } from './publicUrl';
import { catalog, sourceUrl } from './catalog';

afterEach(() => vi.unstubAllEnvs());

it('loads both libraries and downloads under the project hosting path', () => {
  vi.stubEnv('BASE_URL', '/vector-composer/');
  expect(publicUrl('')).toBe('/vector-composer/');
  expect(publicUrl('/palettes/example.json')).toBe('/vector-composer/palettes/example.json');
  expect(publicUrl('examples/study-desk.svg')).toBe('/vector-composer/examples/study-desk.svg');
  for (const source of catalog) expect(sourceUrl(source)).toMatch(/^\/vector-composer\/assets\//);
});

it('retains root paths for local development', () => {
  vi.stubEnv('BASE_URL', '/');
  expect(publicUrl('examples/study-desk.svg')).toBe('/examples/study-desk.svg');
});
