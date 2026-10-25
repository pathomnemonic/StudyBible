import type { BandId } from './model';

export interface Band {
  id: BandId; label: string; grades: string; minutes: number;
  /** how a lesson of that length is spent: [name, share of the time, what to do] */
  plan: [string, number, string][];
  verbs: string;
  methods: string[];
  assess: string[];
  support: string[];
  extend: string[];
}

export const BANDS: Band[] = [
  {
    id: 'primary', label: 'Primary', grades: 'K–2', minutes: 30,
    plan: [
      ['Gather and pray', 0.1, 'Sit together. Sign of the Cross, a short song or a simple prayer. Use the same opening every week so children know what to expect.'],
      ['Hook', 0.15, 'Show an object, a picture or ask a question about the children’s own lives that leads to the lesson’s idea.'],
      ['Tell the story (I do)', 0.25, 'Tell or read the Scripture or the lesson’s idea in short pieces. Use your voice, gestures and pictures. Ask one question at a time.'],
      ['Do it together (we do)', 0.3, 'Act out, sing, draw, sort cards or make something that shows the idea. Keep movement and talk going.'],
      ['Remember and pray', 0.2, 'Ask children to tell back one thing. Pray the lesson’s prayer together and send home the family sheet.'],
    ],
    verbs: 'name, point to, tell back, show, draw, sing, act out',
    methods: ['storytelling and picture books', 'songs and movement', 'drawing and simple crafts', 'play and role-play', 'repeating short prayers'],
    assess: ['Listen as children tell the story back in their own words', 'Ask them to point to or draw the main idea', 'Watch whether they can lead the opening prayer'],
    support: ['Pair children with a buddy', 'Use pictures with every key word', 'Break the task into one step at a time', 'Let a child answer by pointing or acting'],
    extend: ['Ask “What would you say to Jesus about this?”', 'Let a child be the storyteller', 'Add a second Scripture verse to learn by heart'],
  },
  {
    id: 'elementary', label: 'Elementary', grades: '3–5', minutes: 40,
    plan: [
      ['Gather and pray', 0.1, 'Opening prayer. Quick recall of last lesson (two or three questions).'],
      ['Engage', 0.15, 'A story, a question or a short activity that makes the topic matter to them.'],
      ['Teach (I do)', 0.25, 'Explain the idea with the Scripture and Catechism text. Introduce the new words. Use a visual.'],
      ['Practice (we do)', 0.3, 'Partner talk, matching games, short writing, a skit or a hands-on project, with you coaching.'],
      ['Show what you know (you do) and pray', 0.2, 'An exit ticket (one question each) and the closing prayer. Send the family connection home.'],
    ],
    verbs: 'explain, match, sort, retell, compare, give an example, memorize',
    methods: ['stories and Scripture reading', 'partner talk (think, pair, share)', 'games and sorting activities', 'drama and skits', 'memory work with prayers and verses'],
    assess: ['Exit ticket: one question on a card', 'Vocabulary quiz in the app', 'Retell the Scripture story in order', 'A drawing or caption that shows the idea'],
    support: ['Pre-teach vocabulary with pictures', 'Give sentence starters', 'Read aloud and let the child follow along', 'Shorten written answers to a phrase'],
    extend: ['Compare two Scripture passages', 'Teach the idea to a younger child', 'Read the full Catechism paragraph aloud'],
  },
  {
    id: 'middle', label: 'Middle school', grades: '6–8', minutes: 45,
    plan: [
      ['Gather and pray', 0.1, 'Student-led prayer. A retrieval warm-up: three questions on earlier lessons.'],
      ['Launch', 0.15, 'A real question, a short clip or a case to wonder about. Let students say what they already think.'],
      ['Teach and explore (I do)', 0.25, 'Present the idea with the Scripture and Catechism, showing where it comes from. Model how you reason from the text.'],
      ['Work on it (we do)', 0.3, 'Small groups investigate a text, a chart or a case. Report back. Correct misunderstandings.'],
      ['Apply and pray (you do)', 0.2, 'A short written response, then a reflection on how this touches life. Close in prayer.'],
    ],
    verbs: 'analyze, compare, connect, explain why, defend, apply',
    methods: ['guided reading of Scripture and the Catechism', 'small-group inquiry', 'timelines, charts and graphic organizers', 'discussion and debate with ground rules', 'service and mission projects'],
    assess: ['Short written responses graded for accuracy and reasoning', 'Concept maps', 'Group presentations with a rubric', 'Unit quizzes in the app'],
    support: ['Provide graphic organizers', 'Pre-read hard texts together', 'Allow oral answers', 'Chunk the work into steps'],
    extend: ['Read a Father’s sermon on the passage', 'Research a saint who lived the lesson', 'Lead a part of the class discussion'],
  },
  {
    id: 'high', label: 'High school', grades: '9–12', minutes: 50,
    plan: [
      ['Gather and pray', 0.1, 'A short prayer or reading. Retrieval: students write what they remember from last time.'],
      ['Frame the question', 0.15, 'Pose the central question and likely objections honestly. Name what is at stake.'],
      ['Teach from the sources (I do)', 0.25, 'Work from Scripture, the Catechism and, where it helps, the Fathers or Church documents. Show the argument, not just the conclusion.'],
      ['Seminar or workshop (we do)', 0.3, 'Socratic seminar, case study, debate or close reading in groups. Ask for evidence from the texts.'],
      ['Synthesize and pray (you do)', 0.2, 'A one-paragraph written synthesis or exit ticket. Time for silence and prayer.'],
    ],
    verbs: 'evaluate, argue, synthesize, interpret, critique, apply to your own life',
    methods: ['Socratic seminar on primary texts', 'case studies and debates', 'research projects and presentations', 'reading Church documents and the Fathers', 'service and mentoring'],
    assess: ['Written arguments with citations from the Catechism and Scripture', 'Seminar participation rubric', 'Projects and presentations', 'Unit tests in the app plus a reflective journal'],
    support: ['Provide a text guide with margin questions', 'Scaffold writing with a claim-evidence-reasoning frame', 'Offer audio versions of the readings', 'Allow extra time'],
    extend: ['Read the Summa article behind the topic', 'Respond to a real objection in writing', 'Mentor a younger class'],
  },
];
export const bandOf = (id: BandId) => BANDS.find((b) => b.id === id)!;

