import { useEffect, useRef } from 'react';
export default function Confirmation({ message, onResolve }: { message: string; onResolve: (yes: boolean) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="confirm-dialog" aria-labelledby="confirm-title" onCancel={e => { e.preventDefault(); onResolve(false); }}>
    <h2 id="confirm-title">Заменить композицию?</h2><p>{message}</p>
    <div><button autoFocus onClick={() => onResolve(false)}>Отмена</button><button className="confirm-primary" onClick={() => onResolve(true)}>Продолжить</button></div>
  </dialog>;
}
