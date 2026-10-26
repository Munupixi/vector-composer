// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const svg = '<svg xmlns="http://www.w3.org/2000/svg"><g data-component="object"><path fill="#d7cdf5" d="M0 0H200V100H0Z"/></g></svg>';
let host: HTMLDivElement;
let root: Root;
const button = (text: string) => {
  const match = Array.from(host.querySelectorAll('button')).find(b => b.textContent?.trim() === text);
  if (!match) throw new Error('Missing button: ' + text);
  return match;
};
const click = async (element: Element) => { await act(async () => { (element as HTMLElement).click(); }); };
const objects = () => host.querySelectorAll('.composition [data-instance]').length;

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('fetch', vi.fn(async () => new Response(svg)));
  Object.defineProperty(SVGElement.prototype, 'getBBox', { configurable:true, value:() => ({ x:0,y:0,width:200,height:100 }) });
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable:true, value:function(this: HTMLDialogElement) { this.setAttribute('open',''); } });
  localStorage.clear();
  host = document.createElement('div'); document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => { root.render(<App />); });
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove(); vi.unstubAllGlobals();
  Reflect.deleteProperty(SVGElement.prototype,'getBBox');
  Reflect.deleteProperty(HTMLDialogElement.prototype,'showModal');
});

describe('editor regression flows', () => {
  async function saveSmallBook() {
    await click(button('Библиотека ↗'));
    await click(host.querySelector('[aria-label="Открыть исходник: Книга · S · Главный"]')!);
    await click(host.querySelector('.object-option')!);
    await click(button('Сохранить в библиотеку ↗'));
  }
  it('makes a saved S component visible while the scene uses L', async () => {
    await saveSmallBook();
    expect((host.querySelector('.library-filter input') as HTMLInputElement).checked).toBe(true);
    expect(host.querySelector('[aria-label="Добавить на холст: Книга"]')).not.toBeNull();
  });
  it('ignores editor shortcuts during confirmation and keeps the library after clearing', async () => {
    await saveSmallBook();
    await click(host.querySelector('[aria-label="Добавить на холст: Книга"]')!);
    expect(objects()).toBe(1);
    await click(button('＋ Новая композиция'));
    expect(host.querySelector('.confirm-dialog')).not.toBeNull();
    await act(async () => { button('Отмена').dispatchEvent(new KeyboardEvent('keydown',{ key:'Delete', bubbles:true })); });
    expect(objects()).toBe(1);
    await click(button('Отмена'));
    expect(objects()).toBe(1);
    await click(button('＋ Новая композиция'));
    await click(button('Продолжить'));
    expect(objects()).toBe(0);
    expect(host.querySelector('[aria-label="Добавить на холст: Книга"]')).not.toBeNull();
  });
  it('does not overwrite a detail change with settings from a simultaneous action', async () => {
    await saveSmallBook();
    await click(host.querySelector('[aria-label="Добавить на холст: Книга"]')!);
    const selects = host.querySelectorAll<HTMLSelectElement>('.composition-controls select');
    await act(async () => {
      selects[0].value = 's'; selects[0].dispatchEvent(new Event('change',{ bubbles:true }));
      selects[1].value = 'portrait'; selects[1].dispatchEvent(new Event('change',{ bubbles:true }));
    });
    expect(selects[0].value).toBe('s');
    expect(selects[1].value).toBe('landscape');
    expect(host.querySelector('.format-label')?.textContent).toContain('1200');
  });
});
