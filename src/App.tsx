import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { extractObject, namespaceIds } from './svg';
import type { LibraryComponent, SceneObject, SourceObject } from './types';
import { catalog, sourceUrl } from './catalog';
import SourceCatalogue from './components/SourceCatalogue';

function ComponentPreview({ component }: { component: LibraryComponent }) {
  return <svg viewBox={`0 0 ${component.width} ${component.height}`} aria-hidden="true"
    dangerouslySetInnerHTML={{ __html: namespaceIds(component.markup, `thumb-${component.id}`) }} />;
}

export default function App() {
  const [sourceId, setSourceId] = useState('clumsy');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const activeSource = catalog.find(s => s.id === sourceId)!;
  const objects: SourceObject[] = activeSource.objects;
  const [source, setSource] = useState('');
  const [chosen, setChosen] = useState<string | null>(null);
  const [library, setLibrary] = useState<LibraryComponent[]>([]);
  const [scene, setScene] = useState<SceneObject[]>([]);
  const [selection, setSelection] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const canvasRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: string; pointerId: number; startX: number; startY: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(sourceUrl(activeSource), { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error('Исходник не загрузился. Обновите страницу.'); return r.text(); })
      .then(setSource).catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, [activeSource]);

  function chooseSource(id: string) {
    if (id !== sourceId) { setSource(''); setChosen(null); setError(''); setSourceId(id); }
    setCatalogOpen(false);
  }

  const selectedObject = objects.find(o => o.id === chosen);
  const selectedInstance = scene.find(o => o.id === selection);
  const selectedComponent = library.find(c => c.id === selectedInstance?.componentId);

  function saveComponent() {
    if (!chosen || !selectedObject) return;
    if (library.some(c => c.sourceId === sourceId && c.objectId === chosen)) {
      setNotice('Этот объект уже есть в библиотеке. Нажмите на его карточку, чтобы добавить на холст.'); return;
    }
    try {
      const extracted = extractObject(source, chosen);
      const id = crypto.randomUUID();
      setLibrary(items => [...items, { ...extracted, id,
        sourceId, objectId: chosen, name: selectedObject.name }]);
      setNotice(`Компонент «${selectedObject.name}» сохранён. Теперь нажмите на его карточку.`); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось извлечь объект.'); }
  }

  function addToCanvas(component: LibraryComponent) {
    const id = crypto.randomUUID();
    const scale = Math.min(320 / component.width, 360 / component.height, 1);
    setScene(items => [...items, { id, componentId: component.id, x: 150 + (items.length % 6) * 65,
      y: 130 + (items.length % 6) * 45, scale, rotation: 0 }]);
    setSelection(id); setNotice(`Компонент «${component.name}» добавлен на холст. Его можно перетащить мышью.`);
  }

  function canvasPoint(event: PointerEvent<SVGSVGElement | SVGGElement>) {
    const matrix = canvasRef.current?.getScreenCTM();
    return matrix ? new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()) : null;
  }
  function startDrag(event: PointerEvent<SVGGElement>, item: SceneObject) {
    if (event.button !== 0) return;
    event.stopPropagation(); const point = canvasPoint(event); if (!point) return;
    setSelection(item.id);
    drag.current = { id: item.id, pointerId: event.pointerId, startX: point.x, startY: point.y, x: item.x, y: item.y };
    canvasRef.current?.setPointerCapture(event.pointerId);
  }
  function moveDrag(event: PointerEvent<SVGSVGElement>) {
    const current = drag.current; const point = canvasPoint(event);
    if (!current || current.pointerId !== event.pointerId || !point) return;
    setScene(items => items.map(item => item.id === current.id ? {
      ...item, x: current.x + point.x - current.startX, y: current.y + point.y - current.startY,
    } : item));
  }

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="/" aria-label="Сочетай — на главную"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>сочетай<span className="brand-dot">.</span></a>
      <span className="topbar-caption">Конструктор векторных композиций</span>
      <span className="local-badge"><span /> Локальный проект</span>
    </header>
    <div className="workspace">
      <aside className="sidebar">
        <section className="source-section">
          <div className="section-heading"><h2>Исходная иллюстрация</h2><button className="text-button" onClick={() => setCatalogOpen(true)}>Все 20 ↗</button></div>
          <p className="helper">{objects.length ? 'Выберите объект в иллюстрации или в списке ниже.' : 'Этот исходник доступен для просмотра. Выберите подготовленный, чтобы извлечь объект.'}</p>
          {chosen && <style>{`.source-preview [data-component]:not([data-component="${chosen}"]) { opacity: .16; }`}</style>}
          <div className="source-preview" data-selected={chosen ?? ''} onClick={event => {
            const key = (event.target as Element).closest('[data-component]')?.getAttribute('data-component');
            if (key) { setChosen(key); setNotice(''); }
          }} dangerouslySetInnerHTML={{ __html: source }} />
          <div className="source-caption"><strong>{activeSource.title}</strong><span>Open Doodles · SVG {objects.length > 0 && '· Готов к извлечению'}</span></div>
          <div className="object-list" aria-label="Объекты исходника">{objects.map((object, index) =>
            <button key={object.id} className={`object-option ${chosen === object.id ? 'active' : ''}`} aria-pressed={chosen === object.id}
              onClick={() => { setChosen(object.id); setNotice(''); }}>
              <span className="object-number">0{index + 1}</span><span>{object.name}</span><span className="choice-mark">{chosen === object.id ? '✓' : '+'}</span>
            </button>)}</div>
          {objects.length ? <button className="primary-button" disabled={!chosen || !source} onClick={saveComponent}>Сохранить в библиотеку <span>↗</span></button>
            : <button className="primary-button" onClick={() => setCatalogOpen(true)}>Выбрать другой исходник <span>↗</span></button>}
        </section>
        <section className="library-section">
          <div className="section-heading"><h2>Мои компоненты</h2><span className="count">{String(library.length).padStart(2, '0')}</span></div>
          {library.length === 0 ? <div className="library-empty"><span aria-hidden="true">▧</span><p>Здесь появятся ваши объекты</p><small>Выберите объект и сохраните его в библиотеку.</small></div>
            : <div className="component-grid">{library.map(component => <button key={component.id} className="component-card" onClick={() => addToCanvas(component)} aria-label={`Добавить на холст: ${component.name}`}>
              <div className="component-picture"><ComponentPreview component={component} /><span className="card-plus">+</span></div>
              <strong>{component.name}</strong><small>Нажмите, чтобы добавить</small>
            </button>)}</div>}
        </section>
        <div className="sidebar-footer">Иллюстрации: Pablo Stanley · CC0<br />Только элементы исходного SVG</div>
      </aside>
      <main className="editor">
        <div className="editor-heading"><div><span className="eyebrow">ВАША КОМПОЗИЦИЯ</span><h1>Новая история</h1></div><span className="format-label">SVG <span>1200 × 800</span></span></div>
        <div className="canvas-toolbar"><span><span className="status-dot" /> Холст</span><span>Объектов: {scene.length}</span></div>
        <div className="canvas-surround"><div className="canvas-paper">
          <svg ref={canvasRef} className="composition" viewBox="0 0 1200 800" aria-label="Холст композиции"
            onPointerDown={() => setSelection(null)} onPointerMove={moveDrag} onPointerUp={() => { drag.current = null; }}
            onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
            {scene.map(item => { const component = library.find(c => c.id === item.componentId)!;
              return <g key={item.id} transform={`translate(${item.x} ${item.y}) rotate(${item.rotation}) scale(${item.scale})`}
                className="scene-object" data-instance={item.id} onPointerDown={event => startDrag(event, item)}>
                <rect width={component.width} height={component.height} fill="transparent" />
                <g dangerouslySetInnerHTML={{ __html: namespaceIds(component.markup, `instance-${item.id}`) }} />
                {selection === item.id && <rect className="selection-outline" x="-6" y="-6" width={component.width + 12} height={component.height + 12}
                  fill="none" stroke="#416b57" strokeWidth={1.5 / item.scale} strokeDasharray={`${6 / item.scale} ${4 / item.scale}`} pointerEvents="none" />}
              </g>;
            })}
          </svg>
          {scene.length === 0 && <div className="canvas-empty"><span className="empty-art" aria-hidden="true">✳</span><h2>У каждой истории<br />есть первый элемент</h2><p>Сохраните объект из иллюстрации слева,<br />затем добавьте его из библиотеки на холст.</p><span className="empty-step">01 — Выберите · 02 — Сохраните · 03 — Сочетайте</span></div>}
        </div></div>
        <div className="canvas-footer"><span>{selectedComponent ? `Выбрано: ${selectedComponent.name}` : 'Выбирайте и перемещайте объекты мышью'}</span><span>Векторный холст</span></div>
        <div className="feedback" role={error ? 'alert' : 'status'}>{error || notice || 'Начните с выбора объекта в исходной иллюстрации.'}</div>
      </main>
    </div>
    {catalogOpen && <SourceCatalogue activeId={sourceId} onChoose={chooseSource} onClose={() => setCatalogOpen(false)} />}
  </div>;
}
