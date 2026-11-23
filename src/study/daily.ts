import { getJson } from '../data/loader';
import type { DailyFile } from './dailyTypes';

export type { DailyEntry, DailyFile } from './dailyTypes';
export { dailyKeys, pickDaily, dailyRef } from './dailyPick';

export const loadDaily = () => getJson<DailyFile>('daily/index.json', true);
