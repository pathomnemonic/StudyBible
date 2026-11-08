import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BRAND } from '../lib/brand';
import { useSettings } from '../lib/store';
import { useEditions } from '../data/EditionsContext';
import { publishWidgets, readWidgetData, type WidgetData } from '../lib/widgetData';

export const WIDGET_KINDS = [
  { id: 'verse', title: 'Verse of the day', icon: '📖', color: '#4a7bd0' },
  { id: 'review', title: 'Verses to review', icon: '🧠', color: '#8a5ac2' },
  { id: 'streak', title: 'Game streak', icon: '🔥', color: '#e8812b' },
  { id: 'plan', title: 'Reading plan', icon: '📅', color: '#2f8f6b' },
] as const;
type Kind = (typeof WIDGET_KINDS)[number]['id'];

function useWidgetData() {
  const [s] = useSettings();
  const { get, editions } = useEditions();
  const ed = get(s.defaultEdition === 'vulgate' ? 'dra' : s.defaultEdition) ?? editions[0];
  const [d, setD] = useState<WidgetData | null>(readWidgetData());
  useEffect(() => { if (ed) void publishWidgets(ed).then(setD); }, [ed?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return d;
}

/** One widget, drawn the way it appears on a home screen or in a small window. */
export function Widget({ kind, d, size = 'm' }: { kind: Kind; d: WidgetData | null; size?: 's' | 'm' }) {
  const k = WIDGET_KINDS.find((x) => x.id === kind)!;
  let body: JSX.Element;
  if (kind === 'verse') body = d?.verse ? <><p className="wg-verse">{size === 's' ? d.verse.text.slice(0, 110) + (d.verse.text.length > 110 ? '…' : '') : d.verse.text}</p><p className="wg-meta">{d.verse.ref} · {d.verse.edition}</p></> : <p className="wg-verse">Open the app once to load today’s verse.</p>;
  else if (kind === 'review') body = <><p className="wg-big">{d?.reviewsDue ?? 0}</p><p className="wg-meta">{d?.reviewsDue === 1 ? 'verse' : 'verses'} to review today</p></>;
  else if (kind === 'streak') body = <><p className="wg-big">{d?.streak ?? 0}</p><p className="wg-meta">day streak in the games</p></>;
  else body = d?.plan ? <><p className="wg-big">{d.plan.done}</p><p className="wg-meta">days done · {d.plan.name}</p></> : <p className="wg-verse">No plan started. Pick one in Settings or on Today.</p>;
  return (
    <div className={`wg wg-${size}`} style={{ ['--c' as string]: k.color }}>
      <p className="wg-head"><span aria-hidden="true">{k.icon}</span> {k.title}</p>
      {body}
    </div>
  );
}

/** A single widget filling a small window, a pinned tab or a phone's widget slot. */
export function WidgetView() {
  const { kind = 'verse' } = useParams();
  const d = useWidgetData();
  const k = (WIDGET_KINDS.find((x) => x.id === kind)?.id ?? 'verse') as Kind;
  return (
    <div className="page wg-page">
      <h1 className="visually-hidden">{BRAND.name} widget</h1>
      <Widget kind={k} d={d} size="m" />
      <p className="small wg-links"><Link to="/today">Today</Link> · <Link to="/widgets">Widgets</Link></p>
    </div>
  );
}

const HOW: { id: string; title: string; steps: string[] }[] = [
  { id: 'ios', title: 'iPhone and iPad', steps: ['Install the app from the App Store (the store version includes the home-screen widgets).', 'Touch and hold an empty spot on the Home Screen, then tap the + button.', 'Search for the app, pick a widget (verse of the day, reviews due, streak) and tap Add Widget.', 'Open the app once a day so the widget has today’s verse.'] },
  { id: 'android', title: 'Android', steps: ['Install the app from Google Play (the store version includes the widgets).', 'Touch and hold an empty spot on the Home screen, then tap Widgets.', 'Find the app, drag a widget onto the Home screen and resize it.', 'The widget refreshes each time you open the app and once a day.'] },
  { id: 'win', title: 'Windows 11', steps: ['Install the app from Edge (Apps, Install this site as an app).', 'Open the Widgets board (Windows key + W), choose +, and add the app’s verse widget.', 'This works in Microsoft Edge on Windows 11; other browsers do not show it.'] },
  { id: 'mac', title: 'Mac, Chrome and the web', steps: ['A web page cannot place a widget on the desktop, but each widget has its own small window.', 'Open a widget’s own link, then use your browser’s “Install” or “Add to Dock” to keep it as a small app, or pin the tab.'] },
];

/** The widgets, shown as they look, with how to put each one where you will see it. */
export default function WidgetsPage() {
  const d = useWidgetData();
  return (
    <div className="page widgets">
      <h1>Widgets</h1>
      <p className="lede">Today’s verse, your reviews and your streak, where you will see them without opening the app.</p>
      <div className="wg-grid">
        {WIDGET_KINDS.map((k) => (
          <div key={k.id} className="wg-cell">
            <Widget kind={k.id} d={d} size="m" />
            <p className="small"><Link to={`/widget/${k.id}`}>Open as a small window</Link></p>
          </div>
        ))}
      </div>
      <h2 className="chain-h2">Add one to your home screen</h2>
      {HOW.map((h) => (
        <details key={h.id} className="chain-obj"><summary>{h.title}</summary><ol>{h.steps.map((s) => <li key={s}>{s}</li>)}</ol></details>
      ))}
      <p className="muted small">The widgets show what is saved on your device: no account, nothing sent anywhere. Home-screen widgets on phones come with the store versions of the app; a website alone cannot place them.</p>
    </div>
  );
}
