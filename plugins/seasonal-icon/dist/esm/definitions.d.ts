export type SeasonalIconChoice = 'violet' | 'green' | 'red';
export interface SeasonalIconPlugin {
    /**
     * Set the launcher icon: a season colour ('violet', 'green' or 'red'), or null
     * for the primary icon. On iOS the system shows its own short message when the
     * icon actually changes; on Android the change is silent.
     */
    setIcon(options: {
        name: SeasonalIconChoice | null;
    }): Promise<void>;
    /** The icon now in use: a season colour, or null when the primary icon is showing. */
    getCurrentIcon(): Promise<{
        name: SeasonalIconChoice | null;
    }>;
}
