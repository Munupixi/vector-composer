/** The provided Figma library has two genuine detail levels and two paint roles. */
export const figmaObjects = [
  { id: 'book', name: 'Книга', words: ['книг', 'учебник', 'book'], themes: ['учеб', 'знани', 'чтен', 'образован', 'экзамен', 'развити', 'учить', 'учиться'] },
  { id: 'phone', name: 'Телефон', words: ['телефон', 'смартфон', 'phone'], themes: ['связ', 'общени', 'цифров', 'соцсет', 'дистанц', 'онлайн', 'технолог'] },
  { id: 'puzzle', name: 'Пазлы', words: ['пазл', 'puzzle'], themes: ['команд', 'решени', 'задач', 'вместе', 'сотруднич', 'иде', 'творч', 'логик'] },
  { id: 'coin', name: 'Монета', words: ['монет', 'coin'], themes: ['деньг', 'финанс', 'бюджет', 'доход', 'накоп', 'эконом', 'инвест', 'богат', 'оплат'] },
  { id: 'headphones', name: 'Наушники', words: ['наушник', 'headphone'], themes: ['музык', 'звук', 'подкаст', 'слуш', 'отдых', 'фокус', 'сосредоточ', 'концентрац'] },
  { id: 'lamp', name: 'Лампа', words: ['ламп', 'светильник', 'lamp'], themes: ['свет', 'иде', 'вдохнов', 'работ', 'ноч', 'учеб', 'учиться', 'обучен', 'уют', 'фокус', 'знани'] },
  { id: 'folder', name: 'Папка', words: ['папк', 'folder'], themes: ['документ', 'офис', 'порядок', 'работ', 'архив', 'план', 'организац', 'карьер'] },
  { id: 'pen', name: 'Ручка', words: ['ручк', 'pen'], themes: ['пис', 'творч', 'учеб', 'учиться', 'обучен', 'договор', 'иде', 'замет', 'план', 'знани'] },
  { id: 'wallet', name: 'Кошелёк', words: ['кошелек', 'wallet'], themes: ['деньг', 'финанс', 'покуп', 'оплат', 'бюджет', 'накоп', 'эконом'] },
  { id: 'flowers', name: 'Цветы', words: ['цветок', 'цветы', 'цветоч', 'цветк', 'букет', 'flowers'], themes: ['рост', 'весн', 'праздник', 'подар', 'природ', 'уют', 'забот', 'вдохнов'] },
] as const;
export type ObjectKey = typeof figmaObjects[number]['id'];
export type DetailSize = 's' | 'l';
export type ObjectRole = 'main' | 'background';
export const figmaSourceId = (key: string, size: DetailSize, role: ObjectRole = 'main') => `figma-${key}-${size}-${role}`;
export function figmaReference(sourceId: string): { key: ObjectKey; size: DetailSize; role: ObjectRole } | null {
  const match = /^figma-([a-z]+)-(s|l)-(main|background)$/.exec(sourceId);
  if (!match || !figmaObjects.some(o => o.id === match[1])) return null;
  return { key: match[1] as ObjectKey, size: match[2] as DetailSize, role: match[3] as ObjectRole };
}
