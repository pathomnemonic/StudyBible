import { Link } from 'react-router-dom';
import type { Profile, ProfileKind } from '../lib/profiles';
import { extendTrail, profilePath, type Trail } from '../lib/profileView';

export const KIND_LABEL: Record<ProfileKind, string> = { saint: 'Saint', person: 'Person in Scripture', place: 'Place' };

/**
 * The one way a profile is shown wherever it is referenced (profile pages, the list, the study panel's People tab).
 * Opening it carries the trail back to where the reader came from. A missing profile is shown as plain text with a muted note, never a dead link.
 */
export default function ProfileCard({ profile, name, relation, via, from, here, note, compact = true }: {
  /** the record; leave out when it could not be found */
  profile?: Profile;
  /** what to call it when the record is missing */
  name?: string;
  /** the relation label, e.g. "mother of" */
  relation?: string;
  /** the alternate name a search matched */
  via?: string;
  /** the trail the reader arrived with */
  from?: Trail;
  /** where the card is shown, so the next page can lead back here */
  here?: { path: string; label: string };
  note?: string;
  compact?: boolean;
}) {
  if (!profile) {
    return (
      <div className="pcard pcard-missing" data-missing="true">
        {relation && <span className="muted small">{relation}: </span>}<span>{name ?? 'Unknown'}</span>
        <span className="muted small"> · no profile available</span>
      </div>
    );
  }
  const state = here ? { from: extendTrail(from, here) } : from ? { from } : undefined;
  const facts = profile.facts[0];
  return (
    <div className="pcard" data-profile={`${profile.kind}:${profile.id}`} style={{ padding: '6px 0', minWidth: 0, overflowWrap: 'anywhere' }}>
      {relation && <span className="muted small">{relation}: </span>}
      <Link to={profilePath(profile)} state={state}>{profile.name}</Link>
      <span className="muted small"> · {KIND_LABEL[profile.kind]}{profile.feast ? ` · feast ${profile.feast}` : ''}</span>
      {via && <span className="muted small"> · also known as {via}</span>}
      {note && <div className="muted small">{note}</div>}
      {!compact && facts && <div className="small">{facts.text}</div>}
    </div>
  );
}
