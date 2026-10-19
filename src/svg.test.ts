// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import original from '../public/assets/originals/clumsy.svg?raw';
import prepared from '../public/assets/prepared/clumsy.svg?raw';
import { namespaceIds, selectObject } from './svg';

describe('SVG extraction', () => {
  it('preserves all original path geometry, colors and order during preparation', () => {
    const parse = (text: string) => new DOMParser().parseFromString(text, 'image/svg+xml');
    const before = Array.from(parse(original).querySelectorAll('path'));
    const after = Array.from(parse(prepared).querySelectorAll('path'));
    expect(after).toHaveLength(before.length);
    after.forEach((path, i) => {
      expect(path.getAttribute('d')).toBe(before[i].getAttribute('d'));
      expect(path.getAttribute('fill')).toBe(before[i].getAttribute('fill'));
      expect(path.getAttribute('data-component')).toBeTruthy();
    });
  });

  it('extracts only the chosen logical object and keeps inherited transforms', () => {
    const result = selectObject(prepared, 'papers-right');
    expect(result.querySelectorAll('path')).toHaveLength(5);
    const ink = result.querySelector('[id="Ink"]');
    expect(ink?.getAttribute('fill')).toBe('#000000');
    expect(ink?.getAttribute('transform')).toBe('translate(27.999643, -0.500294)');
    expect(result.querySelector('[id="Accent"]')).toBeNull();
    expect(result.querySelector('[data-component]')).toBeNull();
  });

  it('preserves the colored accent and outlines when extracting the character', () => {
    const result = selectObject(prepared, 'character');
    expect(result.querySelector('[id="Accent"]')?.getAttribute('fill')).toBe('#FF5678');
    expect(result.querySelectorAll('path')).toHaveLength(40);
  });

  it('rejects malformed input and a missing object', () => {
    expect(() => selectObject('<svg>', 'missing')).toThrow();
    expect(() => selectObject(prepared, 'missing')).toThrow('не найден');
  });
});

describe('SVG instance IDs', () => {
  const fragment = '<defs><clipPath id="clip"><rect width="10" height="10"/></clipPath></defs><g clip-path="url(#clip)"><path id="shape" d="M0 0L10 10"/><use href="#shape"/></g>';

  it('rewrites IDs and their clip-path / use references together', () => {
    const result = namespaceIds(fragment, 'copy1');
    expect(result).toContain('id="copy1-clip"');
    expect(result).toContain('clip-path="url(#copy1-clip)"');
    expect(result).toContain('href="#copy1-shape"');
  });

  it('gives two copies disjoint ID sets without changing path geometry', () => {
    const a = namespaceIds(fragment, 'a');
    const b = namespaceIds(fragment, 'b');
    expect(a).not.toContain('id="b-');
    expect(b).not.toContain('id="a-');
    expect(a).toContain('d="M0 0L10 10"');
    expect(b).toContain('d="M0 0L10 10"');
  });
});
