/** What a person can pick on a hard day, and a Psalm or Gospel verse for each, with the situation whose saints they might meet. Verses are by reference and shown in the WEB-Catholic text. */
export interface HardKind { id: string; label: string; situation: string; verses: string[] }
export const HARD_KINDS: HardKind[] = [
  { id: 'grief', label: 'I’m grieving', situation: 'grief', verses: ['PSA.34.18', 'JHN.11.35', 'MAT.5.4'] },
  { id: 'fear', label: 'I’m afraid', situation: 'anxiety-and-fear', verses: ['ISA.41.10', 'PSA.56.3-4', 'PSA.27.1'] },
  { id: 'tired', label: 'I’m worn out', situation: 'serious-illness', verses: ['MAT.11.28-30', 'ISA.40.29-31', 'PSA.121.1-2'] },
  { id: 'angry', label: 'I’m angry', situation: 'anger-and-resentment', verses: ['PSA.4.4', 'PSA.37.8', 'PRO.15.1'] },
  { id: 'alone', label: 'I’m lonely', situation: 'loneliness', verses: ['PSA.25.16-17', 'PSA.68.5-6', 'DEU.31.8'] },
  { id: 'cantpray', label: 'I can’t pray', situation: 'feeling-far-from-god', verses: ['ROM.8.26', 'PSA.130.1-2', 'PSA.62.1-2'] },
];
export const ENERGY = [
  { id: 1, label: 'Very little', blurb: 'Just one verse and one line to say.' },
  { id: 2, label: 'Some', blurb: 'Add a saint who has been here.' },
  { id: 3, label: 'A little more', blurb: 'Add somewhere to go next.' },
];
export const HARD_PRAYER = 'Lord Jesus Christ, Son of God, have mercy on me.';
