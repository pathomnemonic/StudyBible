import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useSync } from '../sync/state';
import WeekCard from '../components/WeekCard';
import { Group, HubHeader, Tiles } from '../components/Hub';
import QuickSettings from '../components/QuickSettings';

/** Everything that is yours: your writing, your plans and the settings. Where you left off is on Today. */
export default function ProfilePage() {
  const sync = useSync();
  const notes = useLiveQuery(() => db.notes.count(), []) ?? 0;
  const marks = useLiveQuery(() => db.highlights.count(), []) ?? 0;
  return (
    <div className="page hub">
      <HubHeader quiet title="You" sub={sync.user ? `Signed in as ${sync.user.email}.` : `${notes} note${notes === 1 ? '' : 's'} and ${marks} highlight${marks === 1 ? '' : 's'}, kept on this device.`} />
      <WeekCard />
      <Group title="Make it yours"><QuickSettings /></Group>
      <Group open title="Your things">
        <Tiles ids={['you.library', 'today.plans', 'today.memorize', 'pray.journal', 'pray.intentions', 'you.goals', 'today.days']} />
      </Group>
      <Group title="The app">
        <Tiles ids={['you.settings', 'you.downloads', 'you.account', 'you.privacy', 'you.about']} />
      </Group>
      <Group title="More">
        <div className="btn-row">
          <Link className="btn" to="/more">Every page in the app</Link>
          <button className="btn" onClick={() => window.dispatchEvent(new Event('studybible:tour'))}>Take the tour again</button>
          <Link className="btn" to="/study/sources">Sources and licensing</Link>
        </div>
      </Group>
    </div>
  );
}
