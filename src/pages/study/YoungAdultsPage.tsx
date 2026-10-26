import { Link } from 'react-router-dom';

const ASK: [string, string][] = [
  ['god-exists', 'Does God exist?'],
  ['problem-of-evil', 'If God is good, why is there evil?'],
  ['suffering', 'Why does God allow suffering?'],
  ['science-faith', 'Faith, science and evolution'],
  ['chastity', 'Chastity and sex before marriage'],
  ['marriage-divorce', 'Marriage, divorce and annulment'],
  ['homosexuality', 'Same-sex attraction and marriage'],
  ['contraception', 'Contraception'],
  ['confession', 'Confession to a priest'],
  ['hell', 'Hell'],
];
const VERSES: [string, string][] = [
  ['JER/1/4', 'Jeremiah 1:4–8: “Before I formed you in the womb I knew you.”'],
  ['1SA/3/1', '1 Samuel 3: a young man hears his name called.'],
  ['LUK/1/26', 'Luke 1:26–38: Mary’s “yes.”'],
  ['MAT/19/16', 'Matthew 19:16–22: the rich young man, and the invitation.'],
  ['JHN/1/35', 'John 1:35–39: “Come and see.”'],
  ['1TI/4/12', '1 Timothy 4:12: “Let no one despise your youth.”'],
  ['PSA/119/9', 'Psalm 119:9: how can a young man keep his way pure?'],
  ['ECC/12/1', 'Ecclesiastes 12:1: remember your Creator in the days of your youth.'],
  ['SIR/6/14', 'Sirach 6:14–17: a faithful friend.'],
  ['PRO/3/5', 'Proverbs 3:5–6: trust in the Lord with all your heart.'],
];
const CCC: [number, string][] = [
  [1719, 'We are made for happiness'],
  [2392, 'Love is the fundamental vocation'],
  [1603, 'Marriage'],
  [2337, 'Chastity'],
  [2348, 'Engaged couples'],
];
const LISTEN: [string, string][] = [
  ['fr-mike', 'The Fr. Mike Schmitz Catholic Podcast'],
  ['pints-with-aquinas', 'Pints With Aquinas'],
  ['catholic-talk-show', 'The Catholic Talk Show'],
  ['pray-as-you-go', 'Pray As You Go'],
  ['father-simon-says', 'Father Simon Says'],
];

/** A page for adults: the questions, the Scripture and the people that usually come up. */
export default function YoungAdultsPage() {
  return (
    <div className="page">
      <h1>Adults</h1>
      <p className="lede">For anyone weighing the faith or coming back to it: what you actually believe, what to do with your life, how to love well, and whether any of it holds up. Nothing here is a lecture. Open what you need.</p>


      <section className="sect">
        <h2 className="eyebrow-h">Questions adults ask</h2>
        <p><Link className="btn primary" to="/study/apologetics">Open the apologetics hub</Link></p>
        <p className="muted small">Each gathers what Catholic writers and speakers say, with the verses and Catechism paragraphs to check it against.</p>
        <ul className="list">{ASK.map(([id, t]) => <li key={id}><Link to={`/study/apologetics/${id}`} className="t">{t}</Link></li>)}</ul>
        <Link to="/study/apologetics" className="small">All the questions →</Link>
      </section>

      <section className="sect">
        <h2 className="eyebrow-h">Step by step, if you are newer to the faith</h2>
        <p className="muted small">Forty-eight guided sessions in sixteen units, in order, for a small group or on your own. It starts from the basics: knowing God, the Bible and the Church, prayer, mercy, the sacraments, love and chastity, vocation, work and money, hard questions, and living as a missionary disciple. Each has Scripture, the Catechism, discussion, a challenge and a saint.</p>
        <Link className="btn primary" to="/study/curriculum/YA">Start the adults course</Link>
      </section>

      <section className="sect">
        <h2 className="eyebrow-h">Vocation: what is God asking of me?</h2>
        <p className="muted small">Every Christian is called to holiness. For most that means marriage, for some the priesthood or consecrated life, for some single life given to God. Discernment takes prayer, a spiritual director and time. These are a place to start.</p>
        <ul className="list">{VERSES.map(([ref, t]) => { const [b, c, v] = ref.split('/'); return <li key={ref}><Link to={`/read/webc/${b}/${c}?v=${v}`} className="t">{t}</Link></li>; })}</ul>
        <p className="small"><strong>Catechism.</strong> {CCC.map(([n, t], i) => <span key={n}>{i > 0 && ' · '}<Link to={`/study/catechism/${n}`}>§{n}</Link> {t}</span>)}</p>
      </section>

      <section className="sect">
        <h2 className="eyebrow-h">Read</h2>
        <ul className="list">
          <li><a className="t" href="https://www.vatican.va/content/francesco/en/apost_exhortations/documents/papa-francesco_esortazione-ap_20190325_christus-vivit.html" target="_blank" rel="noreferrer">Christus Vivit</a> <span className="muted small">Pope Francis’s letter to young people (2019), at the Vatican’s site.</span></li>
          <li><Link className="t" to="/room/work/aug-confessions/0">Augustine’s Confessions</Link> <span className="muted small">A restless young man, a lot of mistakes, and a conversion.</span></li>
          <li><Link className="t" to="/room/work/therese-story-of-a-soul/0">Story of a Soul</Link> <span className="muted small">Thérèse of Lisieux, who died at twenty-four.</span></li>
          <li><Link className="t" to="/room/work/desales-devout-life/0">Introduction to the Devout Life</Link> <span className="muted small">Holiness for people with jobs, friends and a social life.</span></li>
          <li><Link className="t" to="/room/work/lawrence-practice/0">The Practice of the Presence of God</Link> <span className="muted small">Short, and surprisingly practical.</span></li>
        </ul>
      </section>

      <section className="sect">
        <h2 className="eyebrow-h">Listen</h2>
        <ul className="list">{LISTEN.map(([id, t]) => <li key={id}><Link to={`/listen?show=${id}`} className="t">{t}</Link></li>)}</ul>
        <Link to="/listen" className="small">The Bible in a Year and more →</Link>
      </section>

      <section className="sect">
        <h2 className="eyebrow-h">Find people</h2>
        <p className="muted small">Faith is easier with friends. These are outside links; the app does not track you there.</p>
        <ul className="list">
          <li><a className="t" href="https://www.masstimes.org" target="_blank" rel="noreferrer">Find a Mass or Adoration near you</a></li>
          <li><a className="t" href="https://www.focus.org" target="_blank" rel="noreferrer">FOCUS</a> <span className="muted small">Catholic missionaries on college campuses.</span></li>
          <li><span className="t">Your parish or diocese</span> <span className="muted small">Many run a young adult group, Bible study or a Theology on Tap night. Ask at the parish office.</span></li>
        </ul>
      </section>

      <p className="muted small">If you are struggling with anxiety, loneliness or thoughts of harming yourself, talk to someone you trust today, or contact a local crisis line. A priest or counsellor can help too.</p>
    </div>
  );
}
