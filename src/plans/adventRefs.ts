/** The 24 daily readings of the Advent plan (an editorial selection). One list, used by the plan and by the social exporter. */
export const ADVENT_REFS = ['ISA.2.1-5', 'ISA.7.10-14', 'ISA.9.1-7', 'ISA.11.1-10', 'ISA.12.1-6', 'ISA.25.6-10', 'ISA.26.1-9', 'ISA.29.17-24', 'ISA.30.18-26', 'ISA.35.1-10', 'ISA.40.1-11', 'ISA.41.8-20', 'ISA.45.6-8', 'ISA.49.8-15', 'ISA.52.7-10', 'ISA.54.1-10', 'ISA.55.1-13', 'ISA.60.1-7', 'MAT.1.1-17', 'MAT.1.18-25', 'LUK.1.5-25', 'LUK.1.26-38', 'LUK.1.39-56', 'LUK.1.57-80'];

/** A one- or two-word name for each plan day and, where the reading has one clear line, the verse a share card should show (Douay numbering). */
export const ADVENT_WALK: { theme: string; key?: string }[] = [
  { theme: 'Come', key: 'ISA.2.5' }, { theme: 'The sign', key: 'ISA.7.14' }, { theme: 'Light', key: 'ISA.9.2' }, { theme: 'The shoot', key: 'ISA.11.1' },
  { theme: 'Joy', key: 'ISA.12.3' }, { theme: 'The feast', key: 'ISA.25.8' }, { theme: 'Trust', key: 'ISA.26.3' }, { theme: 'Hearing', key: 'ISA.29.18' },
  { theme: 'The way', key: 'ISA.30.21' }, { theme: 'Flowers in the desert' }, { theme: 'Comfort', key: 'ISA.40.1' }, { theme: 'Fear not', key: 'ISA.41.10' },
  { theme: 'Rain down', key: 'ISA.45.8' }, { theme: 'Not forgotten', key: 'ISA.49.15' }, { theme: 'Good news' }, { theme: 'Enlarge your tent', key: 'ISA.54.2' },
  { theme: 'Come to the water', key: 'ISA.55.1' }, { theme: 'Arise', key: 'ISA.60.1' }, { theme: 'The family tree' }, { theme: 'Joseph', key: 'MAT.1.21' },
  { theme: 'Zechariah', key: 'LUK.1.13' }, { theme: 'Mary', key: 'LUK.1.38' }, { theme: 'The visit', key: 'LUK.1.45' }, { theme: 'John', key: 'LUK.1.76' },
];

/** December 23 and 24 (days 25 and 26 of the walk) go beyond the 24-day plan: a verse each that the plan's days do not already use. */
export const ADVENT_EVE: { theme: string; key: string }[] = [{ theme: 'Bethlehem', key: 'MIC.5.2' }, { theme: 'A child is born', key: 'ISA.9.6' }];
