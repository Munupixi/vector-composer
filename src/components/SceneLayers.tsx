import type { LibraryComponent, SceneObject } from '../types';

interface Props {
  scene: SceneObject[];
  library: LibraryComponent[];
  selection: string | null;
  onSelect: (id: string) => void;
  onMove: (direction: -1 | 1) => void;
}

export default function SceneLayers({ scene, library, selection, onSelect, onMove }: Props) {
  const index = scene.findIndex(item => item.id === selection);
  return <section className="layers-section">
    <div className="section-heading"><h2>Слои</h2><span className="count">{String(scene.length).padStart(2, '0')}</span></div>
    <p className="helper">Верхний слой — на переднем плане.</p>
    <div className="layer-actions"><button disabled={index < 0 || index === scene.length - 1} onClick={() => onMove(1)}>↑ На слой вперёд</button>
      <button disabled={index <= 0} onClick={() => onMove(-1)}>↓ На слой назад</button></div>
    <div className="layer-list">{[...scene].reverse().map((item, i) => <button key={item.id} className={`layer-item ${selection === item.id ? 'active' : ''}`}
      onClick={() => onSelect(item.id)} aria-pressed={selection === item.id} aria-label={`Выбрать слой ${scene.length - i}: ${library.find(c => c.id === item.componentId)?.name}`}>
      <span className="layer-symbol" aria-hidden="true">▱</span><span>{library.find(c => c.id === item.componentId)?.name}</span><small>{scene.length - i}</small>
    </button>)}</div>
    {!scene.length && <p className="properties-empty">Добавьте первый компонент на холст.</p>}
  </section>;
}
