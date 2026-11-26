/**
 * Where a gallery picture comes from. The store builds carry only the mini gallery below: the pictures
 * the rosary, chaplet and stations use, the same Met paintings under the older art index's file names,
 * and a day card rotation spread across the main themes (about 8 MB in all). Every other work is served
 * from the app's own site, where the web build hosts the full gallery at the same paths.
 * tools/native_slim.py reads this same list to decide which files stay in the binary, so the two never
 * drift apart.
 */
const SITE = 'https://pathomnemonic.github.io/StudyBible/';
const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');

export const ART_LOCAL: ReadonlySet<string> = new Set([
  'art/435580.jpg',
  'art/435899.jpg',
  'art/436096.jpg',
  'art/436513.jpg',
  'art/436801.jpg',
  'art/436835.jpg',
  'art/437007.jpg',
  'art/438466.jpg',
  'art/439977.jpg',
  'art/442488.jpg',
  'art/cma-1950_400.jpg',
  'art/cma-1950_91.jpg',
  'art/cma-1958_320.jpg',
  'art/cma-1965_469.jpg',
  'art/cma-2008_2_20_b.jpg',
  'art/cma-2008_2_214_b.jpg',
  'art/cma-2008_2_350_a.jpg',
  'art/cma-2008_2_440_b.jpg',
  'art/cma-2017_192.jpg',
  'art/dore-010.jpg',
  'art/dore-030.jpg',
  'art/dore-047.jpg',
  'art/dore-070.jpg',
  'art/dore-090.jpg',
  'art/dore-109.jpg',
  'art/dore-141.jpg',
  'art/dore-161.jpg',
  'art/dore-166.jpg',
  'art/dore-175.jpg',
  'art/dore-176.jpg',
  'art/dore-187.jpg',
  'art/dore-202.jpg',
  'art/dore-203.jpg',
  'art/dore-208.jpg',
  'art/dore-210.jpg',
  'art/dore-211.jpg',
  'art/dore-213.jpg',
  'art/dore-216.jpg',
  'art/dore-217.jpg',
  'art/dore-219.jpg',
  'art/dore-223.jpg',
  'art/dore-224.jpg',
  'art/dore-238.jpg',
  'art/met-435578.jpg',
  'art/met-435580.jpg',
  'art/met-435899.jpg',
  'art/met-436096.jpg',
  'art/met-436098.jpg',
  'art/met-436104.jpg',
  'art/met-436513.jpg',
  'art/met-436801.jpg',
  'art/met-436835.jpg',
  'art/met-436929.jpg',
  'art/met-437007.jpg',
  'art/met-438466.jpg',
  'art/met-439553.jpg',
  'art/met-439977.jpg',
  'art/met-442488.jpg',
  'art/met-816629.jpg',
  'art/rijks-sk-a-74.jpg',
]);

/** The address an image or canvas should load for a work's file: inside the app for the mini gallery, the site for the rest. */
export const artSrc = (file: string): string => (ART_LOCAL.has(file) ? `${base}${file}` : `${SITE}${file}`);
