import { catalog, sourceUrl } from './catalog';
import { extractObject } from './svg';
import type { LibraryComponent, SceneObject } from './types';

export const STORAGE_KEY = 'sochetaI.project.v1';
export interface ComponentReference { id: string; sourceId: string; objectId: string; }
export interface ProjectSnapshot {
  version: 1;
  title: string;
  sourceId: string;
  components: ComponentReference[];
  scene: SceneObject[];
}

export function snapshotProject(title: string, sourceId: string, library: LibraryComponent[], scene: SceneObject[]): ProjectSnapshot {
  return { version: 1, title, sourceId,
    components: library.map(({ id, sourceId, objectId }) => ({ id, sourceId, objectId })), scene };
}

function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }
function validId(value: unknown): value is string { return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value); }
function finite(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value); }

/** Read only known asset references, never executable SVG markup from storage. */
export function parseSnapshot(raw: string): ProjectSnapshot {
  const data: unknown = JSON.parse(raw);
  const invalid = () => { throw new Error('Сохранённая композиция повреждена или имеет другую версию.'); };
  if (!record(data) || data.version !== 1 || typeof data.title !== 'string' || data.title.length > 120
    || !catalog.some(s => s.id === data.sourceId) || !Array.isArray(data.components) || !Array.isArray(data.scene)) return invalid();
  const components: ComponentReference[] = [];
  const componentIds = new Set<string>();
  const assetIds = new Set<string>();
  for (const component of data.components) {
    if (!record(component) || !validId(component.id) || typeof component.sourceId !== 'string' || typeof component.objectId !== 'string'
      || !catalog.some(s => s.id === component.sourceId && s.objects.some(o => o.id === component.objectId))
      || componentIds.has(component.id) || assetIds.has(`${component.sourceId}:${component.objectId}`)) return invalid();
    componentIds.add(component.id); assetIds.add(`${component.sourceId}:${component.objectId}`);
    components.push({ id: component.id, sourceId: component.sourceId, objectId: component.objectId });
  }
  const ids = new Set<string>();
  const scene: SceneObject[] = [];
  for (const item of data.scene) {
    if (!record(item) || !validId(item.id) || !validId(item.componentId) || !componentIds.has(item.componentId)
      || ids.has(item.id) || !finite(item.x) || !finite(item.y) || !finite(item.scale) || !finite(item.rotation)
      || item.scale < 0.05 || item.scale > 3 || item.rotation < -180 || item.rotation > 180) return invalid();
    ids.add(item.id);
    scene.push({ id: item.id, componentId: item.componentId, x: item.x, y: item.y, scale: item.scale, rotation: item.rotation });
  }
  return { version: 1, title: data.title, sourceId: data.sourceId as string, components, scene };
}

export async function hydrateComponents(references: ComponentReference[]): Promise<LibraryComponent[]> {
  const sources = new Map<string, string>();
  await Promise.all([...new Set(references.map(r => r.sourceId))].map(async id => {
    const source = catalog.find(s => s.id === id);
    if (!source?.objects.length) throw new Error('Источник компонента недоступен.');
    const response = await fetch(sourceUrl(source));
    if (!response.ok) throw new Error('Не удалось загрузить SVG для восстановления сцены.');
    sources.set(id, await response.text());
  }));
  return references.map(reference => {
    const object = catalog.find(s => s.id === reference.sourceId)?.objects.find(o => o.id === reference.objectId);
    if (!object) throw new Error('Объект компонента недоступен.');
    return { ...reference, name: object.name, ...extractObject(sources.get(reference.sourceId)!, reference.objectId) };
  });
}
