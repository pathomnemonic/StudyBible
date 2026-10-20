import { useState } from 'react';
import Modal from './Modal';
import { useEditions } from '../data/EditionsContext';
import { useSettings } from '../lib/store';
import type { EditionRecord } from '../data/loader';

/** Translations offered in pickers: all the plain-reading ones, plus any older translation the reader has switched on (or is reading now). */
export function useChoosable(current?: string): { choosable: EditionRecord[]; off: EditionRecord[]; isOn: (id: string) => boolean } {
  const { editions } = useEditions();
  const [s] = useSettings();
  const isOn = (id: string) => {
    const e = editions.find((x) => x.id === id);
    return !e?.offByDefault || s.enabledEditions.includes(id) || id === s.defaultEdition || id === current;
  };
  return { choosable: editions.filter((e) => isOn(e.id)), off: editions.filter((e) => !isOn(e.id)), isOn };
}

/** Explains why an older translation is off by default, and lets the reader decide. */
export function EnableEditionDialog({ edition, onClose, onEnabled }: { edition: EditionRecord; onClose: () => void; onEnabled?: () => void }) {
  const [s, set] = useSettings();
  return (
    <Modal title={`Turn on ${edition.shortName}?`} onClose={onClose}>
      <p><strong>{edition.name}</strong> is off by default.</p>
      <p>{edition.offByDefault}</p>
      <div className="row" style={{ marginTop: 12, gap: 8 }}>
        <button className="btn primary" onClick={() => { set({ enabledEditions: [...new Set([...s.enabledEditions, edition.id])] }); onClose(); onEnabled?.(); }}>Turn on {edition.shortName}</button>
        <button className="btn" onClick={onClose}>Keep it off</button>
      </div>
    </Modal>
  );
}
