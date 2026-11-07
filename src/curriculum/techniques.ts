import type { BandId, LessonSpec } from './model';

/**
 * A bank of classroom techniques taken from established teaching practice (think-pair-share, concept attainment, jigsaw,
 * gallery walk, Frayer model, Socratic seminar, retrieval practice, lectio divina, total physical response …).
 * Each one is a recipe that is filled in with the lesson's own idea, word, Scripture and question, so a teacher gets
 * concrete steps rather than a technique name.  `options.ts` chooses and orders them per lesson.
 */
export type Kit = 'voice' | 'paper' | 'screen' | 'devices';
export const KIT_RANK: Record<Kit, number> = { voice: 0, paper: 1, screen: 2, devices: 3 };
export const KIT_LABEL: Record<Kit, string> = { voice: 'Voice only', paper: 'Paper and pencil', screen: 'Screen or projector', devices: 'Student devices' };
export const KIT_ICON: Record<Kit, string> = { voice: '🗣', paper: '📝', screen: '🖥', devices: '📱' };
export type Move = 'talk' | 'move' | 'make' | 'read' | 'see' | 'check' | 'open';

export interface Ctx {
  /** the idea being taught, as written in the lesson */ concept: string;
  /** its first sentence, trimmed */ gist: string;
  /** the lesson word that best fits the idea */ term: string;
  termDef: string;
  title: string; question: string; scripture: string; saint?: string; saintName?: string; misc?: string; mem?: string; hook?: string;
  band: BandId;
  /** how to address the group: children / students / participants */ who: string;
  /** 0-based position of the idea within the lesson */ n: number;
}
export interface Option {
  id: string; title: string; /** the established method it comes from */ method: string; move: Move; kit: Kit; minutes: number;
  prep: string; steps: string[]; /** what to do if the kit is not available */ without?: string; tip?: string;
}
export interface Technique {
  id: string; title: string; method: string; move: Move; kit: Kit; minutes: [Partial<Record<BandId, number>>, number];
  bands: BandId[]; fits?: (c: Ctx) => boolean;
  prep: (c: Ctx) => string; steps: (c: Ctx) => string[]; without?: (c: Ctx) => string; tip?: (c: Ctx) => string;
}

const ALL: BandId[] = ['primary', 'elementary', 'middle', 'high', 'adult'];
const KIDS: BandId[] = ['primary', 'elementary'];
const OLDER: BandId[] = ['middle', 'high', 'adult'];
const TEEN: BandId[] = ['elementary', 'middle', 'high', 'adult'];
/** shorten at a word boundary without leaving a half-open bracket */
const cut = (s: string, n: number) => { if (s.length <= n) return s; let t = s.slice(0, n).replace(/\s+\S*$/, ''); const open = (t.match(/\(/g) ?? []).length - (t.match(/\)/g) ?? []).length; if (open > 0) t = t.replace(/\s*\([^)]*$/, ''); return t.replace(/[,;:\s]+$/, '') + '…'; };
const q = (s: string) => `“${s.replace(/[“”"]/g, '')}”`;
const ref = (c: Ctx) => c.scripture.split(';')[0].trim();
const hasScripture = (c: Ctx) => !!c.scripture;
const mins = (b: Partial<Record<BandId, number>>, d: number): [Partial<Record<BandId, number>>, number] => [b, d];

