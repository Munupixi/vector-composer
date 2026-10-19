import type { LibraryComponent, SceneObject } from './types';

export function objectTransform(item: SceneObject, component: LibraryComponent): string {
  const cx = component.width / 2;
  const cy = component.height / 2;
  return `translate(${item.x + cx * item.scale} ${item.y + cy * item.scale}) rotate(${item.rotation}) scale(${item.scale}) translate(${-cx} ${-cy})`;
}

/** Scaling keeps the object's center fixed, so the object doesn't jump away. */
export function resizeObject(item: SceneObject, component: LibraryComponent, scale: number): SceneObject {
  if (!Number.isFinite(scale)) return item;
  const next = Math.min(3, Math.max(0.05, scale));
  return { ...item, scale: next,
    x: item.x + component.width * (item.scale - next) / 2,
    y: item.y + component.height * (item.scale - next) / 2 };
}

export function moveLayer(scene: SceneObject[], id: string, direction: -1 | 1): SceneObject[] {
  const index = scene.findIndex(item => item.id === id);
  const next = index + direction;
  if (index < 0 || next < 0 || next >= scene.length) return scene;
  const result = [...scene];
  [result[index], result[next]] = [result[next], result[index]];
  return result;
}

export function duplicateObject(item: SceneObject, id: string): SceneObject {
  return { ...item, id, x: item.x + 24, y: item.y + 24 };
}
