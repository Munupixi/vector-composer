const SVG_NS = 'http://www.w3.org/2000/svg';

/** Keep selected paths and their ancestor groups (inherited fills/transforms). */
export function selectObject(source: string, objectId: string): SVGSVGElement {
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  if (doc.querySelector('parsererror') || doc.documentElement.localName !== 'svg') {
    throw new Error('Не удалось прочитать SVG-иллюстрацию.');
  }
  const root = doc.documentElement as unknown as SVGSVGElement;
  const selected = Array.from(root.querySelectorAll('[data-component]'))
    .filter(node => node.getAttribute('data-component') === objectId);
  if (!selected.length) throw new Error('Этот объект не найден в исходнике.');
  const keep = new Set<Element>();
  for (const node of selected) {
    let current: Element | null = node;
    while (current && current !== root) { keep.add(current); current = current.parentElement; }
  }
  for (const node of Array.from(root.querySelectorAll('*')).reverse()) {
    if (node.closest('defs')) continue;
    if (!keep.has(node)) node.remove();
  }
  root.querySelectorAll('[data-component]').forEach(n => n.removeAttribute('data-component'));
  return root;
}

/** Unique IDs for every preview/instance, including references to definitions. */
export function namespaceIds(markup: string, prefix: string): string {
  const doc = new DOMParser().parseFromString(`<svg xmlns="${SVG_NS}">${markup}</svg>`, 'image/svg+xml');
  const root = doc.documentElement;
  const ids = new Map<string, string>();
  root.querySelectorAll('[id]').forEach(node => {
    const old = node.id;
    const next = `${prefix}-${old}`;
    ids.set(old, next); node.setAttribute('id', next);
  });
  root.querySelectorAll('*').forEach(node => {
    for (const attr of Array.from(node.attributes)) {
      let value = attr.value.replace(/url\(\s*['"]?#([^)'"\s]+)['"]?\s*\)/g,
        (match, id: string) => ids.has(id) ? `url(#${ids.get(id)})` : match);
      if (attr.localName === 'href' && value.startsWith('#') && ids.has(value.slice(1))) {
        value = `#${ids.get(value.slice(1))}`;
      }
      if (value !== attr.value) node.setAttributeNS(attr.namespaceURI, attr.name, value);
    }
  });
  return root.innerHTML;
}

/** Browser measurement preserves real bounds after nested SVG transforms. */
export function extractObject(source: string, objectId: string) {
  const root = selectObject(source, objectId);
  const measuringSvg = document.createElementNS(SVG_NS, 'svg');
  measuringSvg.setAttribute('aria-hidden', 'true');
  measuringSvg.style.cssText = 'position:fixed;left:-10000px;top:0;visibility:hidden;pointer-events:none';
  const group = document.createElementNS(SVG_NS, 'g');
  for (const attr of Array.from(root.attributes)) {
    if (!['xmlns', 'xmlns:xlink', 'viewBox', 'width', 'height', 'version'].includes(attr.name)) {
      group.setAttributeNS(attr.namespaceURI, attr.name, attr.value);
    }
  }
  for (const child of Array.from(root.childNodes)) group.appendChild(document.importNode(child, true));
  measuringSvg.appendChild(group); document.body.appendChild(measuringSvg);
  try {
    const box = group.getBBox();
    if (!box.width || !box.height) throw new Error('У объекта нет видимой геометрии.');
    const padding = 4;
    return {
      markup: `<g transform="translate(${padding - box.x} ${padding - box.y})">${group.outerHTML}</g>`,
      width: box.width + padding * 2, height: box.height + padding * 2,
    };
  } finally { measuringSvg.remove(); }
}
