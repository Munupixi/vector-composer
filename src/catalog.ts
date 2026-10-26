import type { SourceIllustration } from './types';
import { figmaObjects, figmaSourceId } from './figmaCatalog';

export const catalog: SourceIllustration[] = [
  ...figmaObjects.flatMap(object => (['s', 'l'] as const).flatMap(size => (['main', 'background'] as const).map(role => ({
    id: figmaSourceId(object.id, size, role), title: `${object.name} · ${size.toUpperCase()} · ${role === 'main' ? 'Главный' : 'Фоновый'}`,
    objects: [{ id: 'object', name: object.name }], assetUrl: `/assets/figma/${object.id}-${size}-${role}.svg`, credit: 'Библиотека из задания · Figma',
  })))),
  { id: 'clumsy', title: 'Бумажный вихрь', objects: [
    { id: 'character', name: 'Персонаж' }, { id: 'papers-left', name: 'Листы слева' }, { id: 'papers-right', name: 'Листы справа' },
  ] },
  { id: 'dog-jump', title: 'Вместе на пробежке', objects: [
    { id: 'dog', name: 'Собака' }, { id: 'runner', name: 'Бегущий персонаж' }, { id: 'motion', name: 'Линии движения' },
  ] },
  { id: 'sitting-reading', title: 'Тихий вечер', objects: [
    { id: 'reader', name: 'Читатель на стуле' }, { id: 'books', name: 'Стопка книг' }, { id: 'book', name: 'Книга' },
  ] },
  ...[
    ['levitate', 'Лёгкость'], ['coffee', 'Чашка кофе'], ['reading', 'Время читать'],
    ['roller-skating', 'На роликах'], ['plant', 'С растением'], ['running', 'В движении'],
    ['groovy', 'Хороший ритм'], ['moshing', 'Полная свобода'], ['ballet', 'Балет'],
    ['rolling', 'На колёсах'], ['meditating', 'Медитация'], ['sitting', 'Пауза'],
    ['unboxing', 'Распаковка'], ['jumping', 'Выше неба'], ['selfie', 'На память'],
    ['dancing', 'Танец'], ['strolling', 'Прогулка'],
  ].map(([id, title]) => ({ id, title, objects: [] })),
];

export function sourceUrl(source: SourceIllustration) {
  return source.assetUrl ?? `/assets/${source.objects.length ? 'prepared' : 'originals'}/${source.id}.svg`;
}
