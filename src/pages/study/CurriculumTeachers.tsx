import { Link } from 'react-router-dom';
import { BANDS, DELIVERY, FAMILY_DAYS, PRINCIPLES, RESOURCES } from '../../curriculum/pedagogy';

/** The teacher and parent handbook for the K–12 program. */
export default function CurriculumTeachers() {
  return (
    <div className="page cur-handbook">
      <Link to="/study/curriculum" className="small no-print">← Curriculum</Link>
      <h1>Handbook for teachers and parents</h1>
      <p className="lede">How to plan, teach, check and adapt these lessons.</p>
      <nav className="no-print cur-toc" aria-label="Sections">
        {[['start', 'Start here'], ['plan', 'Planning the year'], ['lesson', 'Teaching a lesson'], ['ask', 'Asking good questions'], ['assess', 'Assessing'], ['include', 'Including everyone'], ['hard', 'Hard questions'], ['parents', 'Working with parents'], ['prayer', 'Prayer and the Church year'], ['safe', 'Safe environment'], ['modes', 'Ways to deliver'], ['resources', 'More resources']].map(([id, l]) => <a key={id} href={`#${id}`}>{l}</a>)}
      </nav>

      <section className="sect" id="start">
        <h2 className="eyebrow-h">Start here</h2>
        <p>Catechesis is more than teaching facts. It aims to bring a person into friendship with Jesus Christ and to hand on the whole faith: what we believe, how we worship, how we live and how we pray. The Church names six tasks: <strong>knowledge of the faith, liturgical education, moral formation, teaching to pray, education for community life and missionary initiation.</strong> Every lesson here touches several of them.</p>
        <p>Your students are not blank pages. Many come from homes where faith is lived and others from homes where it is not. Begin with welcome, keep your promises, and tell the truth gently.</p>
        <p>A good lesson needs three things from you: <strong>to have read the Scripture and Catechism text ahead of time</strong>, to have prayed for the students, and to be willing to say “I will find out” when you do not know.</p>
      </section>

      <section className="sect" id="plan">
        <h2 className="eyebrow-h">Planning the year</h2>
        <ul>
          <li><strong>Pace.</strong> Each grade has about 24 lessons: one a week leaves room for feast days, review, sacramental preparation and the days that fall through. Two shorter classes a week can split one lesson.</li>
          <li><strong>Line up with the Church year.</strong> Teach the Eucharist units near Holy Thursday or Corpus Christi, the Trinity near Trinity Sunday, the Holy Spirit and Confirmation in Easter, Mary near Marian feasts, the Paschal Mystery in Lent. Move units around as needed; the lessons inside each unit stay together.</li>
          <li><strong>Review.</strong> Every fourth or fifth week, skip a new lesson and review: the app builds a short quiz from words students have already met.</li>
          <li><strong>Sacramental preparation.</strong> Grade 2 prepares for first Reconciliation and first Communion and Grade 8 prepares for Confirmation, but your parish or diocese sets the requirements and calendar. Use these lessons alongside them.</li>
        </ul>
        <div style={{ overflowX: 'auto' }}><table className="cur-table">
          <thead><tr><th>Age band</th><th>Grades</th><th>Class</th><th>Typical teaching methods</th></tr></thead>
          <tbody>{BANDS.map((b) => <tr key={b.id}><td>{b.label}</td><td>{b.grades}</td><td>{b.minutes} min</td><td>{b.methods.join('; ')}</td></tr>)}</tbody>
        </table></div>
      </section>

      <section className="sect" id="lesson">
        <h2 className="eyebrow-h">Teaching a lesson</h2>
        <p><strong>Before (10 to 15 minutes).</strong> Read the big idea, the Scripture and the Catechism paragraphs in the Teacher view. Say the objective in one sentence. Decide what you will cut if time runs short. Gather materials. Pray for each student by name if you can.</p>
        <p><strong>During.</strong> The plan follows a pattern that works for every age: gather and pray; engage; teach; practice together; show what you know; pray again. This is the “I do, we do, you do” pattern: you show, you guide, they try.</p>
        <p><strong>After (5 minutes).</strong> Note what worked and what to reteach. Mark the lesson done in the app.</p>
        <h3>The same pattern for each age</h3>
        {BANDS.map((b) => (
          <details key={b.id}>
            <summary>{b.label} ({b.grades}), {b.minutes} minutes</summary>
            <ol>{b.plan.map(([n, s, t]) => <li key={n}><strong>{n}</strong> ({Math.round(b.minutes * s)} min). {t}</li>)}</ol>
            <p className="small"><strong>Ask students to:</strong> {b.verbs}.</p>
          </details>
        ))}
      </section>

      <section className="sect" id="ask">
        <h2 className="eyebrow-h">Asking good questions</h2>
        <ul>
          <li><strong>Wait.</strong> After you ask, count to five silently. More students answer, and the answers are better.</li>
          <li><strong>Think, pair, share.</strong> Give a minute to think alone, a minute to talk to a partner, then ask a few pairs to share.</li>
          <li><strong>Ask for evidence.</strong> “Where do you see that in the passage?” works for every age from third grade up.</li>
          <li><strong>Start with what they notice,</strong> then what it means, then what to do about it.</li>
          <li><strong>Welcome wrong answers.</strong> Say “Say more” and “Who sees it differently?” before you correct. Correct clearly when it matters: this is the Church’s teaching.</li>
          <li><strong>Cold calling kindly.</strong> Tell students you will call on people, give a heads-up, and let them pass once.</li>
        </ul>
      </section>

      <section className="sect" id="assess">
        <h2 className="eyebrow-h">Assessing</h2>
        <p>You assess knowledge, understanding and skills. You do not grade a child’s faith or prayer; only God sees the heart.</p>
        <ul>
          <li><strong>Every lesson:</strong> an exit ticket (one thing I learned, one question) and the short check in the app.</li>
          <li><strong>Every unit:</strong> a short quiz, a retell or a project. Use a simple rubric with four levels: beginning, developing, secure, strong.</li>
          <li><strong>Memory work:</strong> the Sign of the Cross, Our Father, Hail Mary, Glory Be, Act of Contrition and Apostles’ Creed are prayers learned by heart in the first grades. Add the Rosary, the Angelus and a short list of Scripture verses as students grow.</li>
          <li><strong>Portfolios:</strong> keep a folder of drawings, writing and reflections. They show growth better than a grade.</li>
          <li><strong>Use the results.</strong> If most of the class misses a question, reteach it before moving on.</li>
        </ul>
        {BANDS.map((b) => <p key={b.id} className="small"><strong>{b.label}:</strong> {b.assess.join('; ')}.</p>)}
      </section>

      <section className="sect" id="include">
        <h2 className="eyebrow-h">Including everyone</h2>
        <p>Plan supports for learners before they need them. The lessons are available as text, audio, large print on screen, and paper; students can answer by speaking, drawing or writing.</p>
        {BANDS.map((b) => <div key={b.id}><h3>{b.label}</h3><div className="cur-two"><div><strong>Support</strong><ul>{b.support.map((s) => <li key={s}>{s}</li>)}</ul></div><div><strong>Stretch</strong><ul>{b.extend.map((s) => <li key={s}>{s}</li>)}</ul></div></div></div>)}
        <ul>
          <li><strong>English learners:</strong> use pictures with key words, pair with a buddy, let students pray in their home language, and read the Bible in Spanish (available in the reader).</li>
          <li><strong>Students with attention or reading differences:</strong> shorter chunks, a visible schedule, audio versions and choice in how to respond.</li>
          <li><strong>Students from other traditions or none:</strong> welcome them, teach clearly what Catholics believe, and invite without pressure. Eastern Catholic students: use the “Your Church” setting; the Creed and sacraments are the same, and the Byzantine Divine Liturgy is in the Pray tab.</li>
        </ul>
      </section>

      <section className="sect" id="hard">
        <h2 className="eyebrow-h">Hard questions</h2>
        <ul>
          <li><strong>Welcome the question,</strong> then say, “That is a good question; let us look at what the Church teaches.” Open the Catechism or the Questions about the faith section together.</li>
          <li><strong>Suffering, death and sin</strong> need care with young children: be simple, true and hopeful, and never frighten.</li>
          <li><strong>Sexuality and marriage</strong> are taught by age: dignity of the body and kindness in the early grades; chastity, marriage and the body in middle and high school, with parents informed in advance.</li>
          <li><strong>Disagreement and doubt</strong> are not betrayal. Listen. Do not shame. Offer a conversation after class.</li>
          <li><strong>A child who tells you something troubling</strong> (harm, abuse, self-harm) needs an adult who will act. Follow your diocese’s safe environment policy and your legal duties; do not promise secrecy.</li>
        </ul>
      </section>

      <section className="sect" id="parents">
        <h2 className="eyebrow-h">Working with parents</h2>
        <p>Parents are the first teachers of their children in the faith. Tell them what you are teaching, send the family connection each week, and invite their help at home. The Family view of each lesson gives a five-day plan:</p>
        <ol>{FAMILY_DAYS.map(([d, t]) => <li key={d}><strong>{d}.</strong> {t}</li>)}</ol>
        <p className="small">For homeschoolers: choose the grade by readiness, not by birthday. Use one lesson a week, or two shorter ones. Teach different ages together by reading the same Scripture and giving each child the question and activity for their level.</p>
      </section>

      <section className="sect" id="prayer">
        <h2 className="eyebrow-h">Prayer and the Church year</h2>
        <ul>
          <li>Open and close every class in prayer. Keep the same pattern all year so children can lead it.</li>
          <li>Keep a small prayer table with a crucifix, a Bible, a candle (or a safe light) and a cloth in the color of the season: green, purple, white, red.</li>
          <li>Pray for the students and their families by name, and let students offer prayers of their own.</li>
          <li>Teach students to find <Link to="/today">Today</Link> in the app: the day’s Mass readings, the saint and the season.</li>
          <li>Celebrate feasts. A saint’s story, a song and a small treat teach more than a worksheet.</li>
          <li>Invite students to Mass and to Confession as appropriate, and pray with them for vocations.</li>
        </ul>
      </section>

      <section className="sect" id="safe">
        <h2 className="eyebrow-h">Safe environment</h2>
        <p>Dioceses require background checks and training for everyone who works with children and young people. If you teach for a parish or school, complete them. Never be alone with a single child, keep doors open or windows uncovered, and report any concern as your diocese and the law require. This app does not replace your diocese’s policies.</p>
      </section>

      <section className="sect" id="modes">
        <h2 className="eyebrow-h">Ways to deliver the same lesson</h2>
        <dl className="cur-words">{DELIVERY.map((d) => <div key={d.id}><dt>{d.name}</dt><dd><span className="muted">{d.who}.</span> {d.how}</dd></div>)}</dl>
      </section>

      <section className="sect" id="resources">
        <h2 className="eyebrow-h">More resources</h2>
        <h3>In this app</h3>
        <ul>
          <li><Link to="/study/catechism">The Catechism</Link>, searchable, with Scripture links</li>
          <li><Link to="/study/kids">The Children’s Bible</Link> at three reading levels</li>
          <li><Link to="/study/apologetics">Questions about the faith</Link>, for middle and high school</li>
          <li><Link to="/room">The Read tab</Link>: the Baltimore Catechism, the Roman Catechism and the writings of the saints</li>
          <li><Link to="/study/saints">Lives of the saints</Link> and the <Link to="/pray/prayers">prayer book</Link></li>
          <li><Link to="/study/videos">The Catholic video library</Link> (watch before you show)</li>
          <li><Link to="/study/course">Salvation history in twelve lessons</Link>, <Link to="/study/story">Follow a story</Link> and <Link to="/study/paths">Study paths</Link></li>
          <li><Link to="/pray/devotions">Devotions</Link>: the Rosary, Stations and the Angelus</li>
        </ul>
        <h3>Outside links</h3>
        <ul>{RESOURCES.map((r) => <li key={r.url}><a href={r.url} target="_blank" rel="noreferrer">{r.name}</a> <span className="muted small">{r.note}</span></li>)}</ul>
        <h3>The thinking behind the program</h3>
        <ul>{PRINCIPLES.map((p) => <li key={p.title}><strong>{p.title}.</strong> {p.why}</li>)}</ul>
        <div className="notice info">Not reviewed or approved by a bishop or diocese. If you teach in a parish or school, follow your diocese’s requirements.</div>
      </section>
    </div>
  );
}
