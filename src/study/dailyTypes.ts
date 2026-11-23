export interface DailyEntry {
  /** Anchor id ("LUK.2.19") or a reference in modern numbering ("Luke 2:19"). */
  ref: string;
  saint: { text: string; who: string; work?: string; verified?: boolean; src?: { work?: string; section?: number; url?: string }; misattributed?: string };
  q: string;
}
export interface DailyFile { generic: Record<string, DailyEntry>; seasonal: Record<string, DailyEntry> }
