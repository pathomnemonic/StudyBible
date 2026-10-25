import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FEATURES, STATUS_LABEL, type Status } from '../featureStatus';
import { CANON_NOTES } from '../lib/canon';
import { useEffect } from 'react';
import { getJson } from '../data/loader';

const COLOR: Record<Status, string> = { working: 'good', partial: 'warn', 'needs-license': 'warn', 'needs-credentials': 'warn', planned: '' };

export default function AboutPage() {
  const loc = useLocation();
  useEffect(() => { if (loc.hash) setTimeout(() => document.getElementById(loc.hash.slice(1))?.scrollIntoView(), 300); }, [loc.hash]);
  const [f, setF] = useState<Status | ''>('');
  const [built, setBuilt] = useState('');
  useEffect(() => { getJson<{ generated: string }>('manifest.json', true).then((m) => setBuilt(m?.generated ?? '')).catch(() => {}); }, []);
  const list = FEATURES.filter((x) => !f || x.status === f);
  return (
    <div className="page">
      <h1>About & feature status</h1>
      <p className="lede">A study library built on legitimately available texts. This page says plainly what works, what is partial, and what needs a license, credentials or future work.</p>
      <p className="muted small">Text and study data last built {built || '…'}. The app updates itself quietly when you are online.</p>
      {CANON_NOTES.map((n, i) => <div className="notice info" key={i}>{n}</div>)}
      <div className="chips" style={{ margin: '10px 0' }}>
        <button className={`chip${!f ? ' sel' : ''}`} onClick={() => setF('')}>All</button>
        {(Object.keys(STATUS_LABEL) as Status[]).map((s) => <button key={s} className={`chip${f === s ? ' sel' : ''}`} onClick={() => setF(s)}>{STATUS_LABEL[s]}</button>)}
      </div>
      {list.map((x, i) => (
        <div className="card" key={i}>
          <div className="row between"><strong>{x.name}</strong><span className={`chip ${COLOR[x.status]}`}>{STATUS_LABEL[x.status]}</span></div>
          <div className="muted small">{x.area}</div>
          <p className="small">{x.detail}</p>
          {x.next && <p className="small muted"><strong>Next:</strong> {x.next.deliverable}. <strong>Blocked by:</strong> {x.next.blocker}. <strong>Done when:</strong> {x.next.test}.</p>}
        </div>
      ))}
      <section className="card" id="eastern">
        <h2 className="card-title">For the Eastern Catholic Churches, and others outside the Roman Rite</h2>
        <p className="small">This app began with the Latin Church, and we say so plainly instead of treating the Roman Rite as the whole Catholic Church. Choose your Church in <Link to="/settings">Settings → Your Church</Link>.</p>
        <p className="small"><strong>What it does for you now</strong></p>
        <ul className="small bullets">
          <li>Uses your name for the liturgy (Divine Liturgy, Holy Qurbana, Holy Qurbono, Holy Badarak) and stops presenting the Roman Mass, Office, vestment colors and lectionary as if they were yours.</li>
          <li>Numbers the Psalms as your books do (the Septuagint numbering, which the app already uses internally).</li>
          <li><strong>Byzantine Churches:</strong> the great days of the year, worked out from Pascha, with a choice of Rome’s date or the Julian date and of the new or old calendar; an outline of the Divine Liturgy of St John Chrysostom.</li>
          <li>Prayers of the Eastern tradition in the prayer book (the Trisagion, O Heavenly King, the Our Father with its doxology, the Prayer of St Ephrem, the Paschal troparion, the Creed without the Filioque), listed first for you.</li>
          <li>The Scripture, the Church Fathers (including the Eastern Fathers such as Chrysostom, Athanasius and Cyril), the study tools, the Jesus Prayer, notes and backups are common to everyone.</li>
        </ul>
        <p className="small"><strong>What it does not have yet</strong></p>
        <ul className="small bullets">
          <li>The lectionaries, daily hours, anaphoras and calendars of your Church. The Divine Office and Mass readings here are the Latin Church’s and are labelled so.</li>
          <li>The calendars of the Syriac, Armenian, Alexandrian and Chaldean traditions; we cannot work them out reliably, so the app sends you to your Church’s own calendar.</li>
          <li>The Syriac Peshitta, the Ge’ez, Armenian and Church Slavonic Bibles, and interface languages such as Arabic, Malayalam, Ukrainian and Syriac.</li>
          <li>Most modern liturgical translations and hymn texts, which are under copyright.</li>
        </ul>
        <p className="small">Orthodox and Oriental Orthodox readers are welcome to use the app too: the Scripture, Fathers and prayers are shared, and the Byzantine setting gives the Julian dates. It is a Catholic app, and it is labelled as one. If you can help us do right by your Church, please <a href="https://github.com/pathomnemonic/StudyBible/issues/new?template=feature.md" target="_blank" rel="noreferrer">tell us what is missing</a>. Further reading: <a href="https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_decree_19641121_orientalium-ecclesiarum_en.html" target="_blank" rel="noreferrer noopener">Orientalium Ecclesiarum</a> and <a href="https://www.vatican.va/content/john-paul-ii/en/apost_letters/1995/documents/hf_jp-ii_apl_19950502_orientale-lumen.html" target="_blank" rel="noreferrer noopener">Orientale Lumen</a>.</p>
      </section>
      <section className="card" id="method">
        <h2 className="card-title">How we choose, label and check sources</h2>
        <ul className="small bullets">
          <li><strong>Scripture</strong> comes only from public-domain texts with a recorded source and license. Each edition says where it came from and whether it is Church-approved.</li>
          <li><strong>Every study item says why it is attached to a passage</strong>: the source quotes it, comments on it verse by verse, cites it, is about the chapter, or only shares a topic. Use the filter in the study panel to show only the stronger kinds.</li>
          <li><strong>Authority is shown on each item</strong> (Scripture, Church teaching, Father or Doctor, saint, historical commentary, popular teaching) and is never raised by the way an item looks. Notes and summaries written for this app are labelled as such.</li>
          <li><strong>Matches made by the calendar or by a title</strong> (for example a homily for a Sunday) say so, and are not claimed to treat the passage.</li>
          <li><strong>Checks:</strong> citations are verified against source text where possible; the data validator and tests run on every change; links to other sites are not copied and may change.</li>
          <li><strong>Found a mistake?</strong> Use “Report a problem” on an item, or <a href="https://github.com/pathomnemonic/StudyBible/issues/new?template=data-correction.md" target="_blank" rel="noreferrer">open a correction</a> with the source that shows the right version. Nothing you have written in your notes is sent.</li>
          <li><a href="https://github.com/pathomnemonic/StudyBible/blob/main/docs/CHANGELOG.md" target="_blank" rel="noreferrer">What changed</a> lists app changes and content changes separately.</li>
        </ul>
      </section>
      <p className="small"><Link to="/study/sources">Sources & licensing</Link> · <Link to="/settings">Settings</Link></p>
    </div>
  );
}
