// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import original from '../public/assets/originals/clumsy.svg?raw';
import prepared from '../public/assets/prepared/clumsy.svg?raw';
import dogOriginal from '../public/assets/originals/dog-jump.svg?raw';
import dogPrepared from '../public/assets/prepared/dog-jump.svg?raw';
import booksPrepared from '../public/assets/prepared/sitting-reading.svg?raw';
import booksOriginal from '../public/assets/originals/sitting-reading.svg?raw';
import { catalog } from './catalog';
import { namespaceIds, selectObject } from './svg';

describe('SVG extraction', () => {
  it('preserves the 20 legacy sources alongside all 40 provided variants', () => {
    const legacy = catalog.filter(s => !s.id.startsWith('figma-'));
    expect(legacy).toHaveLength(20);
    expect(new Set(catalog.map(s => s.id)).size).toBe(catalog.length);
    expect(legacy.filter(s => s.objects.length)).toHaveLength(3);
    expect(catalog.filter(s => s.id.startsWith('figma-'))).toHaveLength(40);
  });

  it('splits the dog accent without changing a single original path command', () => {
    const commands = (text: string) => Array.from(new DOMParser().parseFromString(text, 'image/svg+xml')
      .querySelectorAll('path')).map(p => p.getAttribute('d')).join('');
    expect(commands(dogPrepared)).toBe(commands(dogOriginal));
    const dog = selectObject(dogPrepared, 'dog');
    expect(dog.querySelector('[id="dog-jump-tongue"]')?.getAttribute('fill')).toBe('#FF5678');
    expect(dog.querySelector('[id="dog-jump-path-1"]')).toBeNull();
  });

  it('separates books from the reader without changing source paths', () => {
    const parse = (text: string) => new DOMParser().parseFromString(text, 'image/svg+xml');
    expect(Array.from(parse(booksPrepared).querySelectorAll('path')).map(p => p.getAttribute('d')))
      .toEqual(Array.from(parse(booksOriginal).querySelectorAll('path')).map(p => p.getAttribute('d')));
    const books = selectObject(booksPrepared, 'books');
    expect(books.querySelector('[id="sitting-reading-path-2"]')).not.toBeNull();
    expect(books.querySelector('[id="sitting-reading-path-1"]')).toBeNull();
  });

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

  it('keeps nested geometry when a complete group is marked as a component', () => {
    const result = selectObject('<svg xmlns="http://www.w3.org/2000/svg"><g data-component="object" transform="translate(4 5)"><g><path d="M0 0L10 10"/></g></g><path d="M5 5L2 2"/></svg>','object');
    expect(result.querySelectorAll('path')).toHaveLength(1);
    expect(result.querySelector('path')?.getAttribute('d')).toBe('M0 0L10 10');
    expect(result.querySelector('g')?.getAttribute('transform')).toBe('translate(4 5)');
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
