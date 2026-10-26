import { figmaObjects, figmaSourceId, type DetailSize, type ObjectKey } from './figmaCatalog';
import type { LibraryComponent, SceneObject } from './types';
import { formats, type Format } from './composition';

const normalize = (text: string) => text.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
const matches = (tokens: string[], words: readonly string[]) => words.some(w => tokens.some(t => t.startsWith(w)));

/** Transparent, offline semantic dictionary; unknown topics never produce random claims. */
export function selectComponents(query: string, mode: 'metaphor' | 'objects'): ObjectKey[] {
  if (query.length > 300) throw new Error('Запрос слишком длинный. Максимум 300 символов.');
  const tokens = normalize(query);
  if (!tokens.length) throw new Error('Введите заголовок или названия объектов.');
  const ranked = figmaObjects.map((o, i) => ({ id: o.id, order: i,
    score: (matches(tokens, o.words) ? 20 : 0) + (mode === 'metaphor' && matches(tokens, o.themes) ? 5 : 0) }))
    .filter(o => o.score > 0).sort((a,b) => b.score - a.score || a.order - b.order);
  if (!ranked.length) throw new Error(mode === 'objects'
    ? 'Не нашёл объекты. Например: книга, лампа, наушники. Названия есть в библиотеке ниже.'
    : 'Не нашёл подходящую тему в библиотеке. Попробуйте «Время учиться», «Работа в команде», «Финансовая подушка» или укажите объекты.');
  return ranked.slice(0, mode === 'objects' ? figmaObjects.length : 3).map(o => o.id);
}

export function generationReferences(keys: ObjectKey[], size: DetailSize, background: boolean) {
  return keys.map(key => ({ id: crypto.randomUUID(), sourceId: figmaSourceId(key, size), objectId: 'object' }))
    .concat(background ? [{ id: crypto.randomUUID(), sourceId: figmaSourceId(keys[keys.length - 1], size, 'background'), objectId: 'object' }] : []);
}

/** Layout uses only a uniform scale; all paths and the object's proportions stay intact. */
export function layoutComponents(components: LibraryComponent[], format: Format, variant = 0): SceneObject[] {
  const { width, height } = formats[format];
  const mains = components.filter(c => !c.sourceId.endsWith('-background'));
  const backgrounds = components.filter(c => c.sourceId.endsWith('-background'));
  if (!mains.length || mains.length > figmaObjects.length) throw new Error(`Для сборки нужны от 1 до ${figmaObjects.length} главных объектов.`);
  const order = variant % mains.length;
  const sorted = mains.slice(order).concat(mains.slice(0, order));
  const rows = height > width ? Math.ceil(Math.sqrt(sorted.length)) : Math.ceil(sorted.length / 3);
  const cols = Math.ceil(sorted.length / rows);
  const padding = Math.min(width,height) * .09;
  const cw = (width - padding*2) / cols, ch = (height - padding*2) / rows;
  const place = (c: LibraryComponent, cx: number, cy: number, w: number, h: number, role: 'main' | 'background'): SceneObject => {
    const scale = Math.min(w / c.width, h / c.height, 3);
    if (!Number.isFinite(scale) || scale < .05) throw new Error('Размер исходного объекта не подходит для этого формата.');
    return { id: crypto.randomUUID(), componentId: c.id, x: cx-c.width*scale/2, y: cy-c.height*scale/2, scale, rotation: 0, role };
  };
  return [
    ...backgrounds.map((c,i) => place(c, width*.79, height*(.23+i*.1), width*.34, height*.34, 'background')),
    ...sorted.map((c,i) => {
      const row = Math.floor(i/cols), col = i%cols;
      const lastRowCount = Math.min(cols, sorted.length - row*cols);
      const offset = (cols-lastRowCount)*cw/2;
      const stagger = variant%2 ? ((i%2)*2-1)*ch*.05 : 0;
      return place(c, padding+offset+cw*(col+.5), padding+ch*(row+.5)+stagger, cw*.84, ch*.8, 'main');
    }),
  ];
}
