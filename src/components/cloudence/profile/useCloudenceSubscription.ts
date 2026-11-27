import { useCallback, useEffect, useRef, useState } from "react";
import { Linking } from "react-native";
import * as Crypto from "expo-crypto";
import {
    ErrorCode,
    getAvailablePurchases,
    useIAP,
    type Purchase,
} from "expo-iap";
import { useSession } from "../../../auth/SessionContext";
import {
    CLOUDENCE_PLAY_PRODUCTS,
    isCloudencePlayProductId,
    type CloudencePlayProductId,
    verifyGooglePlaySubscription,
} from "../../../lib/api/cloudenceBilling";
import type { CloudenceUsage } from "../../../lib/api/files";
import { useToast } from "../ToastProvider";
import { requireBillingConnection } from "./billingConnection";
import { useSubscriptionProducts } from "./useSubscriptionProducts";
import { getCachedBillingStatus, getCachedPlayProducts } from "../../../lib/cache/billingCache";


export function useCloudenceSubscription({ usage, onEntitlementUpdated, plansVisible }: {
    usage: CloudenceUsage;
    onEntitlementUpdated: () => Promise<boolean>;
    plansVisible: boolean;
}) {
    const { getAccessToken, user } = useSession();
    const { showToast } = useToast();
    const finishTransactionRef = useRef<
        | ((params: {
              purchase: Purchase;
              isConsumable?: boolean;
          }) => Promise<void>)
        | null
    >(null);
    const [billingEnabled, setBillingEnabled] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [restoring, setRestoring] = useState(false);

    const handlePurchase = useCallback(
        async (purchase: Purchase, showSuccess = true) => {
            if (purchase.purchaseState !== "purchased") {
                setProcessing(false);
                if (purchase.purchaseState === "pending") {
                    showToast({
                        title: "Payment pending",
                        message:
                            "Your storage will upgrade after Google Play confirms payment.",
                        variant: "info",
                    });
                }
                return;
            }
            const productId = CLOUDENCE_PLAY_PRODUCTS.find(
                (id) => id === purchase.productId,
            );
            if (!productId || !purchase.purchaseToken) {
                throw new Error("Google Play returned an incomplete purchase.");
            }

            setProcessing(true);
            try {
                const accessToken = await getAccessToken();
                await verifyGooglePlaySubscription(
                    accessToken,
                    productId,
                    purchase.purchaseToken,
                );
                const finishTransaction = finishTransactionRef.current;
                if (!finishTransaction) {
                    throw new Error(
                        "The purchase could not be completed. Please retry.",
                    );
                }
                await finishTransaction({ purchase, isConsumable: false });
                await onEntitlementUpdated();
                if (showSuccess) {
                    showToast({
                        title: "Storage upgraded",
                        message: "Your 50 GB storage plan is active.",
                        variant: "success",
                    });
                }
            } finally {
                setProcessing(false);
            }
        },
        [getAccessToken, onEntitlementUpdated, showToast],
    );

    const iap = useIAP({
        onPurchaseSuccess: (purchase) => {
            void handlePurchase(purchase).catch((error: unknown) => {
                showToast({
                    title: "Purchase verification failed",
                    message:
                        error instanceof Error
                            ? error.message
                            : "Please restore the purchase or try again.",
                    variant: "error",
                });
            });
        },
        onPurchaseError: (error) => {
            setProcessing(false);
            if (error.code === ErrorCode.UserCancelled) return;
            showToast({
                title: "Purchase failed",
                message: error.message,
                variant: "error",
            });
        },
    });
    const {
        connected,
        finishTransaction,
        requestPurchase,
        reconnect,
    } = iap;
    const products = useSubscriptionProducts({
        userId: user?.id ?? null,
        enabled: plansVisible && billingEnabled === true,
        reconnect,
    });

    useEffect(() => {
        finishTransactionRef.current = finishTransaction;
    }, [finishTransaction]);

    useEffect(() => {
        let active = true;
        if (!user?.id) return;
        void getCachedBillingStatus(user.id, getAccessToken)
            .then((status) => {
                if (active) setBillingEnabled(status.enabled);
            })
            .catch((error: unknown) => {
                if (!active) return;
                showToast({
                    title: "Billing status unavailable",
                    message:
                        error instanceof Error
                            ? error.message
                            : "Please try again later.",
                    variant: "error",
                });
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [getAccessToken, showToast, user?.id, plansVisible]);

    const purchaseProduct = async (productId: CloudencePlayProductId) => {
        if (!user?.id) {
            showToast({
                title: "Plan unavailable",
                message:
                    "Please wait for Google Play to load the subscription.",
                variant: "error",
            });
            return;
        }

        setProcessing(true);
        try {
            // Refresh price and offer tokens immediately before checkout.
            const latestProducts = await getCachedPlayProducts(user.id, reconnect, true);
            const product = latestProducts.find((item) => item.id === productId);
            if (!product) throw new Error("This plan is no longer available.");
            await requireBillingConnection(reconnect);
            const offer = product.subscriptionOffers?.find(
                (item) => item.offerTokenAndroid,
            );
            const obfuscatedAccountId = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                user.id,
            );
            await requestPurchase({
                request: {
                    google: {
                        skus: [productId],
                        obfuscatedAccountId,
                        ...(offer?.offerTokenAndroid
                            ? {
                                  subscriptionOffers: [
                                      {
                                          sku: productId,
                                          offerToken: offer.offerTokenAndroid,
                                      },
                                  ],
                              }
                            : {}),
                    },
                },
                type: "subs",
            });
        } catch (error) {
            setProcessing(false);
            showToast({
                title: "Could not start purchase",
                message:
                    error instanceof Error
                        ? error.message
                        : "Please try again later.",
                variant: "error",
            });
        }
    };

    const restorePurchases = async () => {
        setRestoring(true);
        try {
            await requireBillingConnection(reconnect);
            const purchases = await getAvailablePurchases();
            const owned = purchases.filter(
                (purchase) =>
                    isCloudencePlayProductId(purchase.productId) &&
                    purchase.purchaseState === "purchased",
            );
            if (owned.length === 0) {
                showToast({
                    title: "No active purchase found",
                    message: "No Cloudence Google Play subscription was found.",
                    variant: "info",
                });
                return;
            }
            let restored = false;
            let lastError: unknown;
            for (const purchase of owned) {
                try {
                    await handlePurchase(purchase, false);
                    restored = true;
                } catch (error) {
                    lastError = error;
                }
            }
            if (!restored) {
                if (lastError instanceof Error) throw lastError;
                showToast({
                    title: "No active purchase found",
                    message:
                        "No active Cloudence subscription could be verified.",
                    variant: "info",
                });
                return;
            }
            showToast({
                title: "Purchases restored",
                message: "Your active Cloudence storage plan is restored.",
                variant: "success",
            });
        } catch (error) {
            showToast({
                title: "Restore failed",
                message:
                    error instanceof Error
                        ? error.message
                        : "Please try again later.",
                variant: "error",
            });
        } finally {
            setRestoring(false);
        }
    };

    const manageSubscription = async () => {
        const productId = isCloudencePlayProductId(usage.productId)
            ? usage.productId
            : CLOUDENCE_PLAY_PRODUCTS[0];
        const url = `https://play.google.com/store/account/subscriptions?sku=${encodeURIComponent(productId)}&package=za.co.chefu.cloudence`;
        try {
            await Linking.openURL(url);
        } catch {
            showToast({
                title: "Could not open Google Play",
                message: "Manage this subscription in the Play Store.",
                variant: "error",
            });
        }
    };

    return {
        ...products,
        active: usage.plan === "50gb" || usage.all > 2 * 1024 ** 3,
        billingEnabled, loading, processing, restoring, connected,
        purchaseProduct, restorePurchases, manageSubscription,
    };
}
