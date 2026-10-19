import type { LibraryComponent, SceneObject } from '../types';
import { catalog } from '../catalog';

interface Props {
  item: SceneObject | undefined;
  component: LibraryComponent | undefined;
  onChange: (patch: Partial<Pick<SceneObject, 'x' | 'y' | 'rotation'>>) => void;
  onScale: (scale: number) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export default function ObjectProperties({ item, component, onChange, onScale, onDuplicate, onDelete }: Props) {
  const number = (value: number) => Math.round(value * 10) / 10;
  return <section className="properties-section">
    <div className="section-heading"><h2>Свойства объекта</h2><span className="count">↗</span></div>
    {!item || !component ? <p className="properties-empty">Выберите объект на холсте или в списке слоёв, чтобы изменить его.</p> : <>
      <h3 className="property-name">{component.name}</h3>
      <p className="property-source">Из: {catalog.find(s => s.id === component.sourceId)?.title}</p>
      <div className="coordinate-grid">
        <label>X<input type="number" aria-label="Положение X" step="1" value={number(item.x)} onChange={e => {
          if (Number.isFinite(e.target.valueAsNumber)) onChange({ x: e.target.valueAsNumber });
        }} /></label>
        <label>Y<input type="number" aria-label="Положение Y" step="1" value={number(item.y)} onChange={e => {
          if (Number.isFinite(e.target.valueAsNumber)) onChange({ y: e.target.valueAsNumber });
        }} /></label>
      </div>
      <div className="property-control"><label htmlFor="scale-number">Масштаб</label><div className="unit-input"><input id="scale-number" type="number" min="5" max="300" step="1"
        value={number(item.scale * 100)} onChange={e => onScale(e.target.valueAsNumber / 100)} /><span>%</span></div></div>
      <input className="property-slider" type="range" aria-label="Масштаб ползунком" min="5" max="300" step="1" value={item.scale * 100} onChange={e => onScale(Number(e.target.value) / 100)} />
      <div className="property-control"><label htmlFor="rotation-number">Поворот</label><div className="unit-input"><input id="rotation-number" type="number" min="-180" max="180" step="1"
        value={number(item.rotation)} onChange={e => { if (Number.isFinite(e.target.valueAsNumber)) onChange({ rotation: Math.max(-180, Math.min(180, e.target.valueAsNumber)) }); }} /><span>°</span></div></div>
      <input className="property-slider" type="range" aria-label="Поворот ползунком" min="-180" max="180" step="1" value={item.rotation} onChange={e => onChange({ rotation: Number(e.target.value) })} />
      <div className="object-actions"><button onClick={onDuplicate}>⧉ Дублировать</button><button className="delete-button" onClick={onDelete}>Удалить</button></div>
      <p className="keyboard-hint">Delete — удалить · Ctrl+D — копия<br />Стрелки — сдвиг · Shift — шаг 10</p>
    </>}
  </section>;
}
