import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import * as Crypto from "expo-crypto";
import {
  ErrorCode,
  getAvailablePurchases,
  useIAP,
  type Purchase,
} from "expo-iap";
import { useSession } from "../../../auth/SessionContext";
import { theme } from "../../../constants/theme";
import {
  CLOUDENCE_PLAY_PRODUCTS,
  getGooglePlayBillingStatus,
  isCloudencePlayProductId,
  type CloudencePlayProductId,
  verifyGooglePlaySubscription,
} from "../../../lib/api/cloudenceBilling";
import type { CloudenceUsage } from "../../../lib/api/files";
import { useToast } from "../ToastProvider";

type Props = {
  usage: CloudenceUsage;
  onEntitlementUpdated: () => Promise<boolean>;
};

const PRODUCT_LABELS: Record<CloudencePlayProductId, string> = {
  cloudence_pro_monthly: "Cloudence Pro",
  cloudence_storage_50gb_monthly: "50 GB Storage",
};

export default function CloudenceSubscriptionCard({
  usage,
  onEntitlementUpdated,
}: Props) {
  const { getAccessToken, user } = useSession();
  const { showToast } = useToast();
  const finishTransactionRef = useRef<
    ((params: { purchase: Purchase; isConsumable?: boolean }) => Promise<void>) | null
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
          throw new Error("The purchase could not be completed. Please retry.");
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
    onError: (error) => {
      showToast({
        title: "Google Play unavailable",
        message: error.message,
        variant: "error",
      });
    },
  });
  const {
    connected,
    fetchProducts,
    finishTransaction,
    requestPurchase,
    subscriptions,
  } = iap;

  useEffect(() => {
    finishTransactionRef.current = finishTransaction;
  }, [finishTransaction]);

  useEffect(() => {
    let active = true;
    void getAccessToken()
      .then(getGooglePlayBillingStatus)
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
  }, [getAccessToken, showToast]);

  useEffect(() => {
    if (!billingEnabled || !connected) return;
    void fetchProducts({
        skus: [...CLOUDENCE_PLAY_PRODUCTS],
        type: "subs",
      })
      .catch((error: unknown) => {
        showToast({
          title: "Plans unavailable",
          message:
            error instanceof Error
              ? error.message
              : "Google Play could not load plans.",
          variant: "error",
        });
      });
  }, [billingEnabled, connected, fetchProducts, showToast]);

  const purchaseProduct = async (productId: CloudencePlayProductId) => {
    const product = subscriptions.find((item) => item.id === productId);
    if (!product || !user?.id) {
      showToast({
        title: "Plan unavailable",
        message: "Please wait for Google Play to load the subscription.",
        variant: "error",
      });
      return;
    }

    setProcessing(true);
    try {
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
          error instanceof Error ? error.message : "Please try again later.",
        variant: "error",
      });
    }
  };

  const restorePurchases = async () => {
    setRestoring(true);
    try {
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
          message: "No active Cloudence subscription could be verified.",
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
          error instanceof Error ? error.message : "Please try again later.",
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

  if (Platform.OS !== "android") return null;
  const active = usage.plan === "50gb" || usage.all > 2 * 1024 ** 3;

  return (
    <View
      style={{
        padding: 16,
        marginBottom: 16,
        borderRadius: 16,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: 12,
      }}
    >
      <View>
        <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: "800" }}>
          {active ? "50 GB plan active" : "Get 50 GB Cloudence storage"}
        </Text>
        <Text style={{ color: theme.colors.secondaryText, fontSize: 12, marginTop: 4 }}>
          {active
            ? `Your plan renews until ${usage.expiresAt ? new Date(usage.expiresAt).toLocaleDateString() : "its expiry date"}.`
            : "50 GB total storage, billed monthly."}
        </Text>
      </View>

      {loading || (billingEnabled && !connected) ? (
        <ActivityIndicator color={theme.colors.brand} />
      ) : billingEnabled ? (
        active ? (
          <Pressable onPress={() => void manageSubscription()} style={buttonStyle}>
            <Text style={buttonTextStyle}>Manage subscription</Text>
          </Pressable>
        ) : (
          <>
            {CLOUDENCE_PLAY_PRODUCTS.map((productId) => {
              const product = subscriptions.find(
                (item) => item.id === productId,
              );
              if (!product) return null;
              return (
                <Pressable
                  key={productId}
                  disabled={processing}
                  onPress={() => void purchaseProduct(productId)}
                  style={[buttonStyle, processing && { opacity: 0.6 }]}
                >
                  <Text style={buttonTextStyle}>
                    {processing
                      ? "Processing..."
                      : `${PRODUCT_LABELS[productId]} - ${product.displayPrice} / month`}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              disabled={restoring || processing}
              onPress={() => void restorePurchases()}
              style={{ alignItems: "center", paddingVertical: 8 }}
            >
              <Text style={{ color: theme.colors.brand, fontSize: 12, fontWeight: "700" }}>
                {restoring ? "Restoring..." : "Restore purchases"}
              </Text>
            </Pressable>
          </>
        )
      ) : (
        <Text style={{ color: theme.colors.secondaryText, fontSize: 12 }}>
          Google Play subscriptions are not available yet.
        </Text>
      )}
    </View>
  );
}

const buttonStyle = {
  alignItems: "center" as const,
  justifyContent: "center" as const,
  minHeight: 44,
  paddingHorizontal: 14,
  borderRadius: 10,
  backgroundColor: theme.colors.brand,
};

const buttonTextStyle = {
  color: "#FFFFFF",
  fontSize: 13,
  fontWeight: "700" as const,
  textAlign: "center" as const,
};
