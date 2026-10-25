import { applyUpdate, dismissUpdate, useUpdateReady } from '../lib/update';

/** Shown when a new version has been downloaded and is waiting. Nothing reloads until you choose. */
export default function UpdateBanner() {
  if (!useUpdateReady()) return null;
  return (
    <div className="update-banner" role="status">
      <span>A new version is ready.</span>
      <button className="btn small primary" onClick={() => void applyUpdate()}>Update now</button>
      <button className="btn small" onClick={dismissUpdate}>Later</button>
    </div>
  );
}
