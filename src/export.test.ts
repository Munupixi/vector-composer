// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { exportComposition } from './export';
import { objectTransform } from './scene';
import type { LibraryComponent, SceneObject } from './types';

const component: LibraryComponent = { id: 'c', name: 'Book', sourceId: 'sitting-reading', objectId: 'book', width: 100, height: 80,
  markup: '<defs><clipPath id="clip"><rect width="100" height="80"/></clipPath></defs><g clip-path="url(#clip)"><path id="outline" fill="#FF5678" d="M0 0L100 80Z"/></g>' };
const object: SceneObject = { id: 'a', componentId: 'c', x: 100, y: 200, scale: 0.5, rotation: 30 };

describe('SVG export', () => {
  it('ships three standalone examples made only of prepared source paths', () => {
    const exported = import.meta.glob('../public/examples/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
    const prepared = import.meta.glob('../public/assets/prepared/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
    expect(Object.keys(exported)).toHaveLength(3);
    for (const text of Object.values(exported)) {
      const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
      expect(doc.querySelector('parsererror, image, foreignObject, script, .selection-outline')).toBeNull();
      const groups = Array.from(doc.querySelectorAll('[data-source]'));
      expect(new Set(groups.map(g => g.getAttribute('data-source'))).size).toBe(3);
      const ids = Array.from(doc.querySelectorAll('[id]')).map(n => n.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const group of groups) {
        const source = prepared[`../public/assets/prepared/${group.getAttribute('data-source')}.svg`];
        const sourceDoc = new DOMParser().parseFromString(source, 'image/svg+xml');
        const paths = new Set(Array.from(sourceDoc.querySelectorAll('path')).map(p => p.getAttribute('d')));
        for (const path of group.querySelectorAll('path')) expect(paths.has(path.getAttribute('d'))).toBe(true);
      }
    }
  });

  it('exports standalone vector geometry, provenance and transforms without UI', () => {
    const svg = exportComposition('Книги <и> истории', [object], [component]);
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    expect(doc.querySelector('parsererror')).toBeNull();
    expect(doc.documentElement.getAttribute('viewBox')).toBe('0 0 1200 800');
    expect(doc.querySelector('title')?.textContent).toBe('Книги <и> истории');
    expect(doc.querySelector('[data-source]')?.getAttribute('transform')).toBe(objectTransform(object, component));
    expect(doc.querySelector('path')?.getAttribute('d')).toBe('M0 0L100 80Z');
    expect(doc.querySelector('path')?.getAttribute('fill')).toBe('#FF5678');
    expect(doc.querySelector('image, foreignObject, .selection-outline')).toBeNull();
  });
  it('preserves layer order and keeps duplicate definitions independent', () => {
    const svg = exportComposition('Copies', [object, { ...object, id: 'b', rotation: -20 }], [component]);
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    expect(Array.from(doc.querySelectorAll('[data-source]')).map(n => n.id)).toEqual(['object-a', 'object-b']);
    const ids = Array.from(doc.querySelectorAll('[id]')).map(n => n.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(svg).toContain('url(#export-a-clip)'); expect(svg).toContain('url(#export-b-clip)');
  });
  it('does not silently omit a missing component', () => {
    expect(() => exportComposition('Broken', [object], [])).toThrow('Не найден');
  });
});