export interface Principle { title: string; why: string; here: string }
export const PRINCIPLES: Principle[] = [
  { title: 'Begin with the end in mind', why: 'Lessons work best when you decide what students should know, be able to do and become before choosing activities (backward design).', here: 'Every lesson states an objective, an essential question and a way to check for understanding before it lists activities.' },
  { title: 'Spiral the content', why: 'Revisiting key truths at deeper levels, rather than teaching each topic once, builds lasting understanding.', here: 'The Creed, the sacraments, the moral life and prayer return in every grade, with more depth and sources each time.' },
  { title: 'Gradual release of responsibility', why: 'Students learn best when the teacher shows first, then guides, then steps back (I do, we do, you do).', here: 'Each plan has teach, guided practice and independent parts with timings for your class length.' },
  { title: 'Retrieval and spacing', why: 'Trying to remember something strengthens memory more than rereading it, and spacing review over time helps it last.', here: 'Each lesson opens with questions on earlier lessons, and the app builds review quizzes from words students have already met.' },
  { title: 'Teach in more than one way', why: 'Presenting an idea through words, images, sound, movement and doing helps more students (Universal Design for Learning).', here: 'Every lesson can be read, listened to, watched, drawn, acted out, discussed and printed.' },
  { title: 'Active, social learning', why: 'Students understand more when they talk, explain, question and make things, rather than only listening.', here: 'The “Do it together” part has partner and group work suited to the age, with discussion questions that have no one-word answer.' },
  { title: 'Check often and kindly', why: 'Short, frequent, low-stakes checks show you what to reteach before it is too late.', here: 'Exit tickets, vocabulary quizzes, retell prompts and review sets are built in.' },
  { title: 'Differentiate and include', why: 'Students arrive with different backgrounds, languages and needs. Planning supports in advance includes everyone.', here: 'Each age band lists ways to support and extend, and the lessons can be read aloud, enlarged and printed.' },
  { title: 'Start from Scripture and Christ', why: 'Catechesis is about meeting a person, Jesus Christ, and the whole of the faith is centered on him.', here: 'Each lesson is anchored in a Scripture passage and the Catechism, and points to Christ.' },
  { title: 'Form the whole person', why: 'The Church names six tasks of catechesis: knowledge of the faith, liturgical education, moral formation, teaching to pray, education for community life and missionary initiation.', here: 'Lessons include doctrine, a link to the Mass or the Church year, life application, prayer, community activity and a way to share the faith.' },
  { title: 'Parents are the first teachers', why: 'Faith is handed on first in the home. The parish and school help families, not replace them.', here: 'Every lesson has a family connection and a home plan that fits one week.' },
  { title: 'Respect age and development', why: 'Younger children think concretely and learn through story and play. Teens need reasons, honest questions and a chance to own their faith.', here: 'Language, activities and sources change with the age band.' },
];

