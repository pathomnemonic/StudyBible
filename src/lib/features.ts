/**
 * One list of everything the app can do, so the search box, the "Everything" page, the hubs and the red dots all agree.
 * `hub` is the tab where a reader would look first; `hot` marks the features worth pointing a newcomer at.
 */
export type Hub = 'today' | 'bible' | 'read' | 'study' | 'learn' | 'pray' | 'listen' | 'teach' | 'you';
export interface Feature { id: string; title: string; blurb: string; to: string; hub: Hub; keywords?: string; hot?: boolean; interest?: string[] }

export const HUBS: { id: Hub; title: string; blurb: string; to: string }[] = [
  { id: 'today', title: 'Today', blurb: 'The day’s readings, saint and a question', to: '/today' },
  { id: 'bible', title: 'Bible', blurb: 'Read, study and search Scripture', to: '/read' },
  { id: 'read', title: 'Read', blurb: 'Saints, Fathers, catechisms and your own books', to: '/room' },
  { id: 'learn', title: 'Learn', blurb: 'The Catechism program for every age, the Catechism itself and the faith explained', to: '/learn' },
  { id: 'study', title: 'Explore', blurb: 'Study tools for the Bible: words, books, people, places', to: '/study' },
  { id: 'pray', title: 'Pray', blurb: 'Rosary, Mass, devotions and the Church’s year', to: '/pray' },
  { id: 'listen', title: 'Media', blurb: 'Bible in a Year, podcasts, audiobooks and videos', to: '/listen' },
  { id: 'teach', title: 'Teach', blurb: 'Classes, live games and the K–12 program', to: '/teach' },
  { id: 'you', title: 'You', blurb: 'Notes, plans, settings and sync', to: '/profile' },
];

