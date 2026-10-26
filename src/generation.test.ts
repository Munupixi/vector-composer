import { describe, expect, it } from 'vitest';
import { layoutComponents, selectComponents } from './generation';
import { formats, type Format } from './composition';
import type { LibraryComponent } from './types';

describe('automatic composition', () => {
  it('recognizes names and topic metaphors without inventing objects', () => {
    expect(selectComponents('книга, лампа и наушники', 'objects')).toEqual(['book','headphones','lamp']);
    expect(selectComponents('Время учиться', 'metaphor')).toEqual(['book','lamp','pen']);
    expect(selectComponents('Финансовая подушка', 'metaphor')).toEqual(['coin','wallet']);
    expect(selectComponents('КОШЕЛЁК', 'objects')).toEqual(['wallet']);
    expect(selectComponents('цветная книга', 'objects')).toEqual(['book']);
    expect(selectComponents('цветы и букет', 'objects')).toEqual(['flowers']);
    expect(selectComponents('книга, телефон, пазлы, монета, наушники, лампа, папка, ручка, кошелёк, цветы', 'objects')).toHaveLength(10);
    expect(() => selectComponents('космический дракон', 'metaphor')).toThrow('Не нашёл');
    expect(() => selectComponents(' ', 'objects')).toThrow();
  });
  it('keeps every main object inside every format with uniform scaling', () => {
    const components: LibraryComponent[] = Array.from({ length: 10 }, (_,i) => ({ id: `c${i}`, sourceId:`figma-book-l-main`, objectId:'object', name:'Book',
      width: 300+i*50, height: 200+i*80, markup:'<path/>' }));
    for (const f of Object.keys(formats) as Format[]) for (let count=1;count<=10;count++) for (const variant of [0,1,2]) {
      const scene = layoutComponents(components.slice(0,count), f, variant);
      const format = formats[f];
      expect(scene).toHaveLength(count);
      for (const object of scene) {
        const c = components.find(c => c.id === object.componentId)!;
        expect(object.x).toBeGreaterThanOrEqual(0); expect(object.y).toBeGreaterThanOrEqual(0);
        expect(object.x+c.width*object.scale).toBeLessThanOrEqual(format.width);
        expect(object.y+c.height*object.scale).toBeLessThanOrEqual(format.height);
        expect(object.rotation).toBe(0);
      }
    }
  });
});
