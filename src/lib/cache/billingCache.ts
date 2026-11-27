import { fetchProducts, type ProductSubscription } from "expo-iap";
import { CLOUDENCE_PLAY_PRODUCTS, getGooglePlayBillingStatus } from "../api/cloudenceBilling";
import { fetchWithBillingConnection } from "../../components/cloudence/profile/billingConnection";
import { createAccountRequestCache } from "./accountRequestCache";
import { BILLING_FRESH_MS } from "./cachePolicy";

const statusCache = createAccountRequestCache<Awaited<ReturnType<typeof getGooglePlayBillingStatus>>>(BILLING_FRESH_MS);
export const playProductCache = createAccountRequestCache<ProductSubscription[]>(BILLING_FRESH_MS);

export function getCachedBillingStatus(userId: string, getAccessToken: () => Promise<string>) {
  return statusCache.load(userId, async () => getGooglePlayBillingStatus(await getAccessToken()));
}

export function getCachedPlayProducts(userId: string, reconnect: () => Promise<boolean>, force = false) {
  return playProductCache.load(userId, () => fetchWithBillingConnection(reconnect, async () => {
    const products = await fetchProducts({ skus: [...CLOUDENCE_PLAY_PRODUCTS], type: "subs" });
    const subscriptions = (products ?? []).filter((product) =>
      CLOUDENCE_PLAY_PRODUCTS.some((id) => id === product.id),
    ) as ProductSubscription[];
    if (!subscriptions.length) throw new Error("No subscription plans are available. Please try again later.");
    return subscriptions;
  }), force);
}
