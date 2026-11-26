import { registerPlugin } from '@capacitor/core';
const SeasonalIcon = registerPlugin('SeasonalIcon', {
    web: () => import('./web.js').then((m) => new m.SeasonalIconWeb()),
});
export { SeasonalIcon };
