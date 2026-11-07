import { promptInstall, useInstallState } from '../lib/install';

/** Install the app to the home screen: a real button where the browser allows it, plain steps on iPhone/iPad. */
export default function InstallCard() {
  const st = useInstallState();
  if (st === 'installed') return <div className="card"><h3 style={{ marginTop: 0 }}>Installed</h3><p className="muted small" style={{ marginBottom: 0 }}>You are using the installed app. It works offline once the parts you use have loaded.</p></div>;
  return (
    <div className="card" id="install">
      <h3 style={{ marginTop: 0 }}>Install the app</h3>
      <p className="muted small">Opens full screen from your home screen, keeps working without a connection, and updates itself.</p>
      {st === 'prompt' && <button className="btn primary" onClick={() => void promptInstall()}>Install</button>}
      {st === 'ios' && <ol className="small" style={{ margin: 0, paddingLeft: 20 }}><li>Tap the <strong>Share</strong> button in Safari.</li><li>Choose <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</li></ol>}
      {st === 'unavailable' && <p className="muted small" style={{ marginBottom: 0 }}>Open this page in Chrome, Edge or Safari and look for “Install” or “Add to Home Screen” in the browser menu.</p>}
    </div>
  );
}
