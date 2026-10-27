import { Group, HubHeader, Tiles } from '../../components/Hub';
import { useSettings } from '../../lib/store';
import { liturgyFor } from '../../lib/tradition';

/** Pray: groups of ways to pray, with nothing in front of them. */
export default function PrayHome() {
  const [st] = useSettings();
  const lit = liturgyFor(st.tradition);
  // the first tile follows your Church: the Mass, the Divine Liturgy, or (where the app has no text for your rite) the Roman Mass, called that
  const overrides = lit.kind === 'byzantine'
    ? { 'pray.mass': { title: 'Divine Liturgy', blurb: 'The Liturgy of St John Chrysostom to follow along.', to: '/pray/divine-liturgy' } }
    : lit.kind === 'roman-instead'
      ? { 'pray.mass': { title: 'Roman Mass', blurb: `Your Church’s ${lit.own.liturgy} is not in the app yet, so this follows the Roman Mass.` } }
      : undefined;
  return (
    <div className="page hub">
      <HubHeader quiet title="Pray" />
      <Group title="Devotions" hint="Bead by bead, with pictures and recordings">
        <Tiles ids={['pray.rosary', 'pray.mercy', 'pray.novenas', 'pray.devotions', 'pray.lectio', 'pray.prayers']} />
      </Group>
      <Group title="The Mass and the Church’s year">
        <Tiles ids={['pray.mass', 'pray.sunday', 'pray.office', 'pray.year', 'pray.liturgies']} overrides={overrides} />
      </Group>
      <Group title="Confession and examination">
        <Tiles ids={['pray.confession', 'pray.examination', 'pray.examen', 'pray.life']} />
      </Group>
      <Group title="Quiet and your own prayer">
        <Tiles ids={['today.session', 'pray.morning', 'pray.sleep', 'pray.build']} />
      </Group>
      <Group title="Your prayer life">
        <Tiles ids={['pray.intentions', 'pray.journal', 'pray.memento', 'pray.pilgrim']} />
      </Group>
    </div>
  );
}
