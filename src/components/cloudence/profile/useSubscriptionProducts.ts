import { useCallback, useEffect, useState } from "react";
import type { ProductSubscription } from "expo-iap";
import { getCachedPlayProducts, playProductCache } from "../../../lib/cache/billingCache";
import { useCacheRevalidation } from "../../../hooks/useCacheRevalidation";

type Props = {
    userId: string | null;
    enabled: boolean;
    reconnect: () => Promise<boolean>;
};

type Catalog = { userId: string; subscriptions: ProductSubscription[] };

export function useSubscriptionProducts({ userId, enabled, reconnect }: Props) {
    const [plansLoading, setPlansLoading] = useState(false);
    const [plansError, setPlansError] = useState<string | null>(null);
    const [catalog, setCatalog] = useState<Catalog | null>(null);

    const load = useCallback(async (force = false, isCurrent: () => boolean = () => true) => {
        if (!isCurrent()) return;
        if (!userId) return;
        const cached = !force ? playProductCache.peek(userId) : undefined;
        if (!cached) setPlansLoading(true);
        setPlansError(null);
        try {
            const subscriptions = cached ?? await getCachedPlayProducts(userId, reconnect, force);
            if (isCurrent()) setCatalog({ userId, subscriptions });
        } catch (error) {
            if (isCurrent()) setPlansError(error instanceof Error ? error.message : "Plans could not be loaded.");
        } finally {
            if (isCurrent()) setPlansLoading(false);
        }
    }, [reconnect, userId]);

    useEffect(() => {
        let current = true;
        if (enabled) void Promise.resolve().then(() => {
            if (current) return load(false, () => current);
        });
        return () => { current = false; };
    }, [enabled, load]);

    const revalidate = useCallback(() => load(), [load]);
    useCacheRevalidation(revalidate, enabled);
    const reloadPlans = useCallback(() => load(true), [load]);
    return {
        plansLoading, plansError, reloadPlans,
        subscriptions: catalog?.userId === userId ? catalog.subscriptions : (userId ? playProductCache.peek(userId) ?? [] : []),
    };
}
