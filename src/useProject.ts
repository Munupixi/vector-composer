import { useEffect, useState } from 'react';
import type { LibraryComponent, SceneObject } from './types';
import { hydrateComponents, parseSnapshot, snapshotProject, STORAGE_KEY } from './storage';
import { defaultSettings, type CompositionSettings } from './composition';

export function useProject() {
  const [title, setTitle] = useState('Новая история');
  const [sourceId, setSourceId] = useState('figma-book-l-main');
  const [library, setLibrary] = useState<LibraryComponent[]>([]);
  const [scene, setScene] = useState<SceneObject[]>([]);
  const [settings, setSettings] = useState<CompositionSettings>(defaultSettings);
  const [ready, setReady] = useState(false);
  const [storageProblem, setStorageProblem] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data = parseSnapshot(raw);
          const components = await hydrateComponents(data.components);
          if (cancelled) return;
          setTitle(data.title); setSourceId(data.sourceId); setLibrary(components); setScene(data.scene);
          setSettings(data.settings ?? defaultSettings);
        }
      } catch (error) {
        if (!cancelled) setStorageProblem(error instanceof Error ? error.message : 'Хранилище браузера недоступно.');
      } finally { if (!cancelled) setReady(true); }
    }
    void restore();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || storageProblem) return;
    const snapshot = JSON.stringify(snapshotProject(title, sourceId, library, scene, settings));
    setSaving(true);
    const save = () => {
      try { localStorage.setItem(STORAGE_KEY, snapshot); setSaving(false); }
      catch { setStorageProblem('Не удалось сохранить сцену в браузере. Экспорт SVG остаётся доступным.'); setSaving(false); }
    };
    const timer = window.setTimeout(save, 300);
    const onVisibility = () => { if (document.visibilityState === 'hidden') save(); };
    window.addEventListener('pagehide', save); document.addEventListener('visibilitychange', onVisibility);
    return () => { window.clearTimeout(timer); window.removeEventListener('pagehide', save); document.removeEventListener('visibilitychange', onVisibility); };
  }, [ready, title, sourceId, library, scene, settings, storageProblem]);

  return { title, setTitle, sourceId, setSourceId, library, setLibrary, scene, setScene, settings, setSettings,
    ready, storageProblem, retryStorage: () => setStorageProblem(''), saving };
}
