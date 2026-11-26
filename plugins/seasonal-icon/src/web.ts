import { WebPlugin } from '@capacitor/core';

import type { SeasonalIconChoice, SeasonalIconPlugin } from './definitions';

export class SeasonalIconWeb extends WebPlugin implements SeasonalIconPlugin {
  async setIcon(_options: { name: SeasonalIconChoice | null }): Promise<void> {
    // The web app has no launcher icon to change.
  }

  async getCurrentIcon(): Promise<{ name: SeasonalIconChoice | null }> {
    return { name: null };
  }
}
