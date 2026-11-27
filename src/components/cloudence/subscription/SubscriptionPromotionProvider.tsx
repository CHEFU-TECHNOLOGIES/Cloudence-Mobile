import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AppState, Platform } from "react-native";
import { useSession } from "../../../auth/SessionContext";
import { createPromotionClock } from "../../../lib/subscriptions/promotionClock";
import { readPromotionState, savePromotionState } from "../../../lib/subscriptions/promotionState";

type PromotionContext = { readyUserId: string | null; readySequence: number; claim: () => Promise<boolean> };
const Context = createContext<PromotionContext>({ readyUserId: null, readySequence: 0, claim: async () => false });

export function SubscriptionPromotionProvider({ children }: { children: ReactNode }) {
  const { user, status } = useSession();
  const userId = status === "authenticated" ? user?.id : null;
  const [ready, setReady] = useState({ userId: null as string | null, sequence: 0 });
  const tracker = useRef<{ userId: string; clock: ReturnType<typeof createPromotionClock>; update: () => void } | null>(null);

  useEffect(() => {
    if (!userId || Platform.OS !== "android") return;
    let canceled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let checkpoint: ReturnType<typeof setInterval> | undefined;
    let subscription: ReturnType<typeof AppState.addEventListener> | undefined;
    void readPromotionState(userId).then((state) => {
      if (canceled || !state) return;
      const clock = createPromotionClock(state, (value) => savePromotionState(userId, value), () => {
        if (!canceled) setReady(previous => ({ userId, sequence: previous.sequence + 1 }));
      });
      const update = () => {
        clearTimeout(timer);
        if (AppState.currentState === "active") {
          clock.resume();
          if (clock.remaining() > 0) timer = setTimeout(() => clock.checkpoint(), clock.remaining());
        } else clock.pause();
      };
      tracker.current = { userId, clock, update };
      subscription = AppState.addEventListener("change", update);
      checkpoint = setInterval(() => {
        if (AppState.currentState === "active") clock.checkpoint();
      }, 15_000);
      update();
    }).catch(() => undefined);
    return () => {
      canceled = true;
      clearTimeout(timer);
      clearInterval(checkpoint);
      subscription?.remove();
      if (tracker.current?.userId === userId) {
        tracker.current.clock.pause();
        tracker.current = null;
      }
    };
  }, [userId]);

  const claim = useCallback(async () => {
    const current = tracker.current;
    if (!current || current.userId !== userId) return false;
    const claimed = await current.clock.claim();
    if (tracker.current === current) current.update();
    return claimed;
  }, [userId]);

  return <Context.Provider value={{ readyUserId: ready.userId, readySequence: ready.sequence, claim }}>{children}</Context.Provider>;
}

export const useSubscriptionPromotion = () => useContext(Context);
