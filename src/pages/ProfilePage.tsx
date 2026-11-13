import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useSync } from '../sync/state';
import WeekCard from '../components/WeekCard';
import HighlightOfDay from '../components/HighlightOfDay';
import ContinueStrip from '../components/ContinueStrip';
import { Group, HubHeader, Tiles } from '../components/Hub';
import QuickSettings from '../components/QuickSettings';
import SurpriseButton from '../components/SurpriseButton';
import MovePlace from '../components/MovePlace';

/** Everything that is yours: your writing, your plans and the settings. Where you left off is on Today. */
export default function ProfilePage() {
  const sync = useSync();
  const notes = useLiveQuery(() => db.notes.count(), []) ?? 0;
  const marks = useLiveQuery(() => db.highlights.count(), []) ?? 0;
  return (
    <div className="page hub">
      <HubHeader quiet title="You" sub={sync.user ? `Signed in as ${sync.user.email}.` : `${notes} note${notes === 1 ? '' : 's'} and ${marks} highlight${marks === 1 ? '' : 's'}, kept on this device.`} />
      <Link className="you-help" to="/help"><span aria-hidden="true">?</span><span><strong>Help</strong><small>Where things are, how the buttons work, and the tour</small></span></Link>
      <ContinueStrip kinds={['read', 'episode', 'work']} />
      <HighlightOfDay />
      <WeekCard />
      <Group title="Make it yours"><QuickSettings /></Group>
      <Group open title="Your things">
        <Tiles ids={['you.library', 'you.year', 'you.history', 'today.memorize', 'pray.journal', 'pray.intentions', 'you.goals', 'today.days', 'you.passport']} />
      </Group>
      <Group title="Backup">
        <p className="muted small">Save everything as a file from <Link to="/library?tab=export">Library → Export</Link>, or carry just your place to a new phone.</p>
        <MovePlace />
      </Group>
      <Group title="The app">
        <Tiles ids={['you.settings', 'you.downloads', 'you.kid', 'you.account', 'you.privacy', 'you.about']} />
      </Group>
      <Group title="More">
        <div className="btn-row">
          <SurpriseButton />
          <Link className="btn" to="/more">Every page in the app</Link>
          <button className="btn" onClick={() => window.dispatchEvent(new Event('studybible:tour'))}>Replay the intro</button>
          <Link className="btn" to="/study/sources">Sources and licensing</Link>
        </div>
      </Group>
    </div>
  );
}
