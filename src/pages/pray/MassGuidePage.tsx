import { Link } from 'react-router-dom';

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

export default function MassGuidePage() {
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
