import { Link } from 'react-router-dom';
import { Group, HubHeader, HubHero, Tiles } from '../../components/Hub';

/** The time-of-day prayer to put in front: what a person would most likely want to do right now. */
function nowPrayer(h: number): { eyebrow: string; title: string; text: string; to: string; cta: string } {
  if (h < 5 || h >= 22) return { eyebrow: 'Tonight', title: 'End the day in peace', text: 'A psalm read slowly while the sound fades and the screen dims.', to: '/pray/sleep', cta: 'Sleep mode' };
  if (h < 11) return { eyebrow: 'This morning', title: 'Begin the day with God', text: 'Wake to a bell and the day’s Gospel, then offer the day.', to: '/pray/morning', cta: 'Morning mode' };
  if (h < 14) return { eyebrow: 'Midday', title: 'Pause for the Angelus', text: 'A short prayer at noon, remembering the Incarnation.', to: '/pray/devotions/angelus', cta: 'Pray the Angelus' };
  if (h < 18) return { eyebrow: 'This afternoon', title: 'Pray the Divine Mercy Chaplet', text: 'Prayed on rosary beads, best at three o’clock, with a recording if you like.', to: '/pray/devotions/divine-mercy', cta: 'Divine Mercy' };
  return { eyebrow: 'This evening', title: 'Look back on the day', text: 'Five quiet steps: thanks, review, sorrow, resolve. Saved only if you choose.', to: '/pray/examen', cta: 'Daily Examen' };
}

export default function PrayHome() {
  const p = nowPrayer(new Date().getHours());
  return (
    <div className="page hub">
      <HubHeader title="Pray" sub="Pray with the Church, in your own words, or in silence." />
      <HubHero tone="pray" eyebrow={p.eyebrow} title={p.title} text={p.text}>
        <Link className="btn" to={p.to}>{p.cta}</Link>
        <Link className="btn ghost" to="/pray/devotions/rosary">The Rosary</Link>
      </HubHero>
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
