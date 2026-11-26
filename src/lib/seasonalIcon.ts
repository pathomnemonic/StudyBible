import { Capacitor } from '@capacitor/core';
import { SeasonalIcon } from 'capacitor-seasonal-icon';
import { liturgicalDay } from '../liturgy/compute';
import { getSettings } from './store';

/** The launcher icons the store app can show: the primary gold and white monstrance, and one for each season colour. */
export type SeasonalIconName = 'primary' | 'violet' | 'green' | 'red';

/**
 * Which icon a day calls for, from the app's own General Roman Calendar computation
 * (the same liturgicalDay the daily content uses):
 * violet in Advent and Lent (the Triduum keeps Lent's violet, as the season theme does),
 * green in Ordinary Time, red on Pentecost, and the primary gold and white in the
 * Christmas and Easter seasons.
 */
export function iconForDate(d: Date): SeasonalIconName {
  const day = liturgicalDay(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), 'universal');
  if (day.dayName.startsWith('Pentecost')) return 'red';
  switch (day.season) {
    case 'advent':
    case 'lent':
    case 'triduum':
      return 'violet';
    case 'christmas':
    case 'easter':
      return 'primary';
    default:
      return 'green';
  }
}

/** Only the store apps can change their launcher icon; the website has no icon to change. */
export function seasonalIconSupported(): boolean {
  return Capacitor.isNativePlatform();
}

let lastApplied: SeasonalIconName | null = null;

/**
 * Make the launcher icon the one the current season calls for (or the primary icon
 * when the setting is off). Does nothing on the web, and nothing when the icon is
 * already right, so the iOS change message only appears on a real change.
 */
export async function applySeasonalIcon(enabled: boolean = !!getSettings().seasonalIcon): Promise<void> {
  if (!seasonalIconSupported()) return;
  const wanted: SeasonalIconName = enabled ? iconForDate(new Date()) : 'primary';
  if (wanted === lastApplied) return;
  try {
    const { name } = await SeasonalIcon.getCurrentIcon();
    const current: SeasonalIconName = name ?? 'primary';
    if (current === wanted) {
      lastApplied = wanted;
      return;
    }
    await SeasonalIcon.setIcon({ name: wanted === 'primary' ? null : wanted });
    lastApplied = wanted;
  } catch {
    /* an older store build without the native side: nothing to change */
  }
}

let started = false;

/** On launch, and again whenever the app comes back to the front, make sure the icon matches the season. Called once, from App. */
export function initSeasonalIcon(): void {
  if (started) return;
  started = true;
  void applySeasonalIcon();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void applySeasonalIcon();
  });
}
