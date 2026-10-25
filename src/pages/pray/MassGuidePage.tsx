import { Link } from 'react-router-dom';
import { useSettings } from '../../lib/store';
import { traditionOf } from '../../lib/tradition';

/** An outline of the Order of Mass. The words of the Mass (the ICEL Roman Missal) are copyrighted, so this guide names the parts and links to the Church's own texts. */
const PARTS: { head: string; items: { name: string; note: string }[] }[] = [
  { head: 'Introductory Rites', items: [
    { name: 'Entrance and greeting', note: 'The priest and ministers enter, and the people sing. The priest greets the assembly in the Sign of the Cross.' },
    { name: 'Penitential Act', note: 'We call to mind our sins and ask God’s mercy (Kyrie, “Lord, have mercy”).' },
    { name: 'Gloria', note: 'The ancient hymn of praise, omitted in Advent and Lent.' },
    { name: 'Collect', note: 'The priest gathers our prayers into one.' } ] },
  { head: 'Liturgy of the Word', items: [
    { name: 'First reading', note: 'Usually from the Old Testament (in Easter, from Acts).' },
    { name: 'Responsorial Psalm', note: 'We answer God’s word with the psalm.' },
    { name: 'Second reading', note: 'From the letters or Revelation, on Sundays and solemnities.' },
    { name: 'Gospel acclamation and Gospel', note: 'We stand to greet Christ speaking in the Gospel.' },
    { name: 'Homily', note: 'The priest or deacon explains the readings.' },
    { name: 'Creed and Prayer of the Faithful', note: 'We profess the faith on Sundays, then pray for the Church and the world.' } ] },
  { head: 'Liturgy of the Eucharist', items: [
    { name: 'Preparation of the gifts', note: 'Bread and wine are brought forward with the collection for the poor.' },
    { name: 'Eucharistic Prayer', note: 'Includes the Sanctus (“Holy, Holy, Holy”), the words of institution and the consecration, the memorial acclamation and the final doxology with the great Amen.' },
    { name: 'Communion Rite', note: 'The Lord’s Prayer, the sign of peace, the Lamb of God, and the reception of Holy Communion.' } ] },
  { head: 'Concluding Rites', items: [
    { name: 'Blessing and dismissal', note: 'The priest blesses the people and sends them out to live what they have received.' } ] },
];

/** The Byzantine Divine Liturgy of St John Chrysostom, in outline. Other Eastern Churches have their own orders. */
const BYZANTINE: typeof PARTS = [
  { head: 'The Liturgy of the Catechumens', items: [
    { name: 'The Great Litany (Litany of Peace)', note: 'The deacon leads petitions, and the people answer “Lord, have mercy.”' },
    { name: 'The Antiphons and the Little Entrance', note: 'Psalm antiphons and the Beatitudes; the Gospel Book is carried in procession.' },
    { name: 'The Trisagion', note: '“Holy God, Holy Mighty, Holy Immortal, have mercy on us.”' },
    { name: 'The Epistle and the Gospel', note: 'The Apostle is read, then the Alleluia, then the Gospel.' },
    { name: 'The homily and the litanies', note: 'The priest preaches; litanies follow for the Church, the living and the departed.' } ] },
  { head: 'The Liturgy of the Faithful', items: [
    { name: 'The Cherubic Hymn and the Great Entrance', note: 'The gifts of bread and wine are carried in procession to the altar.' },
    { name: 'The Creed', note: 'Sung or recited; many Eastern Catholic Churches omit the Filioque.' },
    { name: 'The Anaphora', note: 'The great prayer of thanksgiving, the words of institution, and the invocation of the Holy Spirit.' },
    { name: 'The Lord’s Prayer and Holy Communion', note: '“Holy things for the holy.” Communion is given under both kinds, usually by spoon.' },
    { name: 'The Dismissal', note: 'Thanksgiving, the blessing, and the distribution of the blessed bread (antidoron).' } ] },
];

export default function MassGuidePage() {
  const [st] = useSettings();
  const t = traditionOf(st.tradition);
  if (!t.roman && st.tradition === 'byzantine') {
    return (
      <div className="page">
        <p><Link to="/pray">← Prayer</Link></p>
        <h1>Following the Divine Liturgy</h1>
        <p className="lede">The parts of the Divine Liturgy of St John Chrysostom, in order. Other days use the Liturgy of St Basil or the Presanctified Gifts, and each Church has its own books and customs. Follow your own parish’s service book.</p>
        {BYZANTINE.map((sec) => <section className="card" key={sec.head}><h2 className="card-title">{sec.head}</h2><ol className="list">{sec.items.map((i) => <li key={i.name}><strong>{i.name}.</strong> {i.note}</li>)}</ol></section>)}
        <section className="card"><h2 className="card-title">Learn more</h2><ul className="list">
          <li><a href="https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_decree_19641121_orientalium-ecclesiarum_en.html" target="_blank" rel="noreferrer noopener">Orientalium Ecclesiarum</a>, the Second Vatican Council’s decree on the Eastern Catholic Churches.</li>
          <li><a href="https://www.vatican.va/content/john-paul-ii/en/apost_letters/1995/documents/hf_jp-ii_apl_19950502_orientale-lumen.html" target="_blank" rel="noreferrer noopener">Orientale Lumen</a>, Pope John Paul II’s letter on the Eastern Churches.</li>
        </ul></section>
      </div>
    );
  }
  if (!t.roman) {
    return (
      <div className="page">
        <p><Link to="/pray">← Prayer</Link></p>
        <h1>Following the {t.liturgy}</h1>
        <p className="lede">The {t.liturgy} of the {t.name} has its own order, prayers and readings, and this app does not have them. The outline below is of the Roman Mass and would not match yours, so we do not show it as if it did.</p>
        <p>Please use your parish’s service book{t.site ? <> or <a href={t.site.url} target="_blank" rel="noreferrer noopener">{t.site.label}</a></> : ''}.</p>
        <p><a href="https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_decree_19641121_orientalium-ecclesiarum_en.html" target="_blank" rel="noreferrer noopener">Orientalium Ecclesiarum</a> explains why the Church treasures each rite.</p>
      </div>
    );
  }
  return (
    <div className="page">
      <p><Link to="/pray">← Prayer</Link></p>
      <h1>Following the Mass</h1>
      <p className="lede">The parts of the Mass in order, with a word on what each one is. The Church’s English texts of the Mass are copyrighted, so this guide describes the parts and sends you to the official sources.</p>
      {PARTS.map((s) => (
        <section className="card" key={s.head}>
          <h2 className="card-title">{s.head}</h2>
          <ol className="list">{s.items.map((i) => <li key={i.name}><strong>{i.name}.</strong> {i.note}</li>)}</ol>
        </section>
      ))}
      <section className="card">
        <h2 className="card-title">Today’s readings and where to read more</h2>
        <ul className="list">
          <li><Link to="/pray/readings">Today’s Mass readings</Link>, in your own translation, and <Link to="/pray/sunday">Prepare for Sunday</Link>.</li>
          <li><a href="https://www.usccb.org/prayer-and-worship/the-mass" target="_blank" rel="noreferrer noopener">The Mass, from the US bishops</a> (official explanations and the order of Mass).</li>
          <li><a href="https://www.vatican.va/archive/ENG0015/_INDEX.HTM" target="_blank" rel="noreferrer noopener">The Catechism, Part Two, on the liturgy</a> (the Eucharist is in paragraphs 1322-1419).</li>
          <li><Link to="/pray/prayers">Prayer book</Link>: the Creed, the Anima Christi and prayers for before and after Communion.</li>
        </ul>
      </section>
    </div>
  );
}