export const FEATURES: Feature[] = [
  // Today
  { id: 'today.home', title: 'Today', blurb: 'A verse, a saint’s words and the day’s readings.', to: '/today', hub: 'today', keywords: 'home daily verse' },
  { id: 'today.readings', title: 'Mass readings', blurb: 'The day’s readings printed in full in your translation.', to: '/pray/readings', hub: 'today', keywords: 'lectionary gospel first reading psalm', hot: true, interest: ['pray', 'bible'] },
  { id: 'today.plans', title: 'Reading plans', blurb: 'Follow a plan through the Bible or a theme.', to: '/pray/plans', hub: 'today', keywords: 'schedule year', interest: ['bible'] },
  { id: 'today.days', title: 'Favorite days', blurb: 'Days you starred, and your week at a glance.', to: '/days', hub: 'today', keywords: 'calendar star' },
  { id: 'today.session', title: 'A quiet moment', blurb: 'A guided ten-minute pause: pray, read, reflect.', to: '/session', hub: 'today', keywords: 'ten minutes guided', interest: ['pray'] },
  { id: 'today.memorize', title: 'Memorize Scripture', blurb: 'Spaced repetition and audio recall for verses.', to: '/memorize', hub: 'today', keywords: 'learn by heart flashcards', interest: ['bible'] },
  // Bible
  { id: 'bible.read', title: 'The Bible', blurb: 'Pick up where you left off or choose any book.', to: '/read', hub: 'bible', keywords: 'scripture chapter translation douay', hot: true, interest: ['bible'] },
  { id: 'bible.search', title: 'Search everything', blurb: 'Verses, words, notes, the Fathers and the Catechism.', to: '/study/search', hub: 'bible', keywords: 'find' },
  { id: 'bible.concordance', title: 'Concordance', blurb: 'Every place a word appears.', to: '/study/concordance', hub: 'bible', keywords: 'word search' },
  { id: 'bible.topical', title: 'Topical index', blurb: 'Parables, miracles, prophecies and covenants by topic.', to: '/study/topical', hub: 'bible', keywords: 'topics' },
  { id: 'bible.books', title: 'Books and outlines', blurb: 'An introduction to each of the 73 books.', to: '/study/books', hub: 'bible', keywords: 'intro outline' },
  { id: 'bible.synopsis', title: 'Gospel comparison', blurb: 'The four Gospels side by side.', to: '/study/synopsis', hub: 'bible', keywords: 'synoptic parallel' },
  { id: 'bible.pauline', title: 'Paul’s letters', blurb: 'Outlines and arguments of the letters.', to: '/study/pauline', hub: 'bible', keywords: 'epistles romans' },
  { id: 'bible.terms', title: 'Key words and phrases', blurb: 'What they mean and where they occur.', to: '/study/terms', hub: 'bible', keywords: 'glossary greek hebrew' },
  { id: 'bible.quotations', title: 'Who quoted this verse?', blurb: 'Every Father and saint who cites a passage.', to: '/study/quotations', hub: 'bible', keywords: 'fathers citations', hot: true, interest: ['study'] },
  { id: 'bible.dossier', title: 'Passage dossier', blurb: 'Everything on a passage, in one printable page.', to: '/study/dossier', hub: 'bible', keywords: 'print report' },
  { id: 'bible.fulfilment', title: 'Promise and fulfilment', blurb: 'Types and prophecies in the Fathers’ words.', to: '/study/fulfilment', hub: 'bible', keywords: 'typology prophecy' },
  { id: 'bible.share', title: 'Share a verse', blurb: 'Make a picture of a verse, with a painting.', to: '/share', hub: 'bible', keywords: 'image card instagram' },
  // Read
  { id: 'read.room', title: 'Read: saints and Fathers', blurb: '94 works to read in full, with every Bible reference tappable.', to: '/room', hub: 'read', keywords: 'library augustine aquinas confessions imitation', hot: true, interest: ['study', 'pray'] },
  { id: 'read.catechism', title: 'Catechism of the Catholic Church', blurb: 'The full text, paragraph by paragraph, with search.', to: '/study/catechism', hub: 'learn', keywords: 'ccc doctrine', hot: true, interest: ['study', 'teach'] },
  { id: 'read.church', title: 'Councils and Church documents', blurb: 'Read in full where public domain, official links for the rest.', to: '/study/church', hub: 'read', keywords: 'vatican nicaea encyclical' },
  { id: 'read.papal', title: 'Papal writings', blurb: 'Encyclicals and letters.', to: '/study/papal', hub: 'read', keywords: 'pope encyclical' },
  { id: 'read.saints', title: 'Saints', blurb: 'Lives of the saints and the saint of the day.', to: '/study/saints', hub: 'read', keywords: 'saint of the day biography' },
  { id: 'read.encyclopedia', title: 'Catholic encyclopedia', blurb: 'Articles on the Church’s history, doctrine and life.', to: '/study/encyclopedia', hub: 'read', keywords: 'reference' },
  { id: 'read.mine', title: 'My books', blurb: 'Import your own EPUB or text books and read them here.', to: '/room?tab=mine', hub: 'read', keywords: 'epub import kindle shelf' },
  { id: 'study.visual', title: 'Visual Catechism', blurb: 'The faith as tappable diagrams: Trinity, sacraments, Mass, the Church’s year, salvation history.', to: '/study/visual', hub: 'learn', keywords: 'diagram chart timeline infographic trinity sacraments commandments virtues', hot: true, interest: ['study', 'teach', 'family'] },
  { id: 'pray.intentions', title: 'Prayer list', blurb: 'People and needs you pray for, with a daily “I prayed” and answered prayers.', to: '/pray/intentions', hub: 'pray', keywords: 'intentions petitions prayer requests names', hot: true, interest: ['pray'] },
  { id: 'pray.memento', title: 'Memento mori', blurb: 'An optional, private look at the weeks of a life, as the saints kept death in mind. Add a bar to Today.', to: '/memento', hub: 'pray', keywords: 'death life weeks birthday saints remember mortality', interest: ['pray'] },
  { id: 'pray.pilgrim', title: 'Pilgrim pack', blurb: 'Rome, the Holy Land, Lourdes, Fatima, Santiago and more: guides and a checklist that work offline.', to: '/pray/pilgrim', hub: 'pray', keywords: 'pilgrimage travel trip camino shrine offline', interest: ['pray'] },
  { id: 'read.gallery', title: 'Gallery', blurb: 'Paintings and engravings of Bible scenes.', to: '/study/gallery', hub: 'read', keywords: 'art dore' },
  // Study
  { id: 'study.curriculum', title: 'Catechism program, K–12', blurb: '408 lessons with slides, games and a teacher handbook.', to: '/study/curriculum', hub: 'learn', keywords: 'lessons classroom homeschool religious education', hot: true, interest: ['teach', 'study'] },
  { id: 'study.prepare', title: 'Prepare for a sacrament', blurb: 'First Confession, First Communion, Confirmation, RCIA, marriage and more.', to: '/study/prepare', hub: 'learn', keywords: 'rcia sacrament preparation', hot: true, interest: ['study'] },
  { id: 'study.ya', title: 'Adults course', blurb: 'Thirty-six sessions on faith, vocation and the hard questions.', to: '/study/adults', hub: 'learn', keywords: 'college discernment', interest: ['study'] },
  { id: 'study.apologetics', title: 'Questions about the faith', blurb: 'Short answers with the verses and Catechism paragraphs.', to: '/study/apologetics', hub: 'learn', keywords: 'apologetics objections why catholics', hot: true, interest: ['study'] },
  { id: 'study.kids', title: 'Children’s Bible', blurb: 'Stories at three reading levels, with questions and videos.', to: '/study/kids', hub: 'learn', keywords: 'children family', interest: ['teach'] },
  { id: 'study.course', title: 'Salvation history in twelve lessons', blurb: 'The story of the Bible in order, with a quiz each.', to: '/study/course', hub: 'learn', keywords: 'overview course', interest: ['bible', 'study'] },
  { id: 'study.story', title: 'Follow a story', blurb: 'Trace Abraham, the Exodus, David, Mary or Peter through the Bible.', to: '/study/story', hub: 'learn', keywords: 'thread theme' },
  { id: 'study.paths', title: 'Study paths', blurb: 'Guided journeys: a passage, a Father’s words, a question.', to: '/study/paths', hub: 'learn', keywords: 'guided' },
  { id: 'study.doctrine', title: 'Doctrine and Catechism', blurb: 'Topics with Scripture and Catechism links.', to: '/study/doctrine', hub: 'learn', keywords: 'beliefs topics' },
  { id: 'study.themes', title: 'Biblical theology explorer', blurb: 'Follow a theme from Genesis to Revelation.', to: '/study/themes', hub: 'study', keywords: 'covenant temple' },
  { id: 'study.universe', title: 'Scripture universe', blurb: 'All 73 books as a galaxy with the Fathers in rings.', to: '/study/universe', hub: 'study', keywords: 'galaxy 3d visual', hot: true, interest: ['study'] },
  { id: 'study.constellation', title: 'Constellation', blurb: 'The books as stars joined by cross-references.', to: '/study/constellation', hub: 'study', keywords: 'xrefs graph' },
  { id: 'study.timespace', title: 'Time and place', blurb: 'Slide through the biblical story and watch the map follow.', to: '/study/timespace', hub: 'study', keywords: 'timeline map history' },
  { id: 'study.maps', title: 'Maps', blurb: 'Places named in Scripture.', to: '/study/maps', hub: 'study', keywords: 'geography' },
  { id: 'study.world', title: 'The biblical world', blurb: 'Journeys, eras and archaeology.', to: '/study/world', hub: 'study', keywords: 'archaeology journeys' },
  { id: 'study.people', title: 'Genealogies', blurb: 'Family trees from Adam to Jesus.', to: '/study/people', hub: 'study', keywords: 'family tree' },
  { id: 'study.manuscripts', title: 'Manuscripts', blurb: 'Real pages, zoomable.', to: '/study/manuscripts', hub: 'study', keywords: 'codex sinaiticus' },
  { id: 'study.textual', title: 'Textual history', blurb: 'How the text was handed down.', to: '/study/textual', hub: 'study', keywords: 'variants' },
  { id: 'study.voices', title: 'Voices through time', blurb: 'The Fathers and saints on one timeline.', to: '/study/voices', hub: 'study', keywords: 'timeline fathers' },
  { id: 'study.concepts', title: 'Web of themes', blurb: 'How great themes of Scripture connect.', to: '/study/concepts', hub: 'study', keywords: 'graph' },
  { id: 'study.lexicon', title: 'Greek and Hebrew words', blurb: 'Look up a word by meaning, sound or Strong’s number, and see every place it appears.', to: '/study/lexicon', hub: 'study', keywords: 'lexicon strongs greek hebrew original language agape logos hesed', hot: true, interest: ['study', 'bible'] },
  { id: 'study.sources', title: 'Sources and licensing', blurb: 'Where every text comes from.', to: '/study/sources', hub: 'study', keywords: 'rights' },
  // Pray
  { id: 'pray.rosary', title: 'The Rosary', blurb: 'Bead by bead, with the mysteries pictured, led by you, a pace, your device or a recording.', to: '/pray/devotions/rosary', hub: 'pray', keywords: 'mysteries beads mary joyful sorrowful glorious luminous', hot: true, interest: ['pray'] },
  { id: 'pray.mercy', title: 'Divine Mercy Chaplet', blurb: 'Prayed on rosary beads, with a recording.', to: '/pray/devotions/divine-mercy', hub: 'pray', keywords: 'faustina chaplet three oclock', hot: true, interest: ['pray'] },
  { id: 'pray.devotions', title: 'Devotions', blurb: 'Rosary, Angelus, Stations, litanies, Holy Hour and more.', to: '/pray/devotions', hub: 'pray', keywords: 'chaplet angelus stations litany st michael holy hour' },
  { id: 'pray.mass', title: 'Mass mode', blurb: 'Follow the Mass step by step: when to stand, kneel, and what to say.', to: '/mass', hub: 'pray', keywords: 'liturgy follow along latin', hot: true, interest: ['pray'] },
  { id: 'pray.massef', title: 'Extraordinary Form Mass', blurb: 'The 1962 Order of Mass in English.', to: '/mass/ef', hub: 'pray', keywords: 'latin tridentine' },
  { id: 'pray.life', title: 'Catholic life', blurb: 'Today’s obligations, holy days, a Confession guide and indulgences.', to: '/pray/life', hub: 'pray', keywords: 'fasting abstinence friday lent holy day obligation indulgence find mass', hot: true, interest: ['pray'] },
  { id: 'pray.confession', title: 'Going to Confession', blurb: 'A step-by-step guide with what to say.', to: '/pray/devotions/confession', hub: 'pray', keywords: 'reconciliation penance sin' },
  { id: 'pray.examination', title: 'Examination of conscience', blurb: 'A private checklist before Confession.', to: '/pray/examination', hub: 'pray', keywords: 'sins' },
  { id: 'pray.examen', title: 'Daily Examen', blurb: 'Five quiet steps at the end of the day.', to: '/pray/examen', hub: 'pray', keywords: 'ignatian' },
  { id: 'pray.office', title: 'Divine Office', blurb: 'Lauds, Vespers, Compline and the little hours.', to: '/pray/office', hub: 'pray', keywords: 'liturgy of the hours breviary' },
  { id: 'pray.prayers', title: 'Prayer book', blurb: 'Traditional prayers searchable by need.', to: '/pray/prayers', hub: 'pray', keywords: 'our father hail mary memorare' },
  { id: 'pray.novenas', title: 'Novenas and short plans', blurb: 'Holy Spirit, St Joseph, Divine Mercy, O Antiphons and more.', to: '/pray/novenas', hub: 'pray', keywords: 'nine days' },
  { id: 'pray.lectio', title: 'Lectio Divina', blurb: 'Read, meditate, pray, rest, with a gentle timer.', to: '/pray/lectio', hub: 'pray', keywords: 'scripture prayer' },
  { id: 'pray.year', title: 'The Church’s year', blurb: 'Seasons, colors and great days.', to: '/pray/year', hub: 'pray', keywords: 'advent lent easter calendar liturgical' },
  { id: 'pray.sunday', title: 'Prepare for Sunday', blurb: 'The coming Sunday’s readings with commentary.', to: '/pray/sunday', hub: 'pray', keywords: 'homily' },
  { id: 'pray.morning', title: 'Morning mode', blurb: 'Wake to rising sound and the day’s Gospel.', to: '/pray/morning', hub: 'pray', keywords: 'alarm' },
  { id: 'listen.meditate', title: 'Meditate: chant, hymns and quiet sounds', blurb: 'Gregorian chant, hymns, piano and nature to rest with or fall asleep to.', to: '/listen?tab=meditate', hub: 'listen', keywords: 'sleep calm relax chant hymns piano rain peace', interest: ['pray'] },
  { id: 'pray.sleep', title: 'Sleep mode', blurb: 'A psalm read slowly while the sound fades.', to: '/pray/sleep', hub: 'pray', keywords: 'bedtime night' },
  { id: 'pray.build', title: 'Build a prayer time', blurb: 'Order your own prayers, Scripture and silence.', to: '/pray/build', hub: 'pray', keywords: 'custom' },
  { id: 'pray.journal', title: 'Prayer journal', blurb: 'Reflections and intentions, private to this device.', to: '/pray/journal', hub: 'pray', keywords: 'diary' },
  { id: 'pray.liturgies', title: 'All the liturgies', blurb: 'Roman, Byzantine and other rites.', to: '/pray/liturgies', hub: 'pray', keywords: 'eastern rites' },
  { id: 'pray.lit.james', title: 'Liturgy of St James', blurb: 'The ancient liturgy of Jerusalem and West Syria.', to: '/pray/liturgy/james', hub: 'pray', keywords: 'syro-malankara maronite antioch jerusalem qurbono anaphora eastern' },
  { id: 'pray.lit.mark', title: 'Liturgy of St Mark', blurb: 'The ancient liturgy of Alexandria, behind the Coptic and Ethiopian rites.', to: '/pray/liturgy/mark', hub: 'pray', keywords: 'coptic ethiopian eritrean alexandria egypt eastern' },
  { id: 'pray.lit.addai', title: 'Liturgy of Addai and Mari', blurb: 'The ancient East Syriac liturgy, behind the Chaldean and Syro-Malabar rites.', to: '/pray/liturgy/addai-mari', hub: 'pray', keywords: 'chaldean syro-malabar qurbana anaphora eastern assyrian' },
  { id: 'pray.divineliturgy', title: 'Byzantine Divine Liturgy', blurb: 'The Liturgy of St John Chrysostom to follow along.', to: '/pray/divine-liturgy', hub: 'pray', keywords: 'eastern orthodox' },
  // Listen
  { id: 'listen.biay', title: 'Bible in a Year', blurb: 'Daily episodes matched to the passages.', to: '/listen', hub: 'listen', keywords: 'fr mike schmitz podcast', hot: true, interest: ['bible', 'listen'] },
  { id: 'listen.foryou', title: 'For you: your favorites', blurb: 'Pick favorite podcasts, audiobooks and video creators; they are put first.', to: '/listen?tab=now', hub: 'listen', keywords: 'favorites follow continue queue', hot: true, interest: ['listen'] },
  { id: 'listen.videos', title: 'Video library', blurb: 'Over 40,000 videos from Catholic creators, searchable, with watch later.', to: '/listen?tab=videos', hub: 'listen', keywords: 'youtube watch barron catholic answers', interest: ['listen', 'study'] },
  { id: 'listen.podcasts', title: 'Catholic podcasts', blurb: 'A large library with progress and queues.', to: '/listen?tab=podcasts', hub: 'listen', keywords: 'shows episodes', hot: true, interest: ['listen'] },
  { id: 'listen.audiobooks', title: 'Audiobooks', blurb: 'Recorded books with your place remembered.', to: '/listen?tab=audiobooks', hub: 'listen', keywords: 'librivox' },
  { id: 'listen.programmes', title: 'Programmes', blurb: 'Series by Catholic teachers.', to: '/listen?tab=programmes', hub: 'listen', keywords: 'series courses' },
  // Teach
  { id: 'learn.mass', title: 'Walk through the Mass', blurb: 'Follow the Mass step by step with what each part means.', to: '/pray/mass', hub: 'learn', keywords: 'liturgy explain parts' },
  { id: 'teach.classes', title: 'Teacher tools', blurb: 'Classes, attendance, scores, exams and a gradebook.', to: '/teach', hub: 'teach', keywords: 'class roster gradebook report card', hot: true, interest: ['teach'] },
  { id: 'teach.join', title: 'Join a class', blurb: 'Type the code your teacher is showing.', to: '/join', hub: 'teach', keywords: 'student code kahoot game', hot: true, interest: ['teach'] },
  { id: 'teach.handbook', title: 'Teacher handbook', blurb: 'Methods, pacing and support for every grade.', to: '/study/curriculum/teachers', hub: 'teach', keywords: 'handbook parents' },
  { id: 'teach.run', title: 'Run a lesson in one tap', blurb: 'Open any lesson and tap Run this lesson: a timed running order with what to say and ask.', to: '/study/curriculum/5', hub: 'teach', keywords: 'lesson in a box timer teach now plan', hot: true, interest: ['teach'] },
  // You
  { id: 'you.goals', title: 'Reading goal', blurb: 'A weekly chapter goal counted from what you read. No streak to lose.', to: '/goals', hub: 'you', keywords: 'target progress weekly habit', interest: ['bible'] },
  { id: 'you.downloads', title: 'Downloads and offline', blurb: 'Save Bibles, study data and audio for no-signal use, with real sizes.', to: '/downloads', hub: 'you', keywords: 'offline save storage space audio plane travel', hot: true },
  { id: 'you.privacy', title: 'Privacy', blurb: 'What stays on your device and exactly when anything leaves it.', to: '/privacy', hub: 'you', keywords: 'data tracking analytics safe' },
  { id: 'learn.ask', title: 'Ask the Catechism', blurb: 'Ask a question in your own words and read the Catechism’s own paragraphs on it.', to: '/study/ask', hub: 'learn', keywords: 'question why how what answer faith', hot: true },
  { id: 'learn.glossary', title: 'Glossary', blurb: 'Terms of the faith in plain language, each with its Catechism paragraph.', to: '/study/glossary', hub: 'learn', keywords: 'define meaning transubstantiation purgatory indulgence dogma terms dictionary' },
  { id: 'you.history', title: 'History', blurb: 'What you read, heard and opened recently.', to: '/history', hub: 'you', keywords: 'recent recently opened listened viewed' },
  { id: 'you.library', title: 'Notes, highlights and bookmarks', blurb: 'Everything you have written or marked.', to: '/library', hub: 'you', keywords: 'my notes export' },
  { id: 'you.settings', title: 'Settings', blurb: 'Translation, language, theme, offline, reminders.', to: '/settings', hub: 'you', keywords: 'preferences font size' },
  { id: 'you.account', title: 'Account and sync', blurb: 'Optional; your data stays on this device without it.', to: '/account', hub: 'you', keywords: 'login backup drive' },
  { id: 'you.about', title: 'About', blurb: 'What this app is and is not.', to: '/about', hub: 'you', keywords: 'status help' },
];

