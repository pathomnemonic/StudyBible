import { useLiveQuery } from 'dexie-react-hooks';
import { db, type UserBook } from '../db/db';
import type { LibraryWorkMeta } from './content';
import { readBookFile } from '../lib/importBook';

export const isUserBook = (id: string) => id.startsWith('u:');

export async function addBookFile(file: File): Promise<UserBook> {
  const parsed = await readBookFile(file);
  const book: UserBook = { id: `u:${crypto.randomUUID().slice(0, 12)}`, addedAt: Date.now(), ...parsed };
  await db.userBooks.put(book);
  return book;
}
export const useUserBooks = () => useLiveQuery(() => db.userBooks.orderBy('addedAt').reverse().toArray(), []) ?? [];

/** A book of the reader's own, in the shape the Reading room reader expects. */
export function bookMeta(b: UserBook): LibraryWorkMeta {
  return { id: b.id, title: b.title, author: b.author || 'Your book', authorId: 'user', period: '', authority: 'Your own file', kind: 'your book', description: '', scriptureMode: 'none', translator: 'as in your file', rightsEvidence: 'It is your own copy, kept on this device only.', source: { name: `Your file (${b.format})`, url: '', retrieved: '' }, rights: 'user', format: b.format, sections: b.sections.map((s, i) => ({ id: String(i), title: s.title, scripture: [], words: s.paras.join(' ').split(/\s+/).length })) };
}
export const bookWork = (b: UserBook) => ({ id: b.id, sections: b.sections.map((s, i) => ({ id: String(i), title: s.title, paras: s.paras, scripture: [] as string[] })) });
