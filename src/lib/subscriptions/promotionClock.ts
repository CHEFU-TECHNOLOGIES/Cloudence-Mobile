import { PROMOTION_COOLDOWN_MS, PROMOTION_DELAY_MS, type PromotionState } from "./promotionState";

export function createPromotionClock(
  initial: PromotionState,
  save: (state: PromotionState) => Promise<void>,
  onReady: () => void,
  now = Date.now,
) {
  let state = { ...initial };
  if (state.shown && state.lastShownAt === undefined) state.lastShownAt = now();
  let startedAt: number | null = null;
  let writes = Promise.resolve();
  let readyNotified = false;

  const remaining = () => state.shown
    ? Math.max(0, state.lastShownAt! + PROMOTION_COOLDOWN_MS - now())
    : Math.max(0, PROMOTION_DELAY_MS - state.activeMs -
      (startedAt === null ? 0 : Math.max(0, now() - startedAt)));
  const persist = () => {
    const snapshot = { ...state };
    writes = writes.catch(() => undefined).then(() => save(snapshot));
    // Background checkpoints are best effort; claim() still waits for its own write.
    void writes.catch(() => undefined);
    return writes;
  };
  const checkpoint = () => {
    if (state.shown) {
      if (!remaining() && !readyNotified) { readyNotified = true; onReady(); }
      return;
    }
    if (state.activeMs >= PROMOTION_DELAY_MS && readyNotified) return;
    if (startedAt !== null) {
      state.activeMs = Math.min(PROMOTION_DELAY_MS, state.activeMs + Math.max(0, now() - startedAt));
      startedAt = now();
    }
    void persist();
    if (!remaining() && !readyNotified) { readyNotified = true; onReady(); }
  };
  return {
    remaining,
    resume() {
      if (!state.shown && startedAt === null) startedAt = now();
      if (!remaining()) checkpoint();
    },
    pause() { checkpoint(); startedAt = null; },
    checkpoint,
    async claim() {
      if (remaining() > 0) return false;
      state = { activeMs: PROMOTION_DELAY_MS, shown: true, lastShownAt: now() };
      readyNotified = false;
      startedAt = null;
      try { await persist(); return true; } catch { return false; }
    },
  };
}
