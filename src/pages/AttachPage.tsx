import { useNavigate, useSearchParams } from 'react-router-dom';
import AddLinkDialog from '../components/AddLinkDialog';
import { parseRefs } from '../lib/refs';

/**
 * Landing page for the PWA share target: sharing a web page to the installed app (or opening
 * #/attach?url=…&title=…) lets the reader attach it to a passage. If the shared title names a passage it is pre-filled.
 */
export default function AttachPage() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const url = sp.get('url') || (sp.get('text')?.match(/https?:\/\/\S+/)?.[0] ?? '');
  const title = sp.get('title') ?? '';
  const guess = title.match(/(?:[1-3]\s)?[A-Z][a-z]+\.?\s\d+(?::\d+(?:[-–]\d+)?)?/)?.[0];
  void parseRefs;
  return (
    <div className="page narrow">
      <h1>Attach a link</h1>
      <p className="lede">Choose the passage this page is about.</p>
      <AddLinkDialog passages={[]} initialUrl={url} initialTitle={title} onClose={() => nav('/library')} />
      {guess && <p className="muted small">The title mentions “{guess}”.</p>}
    </div>
  );
}
