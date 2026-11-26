import { WebPlugin } from '@capacitor/core';
import type { SeasonalIconChoice, SeasonalIconPlugin } from './definitions';
export declare class SeasonalIconWeb extends WebPlugin implements SeasonalIconPlugin {
    setIcon(_options: {
        name: SeasonalIconChoice | null;
    }): Promise<void>;
    getCurrentIcon(): Promise<{
        name: SeasonalIconChoice | null;
    }>;
}
