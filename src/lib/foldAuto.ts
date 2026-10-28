/** Folds the page opened by itself because there was room. A fold that is rebuilt (the page re-renders when its data arrives) starts open again, so it never closes on its own. */
export const autoOpen = new Set<string>();
