import Store from "expo-sqlite/kv-store";

export const PROMOTION_DELAY_MS = 3 * 60_000;
export const PROMOTION_COOLDOWN_MS = 3 * 24 * 60 * 60_000;
export type PromotionState = { activeMs: number; shown: boolean; lastShownAt?: number };
const keyFor = (userId: string) => `cloudence.promotion.50gb.v1:${encodeURIComponent(userId)}`;

export async function readPromotionState(userId: string): Promise<PromotionState | null> {
  const serialized = await Store.getItem(keyFor(userId));
  if (!serialized) return null;
  const value: unknown = JSON.parse(serialized);
  if (!value || typeof value !== "object" || !("activeMs" in value) ||
      typeof value.activeMs !== "number" || !Number.isFinite(value.activeMs) ||
      value.activeMs < 0 || !("shown" in value) || typeof value.shown !== "boolean") return null;
  const lastShownAt = "lastShownAt" in value && typeof value.lastShownAt === "number" &&
    Number.isFinite(value.lastShownAt) && value.lastShownAt >= 0 ? value.lastShownAt : undefined;
  const state = { activeMs: Math.min(value.activeMs, PROMOTION_DELAY_MS), shown: value.shown,
    ...(value.shown ? { lastShownAt: lastShownAt ?? Date.now() } : {}) };
  // Older installations have no display date. Start their cooldown once on migration.
  if (value.shown && lastShownAt === undefined) await savePromotionState(userId, state);
  return state;
}

export function savePromotionState(userId: string, state: PromotionState) {
  return Store.setItem(keyFor(userId), JSON.stringify(state));
}

// New users wait three active minutes; returning installations start with a cooldown.
export async function initializePromotion(userId: string, returningUser: boolean) {
  try {
    if (!(await readPromotionState(userId))) {
      await savePromotionState(userId, { activeMs: 0, shown: returningUser,
        ...(returningUser ? { lastShownAt: Date.now() } : {}) });
    }
  } catch {
    // A promotion must never prevent sign-in or session restoration.
  }
}
