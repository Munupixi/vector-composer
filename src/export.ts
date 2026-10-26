import { namespaceIds } from './svg';
import { objectTransform } from './scene';
import type { LibraryComponent, SceneObject } from './types';
import { defaultSettings, formats, type CompositionSettings } from './composition';
import { paintComponent } from './paint';
import { figmaReference } from './figmaCatalog';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function exportComposition(title: string, scene: SceneObject[], library: LibraryComponent[], settings: CompositionSettings = defaultSettings): string {
  const svg = document.createElementNS(SVG_NS, 'svg');
  const { width, height } = formats[settings.format];
  svg.setAttribute('width', String(width)); svg.setAttribute('height', String(height)); svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  const heading = document.createElementNS(SVG_NS, 'title'); heading.textContent = title || 'Новая история'; svg.appendChild(heading);
  const description = document.createElementNS(SVG_NS, 'desc');
  description.textContent = 'Композиция из исходных SVG-компонентов. Собрана в «Сочетай». Геометрия объектов сохранена.';
  svg.appendChild(description);
  if (settings.palette) {
    const background = document.createElementNS(SVG_NS, 'rect');
    background.setAttribute('width', String(width)); background.setAttribute('height', String(height));
    background.setAttribute('fill', settings.palette.background); background.setAttribute('data-background', 'true');
    svg.appendChild(background);
  }
  const components = new Map(library.map(c => [c.id, c]));
  for (const item of scene) {
    const component = components.get(item.componentId);
    if (!component) throw new Error('Не найден компонент одного из объектов.');
    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('id', `object-${item.id}`); group.setAttribute('data-source', component.sourceId);
    group.setAttribute('data-component', component.objectId); group.setAttribute('transform', objectTransform(item, component));
    // Only authoritative fragments from our prepared assets reach the exporter.
    group.innerHTML = namespaceIds(paintComponent(component.markup, component.colors ?? [], settings.palette,
      figmaReference(component.sourceId)?.role === 'background'), `export-${item.id}`);
    svg.appendChild(group);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(svg)}`;
}

export function downloadSvg(contents: string, title: string) {
  const name = title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').trim().slice(0, 80) || 'composition';
  const url = URL.createObjectURL(new Blob([contents], { type: 'image/svg+xml;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `${name}.svg`;
  document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
