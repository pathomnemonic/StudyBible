import { isPinned, togglePin, usePins, type Entry } from '../lib/pins';

/** A pin on a collection or plan: pinned ones are listed at the top of the library, in the same place as recent items. */
export default function PinButton({ entry, small = true }: { entry: Entry; small?: boolean }) {
  usePins();
  const on = isPinned(entry.kind, entry.id);
  return <button className={`btn${small ? ' small' : ''}`} aria-pressed={on} aria-label={`${on ? 'Unpin' : 'Pin'} ${entry.title}`} onClick={() => togglePin(entry)}>{on ? 'Unpin' : 'Pin'}</button>;
}
