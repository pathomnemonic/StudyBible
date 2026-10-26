import { Group, HubHeader, Tiles } from '../../components/Hub';

/** Pray: groups of ways to pray, with nothing in front of them. */
export default function PrayHome() {
  return (
    <div className="page hub">
      <HubHeader title="Pray" sub="Pray with the Church, in your own words, or in silence." />
      <Group title="Devotions" hint="Bead by bead, with pictures and recordings">
        <Tiles ids={['pray.rosary', 'pray.mercy', 'pray.novenas', 'pray.devotions', 'pray.lectio', 'pray.prayers']} />
      </Group>
      <Group title="The Mass and the Church’s year">
        <Tiles ids={['pray.mass', 'pray.sunday', 'pray.office', 'pray.year', 'pray.liturgies']} />
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
