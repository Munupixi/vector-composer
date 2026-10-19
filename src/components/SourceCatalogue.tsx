import { useEffect, useRef, useState } from 'react';
import { catalog } from '../catalog';

interface Props { activeId: string; onChoose: (id: string) => void; onClose: () => void; }

export default function SourceCatalogue({ activeId, onChoose, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [preparedOnly, setPreparedOnly] = useState(false);
  useEffect(() => { dialog.current?.showModal(); }, []);
  const visible = preparedOnly ? catalog.filter(source => source.objects.length) : catalog;
  return <dialog ref={dialog} className="catalog-dialog" aria-labelledby="catalog-title" onCancel={onClose}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="dialog-heading"><div><span className="eyebrow">OPEN DOODLES · PABLO STANLEY · CC0</span><h2 id="catalog-title">20 иллюстраций. Бесконечно много историй.</h2></div>
      <button className="icon-button" onClick={onClose} aria-label="Закрыть каталог">×</button></div>
    <p className="dialog-helper">Три иллюстрации подготовлены для извлечения объектов. Остальные доступны для просмотра.</p>
    <label className="filter-toggle"><input type="checkbox" checked={preparedOnly} onChange={event => setPreparedOnly(event.target.checked)} /> Только с готовыми объектами</label>
    <div className="catalog-grid">{visible.map(source => <button className={`catalog-card ${source.id === activeId ? 'current' : ''}`} key={source.id}
      onClick={() => onChoose(source.id)} aria-label={`Открыть исходник: ${source.title}`}>
      <div className="catalog-picture"><img src={`/assets/originals/${source.id}.svg`} alt="" loading="lazy" /></div>
      <strong>{source.title}</strong><span>{source.objects.length ? `${source.objects.length} комп. · Можно извлекать` : 'Просмотр исходника'}</span>
    </button>)}</div>
  </dialog>;
}
