/** A periodic save near the end is not proof that the media element actually ended. */
export function playbackProgressPatch(currentTime: number, duration: number | undefined, ended: boolean) {
  return {
    position: ended ? 0 : Math.max(0, Number.isFinite(currentTime) ? currentTime : 0),
    duration: duration && Number.isFinite(duration) ? duration : undefined,
    completed: ended || undefined,
    ranToEnd: ended,
  };
}
