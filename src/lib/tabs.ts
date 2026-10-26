/** Which tab a page belongs to. One place, so the tab bar, the breadcrumbs and the tools menu always agree. */
export const under = (path: string, list: string[]) => list.some((m) => path === m || path.startsWith(m + '/'));

/** The Catechism program, the Catechism itself and the pages that teach the faith. */
export const LEARN_PATHS = ['/learn', '/study/curriculum', '/study/prepare', '/study/young-adults', '/study/adults', '/study/kids', '/study/apologetics', '/study/visual', '/study/catechism', '/study/doctrine', '/study/course', '/study/story', '/study/paths', '/teach', '/join'];
/** Texts and recordings beyond the Bible. */
export const READ_PATHS = ['/room', '/study/works', '/study/saints', '/study/encyclopedia', '/study/papal', '/study/church'];
/** Yours: notes, settings, downloads and the like. */
export const YOU_PATHS = ['/profile', '/downloads', '/library', '/settings', '/account', '/about', '/more', '/days', '/share', '/goals', '/privacy'];
/** Paths under /pray that belong to Today's daily practice rather than the Pray tab. */
export const DAILY_PRAY = ['/pray/readings', '/pray/plans'];

export const inLearn = (p: string) => under(p, LEARN_PATHS);
export const inRead = (p: string) => under(p, READ_PATHS);
export const inYou = (p: string) => under(p, YOU_PATHS) && !p.startsWith('/pray/readings');
export const inPray = (p: string) => under(p, ['/pray', '/mass', '/memento']) && !under(p, DAILY_PRAY);
/** Everything under /study that is a tool for the Bible text: it lives with the Bible tab. */
export const inStudyTools = (p: string) => p.startsWith('/study/') && !inLearn(p) && !inRead(p) && !p.startsWith('/study/search');
export const inBible = (p: string) => p === '/read' || p.startsWith('/read/') || p === '/study' || inStudyTools(p) || p.startsWith('/study/search') || p.startsWith('/study/passage');
