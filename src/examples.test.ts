import { describe, expect, it } from 'vitest';
import { catalog } from './catalog';
import { examples, exampleReferences, exampleScene } from './examples';

describe('demonstration compositions', () => {
  it('provides three examples, each referencing three different SVG sources', () => {
    expect(examples).toHaveLength(3);
    for (const example of examples) {
      expect(new Set(example.placements.map(p => p.sourceId)).size).toBe(3);
      for (const p of example.placements) expect(catalog.some(s => s.id === p.sourceId && s.objects.some(o => o.id === p.objectId))).toBe(true);
    }
  });
  it('reuses existing library components instead of creating duplicates', () => {
    const example = examples[0];
    const refs = exampleReferences(example, []);
    const library = refs.map(ref => ({ ...ref, name: ref.objectId, markup: '', width: 200, height: 300 }));
    expect(exampleReferences(example, library)).toEqual([]);
    const scene = exampleScene(example, library);
    expect(scene).toHaveLength(example.placements.length);
    expect(scene[0].scale).toBe(example.placements[0].height / 300);
    expect(scene[0].componentId).toBe(library[0].id);
  });
});
