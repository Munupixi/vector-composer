import { useEffect, useMemo, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';
import { extractObject } from './svg';
import type { LibraryComponent, SceneObject, SourceObject } from './types';
import { catalog, sourceUrl } from './catalog';
import SourceCatalogue from './components/SourceCatalogue';
import SvgFragment from './components/SvgFragment';
import ObjectProperties from './components/ObjectProperties';
import SceneLayers from './components/SceneLayers';
import { duplicateObject, moveLayer, objectTransform, resizeObject } from './scene';
import { useProject } from './useProject';
import { downloadSvg, exportComposition } from './export';
import { exampleReferences, exampleScene, type Example } from './examples';
import { hydrateComponents } from './storage';
import ExamplesDialog from './components/ExamplesDialog';
import CompositionControls from './components/CompositionControls';
import { formats } from './composition';
import { componentColors, paintComponent } from './paint';
import { originalPaints, palettes } from './palettes';
import { defaultSettings, type CompositionSettings } from './composition';
import { figmaReference, figmaSourceId, type ObjectRole } from './figmaCatalog';
import AutoComposer from './components/AutoComposer';
import { generationReferences, layoutComponents, selectComponents } from './generation';
import type { ComponentReference } from './storage';
import Confirmation from './components/Confirmation';

function ComponentPreview({ component }: { component: LibraryComponent }) {
  return <svg viewBox={`0 0 ${component.width} ${component.height}`} aria-hidden="true">
    <SvgFragment markup={component.markup} prefix={`thumb-${component.id}`} /></svg>;
}

export default function App() {
  const { title, setTitle, sourceId, setSourceId, library, setLibrary, scene, setScene,
    ready, storageProblem, retryStorage, saving, settings, setSettings } = useProject();
  const format = formats[settings.format];
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [exampleLoading, setExampleLoading] = useState(false);
  const operationInProgress = useRef(false);
  const activeSource = catalog.find(s => s.id === sourceId)!;
  const objects: SourceObject[] = activeSource.objects;
  const [source, setSource] = useState('');
  const [chosen, setChosen] = useState<string | null>(null);
  const [selection, setSelection] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [generationVariant, setGenerationVariant] = useState(0);
  const [showLegacyLibrary, setShowLegacyLibrary] = useState(false);
  useEffect(() => {
    if (!ready) return;
    const reference = figmaReference(sourceId);
    if (!reference || reference.size !== (settings.detail ?? 'l')) setShowLegacyLibrary(true);
  }, [ready, sourceId, settings.detail]);
  const visibleLibrary = library.filter(c => { const f = figmaReference(c.sourceId);
    return showLegacyLibrary || (f && f.size === (settings.detail ?? 'l')); });
  const [confirmation, setConfirmation] = useState<{ message: string; resolve: (yes: boolean) => void } | null>(null);
  const requestConfirmation = (message: string) => new Promise<boolean>(resolve => setConfirmation({ message, resolve }));
  const painted = useMemo(() => new Map(library.map(c => [c.id,
    paintComponent(c.markup, c.colors ?? [], settings.palette, figmaReference(c.sourceId)?.role === 'background')])), [library, settings.palette]);
  const canvasRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: string; pointerId: number; startX: number; startY: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(sourceUrl(activeSource), { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error('Исходник не загрузился. Обновите страницу.'); return r.text(); })
      .then(setSource).catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, [activeSource]);

  async function ensureComponents(refs: ComponentReference[]) {
    const missing = refs.filter((r, i) => !library.some(c => c.sourceId === r.sourceId && c.objectId === r.objectId)
      && refs.findIndex(c => c.sourceId === r.sourceId && c.objectId === r.objectId) === i);
    return [...library, ...await hydrateComponents(missing)];
  }

  async function generate(query: string, mode: 'metaphor' | 'objects', background: boolean) {
    if (operationInProgress.current) return;
    try {
      const keys = selectComponents(query, mode);
      if (scene.length && !await requestConfirmation('Текущий холст будет заменён новой композицией. Компоненты останутся в библиотеке.')) return;
      operationInProgress.current = true; setExampleLoading(true);
      const refs = generationReferences(keys, settings.detail ?? 'l', background);
      const components = await ensureComponents(refs);
      const chosen = refs.map(r => components.find(c => c.sourceId === r.sourceId && c.objectId === r.objectId)!);
      const next = layoutComponents(chosen, settings.format, generationVariant);
      setLibrary(components); setScene(next); setTitle(query.trim().slice(0,120)); setSelection(null);
      setSettings(s => ({ ...s, palette: s.palette ?? palettes[0] })); chooseSource(chosen.find(c => figmaReference(c.sourceId)?.role === 'main')!.sourceId);
      setGenerationVariant(v => v + 1); setError('');
      setNotice(`Композиция собрана: ${keys.map(k => components.find(c => figmaReference(c.sourceId)?.key === k)?.name).join(', ')}. Можно менять объекты вручную или собрать другой вариант.`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось собрать композицию.'); }
    finally { operationInProgress.current = false; setExampleLoading(false); }
  }

  async function changeSettings(next: CompositionSettings) {
    if (operationInProgress.current) return;
    if ((next.detail ?? 'l') !== (settings.detail ?? 'l')) {
      operationInProgress.current = true; setExampleLoading(true);
      try {
        const refs = library.flatMap(c => { const f = figmaReference(c.sourceId); return f ? [{ id: crypto.randomUUID(), sourceId: figmaSourceId(f.key, next.detail ?? 'l', f.role), objectId: 'object' }] : []; });
        const components = await ensureComponents(refs);
        const result = scene.map(item => {
          const old = library.find(c => c.id === item.componentId)!; const f = figmaReference(old.sourceId);
          if (!f) return item;
          const replacement = components.find(c => c.sourceId === figmaSourceId(f.key, next.detail ?? 'l', f.role))!;
          const scale = item.scale * old.width / replacement.width;
          if (scale < .05 || scale > 3) throw new Error('Для этого объекта сначала уменьшите или увеличьте масштаб, затем смените детализацию.');
          return { ...item, componentId: replacement.id, scale,
            y: item.y + (old.height*item.scale - replacement.height*scale)/2 };
        });
        setLibrary(components); setScene(result); setSettings(next);
        const f = figmaReference(sourceId); if (f) chooseSource(figmaSourceId(f.key, next.detail ?? 'l', f.role));
        setNotice('Подгружены исходные компоненты выбранной детализации.'); setError('');
      } catch(e) { setError(e instanceof Error ? e.message : 'Не удалось сменить детализацию.'); }
      finally { operationInProgress.current = false; setExampleLoading(false); }
    } else {
      if (next.format !== settings.format) {
        const before = formats[settings.format], after = formats[next.format];
        const scale = Math.min(after.width/before.width, after.height/before.height);
        if (scene.some(o => o.scale*scale < .05 || o.scale*scale > 3)) { setError('Масштаб объекта выходит за допустимые границы при смене формата. Сначала скорректируйте его масштаб.'); return; }
        setScene(items => items.map(o => ({ ...o, scale:o.scale*scale,
          x:(o.x-before.width/2)*scale+after.width/2, y:(o.y-before.height/2)*scale+after.height/2 })));
      }
      setSettings(next);
    }
  }

  async function changeRole(role: ObjectRole) {
    if (operationInProgress.current) return;
    if (!selectedInstance || !selectedComponent) return;
    const f = figmaReference(selectedComponent.sourceId); if (!f || f.role === role) return;
    operationInProgress.current = true; setExampleLoading(true);
    try {
      const target = figmaSourceId(f.key, f.size, role);
      const components = await ensureComponents([{ id:crypto.randomUUID(), sourceId:target, objectId:'object' }]);
      const replacement = components.find(c => c.sourceId === target)!;
      const scale = selectedInstance.scale*selectedComponent.width/replacement.width;
      if (scale < .05 || scale > 3) throw new Error('Измените масштаб объекта перед сменой роли.');
      setLibrary(components); setScene(items => items.map(o => o.id === selectedInstance.id ? { ...o, componentId:replacement.id, role, scale,
        y:o.y+(selectedComponent.height*o.scale-replacement.height*scale)/2 } : o));
      setSettings(s => ({ ...s, palette:s.palette ?? palettes[0] })); setError('');
    } catch(e) { setError(e instanceof Error ? e.message : 'Не удалось сменить роль.'); }
    finally { operationInProgress.current = false; setExampleLoading(false); }
  }

  function chooseSource(id: string) {
    if (id !== sourceId) { setSource(''); setChosen(null); setError(''); setSourceId(id); }
    setCatalogOpen(false);
  }

  const selectedObject = objects.find(o => o.id === chosen);
  const selectedInstance = scene.find(o => o.id === selection);
  const selectedComponent = library.find(c => c.id === selectedInstance?.componentId);

  function exportScene() {
    try { downloadSvg(exportComposition(title, scene, library, settings), title); setNotice('SVG скачан: объекты остались векторными и сгруппированными.'); setError(''); }
    catch (error) { setError(error instanceof Error ? error.message : 'Не удалось экспортировать SVG.'); }
  }

  async function newScene() {
    if (scene.length && !await requestConfirmation('Холст будет очищен. Компоненты останутся в библиотеке.')) return;
    setScene([]); setSelection(null); setTitle('Новая история'); setNotice('Новый холст готов. Компоненты сохранены в библиотеке.');
  }

  async function loadExample(example: Example) {
    if (operationInProgress.current) return;
    if (scene.length && !await requestConfirmation('Текущая композиция будет заменена примером. Компоненты останутся в библиотеке.')) return;
    operationInProgress.current = true; setExamplesOpen(false); setExampleLoading(true);
    try {
      const components = [...library, ...await hydrateComponents(exampleReferences(example, library))];
      const items = exampleScene(example, components);
      setLibrary(components); setScene(items); setTitle(example.title); setSelection(null); setError('');
      setSettings(example.settings ?? defaultSettings);
      chooseSource(example.placements.find(p => figmaReference(p.sourceId)?.role === 'main')?.sourceId ?? example.placements[0].sourceId);
      if (example.placements.some(p => !figmaReference(p.sourceId))) setShowLegacyLibrary(true);
      setNotice('Открыт пример из исходных SVG. Все объекты можно изменять по отдельности.');
    } catch (error) { setError(error instanceof Error ? error.message : 'Не удалось открыть пример.'); }
    finally { operationInProgress.current = false; setExampleLoading(false); }
  }

  function changeSelected(patch: Partial<Pick<SceneObject, 'x' | 'y' | 'rotation'>>) {
    setScene(items => items.map(item => item.id === selection ? { ...item, ...patch } : item));
  }
  function duplicateSelected() {
    if (!selectedInstance) return;
    const copy = duplicateObject(selectedInstance, crypto.randomUUID());
    setScene(items => [...items, copy]); setSelection(copy.id);
    setNotice('Создана независимая копия объекта.');
  }
  function deleteSelected() {
    setScene(items => items.filter(item => item.id !== selection)); setSelection(null);
    setNotice('Объект удалён с холста. Компонент остался в библиотеке.');
  }
  function handleKeys(event: KeyboardEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (!ready || exampleLoading || confirmation || catalogOpen || examplesOpen || target.closest('input, textarea, select, [contenteditable="true"]') || !selectedInstance) return;
    if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); deleteSelected(); }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') { event.preventDefault(); duplicateSelected(); }
    const step = event.shiftKey ? 10 : 1;
    const directions: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const delta = directions[event.key];
    if (delta) { event.preventDefault(); changeSelected({ x: selectedInstance.x + delta[0], y: selectedInstance.y + delta[1] }); }
  }

  function saveComponent() {
    if (!chosen || !selectedObject) return;
    if (library.some(c => c.sourceId === sourceId && c.objectId === chosen)) {
      setNotice('Этот объект уже есть в библиотеке. Нажмите на его карточку, чтобы добавить на холст.'); return;
    }
    try {
      const extracted = extractObject(source, chosen);
      const id = crypto.randomUUID();
      const reference = figmaReference(sourceId);
      if (!reference || reference.size !== (settings.detail ?? 'l')) setShowLegacyLibrary(true);
      setLibrary(items => [...items, { ...extracted, id,
        sourceId, objectId: chosen, name: selectedObject.name, colors: figmaReference(sourceId) ? originalPaints : componentColors(extracted.markup) }]);
      setNotice(`Компонент «${selectedObject.name}» сохранён. Теперь нажмите на его карточку.`); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось извлечь объект.'); }
  }

  function addToCanvas(component: LibraryComponent) {
    const id = crypto.randomUUID();
    const scale = Math.min(format.width*.3 / component.width, format.height*.4 / component.height, 1);
    setScene(items => [...items, { id, componentId: component.id, x: 150 + (items.length % 6) * 65,
      y: 130 + (items.length % 6) * 45, scale, rotation: 0, role: figmaReference(component.sourceId)?.role }]);
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

  return <div className="app-shell" onKeyDown={handleKeys}>
    <header className="topbar">
      <a className="brand" href="/" aria-label="Сочетай — на главную"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>сочетай<span className="brand-dot">.</span></a>
      <span className="topbar-caption">Конструктор векторных композиций</span>
      <span className="local-badge"><span /> {storageProblem ? 'Автосохранение недоступно' : saving ? 'Сохраняем…' : 'Сохранено в браузере'}</span>
      <button className="export-button" disabled={!ready || exampleLoading || !scene.length} onClick={exportScene}>Скачать SVG <span>↓</span></button>
    </header>
    <div className="workspace" inert={!ready || exampleLoading}>
      <aside className="sidebar">
        <section className="source-section">
          <div className="section-heading"><h2>Исходный объект</h2><button className="text-button" onClick={() => setCatalogOpen(true)}>Библиотека ↗</button></div>
          <p className="helper">{objects.length ? 'Выберите объект в иллюстрации или в списке ниже.' : 'Этот исходник доступен для просмотра. Выберите подготовленный, чтобы извлечь объект.'}</p>
          {chosen && <style>{`.source-preview [data-component]:not([data-component="${chosen}"]) { opacity: .16; }`}</style>}
          <div className="source-preview" data-selected={chosen ?? ''} onClick={event => {
            const key = (event.target as Element).closest('[data-component]')?.getAttribute('data-component');
            if (key) { setChosen(key); setNotice(''); }
          }} dangerouslySetInnerHTML={{ __html: source }} />
          <div className="source-caption"><strong>{activeSource.title}</strong><span>{activeSource.credit ?? 'Open Doodles · CC0'} · SVG {objects.length > 0 && '· Готов к извлечению'}</span></div>
          <div className="object-list" aria-label="Объекты исходника">{objects.map((object, index) =>
            <button key={object.id} className={`object-option ${chosen === object.id ? 'active' : ''}`} aria-pressed={chosen === object.id}
              onClick={() => { setChosen(object.id); setNotice(''); }}>
              <span className="object-number">0{index + 1}</span><span>{object.name}</span><span className="choice-mark">{chosen === object.id ? '✓' : '+'}</span>
            </button>)}</div>
          {objects.length ? <button className="primary-button" disabled={!chosen || !source} onClick={saveComponent}>Сохранить в библиотеку <span>↗</span></button>
            : <button className="primary-button" onClick={() => setCatalogOpen(true)}>Выбрать другой исходник <span>↗</span></button>}
        </section>
        <section className="library-section">
          <div className="section-heading"><h2>Мои компоненты</h2><span className="count">{String(visibleLibrary.length).padStart(2, '0')}</span></div>
          <label className="library-filter"><input type="checkbox" checked={showLegacyLibrary} onChange={e => setShowLegacyLibrary(e.target.checked)} /> Все размеры и прежняя библиотека</label>
          {visibleLibrary.length === 0 ? <div className="library-empty"><span aria-hidden="true">▧</span><p>Здесь появятся ваши объекты</p><small>Сохраните объект из библиотеки или соберите композицию по запросу.</small></div>
            : <div className="component-grid">{visibleLibrary.map(component => <button key={component.id} className="component-card" onClick={() => addToCanvas(component)} aria-label={`Добавить на холст: ${component.name}`}>
              <div className="component-picture"><ComponentPreview component={component} /><span className="card-plus">+</span></div>
              <strong>{component.name}</strong><small>{catalog.find(s => s.id === component.sourceId)?.title}</small>
            </button>)}</div>}
        </section>
        <div className="sidebar-footer">Библиотека из задания Figma<br />Только исходные векторные объекты</div>
      </aside>
      <main className="editor">
        <div className="editor-heading"><div><span className="eyebrow">ВАША КОМПОЗИЦИЯ</span><input className="scene-title" aria-label="Название композиции" maxLength={120} value={title} onChange={e => setTitle(e.target.value)} placeholder="Новая история" /></div><span className="format-label">SVG <span>{format.width} × {format.height}</span></span></div>
        <AutoComposer busy={exampleLoading || !ready} onGenerate={generate} />
        <CompositionControls busy={!ready || exampleLoading} settings={settings} onChange={s => { void changeSettings(s); }} />
        <div className="canvas-toolbar"><span><span className="status-dot" /> Холст</span><span>Объектов: {scene.length} · Источников: {new Set(scene.map(item => library.find(c => c.id === item.componentId)?.sourceId)).size}</span></div>
        <div className="canvas-surround"><div className="canvas-paper" style={{ aspectRatio: `${format.width}/${format.height}`, background: settings.palette?.background ?? '#fff' }}>
          <svg ref={canvasRef} className="composition" viewBox={`0 0 ${format.width} ${format.height}`} aria-label="Холст композиции" tabIndex={0}
            onPointerDown={() => setSelection(null)} onPointerMove={moveDrag} onPointerUp={() => { drag.current = null; }}
            onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
            {scene.map(item => { const component = library.find(c => c.id === item.componentId)!;
              return <g key={item.id} transform={objectTransform(item, component)}
                className="scene-object" data-instance={item.id} onPointerDown={event => startDrag(event, item)}>
                <rect width={component.width} height={component.height} fill="transparent" />
                <SvgFragment markup={painted.get(component.id)!} prefix={`instance-${item.id}`} />
                {selection === item.id && <rect className="selection-outline" x="-6" y="-6" width={component.width + 12} height={component.height + 12}
                  fill="none" stroke="#416b57" strokeWidth={1.5 / item.scale} strokeDasharray={`${6 / item.scale} ${4 / item.scale}`} pointerEvents="none" />}
              </g>;
            })}
          </svg>
          {scene.length === 0 && <div className="canvas-empty"><span className="empty-art" aria-hidden="true">✳</span><h2>У каждой истории<br />есть первый элемент</h2><p>Сохраните объект из иллюстрации слева,<br />затем добавьте его из библиотеки на холст.</p><span className="empty-step">01 — Выберите · 02 — Сохраните · 03 — Сочетайте</span></div>}
        </div></div>
        <div className="canvas-footer"><span>{selectedComponent ? `Выбрано: ${selectedComponent.name}` : 'Выбирайте и перемещайте объекты мышью'}</span><span>Векторный холст</span></div>
        <div className="feedback" role={error ? 'alert' : 'status'}>{error || notice || (scene.length ? 'Выберите объект на холсте или в списке слоёв. Изменения сохраняются в этом браузере.' : 'Начните с выбора объекта в исходной иллюстрации.')}</div>
        <div className="editor-bottom-actions"><button className="new-scene-button" disabled={!ready} onClick={() => { void newScene(); }}>＋ Новая композиция</button>
          <button className="new-scene-button" disabled={!ready || exampleLoading} onClick={() => setExamplesOpen(true)}>Посмотреть примеры ↗</button></div>
        {storageProblem && <div className="storage-warning" role="alert"><p>{storageProblem} Можно продолжить работу и скачать SVG. Текущая сцена не сохраняется автоматически.</p>
          <button onClick={retryStorage}>Сохранить текущую сцену вместо прежней</button></div>}
      </main>
      <aside className="properties-panel">
        <ObjectProperties item={selectedInstance} component={selectedComponent} onChange={changeSelected}
          onScale={scale => { if (selectedComponent) setScene(items => items.map(item => item.id === selection ? resizeObject(item, selectedComponent, scale) : item)); }}
          onDuplicate={duplicateSelected} onDelete={deleteSelected} onRole={role => { void changeRole(role); }} />
        <SceneLayers scene={scene} library={library} selection={selection} onSelect={setSelection}
          onMove={direction => { if (selection) setScene(items => moveLayer(items, selection, direction)); }} />
      </aside>
    </div>
    {catalogOpen && <SourceCatalogue activeId={sourceId} onChoose={chooseSource} onClose={() => setCatalogOpen(false)} />}
    {confirmation && <Confirmation message={confirmation.message} onResolve={yes => { confirmation.resolve(yes); setConfirmation(null); }} />}
    {examplesOpen && <ExamplesDialog onChoose={example => { void loadExample(example); }} onClose={() => setExamplesOpen(false)} />}
    {(!ready || exampleLoading) && <div className="loading-overlay" role="status">{exampleLoading ? 'Загружаем SVG и обновляем композицию…' : 'Восстанавливаем вашу композицию…'}</div>}
  </div>;
}
