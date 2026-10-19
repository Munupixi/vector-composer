// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { parseSnapshot, snapshotProject } from './storage';
import type { ProjectSnapshot } from './storage';

const saved: ProjectSnapshot = { version: 1, title: 'Пример', sourceId: 'clumsy',
  components: [{ id: 'component-1', sourceId: 'clumsy', objectId: 'character' }],
  scene: [{ id: 'object-1', componentId: 'component-1', x: -25, y: 100, scale: 0.5, rotation: 45 }] };

describe('project storage', () => {
  it('restores a valid scene with its provenance and transforms', () => {
    expect(parseSnapshot(JSON.stringify(saved))).toEqual(saved);
  });
  it('stores references rather than SVG markup and derived dimensions', () => {
    const snapshot = snapshotProject('Test', 'clumsy', [{ ...saved.components[0], name: 'Character', markup: '<path/>', width: 20, height: 20 }], saved.scene);
    expect(JSON.stringify(snapshot)).not.toContain('<path');
    expect(snapshot.components).toEqual(saved.components);
  });
  it('rejects broken references, duplicates and unknown versions', () => {
    expect(() => parseSnapshot(JSON.stringify({ ...saved, version: 2 }))).toThrow();
    expect(() => parseSnapshot(JSON.stringify({ ...saved, components: [] }))).toThrow();
    expect(() => parseSnapshot(JSON.stringify({ ...saved, scene: [...saved.scene, ...saved.scene] }))).toThrow();
    expect(() => parseSnapshot(JSON.stringify({ ...saved, components: [{ ...saved.components[0], objectId: 'unknown' }] }))).toThrow();
  });
  it('rejects invalid geometry and malformed JSON', () => {
    expect(() => parseSnapshot('{')).toThrow();
    expect(() => parseSnapshot(JSON.stringify({ ...saved, scene: [{ ...saved.scene[0], scale: 0 }] }))).toThrow();
    expect(() => parseSnapshot(JSON.stringify({ ...saved, scene: [{ ...saved.scene[0], x: '100' }] }))).toThrow();
  });
});
