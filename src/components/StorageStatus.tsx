import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const mb = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(1)} GB` : `${Math.max(0.1, n / 1e6).toFixed(1)} MB`);

/** How much room the browser is giving the app, and whether it has promised not to clear it. Clearing site data would erase notes that are not backed up. */
export default function StorageStatus() {
  const [est, setEst] = useState<{ usage: number; quota: number } | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [note, setNote] = useState('');
  const refresh = () => {
    navigator.storage?.estimate?.().then((e) => setEst({ usage: e.usage ?? 0, quota: e.quota ?? 0 })).catch(() => {});
    navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null));
  };
  useEffect(refresh, []);
  const ask = async () => {
    const ok = await navigator.storage?.persist?.().catch(() => false);
    setNote(ok ? 'Done: the browser will keep your data unless you clear it yourself.' : 'The browser declined for now. Installing the app to your home screen, or using it regularly, often helps. Back up to be safe.');
    refresh();
  };
  return (
    <div className="card">
      <h2 className="card-title">Storage and backup</h2>
      <p className="small" style={{ margin: '4px 0' }}>
        {est ? <>This app is using about <strong>{mb(est.usage)}</strong> of the {mb(est.quota)} the browser allows (downloaded Bibles and study packs included; your notes and highlights are tiny by comparison).</> : 'Your browser does not report storage use.'}
      </p>
      <p className="small" style={{ margin: '4px 0' }}>
        {persisted === null ? 'This browser cannot promise to keep your data.' : persisted ? <><span className="chip good">protected</span> The browser has agreed not to clear your notes automatically.</> : <><span className="chip">not protected</span> The browser may clear this site’s data if the device runs low on space.</>}
      </p>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        {persisted === false && <button className="btn small" onClick={ask}>Ask the browser to keep my data</button>}
        <Link className="btn small" to="/library?tab=export">Export a backup</Link>
      </div>
      {note && <p className="small muted" role="status">{note}</p>}
    </div>
  );
}
