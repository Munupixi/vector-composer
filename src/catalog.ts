import type { SourceIllustration } from './types';

export const catalog: SourceIllustration[] = [
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
  return `/assets/${source.objects.length ? 'prepared' : 'originals'}/${source.id}.svg`;
}
