import { useEffect, useState } from 'react';
import { useSettings } from '../lib/store';

/** Asked only where an answer is required before error reports and page counts may run (the EU, the UK and the EEA): one plain question and two buttons of equal weight, and the same choice lives in Settings under "Your data, sync and privacy". Shown on the website only, never in the store apps. */
export default function TelemetryConsentBanner() {
  const [s, set] = useSettings();
  const [needed, setNeeded] = useState(false);
  useEffect(() => {
    let on = true;
    // loaded on demand, like the reporting itself, so none of it is in the first download
    import('../lib/telemetry').then((m) => { if (on) setNeeded(m.consentPromptNeeded()); }, () => 0);
    return () => { on = false; };
  }, []);
  if (!needed) return null;
  if (s.telemetryConsent === 'granted' || s.telemetryConsent === 'denied') return null; // answered, here or in Settings: go away at once
  return (
    <div className="update-banner consent-banner" role="region" aria-label="Error reports and page counts: your choice">
      <span className="small">Where you live, we ask first. With your agreement, this website sends anonymous error reports and counts of which section is opened. No cookies, no profiles, and never what you read or write. You can change your mind in Settings.</span>
      <button className="btn small" onClick={() => set({ telemetryConsent: 'granted' })}>Accept</button>
      <button className="btn small" onClick={() => set({ telemetryConsent: 'denied' })}>Decline</button>
    </div>
  );
}
