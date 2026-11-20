import * as AuthSession from "expo-auth-session";
import * as SecureStore from "expo-secure-store";
import { OAUTH_CLIENT_ID, OAUTH_DISCOVERY } from "../api/config";

const TOKEN_STORAGE_KEY = "cloudence.oauth.tokens";
const REFRESH_MARGIN_MS = 60_000;

export type StoredTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
};

export function toStoredTokens(
  response: AuthSession.TokenResponse,
  previous?: StoredTokens,
): StoredTokens {
  if (!response.accessToken) {
    throw new Error("The sign-in response did not include an access token.");
  }

  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken ?? previous?.refreshToken,
    expiresAt:
      (response.issuedAt + (response.expiresIn ?? 3600)) * 1000,
  };
}

export async function readStoredTokens(): Promise<StoredTokens | null> {
  const serialized = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
  if (!serialized) return null;

  let value: unknown;
  try {
    value = JSON.parse(serialized);
  } catch {
    throw new Error("The saved sign-in data is invalid. Sign in again.");
  }

  if (
    typeof value !== "object" ||
    value === null ||
    typeof Reflect.get(value, "accessToken") !== "string" ||
    typeof Reflect.get(value, "expiresAt") !== "number" ||
    (Reflect.get(value, "refreshToken") !== undefined &&
      typeof Reflect.get(value, "refreshToken") !== "string")
  ) {
    throw new Error("The saved sign-in data is invalid. Sign in again.");
  }

  return value as StoredTokens;
}

export function saveStoredTokens(tokens: StoredTokens) {
  return SecureStore.setItemAsync(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
}

export function clearStoredTokens() {
  return SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
}

export function tokenNeedsRefresh(tokens: StoredTokens) {
  return tokens.expiresAt <= Date.now() + REFRESH_MARGIN_MS;
}

export async function refreshStoredTokens(
  refreshToken: string,
  previous: StoredTokens,
) {
  const response = await AuthSession.refreshAsync(
    {
      clientId: OAUTH_CLIENT_ID,
      refreshToken,
    },
    OAUTH_DISCOVERY,
  );
  return toStoredTokens(response, previous);
}
