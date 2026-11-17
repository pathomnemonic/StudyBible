/** Today's date as the reader's own calendar has it (YYYY-MM-DD). Never `new Date().toISOString().slice(0, 10)`: that is the date in UTC, which is already tomorrow by late afternoon in the Americas and still yesterday in the morning east of Greenwich. */
export const isoToday = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
/** The calendar day `by` days from a YYYY-MM-DD date, worked in UTC throughout so no time zone can move it. */
export const shiftDay = (date: string, by: number) => new Date(Date.parse(`${date}T12:00:00Z`) + by * 864e5).toISOString().slice(0, 10);
