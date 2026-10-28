import { useEffect, useRef } from 'react';
import { examples, type Example } from '../examples';
import { publicUrl } from '../publicUrl';

export default function ExamplesDialog({ onChoose, onClose }: { onChoose: (example: Example) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="catalog-dialog examples-dialog" aria-labelledby="examples-title" onCancel={onClose}
    onClick={event => { if (event.currentTarget === event.target) onClose(); }}>
    <div className="dialog-heading"><div><span className="eyebrow">СОБРАНО ИЗ ИСХОДНЫХ ЭЛЕМЕНТОВ</span><h2 id="examples-title">С чего начнётся ваша история?</h2></div><button className="icon-button" onClick={onClose} aria-label="Закрыть примеры">×</button></div>
    <p className="dialog-helper">Каждая композиция использует три разных исходника. Откройте пример, измените его и скачайте SVG.</p>
    <div className="examples-grid">{examples.map((example, index) => <button key={example.id} className="example-card" onClick={() => onChoose(example)}>
      <img className="example-thumbnail" src={publicUrl(`examples/${example.id}.svg`)} alt="" />
      <span className="example-index">0{index + 1}</span><strong>{example.title}</strong><span>{example.subtitle}</span><small>Открыть композицию ↗</small>
    </button>)}</div>
    <p className="dialog-helper">При открытии примера текущий холст будет заменён. Библиотека компонентов останется.</p>
  </dialog>;
}
