/**
 * Where to put our own small bar for a text selection. On a phone the browser shows its own Copy / Share menu just above the
 * selection and drag handles just below it, so ours goes under the handles (or well above the menu if there is no room), never behind them.
 */
export function popupY(r: DOMRect, h = 44): number {
  const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
  if (!coarse) return Math.max(60, r.top - h - 6);
  const below = r.bottom + 48;
  const limit = window.innerHeight - 150; // keep clear of the tab bar
  return below <= limit ? below : Math.max(60, r.top - 112);
}
