import type { BiayEpisode } from '../data/content';

/**
 * Spoken recordings from the Creedal podcast "The Holy Rosary" (rosary.pinecast.co), a free feed of the four sets of mysteries and the
 * Divine Mercy chaplet. The audio is streamed from the publisher; the app stores only the title and address.
 */
const PAGE = 'https://www.creedalpodcast.com/rosary';
const mk = (key: string, title: string, uuid: string, seconds: number, date: string, desc: string): BiayEpisode => ({
  id: `pod-creedal-rosary-${key}`, day: null, year: null, kind: 'bonus', title: `${title} (Creedal)`, short: title, date, duration: seconds,
  audio: `https://pinecast.com/listen/${uuid}.mp3?source=rss&ext=asset.mp3`, page: PAGE, link: PAGE, description: desc, passages: [], passageSource: '',
  artist: 'Creedal', album: 'The Holy Rosary',
});

export const CREEDAL: Record<string, BiayEpisode> = {
  joyful: mk('joyful', 'The Joyful Mysteries', 'b3226b36-3871-4ed3-98a1-0ffe384862a9', 837, '2019-04-13', 'The five joyful mysteries of the Rosary, prayed aloud.'),
  luminous: mk('luminous', 'The Luminous Mysteries', '972575c6-88f8-4fd1-8304-f3c26459be95', 838, '2019-04-13', 'The five luminous mysteries of the Rosary, prayed aloud.'),
  sorrowful: mk('sorrowful', 'The Sorrowful Mysteries', 'b67f6a7b-fea3-4557-9c63-df4385f8a38e', 840, '2019-04-13', 'The five sorrowful mysteries of the Rosary, prayed aloud.'),
  glorious: mk('glorious', 'The Glorious Mysteries', 'e257f29f-000f-4b2e-a6ba-70aa03d21569', 839, '2019-04-13', 'The five glorious mysteries of the Rosary, prayed aloud.'),
  mercy: mk('mercy', 'The Divine Mercy Chaplet', '8aa93c33-8dfa-4913-97ff-0f81f9e9bfde', 454, '2021-04-04', 'The Chaplet of Divine Mercy, prayed aloud.'),
};
