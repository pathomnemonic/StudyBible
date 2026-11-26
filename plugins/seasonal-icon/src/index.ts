import { registerPlugin } from '@capacitor/core';

import type { SeasonalIconPlugin } from './definitions';

const SeasonalIcon = registerPlugin<SeasonalIconPlugin>('SeasonalIcon', {
  web: () => import('./web').then((m) => new m.SeasonalIconWeb()),
});

export * from './definitions';
export { SeasonalIcon };
