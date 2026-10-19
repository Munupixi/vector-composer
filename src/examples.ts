import type { LibraryComponent, SceneObject } from './types';
import type { ComponentReference } from './storage';

interface Placement { sourceId: string; objectId: string; x: number; y: number; height: number; rotation?: number; }
export interface Example { id: string; title: string; subtitle: string; placements: Placement[]; }

export const examples: Example[] = [
  { id: 'paper-walk', title: 'Бумажная прогулка', subtitle: 'Персонаж, собака и немного книжной магии', placements: [
    { sourceId: 'clumsy', objectId: 'character', x: 130, y: 290, height: 390 },
    { sourceId: 'dog-jump', objectId: 'dog', x: 590, y: 440, height: 200 },
    { sourceId: 'sitting-reading', objectId: 'books', x: 950, y: 490, height: 150 },
    { sourceId: 'clumsy', objectId: 'papers-right', x: 810, y: 80, height: 270, rotation: -12 },
  ] },
  { id: 'quiet-hour', title: 'Тихий час', subtitle: 'Книга, верный друг и свободный вечер', placements: [
    { sourceId: 'sitting-reading', objectId: 'reader', x: 120, y: 120, height: 560 },
    { sourceId: 'dog-jump', objectId: 'dog', x: 740, y: 410, height: 240 },
    { sourceId: 'clumsy', objectId: 'papers-left', x: 800, y: 80, height: 260 },
    { sourceId: 'sitting-reading', objectId: 'book', x: 700, y: 690, height: 60, rotation: -8 },
  ] },
  { id: 'big-story', title: 'Большая история', subtitle: 'Разные ритмы встречаются в одной сцене', placements: [
    { sourceId: 'sitting-reading', objectId: 'reader', x: 100, y: 330, height: 340 },
    { sourceId: 'dog-jump', objectId: 'runner', x: 530, y: 170, height: 430 },
    { sourceId: 'clumsy', objectId: 'papers-right', x: 1000, y: 80, height: 310 },
    { sourceId: 'sitting-reading', objectId: 'books', x: 980, y: 540, height: 130 },
    { sourceId: 'dog-jump', objectId: 'dog', x: 580, y: 620, height: 135 },
  ] },
];

export function exampleReferences(example: Example, library: LibraryComponent[]): ComponentReference[] {
  const refs = new Map<string, ComponentReference>();
  for (const placement of example.placements) {
    const key = `${placement.sourceId}:${placement.objectId}`;
    if (library.some(c => c.sourceId === placement.sourceId && c.objectId === placement.objectId)) continue;
    refs.set(key, { id: `component-${placement.sourceId}-${placement.objectId}`, sourceId: placement.sourceId, objectId: placement.objectId });
  }
  return [...refs.values()];
}

export function exampleScene(example: Example, library: LibraryComponent[]): SceneObject[] {
  return example.placements.map((placement, i) => {
    const component = library.find(c => c.sourceId === placement.sourceId && c.objectId === placement.objectId);
    if (!component) throw new Error('Компоненты примера не загружены.');
    return { id: `${example.id}-${i}-${crypto.randomUUID()}`, componentId: component.id,
      x: placement.x, y: placement.y, scale: Math.min(3, Math.max(0.05, placement.height / component.height)), rotation: placement.rotation ?? 0 };
  });
}
