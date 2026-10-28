/** Print the page, or save it as a PDF from the print dialog. Buttons, menus and the tab bar are left off the paper. */
export default function PrintButton({ label = 'Print', className = 'btn small ghost' }: { label?: string; className?: string }) {
  return <button className={`${className} no-print`} onClick={() => window.print()} aria-label="Print this page or save it as a PDF">{label}</button>;
}