export const TECHNIQUES: Technique[] = [
  // ───────────────────────── talk
  {
    id: 'tps', title: 'Think, pair, share', method: 'Think-pair-share (cooperative learning)', move: 'talk', kit: 'voice', bands: ALL, minutes: mins({ primary: 4 }, 6),
    prep: () => 'Nothing to prepare.',
    steps: (c) => [`Say the idea slowly: ${q(c.gist)}`, `Ask: “${c.question}” and give ten seconds of silent thinking.`, `${c.who[0].toUpperCase() + c.who.slice(1)} turn to a neighbour and take turns answering, one minute each.`, 'Call on two or three pairs to share what their partner said (not what they said themselves).', `Add what is missing from the Church's teaching, using the word “${c.term}”.`],
    tip: () => 'Asking them to report their partner’s idea makes everyone listen.',
  },
  {
    id: 'corners', title: 'Four corners', method: 'Four corners (structured controversy, movement)', move: 'talk', kit: 'voice', bands: TEEN, minutes: mins({ elementary: 8 }, 10),
    fits: (c) => c.gist.length > 30,
    prep: () => 'Label the four corners of the room: Agree, Strongly agree, Disagree, Not sure (paper signs or just point).',
    steps: (c) => [`Read this statement and give thinking time: ${q(c.gist)}`, 'Everyone walks to the corner that matches their view and tells one neighbour why.', 'Invite one speaker from each corner. Anyone may move if someone persuades them.', `Name what the Church teaches, and show how the word ${q(c.term)} and ${ref(c)} help answer it.`],
    without: () => 'No space to move? Use hands: thumbs up, sideways or down, then pair up with someone who disagrees.',
    tip: () => 'Let students who are “not sure” speak first. It lowers the stakes.',
  },
  {
    id: 'mythtruth', title: 'Myth or truth?', method: 'Misconception check (conceptual-change teaching)', move: 'talk', kit: 'voice', bands: ALL, minutes: mins({ primary: 5 }, 7),
    fits: (c) => !!c.misc,
    prep: () => 'None.',
    steps: (c) => [`Say aloud, as if it were true: ${q(c.misc ?? '')}`, 'Ask for a show of hands: myth or truth? Do not correct yet.', `Ask someone who voted each way to explain. Then show where the Church's teaching differs (${ref(c)}).`, `Restate it correctly in one sentence together: ${q(c.gist)}`],
    tip: () => 'Saying the misunderstanding out loud removes its power. Students often already half-believe it.',
  },
  {
    id: 'silentdebate', title: 'Chalk talk (silent conversation)', method: 'Chalk talk / written conversation', move: 'talk', kit: 'paper', bands: OLDER, minutes: mins({ middle: 8 }, 10),
    prep: () => 'A large sheet of paper or the board with the question in the middle. Markers or chalk.',
    steps: (c) => [`Write in the centre: ${q(c.question)}`, 'For five minutes nobody speaks. Everyone writes answers, objections and questions around the question, and draws lines to reply to each other.', 'Read the board together in silence, then circle the two comments you most want to talk about.', `Discuss those two, then bring in ${q(c.term)} and ${q(ref(c))}. Ask which comments the Church's teaching confirms and which it corrects.`],
    without: () => 'No board? Use a sheet of paper passed around a table group, one comment each, for three rounds.',
    tip: () => 'Quiet students often say their best things in writing.',
  },
  {
    id: 'socratic', title: 'Mini Socratic seminar', method: 'Socratic seminar', move: 'talk', kit: 'voice', bands: ['high', 'adult', 'middle'], minutes: mins({ middle: 10 }, 14),
    prep: (c) => `Have the text ready: ${ref(c)}${c.mem ? ' or the verse to memorize' : ''}.`,
    steps: (c) => [`Read ${ref(c)} aloud once. Allow a minute of silence.`, `Open with one question only: ${q(c.question)} Do not answer it yourself.`, 'Ask follow-ups instead of giving answers: “What in the text makes you say that?”, “Who sees it differently?”, “What would follow if that were true?”', `After ten minutes, state the teaching plainly: ${q(c.gist)}`],
    tip: () => 'Record on the board who spoke and who has not yet; invite the quiet ones in.',
  },
  {
    id: 'spectrum', title: 'Spectrum line', method: 'Values clarification line / continuum', move: 'talk', kit: 'voice', bands: OLDER, minutes: mins({ middle: 8 }, 10),
    prep: () => 'Clear a line across the room: “completely agree” at one end, “completely disagree” at the other.',
    steps: (c) => [`Read the claim: ${q(c.gist)}`, 'Everyone stands where they honestly are on the line. Talk to the person beside you about why.', 'Ask one person from each end, then the middle, to explain. Invite movement.', `Ask what evidence from ${ref(c)} or the Catechism would move someone toward the Church's teaching.`],
    without: () => 'Sitting only? Use a 1–5 card held up, then pair a 1 with a 5 to talk.',
  },
  {
    id: 'teachback', title: 'Teach it back', method: 'Teach-back / protégé effect', move: 'talk', kit: 'voice', bands: ALL, minutes: mins({ primary: 5 }, 8),
    prep: () => 'None.',
    steps: (c) => [`Teach the idea in two minutes: ${q(c.gist)}`, `Pair ${c.who} up. One is the teacher and explains it in their own words, using the word “${c.term}”. The other asks one question.`, 'Swap. The new teacher must use a different example.', 'Listen in and note any idea that needs re-teaching.'],
    tip: () => 'If they cannot explain it simply, they have not yet understood it. That is useful to find out now.',
  },
  {
    id: 'hotseat', title: 'Hot seat interview', method: 'Role-play / hot seating (drama in education)', move: 'talk', kit: 'voice', bands: TEEN, minutes: mins({ elementary: 8 }, 12),
    fits: (c) => !!c.saintName,
    prep: (c) => `Read the short story of ${c.saintName ?? 'the saint'} (under “Saint” in this lesson). Choose a volunteer to be ${c.saintName}.`,
    steps: (c) => [`The volunteer sits in front as ${c.saintName}. The rest prepare two questions each that connect to ${q(c.title)}.`, `Ask in turn. The volunteer answers using what the story says, and “passes” if it does not say.`, `Debrief: What did ${c.saintName} show us about ${q(cut(c.gist, 70))}? Where did he or she struggle?`],
    tip: () => 'Give the volunteer the saint story to read for two minutes first.',
  },
  {
    id: 'casestudy', title: 'Case study', method: 'Case-based learning', move: 'talk', kit: 'paper', bands: OLDER, minutes: mins({ middle: 10 }, 14),
    prep: (c) => `Write a short, realistic case in which someone has to act on this idea (${c.term}). Two or three sentences are enough.`,
    steps: (c) => [`Read the case aloud. Example frame: “Sam is tempted to treat ${q(c.term)} as unimportant because…”`, 'In small groups: What is really going on? What would be easy? What does the faith ask?', `Each group cites one passage (${ref(c)}) or Catechism paragraph for its answer.`, 'Groups report and the others ask “what if…?” once.'],
    tip: (c) => `Use a case from the students' own world (school, phones, sport, family) rather than a distant one. ${c.misc ? 'Seed the case with this misunderstanding: ' + q(c.misc) : ''}`,
  },
  // ───────────────────────── move
  {
    id: 'tpr', title: 'Say it, sign it', method: 'Total physical response (action and chant)', move: 'move', kit: 'voice', bands: ['primary', 'elementary'], minutes: mins({ primary: 5 }, 6),
    prep: () => 'None. Invent one simple gesture per key word.',
    steps: (c) => [`Say the key line in a short rhythm: ${q(c.gist.split(/[,;:]/)[0].slice(0, 80))}`, `Invent one gesture for “${c.term}” and one for the main idea. Teach them by doing them first.`, 'Echo: you say it with the action, the class echoes. Then whisper it, then shout it silently with big gestures.', 'Finish by asking a volunteer to lead.'],
    tip: () => 'Repeat three times in different voices (squeaky, slow, whisper). Repetition with fun builds memory.',
  },
  {
    id: 'tableau', title: 'Freeze-frame scene', method: 'Tableau (drama in education)', move: 'move', kit: 'voice', bands: ALL, minutes: mins({ primary: 6 }, 9),
    fits: hasScripture,
    prep: (c) => `Know the scene from ${ref(c)} or from the lesson.`,
    steps: (c) => [`Read or tell the story behind ${ref(c)} in three sentences.`, 'Split into groups. Each makes a still picture (freeze-frame) of the most important moment. No talking, no moving.', 'Walk among the groups and tap a character on the shoulder: they say one thought out loud.', `Ask: What is the picture telling us about ${q(c.term)}?`],
    tip: () => 'Photograph or sketch each frame if you can; it becomes a quick review next week.',
  },
  {
    id: 'sort', title: 'Sort and sequence cards', method: 'Card sort / sequencing (hands-on concept building)', move: 'move', kit: 'paper', bands: TEEN, minutes: mins({ elementary: 8 }, 10),
    prep: (c) => `Cut up 6–8 slips: the key sentences of this idea (${q(cut(c.gist, 60))}…) mixed with two things that do not belong.`,
    steps: (c) => ['Give each pair a set of slips, face up.', 'They sort the slips into “Church teaches this” and “not quite”, or put them in order, and say why.', `Check together against ${ref(c)} and the Catechism paragraphs in this lesson, and fix any mistakes.`, `Each pair turns over one slip and explains it using the word “${c.term}”.`],
    without: () => 'No scissors? Write the sentences on the board and have students call out where each belongs.',
  },
  {
    id: 'stations', title: 'Three-station rotation', method: 'Station rotation (differentiated learning)', move: 'move', kit: 'paper', bands: TEEN, minutes: mins({ elementary: 15 }, 20),
    prep: (c) => `Set up three stations around ${q(c.title)}: Read (${ref(c)}), Make (draw or write about ${c.term}), Talk (discussion card with the lesson question).`,
    steps: (c) => ['Make three groups. Five minutes at each station, then rotate.', `Read: read ${ref(c)} aloud in turns and underline one line. Make: show “${c.term}” in a quick drawing, poem or diagram. Talk: answer ${q(c.question)} in turn.`, 'Debrief as a class: one thing from each station.'],
    tip: () => 'Put the strongest readers with the weakest. The station sheet can be a single index card.',
  },
  {
    id: 'relay', title: 'Draw-it relay', method: 'Pictionary relay (visual retrieval)', move: 'move', kit: 'paper', bands: ['primary', 'elementary', 'middle'], minutes: mins({ primary: 5 }, 7),
    prep: () => 'A board or big paper per team, and a marker.',
    steps: (c) => [`Secretly give each team the same word from the lesson: ${q(c.term)}.`, 'One at a time, each team member runs up and adds one line to a team drawing. No talking, no letters.', 'The first team whose class can guess the word and explain it wins a point.', `Explain what the word means in the lesson: ${q(c.termDef || c.gist)}`],
  },
  {
    id: 'charades', title: 'Act it out', method: 'Mime and guess (kinaesthetic review)', move: 'move', kit: 'voice', bands: KIDS, minutes: mins({ primary: 5 }, 7),
    prep: () => 'None.',
    steps: (c) => [`Whisper “${c.term}” (or a key action from the story) to a volunteer.`, 'They act it with no words. The class guesses.', 'When guessed, everyone does it together and says one sentence about it.'],
  },
  // ───────────────────────── make
  {
    id: 'frayer', title: 'Frayer word square', method: 'Frayer model (vocabulary development)', move: 'make', kit: 'paper', bands: TEEN, minutes: mins({ elementary: 8 }, 10),
    prep: (c) => `Folded paper with four boxes around the word “${c.term}”: Definition, In my own words, Example, Non-example.`,
    steps: (c) => [`Write “${c.term}” in the centre. Read the meaning together: ${q(c.termDef || c.gist)}`, 'Fill the four boxes alone, then compare with a partner.', `Ask for a non-example. Ask why it is not ${q(c.term)}.`, 'Keep the squares: they are the class word wall and review cards.'],
  },
  {
    id: 'organizer', title: 'Concept map', method: 'Graphic organizer / concept map', move: 'make', kit: 'paper', bands: OLDER, minutes: mins({ middle: 10 }, 12),
    prep: () => 'Blank paper and pencils. A sample map on the board (box, arrows, short labels).',
    steps: (c) => [`Write ${q(c.term)} in a circle in the middle.`, `In pairs, add at least four linked ideas from the lesson (use ${ref(c)} and ${q(cut(c.gist, 50))}…) and label every arrow with a verb (“leads to”, “shows”, “asks of us”).`, 'Swap maps with another pair and add one link to theirs.', 'Debrief: which arrow was hardest to name?'],
  },
  {
    id: 'headline', title: 'Headline and tweet', method: 'Summarising (RAFT / headline writing)', move: 'make', kit: 'paper', bands: TEEN, minutes: mins({ elementary: 6 }, 8),
    prep: () => 'Index cards or scrap paper.',
    steps: (c) => [`In two minutes write a newspaper headline for this idea: ${q(cut(c.gist, 80))}`, 'Then write one tweet-length line (under 140 characters) that a friend would understand.', 'Read the headlines in a round. The class votes for the one that is both accurate and memorable.'],
  },
  {
    id: 'rap', title: 'Write a chant or rhyme', method: 'Mnemonic song / rap (memory through rhythm)', move: 'make', kit: 'voice', bands: ['primary', 'elementary', 'middle'], minutes: mins({ primary: 6 }, 10),
    prep: () => 'Choose a tune everyone knows, or a clapping beat.',
    steps: (c) => [`Agree on the one sentence to remember: ${q(cut(c.gist, 90))}`, 'In small groups, set it to the beat or a familiar tune. Two lines are enough.', `Perform. After each, the class repeats the line that includes “${c.term}”.`],
    tip: () => 'Record the best one (even on a phone) and use it as next week’s warm-up.',
  },
  {
    id: 'prayerjournal', title: 'Write a short prayer', method: 'Reflective writing / prayer journal', move: 'make', kit: 'paper', bands: ['middle', 'high', 'adult'], minutes: mins({ middle: 6 }, 8),
    prep: () => 'A card or journal page.',
    steps: (c) => [`Read this aloud slowly: ${q(c.gist)}`, `In silence, write a four-line prayer: thank God for one thing about ${q(c.term)}, ask for one thing, and offer one small action this week.`, 'Invite volunteers to read one line (never force). Close by praying together the shared lines.'],
  },
  // ───────────────────────── read
  {
    id: 'closeread', title: 'Three reads', method: 'Close reading (gist, detail, meaning)', move: 'read', kit: 'paper', bands: TEEN, minutes: mins({ elementary: 8 }, 12),
    fits: hasScripture,
    prep: (c) => `Print or open ${ref(c)}. Give each pair a pencil.`,
    steps: (c) => [`Read 1 (gist): read ${ref(c)} aloud. Ask: “In one sentence, what happened or was said?”`, 'Read 2 (detail): pairs read it again and underline a word that repeats and a word that surprises them.', `Read 3 (meaning): ask what the passage teaches about ${q(c.term)}. Connect it to ${q(cut(c.gist, 70))}…`, 'Share the underlined words.'],
    without: () => 'No handouts? Read aloud three times, each time giving students a different thing to listen for.',
  },
  {
    id: 'lectio', title: 'Lectio divina', method: 'Lectio divina (prayerful reading)', move: 'read', kit: 'voice', bands: ['middle', 'high', 'adult'], minutes: mins({ middle: 8 }, 12),
    fits: hasScripture,
    prep: (c) => `The passage: ${ref(c)}. A quiet room and a short bell or pause.`,
    steps: (c) => [`Lectio: read ${ref(c)} slowly. Invite everyone to listen for one word or phrase.`, 'Meditatio: read it again. Share the word or phrase in a single phrase round the room, with no comment.', 'Oratio: read it a third time and invite a one-sentence prayer in response.', `Contemplatio: two minutes of silence. Then connect: what does this teach us about ${q(c.term)}?`],
    tip: () => 'Keep the silences longer than feels comfortable: that is where students listen.',
  },
  {
    id: 'jigsaw', title: 'Expert jigsaw', method: 'Jigsaw (cooperative learning)', move: 'read', kit: 'paper', bands: OLDER.concat(['elementary']), minutes: mins({ elementary: 12 }, 18),
    prep: (c) => `Split the text on ${q(c.title)} into three short parts (idea, Scripture ${ref(c)}, Catechism paragraph or saint).`,
    steps: () => ['Home groups of three number off. Each person becomes an expert on one part and meets the other experts for five minutes.', 'Experts return and teach their part to their home group in two minutes.', 'Each home group writes one sentence that combines all three parts.', 'Read the sentences. Fill the gaps yourself.'],
    without: () => 'Read aloud and have each trio decide who listens for which part.',
  },
  {
    id: 'gallery', title: 'Gallery walk', method: 'Gallery walk (movement and peer feedback)', move: 'read', kit: 'paper', bands: TEEN, minutes: mins({ elementary: 10 }, 14),
    prep: (c) => `Put 4–5 big sheets around the room, each with a different prompt on ${q(c.term)} (e.g. “What does it mean?”, “Where is it in ${ref(c)}?”, “How would I live it on Monday?”).`,
    steps: () => ['Small groups start at one sheet and add ideas in a coloured marker for two minutes, then rotate.', 'At each stop they read what others wrote and add a tick, a question mark or one more idea.', 'Return to the first sheet. Each group reports what changed.'],
    without: () => 'Short on wall space? Pass folders round a table instead.',
  },
  // ───────────────────────── see (screen)
  {
    id: 'seethinkwonder', title: 'See, think, wonder', method: 'Visible thinking routine (Project Zero)', move: 'see', kit: 'screen', bands: ALL, minutes: mins({ primary: 5 }, 8),
    prep: (c) => `Choose one picture connected to ${q(c.title)} (use the lesson's art on the slides, or a holy card).`,
    steps: (c) => ['Show the picture and stay silent for thirty seconds.', 'Ask three times: “What do you see?” (only facts), “What do you think is going on?”, “What do you wonder?”', `Connect the wondering to the lesson's idea: ${q(cut(c.gist, 80))}`],
    without: (c) => 'No screen? Use a holy card, a book picture, or draw a simple sketch of the scene on the board.',
  },
  {
    id: 'predict', title: 'Predict then reveal', method: 'Prediction and reveal (generating curiosity)', move: 'see', kit: 'screen', bands: ALL, minutes: mins({ primary: 4 }, 6),
    prep: (c) => `On the slide of this lesson, hide the key sentence for the idea (${q(cut(c.gist, 50))}…).`,
    steps: (c) => [`Show the question: ${q(c.question)}`, 'Everyone writes or whispers a prediction. Take three.', 'Reveal the answer on the next slide and compare. What did we get right? What surprised us?'],
    without: () => 'No slides? Write the answer on paper, fold it and reveal it by unfolding.',
  },
  {
    id: 'slidesguide', title: 'Slides with guided notes', method: 'Guided notes with slides (reduced note-taking load)', move: 'see', kit: 'screen', bands: OLDER.concat(['elementary']), minutes: mins({ elementary: 10 }, 12),
    prep: () => 'Open “Present as slides”. Give students a half-sheet with three blanks, one for each key word.',
    steps: (c) => [`Present only the slides for this idea. Pause at the word ${q(c.term)} and let students fill the first blank.`, 'After each slide, stop and ask one pair to say it back before moving on.', `End by asking students to cover their notes and say the idea: ${q(cut(c.gist, 70))}`],
    without: () => 'Without a screen: write the three key words on the board and teach in the same pauses.',
  },
  {
    id: 'video', title: 'Short clip with stops', method: 'Interactive video viewing (stop-and-talk)', move: 'see', kit: 'screen', bands: ALL, minutes: mins({ primary: 6 }, 9),
    prep: () => 'Pick a 3–5 minute clip from the lesson’s video list. Decide two places to pause.',
    steps: (c) => [`Before: ask students to listen for ${q(c.term)}.`, 'Play, and pause at your two points. Ask: “What just happened? What do you think comes next?”', `After: compare what they heard with ${q(cut(c.gist, 70))}.`],
    without: () => 'No video? Read the Scripture or the saint story aloud, pausing in the same way.',
  },
  {
    id: 'timeline', title: 'Build a timeline', method: 'Chronology and map thinking', move: 'see', kit: 'paper', bands: OLDER, minutes: mins({ middle: 8 }, 12),
    prep: () => 'A long strip of paper or a line on the board.',
    steps: (c) => [`Ask: where does ${q(c.term)} fit in salvation history? Place the key events (creation, covenant, prophets, Christ, Church, today).`, `Add where ${ref(c)} and ${c.saintName ?? 'one saint'} belong on the line.`, 'Stand back: what pattern do you see? Where does God act first?'],
  },
  // ───────────────────────── devices
  {
    id: 'livequiz', title: 'Live quiz on phones', method: 'Quick-fire retrieval practice with immediate feedback', move: 'check', kit: 'devices', bands: TEEN, minutes: mins({ elementary: 6 }, 8),
    prep: () => 'Use “Host live” in this app and have students join with the class code on their own devices.',
    steps: (c) => [`Host the live lesson. Launch the quiz built from this lesson’s words (${q(c.term)} and the others).`, 'Show the class results after each question, but not individual names. Discuss every common wrong answer.', 'Re-ask any question most students missed two minutes later.'],
    without: () => 'No devices? Use mini-whiteboards or A/B/C/D cards held up together on “3, 2, 1, show”.',
  },
  {
    id: 'deviceplay', title: 'Play the lesson', method: 'Self-paced practice with feedback', move: 'check', kit: 'devices', bands: ALL, minutes: mins({ primary: 6 }, 10),
    prep: () => 'Students open the lesson on a device (Student view) and use “Play this lesson”.',
    steps: (c) => ['In pairs, students work through the matching and the check questions. You circulate.', `Choose one question about ${q(c.term)} and discuss it as a class.`],
    without: () => 'No devices? Print the handout and work through the same checks on paper.',
  },
  // ───────────────────────── openers
  {
    id: 'mystery', title: 'Mystery object', method: 'Hook: concrete object (inquiry learning)', move: 'open', kit: 'voice', bands: ALL, minutes: mins({ primary: 4 }, 5),
    prep: (c) => `Bring one object that points toward ${q(c.title)} (a candle, bread, a stone, a key, a photo). Keep it hidden.`,
    steps: (c) => ['Ask three yes/no questions to guess what is hidden, taking guesses from the class.', 'Show the object and ask: “What does this have to do with our topic?”', `Lead into the question: ${q(c.question)}`],
    without: () => 'No object? Describe it in words and let them draw it before you reveal.',
  },
  {
    id: 'kwl', title: 'What I know, what I wonder', method: 'KWL chart (activating prior knowledge)', move: 'open', kit: 'paper', bands: TEEN, minutes: mins({ elementary: 5 }, 7),
    prep: () => 'A chart on the board with two columns: Know and Wonder (add Learned at the end).',
    steps: (c) => [`Write ${q(c.term)} or ${q(c.title)} on the board.`, 'Students add what they already know and what they wonder. Do not correct yet.', 'Keep the chart for the closing: move wonderings to “Learned”.'],
  },
  {
    id: 'quickwrite', title: 'One-minute quick write', method: 'Quick write (retrieval and reflection)', move: 'open', kit: 'paper', bands: OLDER.concat(['elementary']), minutes: mins({ elementary: 4 }, 5),
    prep: () => 'Scrap paper.',
    steps: (c) => [`Write the question: ${q(c.question)}`, 'Everyone writes for one minute without stopping. No names.', 'Collect a few at random and read them (without names) as the starting point for the lesson.'],
  },
  {
    id: 'circlegather', title: 'Gather, light a candle, pray', method: 'Ritual opening (routines for belonging)', move: 'open', kit: 'voice', bands: ['primary', 'elementary'], minutes: mins({ primary: 4 }, 4),
    prep: (c) => `A candle or a cross and the lesson’s prayer or the Sign of the Cross.`,
    steps: (c) => ['Gather in a circle on the floor or chairs. Light the candle.', `Pray the same opening every week, then say: “Today we are going to learn about ${c.title.toLowerCase()}.”`, `Ask: “${c.question}” and let two children answer.`],
    without: () => 'No candle? Use a picture of Jesus or a cross.',
  },
  // ───────────────────────── more openers and checks
  {
    id: 'poll', title: 'Hands-up poll', method: 'Opening poll (activating prior knowledge)', move: 'open', kit: 'voice', bands: ALL, minutes: mins({ primary: 3 }, 4),
    prep: () => 'None.',
    steps: (c) => [`Ask: ${q(c.question)} and give three choices that you say aloud (for example: always / sometimes / not sure).`, 'Count hands for each. Ask one person from the biggest group why.', 'Say: “By the end of the lesson we will see what the Church says.”'],
  },
  {
    id: 'storyhook', title: 'Tell it as a story', method: 'Narrative hook (story-first teaching)', move: 'open', kit: 'voice', bands: ALL, minutes: mins({ primary: 4 }, 5),
    fits: (c) => !!c.hook,
    prep: () => 'Read the story hook once so you can tell it in your own words, not read it out.',
    steps: (c) => [`Tell this in your own voice: ${q(cut(c.hook ?? '', 220))}`, `Stop before the ending and ask: “What do you think happens, or what would you do?” Take three answers.`, `Bridge to today: ${q(c.question)}`],
  },
  {
    id: 'wouldyourather', title: 'Would you rather?', method: 'Opening dilemma (engagement through choice)', move: 'open', kit: 'voice', bands: ['elementary', 'middle', 'high', 'adult'], minutes: mins({ elementary: 4 }, 5),
    prep: (c) => `Think of two choices that make ${q(c.term)} matter (a small, real-life pair).`,
    steps: (c) => ['Offer the pair. Students move to the side of the room that matches their choice, or raise a hand.', 'One person from each side explains. Keep it light.', `Say: “Today we find out what ${q(c.term)} has to do with that.”`],
  },
  {
    id: 'whisper', title: 'Whisper chain', method: 'Message-passing game (listening and accuracy)', move: 'open', kit: 'voice', bands: KIDS, minutes: mins({ primary: 4 }, 5),
    prep: () => 'None.',
    steps: (c) => [`Whisper to one child: ${q(cut(c.gist, 60))} and pass it around the circle.`, 'The last child says it out loud. Laugh at how it changed.', 'Say: “God does not get messages wrong. Let us see how he told us.”'],
  },
  {
    id: 'thumbs', title: 'Thumbs and tell', method: 'Thumbs check with one-sentence explanation', move: 'check', kit: 'voice', bands: ALL, minutes: mins({ primary: 2 }, 3),
    prep: () => 'None.',
    steps: (c) => [`Ask: “Did we do what we set out to do? Could you teach ${q(c.term)} to someone?” Thumbs up, sideways or down.`, 'Ask one up and one sideways to say what they would tell a friend.', 'Note who needs more help next time.'],
  },
  {
    id: 'prayback', title: 'Pray it back', method: 'Closing prayer of intercession (formation, not testing)', move: 'check', kit: 'voice', bands: ALL, minutes: mins({ primary: 3 }, 4),
    prep: () => 'None.',
    steps: (c) => [`Invite each person to finish aloud the line “Lord, help me to ${q(c.term)} by…” in their own words, or to pass.`, 'Close with the lesson’s prayer or an Our Father.'],
    tip: () => 'Listen to the lines: they show what was understood far better than answers do.',
  },
  // ───────────────────────── checks
  {
    id: 'exitticket', title: 'Exit ticket', method: 'Exit ticket (formative assessment)', move: 'check', kit: 'paper', bands: ALL, minutes: mins({ primary: 3 }, 4),
    prep: () => 'Slips of paper.',
    steps: (c) => [`Ask them to write one thing they learned about ${q(c.term)} and one question they still have.`, 'Collect them at the door. Sort into three piles: got it, almost, lost.', 'Begin the next lesson with the most common question.'],
    without: (c) => 'No paper? Ask each person to tell you one thing at the door as they leave.',
  },
  {
    id: 'fist5', title: 'Fist to five', method: 'Fist to five (quick confidence check)', move: 'check', kit: 'voice', bands: ALL, minutes: mins({ primary: 2 }, 2),
    prep: () => 'None.',
    steps: (c) => [`Ask: “How well could you explain ${q(c.term)} to a friend? Show me zero to five fingers.”`, 'Look at the room. Ask one person with five and one with two to say why.', 'Teach again to the “twos”; give the “fives” a challenge: use it in an example.'],
  },
  {
    id: 'whip', title: 'One-word round', method: 'Whip-around (summing up)', move: 'check', kit: 'voice', bands: ALL, minutes: mins({ primary: 3 }, 4),
    prep: () => 'None.',
    steps: (c) => [`Ask everyone to give one word that sums up ${q(c.title)}, going round the circle. No repeats.`, `Then ask one person to say a sentence using ${q(c.term)}.`, 'Send them off with the lesson’s challenge.'],
  },
  {
    id: 'bridge', title: '3-2-1 bridge', method: '3-2-1 (summarising and questioning)', move: 'check', kit: 'paper', bands: TEEN, minutes: mins({ elementary: 4 }, 5),
    prep: () => 'Scrap paper.',
    steps: (c) => [`Students write: 3 things they learned about ${q(c.term)}, 2 questions, 1 way they will live it this week.`, 'Read the “1s” aloud as the closing prayer intentions.'],
  },
  {
    id: 'quizquiztrade', title: 'Quiz, quiz, trade', method: 'Quiz-quiz-trade (kagan structure, retrieval)', move: 'check', kit: 'paper', bands: TEEN, minutes: mins({ elementary: 6 }, 8),
    prep: (c) => `Make cards: a question on one side (e.g. “What does ${c.term} mean?”) and the answer on the back.`,
    steps: () => ['Everyone has a card, stands up, and finds a partner.', 'Partner A quizzes B, B answers, and A coaches if wrong. Swap roles, then trade cards and find a new partner.', 'Stop after four rounds. Debrief the question that was hardest.'],
  },
];