import { getSync } from '../sync/state';
/** Accounts only show up where a sync server exists; nothing mentions them otherwise. */
/** Parts kept out of sight until they are worth showing: their pages still exist, but nothing links to them. */
const HIDDEN = new Set(['pray.morning', 'pray.pilgrim', 'today.plans']);
export const visible = (f: Feature) => !HIDDEN.has(f.id) && (f.id !== 'you.account' || getSync().server === 'available' || !!getSync().user);
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
/** Every feature that matches the typed words, best first (title matches before description matches). */
export function searchFeatures(q: string, limit = 12): Feature[] {
  const words = norm(q).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const scored: [number, Feature][] = [];
  for (const f of FEATURES.filter(visible)) {
    const t = norm(f.title), b = norm(f.blurb), k = norm(f.keywords ?? '');
    let score = 0;
    for (const w of words) {
      if (t.includes(w)) score += t.startsWith(w) ? 6 : 4;
      else if (k.includes(w)) score += 3;
      else if (b.includes(w)) score += 1;
      else { score = 0; break; }
    }
    if (score > 0) scored.push([score, f]);
  }
  return scored.sort((a, b) => b[0] - a[0]).slice(0, limit).map((x) => x[1]);
}
export const featuresOf = (hub: Hub) => FEATURES.filter((f) => f.hub === hub && visible(f));
/** The features worth starting with, put first for the things the reader said they came for. */
export function startHere(hub: Hub | null, interests: string[], n = 4): Feature[] {
  const pool = FEATURES.filter((f) => f.hot && (!hub || f.hub === hub));
  const score = (f: Feature) => (f.interest ?? []).filter((i) => interests.includes(i)).length;
  return [...pool].sort((a, b) => score(b) - score(a)).slice(0, n);
}
