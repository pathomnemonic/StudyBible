import { useCallback, useState, type ReactNode } from 'react';
import Modal from './Modal';

interface Req { title: string; body: string; ok: string; cancel: string; danger: boolean; resolve: (v: boolean) => void }

/**
 * A question put in the page instead of the browser's own confirm box. The native box can be switched off or suppressed (some browsers do, and automated ones
 * answer it silently), which made a button that depended on it do nothing at all. `ask` resolves true for the main button and false for the other, or for Escape.
 */
export function useConfirm(): readonly [(title: string, body: string, o?: { ok?: string; cancel?: string; danger?: boolean }) => Promise<boolean>, ReactNode] {
  const [req, setReq] = useState<Req | null>(null);
  const ask = useCallback((title: string, body: string, o: { ok?: string; cancel?: string; danger?: boolean } = {}) => new Promise<boolean>((resolve) => setReq({ title, body, ok: o.ok ?? 'OK', cancel: o.cancel ?? 'Cancel', danger: !!o.danger, resolve })), []);
  const close = (v: boolean) => { req?.resolve(v); setReq(null); };
  const dialog = req ? (
    <Modal title={req.title} onClose={() => close(false)}>
      <p style={{ whiteSpace: 'pre-line' }}>{req.body}</p>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className={`btn ${req.danger ? 'danger' : 'primary'}`} onClick={() => close(true)} autoFocus>{req.ok}</button>
        <button type="button" className="btn" onClick={() => close(false)}>{req.cancel}</button>
      </div>
    </Modal>
  ) : null;
  return [ask, dialog] as const;
}