export const DELIVERY: { id: string; name: string; who: string; how: string }[] = [
  { id: 'classroom', name: 'Classroom (teacher-led)', who: 'Catholic school, parish school of religion, religious education class', how: 'Use the Teacher view for a timed plan. Use Present on a screen for the idea, Scripture, words and questions. Print the student handout.' },
  { id: 'self', name: 'Self-paced (student)', who: 'Older students, distance learners, anyone catching up', how: 'Use the Student view: read, watch, listen, do the activity, take the check. Progress is saved on this device.' },
  { id: 'family', name: 'Family and homeschool', who: 'Parents teaching at home, one or several children', how: 'Use the Family view: a five-day plan for each lesson with short daily steps, shared prayers and conversation questions.' },
  { id: 'listen', name: 'Listen only', who: 'Car rides, young children, readers who struggle, blind or low-vision learners', how: 'Press Read to me for the lesson, the Scripture and the Catechism text. The Bible in a Year and recorded readings are in the Listen tab.' },
  { id: 'print', name: 'Print or paper', who: 'Classrooms without devices, take-home work, travel', how: 'Print one lesson or the whole grade packet. Each handout fits a page or two with space to write.' },
  { id: 'group', name: 'Small group or youth night', who: 'Youth ministry, confirmation prep, campus ministry, Bible study', how: 'Use the discussion questions and Scripture from the lesson, then the “Go deeper” sources. Plan 60 minutes with prayer at the start and end.' },
  { id: 'present', name: 'Present on a screen', who: 'Any teacher with a projector or tablet', how: 'Present turns the lesson into large-print cards, one idea at a time. Use the arrow keys to move.' },
];

export const FAMILY_DAYS: [string, string][] = [
  ['Day 1: Listen and read', 'Read or listen to the big idea and the Scripture together. Ask the “wonder” question and let everyone answer.'],
  ['Day 2: Watch and talk', 'Watch a recommended video if there is one. Talk about what you noticed. Look at the picture or painting.'],
  ['Day 3: Do it', 'Do the activity. Let older children help younger ones.'],
  ['Day 4: Pray and remember', 'Learn the prayer or verse. Read the Catechism paragraphs aloud (older children). Learn the new words.'],
  ['Day 5: Check and celebrate', 'Take the quick check together. Share one thing each person learned. Pray and, if you can, go to Mass or share a treat.'],
];

export const RESOURCES: { name: string; url: string; note: string }[] = [
  { name: 'Catechism of the Catholic Church (Vatican)', url: 'https://www.vatican.va/archive/ENG0015/_INDEX.HTM', note: 'The full text at the Vatican’s site.' },
  { name: 'Compendium of the Catechism', url: 'https://www.vatican.va/archive/compendium_ccc/documents/archive_2005_compendium-ccc_en.html', note: 'The whole Catechism in 598 short questions and answers: good for review.' },
  { name: 'Catechesi Tradendae', url: 'https://www.vatican.va/content/john-paul-ii/en/apost_exhortations/documents/hf_jp-ii_exh_16101979_catechesi-tradendae.html', note: 'St John Paul II on catechesis in our time.' },
  { name: 'Fidei Depositum', url: 'https://www.vatican.va/content/john-paul-ii/en/apost_constitutions/documents/hf_jp-ii_apc_19921011_fidei-depositum.html', note: 'The apostolic constitution that gave the Catechism to the Church.' },
  { name: 'Evangelii Gaudium', url: 'https://www.vatican.va/content/francesco/en/apost_exhortations/documents/papa-francesco_esortazione-ap_20131124_evangelii-gaudium.html', note: 'Pope Francis on proclaiming the Gospel, with a chapter on preparing homilies and sharing the faith.' },
  { name: 'Loyola Press: Catholic resources', url: 'https://www.loyolapress.com/catholic-resources/', note: 'Articles, activities and seasonal ideas for families and catechists.' },
  { name: 'Catholic Culture', url: 'https://www.catholicculture.org', note: 'Liturgical year, saints of the day and documents.' },
  { name: 'EWTN Catholic library', url: 'https://www.ewtn.com/catholicism/library', note: 'Articles and documents on many topics.' },
  { name: 'Catholic Online: Saints', url: 'https://www.catholic.org/saints/', note: 'Short lives of saints for biography projects.' },
];
