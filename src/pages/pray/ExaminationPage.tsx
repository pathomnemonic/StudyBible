import { useState } from 'react';
import { Link } from 'react-router-dom';

/** Questions follow the Ten Commandments and the precepts of the Church, in the long-used pattern of examinations of conscience. */
const SECTIONS: { title: string; ref: string; qs: string[] }[] = [
  { title: 'I am the Lord your God: you shall have no other gods before me', ref: 'Exodus 20:2-3', qs: [
    'Have I put anything (money, work, pleasure, comfort, other people, my own opinion) ahead of God?',
    'Have I neglected prayer, or prayed only when I needed something?',
    'Have I doubted or denied a teaching of the Faith on purpose, or been ashamed to be a Catholic?',
    'Have I dabbled in horoscopes, fortune-telling, spiritism or the occult?',
    'Have I despaired of God’s mercy, or presumed on it, sinning because I can always be forgiven?' ] },
  { title: 'You shall not take the name of the Lord in vain', ref: 'Exodus 20:7', qs: [
    'Have I used God’s name, Jesus’ name or holy things carelessly, in anger or as a joke?',
    'Have I broken a vow or promise made to God?',
    'Have I spoken with contempt of the Church, the saints or sacred things?' ] },
  { title: 'Remember to keep holy the Lord’s day', ref: 'Exodus 20:8', qs: [
    'Have I missed Mass on a Sunday or holy day of obligation through my own fault?',
    'Have I come late or left early without good reason, or been distracted on purpose?',
    'Have I done unnecessary work on Sunday, or failed to make it a day of rest and joy?' ] },
  { title: 'Honour your father and your mother', ref: 'Exodus 20:12', qs: [
    'Have I been disrespectful, impatient or disobedient to my parents or those with legitimate authority over me?',
    'Have I neglected my parents or elders in need?',
    'If I have authority (as a parent, teacher, employer), have I used it unjustly, or neglected the faith and care of those under me?' ] },
  { title: 'You shall not kill', ref: 'Exodus 20:13', qs: [
    'Have I harmed anyone in body or in spirit, or wished them harm?',
    'Have I held on to anger, hatred or a grudge, or refused to forgive?',
    'Have I taken part in or encouraged abortion, euthanasia or any other attack on human life?',
    'Have I harmed my own health by abuse of food, alcohol or drugs, or by recklessness?',
    'Have I led someone else into sin by my example or my words?' ] },
  { title: 'You shall not commit adultery', ref: 'Exodus 20:14', qs: [
    'Have I willingly entertained impure thoughts or desires, or sought out impure images?',
    'Have I acted impurely, alone or with another, outside of marriage?',
    'Have I been faithful to my spouse in thought, word and deed?',
    'Have I dressed or acted so as to lead others into sin, or treated anyone as an object?',
    'Have I used contraception or other means against the openness of marriage to life?' ] },
  { title: 'You shall not steal', ref: 'Exodus 20:15', qs: [
    'Have I stolen, cheated, or kept what is not mine, including at work or in taxes?',
    'Have I failed to pay a just debt or a fair wage, or wasted what was entrusted to me?',
    'Have I been generous to the poor and to the Church according to my means?' ] },
  { title: 'You shall not bear false witness against your neighbor', ref: 'Exodus 20:16', qs: [
    'Have I lied, exaggerated or deceived, or broken a confidence?',
    'Have I gossiped, slandered, or spoken ill of someone without need?',
    'Have I judged others rashly, or refused to repair harm I have done to their good name?' ] },
  { title: 'You shall not covet your neighbor’s wife or goods', ref: 'Exodus 20:17', qs: [
    'Have I been jealous or envious of what others have or are?',
    'Have I let greed or the desire to have more rule my choices?',
    'Have I let lust or desire for another person’s spouse take root in my heart?' ] },
  { title: 'The precepts of the Church and my duties', ref: 'Catechism 2041-2043', qs: [
    'Have I gone to confession at least once a year, and to Communion at least once a year at Easter?',
    'Have I kept the days of fasting and abstinence, and received Communion only when rightly prepared, fasting an hour before and free of mortal sin?',
    'Have I neglected the duties of my state in life (family, work, study) or my duty to love my neighbor in practical ways?',
    'Have I been lazy in using my gifts, or proud, vain, or selfish in how I treat others?' ] },
];

export default function ExaminationPage() {
  const [on, setOn] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<number | null>(0);
  const toggle = (k: string) => setOn((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const marked = SECTIONS.map((s, i) => s.qs.filter((_, j) => on.has(`${i}.${j}`)).map((q) => ({ s: s.title, q }))).flat();
  return (
    <div className="page">
      <p><Link to="/pray">← Prayer</Link></p>
      <h1>Examination of conscience</h1>
      <p className="lede">A quiet look back before Confession, following the Ten Commandments. Ask the Holy Spirit for light, and be honest and gentle with yourself.</p>
      <div className="card" role="note" style={{ borderLeft: '3px solid var(--accent, #6a4)' }}>
        <strong>Private by design.</strong> What you tick here is kept only on this screen. It is not saved, not synced and not sent anywhere, and it is gone when you leave or refresh the page.
      </div>
      <div style={{ marginTop: 12 }}>
        {SECTIONS.map((s, i) => (
          <section className="card" key={s.title}>
            <h2 className="card-title" style={{ margin: 0 }}>
              <button className="linklike" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>{i + 1}. {s.title}</button>
              <span className="muted small"> — {s.ref}</span>
            </h2>
            {open === i && (
              <ul className="list" style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
                {s.qs.map((q, j) => (
                  <li key={j}><label style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}><input type="checkbox" checked={on.has(`${i}.${j}`)} onChange={() => toggle(`${i}.${j}`)} /><span>{q}</span></label></li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
      {marked.length > 0 && (
        <section className="card" aria-live="polite">
          <h2 className="card-title">To bring to Confession</h2>
          <ul className="list">{marked.map((m, i) => <li key={i}>{m.q}</li>)}</ul>
          <p className="muted small">Confess the kind of sin and, for serious sins, roughly how often. You don’t have to remember every detail.</p>
          <button className="btn small" onClick={() => setOn(new Set())}>Clear</button>
        </section>
      )}
      <section className="card">
        <h2 className="card-title">How to go to Confession</h2>
        <ol className="list">
          <li>Make the Sign of the Cross. Say how long since your last confession.</li>
          <li>Confess your sins to the priest, beginning with the most serious.</li>
          <li>Listen to his counsel and accept the penance he gives.</li>
          <li>Pray an Act of Contrition (below), and receive absolution.</li>
          <li>Do the penance soon, and thank God.</li>
        </ol>
        <p className="scripture"><em>O my God, I am heartily sorry for having offended thee, and I detest all my sins, because of thy just punishments, but most of all because they offend thee, my God, who art all good and deserving of all my love. I firmly resolve, with the help of thy grace, to sin no more and to avoid the near occasion of sin. Amen.</em></p>
        <p className="muted small">Examinations like this are an aid, not a substitute for a priest’s guidance. If you are unsure whether something is serious sin, ask the priest in Confession.</p>
      </section>
    </div>
  );
}
