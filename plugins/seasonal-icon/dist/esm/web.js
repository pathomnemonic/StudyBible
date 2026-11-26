import { WebPlugin } from '@capacitor/core';
export class SeasonalIconWeb extends WebPlugin {
    async setIcon(_options) {
        // The web app has no launcher icon to change.
    }
    async getCurrentIcon() {
        return { name: null };
    }
}
