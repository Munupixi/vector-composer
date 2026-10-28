import { useState } from 'react';
import { formats, parsePalette, type CompositionSettings, type Format } from '../composition';
import { palettes } from '../palettes';
import { publicUrl } from '../publicUrl';

interface Props { busy: boolean; settings: CompositionSettings; onChange: (s: CompositionSettings) => void; }
export default function CompositionControls({ busy, settings, onChange }: Props) {
  const [error, setError] = useState('');
  async function upload(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 32_000) throw new Error('Файл палитры слишком большой. Максимум 32 КБ.');
      const palette = parsePalette(JSON.parse(await file.text()));
      onChange({ ...settings, palette }); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось прочитать палитру.'); }
  }
  return <fieldset disabled={busy} className="composition-controls" aria-label="Формат и палитра">
    <label>Детализация<select value={settings.detail ?? 'l'} onChange={e => onChange({ ...settings, detail: e.target.value as 's' | 'l' })}>
      <option value="l">L · Полная</option><option value="s">S · Упрощённая</option>
    </select></label>
    <label>Формат<select value={settings.format} onChange={e => onChange({ ...settings, format: e.target.value as Format })}>
      {Object.entries(formats).map(([key, f]) => <option key={key} value={key}>{f.name} · {f.width} × {f.height}</option>)}
    </select></label>
    <label>Цветовая схема<select value={palettes.findIndex(p => JSON.stringify(p) === JSON.stringify(settings.palette))}
      onChange={e => { const index = Number(e.target.value); if (index >= 0) onChange({ ...settings, palette: palettes[index] }); }}>
      {!palettes.some(p => JSON.stringify(p) === JSON.stringify(settings.palette)) && <option value="-1">{settings.palette ? settings.palette.name : 'Исходные цвета'}</option>}
      {palettes.map((p, i) => <option key={p.name} value={i}>{p.name}</option>)}
    </select></label>
    <label className="palette-upload">Загрузить палитру JSON<input type="file" accept=".json,application/json" onChange={e => {
      void upload(e.target.files?.[0]); e.target.value = '';
    }} /></label>
    {settings.palette && <>
      <label>Фон<select value={settings.palette.background} onChange={e => onChange({ ...settings,
        palette: { ...settings.palette!, background: e.target.value } })}>
        {settings.palette.backgroundColors.map((c, i) => <option key={`${i}-${c}`} value={c}>{c}</option>)}
      </select></label>
      <span className="palette-name">{settings.palette.name}</span>
      <button onClick={() => onChange({ ...settings, palette: null })}>Исходные цвета</button>
    </>}
    <details><summary>Формат файла палитры</summary><p>Цвета фона задаются отдельно от цветов объектов. Все цвета — в формате #RRGGBB.</p>
      <p><a href={publicUrl('palettes/example.json')} download>Скачать пример палитры</a></p>
      <pre>{JSON.stringify({ name: 'Моя палитра', background: '#eee8ff', backgroundColors: ['#eee8ff', '#c8b6f0'],
        objectColors: ['#eee8ff', '#c8b6f0', '#7864d7', '#f8d970', '#f9a3aa', '#ffe3e1', '#181817', '#ffffff'] }, null, 2)}</pre>
      <p>Порядок цветов объектов: светлый, средний и тёмный фоновые оттенки, три акцента, контур и белый. Можно задать свою палитру той же структуры.</p>
    </details>
    {error && <p role="alert">{error}</p>}
  </fieldset>;
}
