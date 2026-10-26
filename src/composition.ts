export const formats = {
  landscape: { name: 'Горизонтальный', width: 1200, height: 800 },
  square: { name: 'Квадратный', width: 1080, height: 1080 },
  portrait: { name: 'Вертикальный', width: 800, height: 1200 },
} as const;
export type Format = keyof typeof formats;

export interface Palette {
  name: string;
  background: string;
  /** Only this set may be used as a composition background. */
  backgroundColors: string[];
  /** The source's object paints mapped to replacement paints, in source order. */
  objectColors: string[];
}
export interface CompositionSettings { format: Format; palette: Palette | null; detail?: 's' | 'l'; }
export const defaultSettings: CompositionSettings = { format: 'landscape', palette: null, detail: 'l' };
const hex = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);

/** JSON palettes are data only; no CSS, URLs or executable markup is accepted. */
export function parsePalette(value: unknown): Palette {
  if (!value || typeof value !== 'object') throw new Error('Палитра должна быть JSON-объектом.');
  const p = value as Record<string, unknown>;
  if (typeof p.name !== 'string' || !p.name.trim() || p.name.length > 60
    || !hex(p.background) || !Array.isArray(p.backgroundColors) || !p.backgroundColors.length
    || p.backgroundColors.length > 24 || !p.backgroundColors.every(hex)
    || !p.backgroundColors.some(c => c.toLowerCase() === (p.background as string).toLowerCase())
    || !Array.isArray(p.objectColors) || !p.objectColors.length || p.objectColors.length > 24 || !p.objectColors.every(hex)) {
    throw new Error('Укажите name, background и массивы backgroundColors, objectColors с цветами #RRGGBB. Фон должен входить в backgroundColors.');
  }
  return { name: p.name.trim(), background: p.background.toLowerCase(),
    backgroundColors: p.backgroundColors.map(c => c.toLowerCase()), objectColors: p.objectColors.map(c => c.toLowerCase()) };
}

export function parseSettings(value: unknown): CompositionSettings {
  if (!value || typeof value !== 'object') throw new Error('Некорректные настройки композиции.');
  const s = value as Record<string, unknown>;
  if (typeof s.format !== 'string' || !Object.hasOwn(formats, s.format)) throw new Error('Неизвестный формат холста.');
  if (s.detail !== undefined && s.detail !== 's' && s.detail !== 'l') throw new Error('Неизвестная детализация.');
  return { format: s.format as Format, palette: s.palette === null ? null : parsePalette(s.palette),
    ...(s.detail ? { detail: s.detail as 's' | 'l' } : {}) };
}
