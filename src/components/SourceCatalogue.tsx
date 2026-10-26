import { useEffect, useRef, useState } from 'react';
import { catalog, sourceUrl } from '../catalog';
import { figmaReference } from '../figmaCatalog';

interface Props { activeId: string; onChoose: (id: string) => void; onClose: () => void; }

export default function SourceCatalogue({ activeId, onChoose, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [preparedOnly, setPreparedOnly] = useState(false);
  const [family, setFamily] = useState('figma');
  useEffect(() => { dialog.current?.showModal(); }, []);
  const visible = catalog.filter(source => (family === 'figma' ? !!figmaReference(source.id) : !figmaReference(source.id)) && (!preparedOnly || source.objects.length));
  return <dialog ref={dialog} className="catalog-dialog" aria-labelledby="catalog-title" onCancel={onClose}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="dialog-heading"><div><span className="eyebrow">БИБЛИОТЕКА SVG</span><h2 id="catalog-title">Выберите исходный объект</h2></div>
      <button className="icon-button" onClick={onClose} aria-label="Закрыть каталог">×</button></div>
    <p className="dialog-helper">Библиотека из задания: 10 объектов в двух уровнях детализации и двух ролях. Старая библиотека сохранена для прежних композиций.</p>
    <label className="filter-toggle">Библиотека<select value={family} onChange={e => setFamily(e.target.value)}><option value="figma">Из задания Figma · 40 вариантов</option><option value="legacy">Open Doodles · первая версия</option></select></label>
    <label className="filter-toggle"><input type="checkbox" checked={preparedOnly} onChange={event => setPreparedOnly(event.target.checked)} /> Только с готовыми объектами</label>
    <div className="catalog-grid">{visible.map(source => <button className={`catalog-card ${source.id === activeId ? 'current' : ''}`} key={source.id}
      onClick={() => onChoose(source.id)} aria-label={`Открыть исходник: ${source.title}`}>
      <div className="catalog-picture"><img src={sourceUrl(source)} alt="" loading="lazy" /></div>
      <strong>{source.title}</strong><span>{source.objects.length ? `${source.objects.length} комп. · Можно извлекать` : 'Просмотр исходника'}</span>
    </button>)}</div>
  </dialog>;
}
