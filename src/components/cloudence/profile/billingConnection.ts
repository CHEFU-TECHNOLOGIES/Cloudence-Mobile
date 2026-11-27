import { ErrorCode } from "expo-iap";

export function isBillingConnectionError(error: unknown): boolean {
    if (!error || typeof error !== "object" || !("code" in error)) return false;
    return [ErrorCode.NotPrepared, ErrorCode.ServiceDisconnected, ErrorCode.ConnectionClosed]
        .some((code) => code === error.code);
}

export async function requireBillingConnection(reconnect: () => Promise<boolean>) {
    if (!(await reconnect())) {
        throw new Error("Google Play is unavailable. Check your connection and try again.");
    }
}

// Only retry reads. A purchase request must never be automatically repeated.
export async function fetchWithBillingConnection<T>(
    reconnect: () => Promise<boolean>,
    fetchProducts: () => Promise<T>,
) {
    await requireBillingConnection(reconnect);
    try {
        return await fetchProducts();
    } catch (error) {
        if (!isBillingConnectionError(error)) throw error;
        await requireBillingConnection(reconnect);
        return await fetchProducts();
    }
}
