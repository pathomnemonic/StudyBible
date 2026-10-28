export type Genre = 'parable' | 'miracle' | 'teaching' | 'story';
export type Level = 'little' | 'middle' | 'older';

/** A rough sense of what kind of passage this is, from its words, so the questions fit it. */
export function genreOf(text: string): Genre {
  const t = text.toLowerCase();
  if (/\b(parable|is like|a man had|a sower|kingdom of heaven may be|a certain (man|rich|king)|there was a (rich|man|king))\b/.test(t)) return 'parable';
  if (/\b(healed|blind|leper|demon|unclean spirit|paralyzed|raised|dead|fever|walked on|calmed|storm|loaves|fish)\b/.test(t)) return 'miracle';
  if (/\b(i am the|truly, truly|i tell you|blessed are|you have heard that|do not be afraid|love one another|follow me)\b/.test(t)) return 'teaching';
  return 'story';
}

/** The first thing someone says in the passage, in their own words, for the family to hold on to. */
export function quoteOf(text: string): string | null {
  const m = text.match(/[“"]([^”"]{12,160})[”"]/);
  return m ? m[1].trim() : null;
}

const COMMON: Record<Level, string[]> = {
  little: ['Who is in this story? Let’s act out one part.', 'What did Jesus do or say? How do you think the people felt?'],
  middle: ['Who is the story about, and what do they want? What gets in the way?', 'What does this show us about who Jesus is?'],
  older: ['What stands out to you, and what puzzles you? Which word or detail would you ask Jesus about?', 'What does this passage ask of us, not just in theory but in this house, this week?'],
};
const BY_GENRE: Record<Genre, Record<Level, string[]>> = {
  parable: {
    little: ['Jesus told a story to teach us. Who in the story is like God?', 'Who is someone we can be kind to like in the story?'],
    middle: ['A parable has a surprise. What surprised you here?', 'Who in the story are you most like? Who do you want to be like?'],
    older: ['Why do you think Jesus used a story and not a plain command? What does the story keep hidden, and what does it reveal?', 'Where does the story judge us? Where does it give us hope?'],
  },
  miracle: {
    little: ['What did Jesus do for the person who needed help?', 'Who needs help in our family or school this week? How can we help?'],
    middle: ['Why do you think Jesus helped in this way? What did it show the people?', 'What did the person have to do before, or after, the miracle?'],
    older: ['What is the need beneath the visible one in this scene (healing, forgiveness, trust)? Where do we ask Jesus for the same?', 'How do people react, with faith, fear, or doubt? Which is closest to your own reaction today?'],
  },
  teaching: {
    little: ['What is one thing Jesus asks us to do or not do?', 'Can we try it together today?'],
    middle: ['Say Jesus’ words in your own words. Why is this hard?', 'Where do you see this in the life of a saint you know?'],
    older: ['What is the hardest sentence here to live out, and why? Who has shown you this teaching in practice?', 'How does this connect to a line of the Creed, the Our Father, or the Catechism?'],
  },
  story: {
    little: ['Where does this happen? Who goes there?', 'What is your favorite part? Draw it.'],
    middle: ['What changes for the people in the story from the beginning to the end?', 'What does this tell us about following Jesus?'],
    older: ['What does this scene reveal about Jesus, and about the people around him? How does it fit with the Gospel as a whole?', 'What would it cost to take this passage seriously this week?'],
  },
};
const ACTION: Record<Genre, string> = {
  parable: 'This week, do one small kindness that no one asked for, like the people in the story, and tell the family at dinner.',
  miracle: 'This week, pray together for someone who needs healing, and send them a message or a card.',
  teaching: 'This week, pick one line from today’s Gospel and try to live it for a day. Write it on the fridge.',
  story: 'This week, find a way to retell today’s Gospel to someone who has not heard it, even in one sentence.',
};
export const questionsFor = (g: Genre, level: Level): string[] => [...COMMON[level], ...BY_GENRE[g][level]];
export const actionFor = (g: Genre) => ACTION[g];
export const LEVELS: { id: Level; title: string }[] = [{ id: 'little', title: 'Little ones (ages 4 to 7)' }, { id: 'middle', title: 'Ages 8 to 12' }, { id: 'older', title: 'Teens and adults' }];
