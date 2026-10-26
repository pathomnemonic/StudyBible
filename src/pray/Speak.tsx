import { useEffect, useState } from 'react';
import { voiceSupported } from './useGuide';

/** Reads a short prayer aloud with the device's own voice, so it can be prayed along with. */
export default function Speak({ title, text }: { title: string; text: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => () => { if (voiceSupported()) speechSynthesis.cancel(); }, []);
  if (!voiceSupported()) return null;
  const toggle = () => {
    if (on) { speechSynthesis.cancel(); setOn(false); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(`${title}. ${text}`);
    u.rate = 0.9;
    u.onend = () => setOn(false);
    u.onerror = () => setOn(false);
    setOn(true);
    speechSynthesis.speak(u);
  };
  return <button className="btn small" aria-pressed={on} onClick={toggle} title="Read this prayer aloud so you can pray along">{on ? 'Stop' : 'Pray along'}</button>;
}
