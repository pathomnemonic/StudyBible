/** Before the print dialog: open every folded section on the page so its words reach the paper, and put them back afterwards. */
export function installPrintPrep() {
  let opened: HTMLDetailsElement[] = [];
  const before = () => {
    opened = [...document.querySelectorAll<HTMLDetailsElement>('.page details:not([open])')];
    (window as unknown as { __sbAuto?: boolean }).__sbAuto = true;
    for (const d of opened) d.open = true;
    document.documentElement.dataset.printing = '1';
  };
  const after = () => {
    for (const d of opened) d.open = false;
    opened = [];
    delete document.documentElement.dataset.printing;
    window.setTimeout(() => { (window as unknown as { __sbAuto?: boolean }).__sbAuto = false; }, 0);
  };
  window.addEventListener('beforeprint', before);
  window.addEventListener('afterprint', after);
  return () => { window.removeEventListener('beforeprint', before); window.removeEventListener('afterprint', after); };
}
