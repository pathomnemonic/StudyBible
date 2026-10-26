import brand from '../../brand.json';

/**
 * The app's name and one-line description live in brand.json at the root of the project. Change them there and the interface,
 * the page title, the install name, exports and calendar files all follow. (Storage keys and file formats keep their old internal
 * names on purpose, so nobody loses their data when the name changes.)
 */
export const BRAND = brand as { name: string; tagline: string; description: string; repo: string };
export const pageTitle = (page?: string) => (page ? `${page} · ${BRAND.name}` : BRAND.name);
