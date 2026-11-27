import { apiRequest } from "./client";

export const CLOUDENCE_PLAY_PRODUCTS = [
  "cloudence_pro_monthly",
] as const;

export type CloudencePlayProductId =
  (typeof CLOUDENCE_PLAY_PRODUCTS)[number];

export type GooglePlayBillingStatus = {
  enabled: boolean;
  productIds: CloudencePlayProductId[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isCloudencePlayProductId(
  value: unknown,
): value is CloudencePlayProductId {
  return (
    typeof value === "string" &&
    CLOUDENCE_PLAY_PRODUCTS.some((productId) => productId === value)
  );
}

export async function getGooglePlayBillingStatus(accessToken: string) {
  const result = await apiRequest<unknown>(
    "/cloudence/billing/google-play/status",
    accessToken,
  );
  if (
    !isRecord(result) ||
    typeof result.enabled !== "boolean" ||
    !Array.isArray(result.productIds)
  ) {
    throw new Error("The Google Play billing status response is invalid.");
  }
  const productIds = result.productIds.filter(isCloudencePlayProductId);
  if (productIds.length !== result.productIds.length) {
    throw new Error("The Google Play billing status response is invalid.");
  }
  return {
    enabled: result.enabled,
    productIds,
  };
}

export async function verifyGooglePlaySubscription(
  accessToken: string,
  productId: CloudencePlayProductId,
  purchaseToken: string,
) {
  return apiRequest<unknown>(
    "/cloudence/billing/google-play/verify",
    accessToken,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, purchaseToken }),
    },
  );
}
