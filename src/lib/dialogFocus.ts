import { useEffect, type RefObject } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Keyboard behaviour a dialog owes its user: focus moves in when it opens, Tab stays inside it, and focus goes back to where it was when it closes. */
export function useDialogFocus(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    const before = document.activeElement as HTMLElement | null;
    const items = () => [...box.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((e) => e.offsetParent !== null || e === document.activeElement);
    // into the dialog: the first control after its close button, or the dialog itself
    const first = items().find((e) => !/close/i.test(e.getAttribute('aria-label') ?? '')) ?? items()[0];
    if (first) first.focus(); else { box.tabIndex = -1; box.focus(); }
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const list = items();
      if (!list.length) return;
      const a = list[0], z = list[list.length - 1];
      if (e.shiftKey && (document.activeElement === a || !box.contains(document.activeElement))) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && (document.activeElement === z || !box.contains(document.activeElement))) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener('keydown', trap);
    return () => { document.removeEventListener('keydown', trap); if (before && document.contains(before)) before.focus(); };
  }, [ref]);
}
