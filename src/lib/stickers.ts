/** The kids' sticker book: a saint for each sticker, earned by finishing a story, a game or a prayer. It all stays on this device. */
export interface Sticker { id: string; icon: string; name: string; why: string }
export const STICKERS: Sticker[] = [
  { id: 'francis', icon: '🐺', name: 'St Francis', why: 'He loved animals and all creation.' },
  { id: 'patrick', icon: '☘️', name: 'St Patrick', why: 'He taught Ireland about the Trinity.' },
  { id: 'nicholas', icon: '🎁', name: 'St Nicholas', why: 'He gave gifts in secret.' },
  { id: 'george', icon: '🐉', name: 'St George', why: 'A brave soldier and defender.' },
  { id: 'joan', icon: '⚔️', name: 'St Joan of Arc', why: 'A girl who trusted God’s call.' },
  { id: 'cecilia', icon: '🎵', name: 'St Cecilia', why: 'The patron of music.' },
  { id: 'lucy', icon: '🕯️', name: 'St Lucy', why: 'Her name means light.' },
  { id: 'michael', icon: '🛡️', name: 'St Michael', why: 'The archangel who protects us.' },
  { id: 'therese', icon: '🌹', name: 'St Thérèse', why: 'She did small things with great love.' },
  { id: 'anthony', icon: '🔎', name: 'St Anthony', why: 'People pray to him to find lost things.' },
  { id: 'christopher', icon: '🌊', name: 'St Christopher', why: 'He carried travelers across the river.' },
  { id: 'valentine', icon: '💌', name: 'St Valentine', why: 'A martyr remembered for love.' },
  { id: 'brigid', icon: '🔥', name: 'St Brigid', why: 'An Irish abbess who cared for the poor.' },
  { id: 'clare', icon: '☀️', name: 'St Clare', why: 'A friend of St Francis who loved prayer.' },
  { id: 'bosco', icon: '🤹', name: 'St John Bosco', why: 'He made games and school for poor boys.' },
  { id: 'kateri', icon: '🦌', name: 'St Kateri', why: 'The Lily of the Mohawks.' },
  { id: 'juandiego', icon: '🌸', name: 'St Juan Diego', why: 'Mary left roses on his cloak.' },
  { id: 'joseph', icon: '🔨', name: 'St Joseph', why: 'The carpenter who cared for Jesus.' },
  { id: 'gabriel', icon: '📯', name: 'St Gabriel', why: 'The angel who greeted Mary.' },
  { id: 'raphael', icon: '🐟', name: 'St Raphael', why: 'The angel who healed Tobit.' },
  { id: 'isidore', icon: '🌾', name: 'St Isidore', why: 'A farmer who prayed as he worked.' },
  { id: 'martin', icon: '🧣', name: 'St Martin of Tours', why: 'He shared his cloak with a beggar.' },
  { id: 'blaise', icon: '🧣', name: 'St Blaise', why: 'A bishop who healed with a blessing.' },
  { id: 'dominic', icon: '📿', name: 'St Dominic', why: 'He spread the Rosary.' },
  { id: 'bernadette', icon: '💧', name: 'St Bernadette', why: 'She saw Mary at Lourdes.' },
  { id: 'maximilian', icon: '🕊️', name: 'St Maximilian Kolbe', why: 'He gave his life for another man.' },
  { id: 'carlo', icon: '💻', name: 'St Carlo Acutis', why: 'A teenager who loved the Eucharist.' },
  { id: 'rose', icon: '🌷', name: 'St Rose of Lima', why: 'The first saint of the Americas.' },
  { id: 'damien', icon: '🏝️', name: 'St Damien', why: 'He served people with leprosy.' },
  { id: 'elizabeth', icon: '👑', name: 'St Elizabeth of Hungary', why: 'A queen who fed the poor.' },
];
const KEY = 'sb:stickers:v1';
export const loadStickers = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]; } catch { return []; } };

/** Give the next sticker not yet earned, and say so. Returns it, or null once the book is full. */
export function awardSticker(reason: string): Sticker | null {
  void reason;
  try {
    const have = loadStickers();
    const next = STICKERS.find((s) => !have.includes(s.id));
    if (!next) return null;
    localStorage.setItem(KEY, JSON.stringify([...have, next.id]));
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('studybible:sticker', { detail: next }));
    return next;
  } catch { return null; }
}

const STORIES = 'sb:stickers:stories';
const GAMEDAY = 'sb:stickers:gameday';
export const storyDone = (id: string): boolean => { try { return (JSON.parse(localStorage.getItem(STORIES) ?? '[]') as string[]).includes(id); } catch { return false; } };
/** A child says they finished a story: one sticker per story, once. */
export function finishStory(id: string): Sticker | null {
  if (storyDone(id)) return null;
  try { const l = JSON.parse(localStorage.getItem(STORIES) ?? '[]') as string[]; localStorage.setItem(STORIES, JSON.stringify([...l, id])); } catch { /* private mode */ }
  return awardSticker(`story:${id}`);
}
/** Finishing a game earns a sticker, once for each game each day. */
export function gameSticker(game: string, day: number): Sticker | null {
  try {
    const v = JSON.parse(localStorage.getItem(GAMEDAY) ?? '{}') as { day?: number; games?: string[] };
    const games = v.day === day ? v.games ?? [] : [];
    if (games.includes(game)) return null;
    localStorage.setItem(GAMEDAY, JSON.stringify({ day, games: [...games, game] }));
    return awardSticker(`game:${game}`);
  } catch { return null; }
}
