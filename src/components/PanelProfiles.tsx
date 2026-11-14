import { useLocation } from 'react-router-dom';
import { useProfiles } from '../lib/useProfiles';
import { profileByName } from '../lib/profileView';
import ProfileCard from './ProfileCard';

/** In the study panel's People tab: the reviewed profiles of the people named here (matched by exact name or alternate name only). */
export default function PanelProfiles({ names, label }: { names: string[]; label: string }) {
  const { list } = useProfiles();
  const loc = useLocation();
  if (!list?.length) return null;
  const found = [...new Map(names.flatMap((n) => { const p = profileByName(list, n); return p ? [[`${p.kind}:${p.id}`, p] as const] : []; })).values()];
  if (!found.length) return null;
  const here = { path: `${loc.pathname}${loc.search}`, label };
  const from = (loc.state as { from?: { path: string; label: string } } | null)?.from;
  return (
    <div className="panel-profiles" aria-label="Profiles of people named here" data-testid="panel-profiles">
      <div className="muted small">Profiles</div>
      {found.map((p) => <ProfileCard key={`${p.kind}:${p.id}`} profile={p} from={from} here={here} />)}
    </div>
  );
}
