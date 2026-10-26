// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { selectObject } from './svg';
import { paintComponent } from './paint';
import { originalPaints, palettes } from './palettes';

const assets = import.meta.glob('../public/assets/figma/*.svg', { query:'?raw', import:'default', eager:true }) as Record<string,string>;
const originals = import.meta.glob('../public/assets/figma-originals/*.svg', { query:'?raw', import:'default', eager:true }) as Record<string,string>;
const parse = (s:string) => new DOMParser().parseFromString(s,'image/svg+xml');
describe('provided Figma vectors', () => {
  it('preserves source geometry in all forty extracted variants', () => {
    expect(Object.keys(assets)).toHaveLength(40);
    for (const [path,text] of Object.entries(assets)) {
      const size = path.includes('-s-') ? 'S' : 'L';
      const original = parse(originals[`../public/assets/figma-originals/${size}.svg`]);
      const sourcePaths = new Set(Array.from(original.querySelectorAll('path')).map(p => p.getAttribute('d')));
      const doc = selectObject(text,'object');
      const groupId = doc.querySelector('g')!.getAttribute('id');
      const originalGroup = Array.from(original.querySelectorAll('g')).find(g => g.getAttribute('id') === groupId)!;
      const attributes = (root: Element) => Array.from(root.querySelectorAll('path')).map(p => Object.fromEntries(Array.from(p.attributes).map(a => [a.name,a.value])));
      expect(attributes(doc)).toEqual(attributes(originalGroup));
      expect(doc.querySelector('image, script, foreignObject')).toBeNull();
      expect(doc.querySelectorAll('path').length).toBeGreaterThan(0);
      for (const p of doc.querySelectorAll('path')) expect(sourcePaths.has(p.getAttribute('d'))).toBe(true);
    }
  });
  it('maps source paints into allowed role slots for each supplied scheme', () => {
    const source = selectObject(assets['../public/assets/figma/book-l-main.svg'],'object');
    const geometry = Array.from(source.querySelectorAll('path')).map(p => p.getAttribute('d'));
    for (const palette of palettes) {
      const repainted = parse(`<svg xmlns="http://www.w3.org/2000/svg">${paintComponent(source.innerHTML,originalPaints,palette)}</svg>`);
      expect(Array.from(repainted.querySelectorAll('path')).map(p => p.getAttribute('d'))).toEqual(geometry);
      for (const node of repainted.querySelectorAll('[fill]')) {
        if (node.getAttribute('fill') !== 'none') expect(palette.objectColors).toContain(node.getAttribute('fill'));
      }
    }
  });
});
