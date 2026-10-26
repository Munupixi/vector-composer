import { useState } from 'react';

interface Props { busy: boolean; onGenerate: (query: string, mode: 'metaphor' | 'objects', background: boolean) => Promise<void>; }
export default function AutoComposer({ busy, onGenerate }: Props) {
  const [query, setQuery] = useState('Время учиться');
  const [mode, setMode] = useState<'metaphor' | 'objects'>('metaphor');
  const [background, setBackground] = useState(true);
  return <section className="auto-composer" aria-labelledby="auto-title">
    <div className="section-heading"><h2 id="auto-title">Собрать композицию по запросу</h2><span className="count">SVG</span></div>
    <p>Подберём готовые объекты и расставим их на холсте. Затем можно всё изменить вручную.</p>
    <form onSubmit={e => { e.preventDefault(); void onGenerate(query, mode, background); }}>
      <label>Как подобрать объекты<select value={mode} onChange={e => setMode(e.target.value as typeof mode)}>
        <option value="metaphor">По заголовку или метафоре</option><option value="objects">По названиям компонентов</option>
      </select></label>
      <label className="query-label">{mode === 'metaphor' ? 'Заголовок или метафора' : 'Названия объектов'}
        <input maxLength={300} value={query} onChange={e => setQuery(e.target.value)} placeholder={mode === 'metaphor' ? 'Например: Работа в команде' : 'Например: книга, лампа, наушники'} />
      </label>
      <button className="primary-button" disabled={busy || !query.trim()} type="submit">{busy ? 'Собираем…' : 'Собрать композицию'} <span>↗</span></button>
      <label className="background-toggle"><input type="checkbox" checked={background} onChange={e => setBackground(e.target.checked)} /> Добавить фоновый объект</label>
    </form>
    <div className="query-examples"><span>Попробуйте:</span>{['Время учиться', 'Финансовая подушка', 'Работа в команде'].map(example =>
      <button disabled={busy} key={example} onClick={() => { setMode('metaphor'); setQuery(example); }}>{example}</button>)}</div>
    <small>Подбор работает по темам и синонимам библиотеки, без генерации новых изображений.</small>
  </section>;
}
