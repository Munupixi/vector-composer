import { describe, expect, it } from 'vitest';
import { duplicateObject, moveLayer, objectTransform, resizeObject } from './scene';
import type { LibraryComponent, SceneObject } from './types';

const item: SceneObject = { id: 'a', componentId: 'component', x: 100, y: 200, scale: 1, rotation: 30 };
const component: LibraryComponent = { id: 'component', name: 'Test', sourceId: 'clumsy', objectId: 'character', markup: '', width: 200, height: 100 };

describe('scene editing', () => {
  it('scales around the same center', () => {
    const resized = resizeObject(item, component, 2);
    expect(resized.x + component.width * resized.scale / 2).toBe(200);
    expect(resized.y + component.height * resized.scale / 2).toBe(250);
    expect(item.scale).toBe(1);
  });
  it('rejects nonfinite scale and limits it to a usable range', () => {
    expect(resizeObject(item, component, NaN)).toBe(item);
    expect(resizeObject(item, component, 0).scale).toBe(0.05);
    expect(resizeObject(item, component, 99).scale).toBe(3);
  });
  it('duplicates independently while retaining the component reference', () => {
    const copy = duplicateObject(item, 'b');
    copy.rotation = -10;
    expect(item.rotation).toBe(30);
    expect(copy).toMatchObject({ id: 'b', componentId: item.componentId, x: 124, y: 224 });
  });
  it('changes layer order without mutating the original scene', () => {
    const scene = [item, { ...item, id: 'b' }, { ...item, id: 'c' }];
    expect(moveLayer(scene, 'a', 1).map(o => o.id)).toEqual(['b', 'a', 'c']);
    expect(scene.map(o => o.id)).toEqual(['a', 'b', 'c']);
    expect(moveLayer(scene, 'a', -1)).toBe(scene);
    expect(moveLayer(scene, 'missing', 1)).toBe(scene);
  });
  it('uses the component center for rotation and scaling', () => {
    expect(objectTransform(item, component)).toBe('translate(200 250) rotate(30) scale(1) translate(-100 -50)');
  });
});
