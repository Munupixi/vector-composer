import type { Palette } from './composition';

export function componentColors(markup: string): string[] {
  return [...new Set((markup.match(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi) ?? []).map(c => c.toLowerCase()))];
}

/** Recolor known source paints without changing geometry, IDs or opacity. */
export function paintComponent(markup: string, sourceColors: string[], palette: Palette | null, background = false): string {
  if (!palette) return markup;
  const targetColors = background ? palette.backgroundColors : palette.objectColors;
  const replacements = new Map(sourceColors.map((c, i) => [c.toLowerCase(), targetColors[i % targetColors.length]]));
  const doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`, 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw new Error('Не удалось прочитать цвета SVG.');
  for (const element of doc.querySelectorAll('*')) {
    for (const attr of ['fill', 'stroke', 'stop-color']) {
      let color = element.getAttribute(attr)?.toLowerCase();
      if (color === 'white') color = '#ffffff';
      if (color === 'black') color = '#000000';
      if (color && replacements.has(color)) element.setAttribute(attr, replacements.get(color)!);
    }
    // Exported Figma styles can contain presentation colors in style attributes.
    const style = element.getAttribute('style');
    if (style) element.setAttribute('style', style.replace(/((?:fill|stroke|stop-color)\s*:\s*)(#[0-9a-f]{6}|#[0-9a-f]{3})(?=\s*(?:;|$))/gi,
      (match, property: string, color: string) => replacements.has(color.toLowerCase()) ? property + replacements.get(color.toLowerCase()) : match));
  }
  return Array.from(doc.documentElement.childNodes).map(n => new XMLSerializer().serializeToString(n)).join('');
}
