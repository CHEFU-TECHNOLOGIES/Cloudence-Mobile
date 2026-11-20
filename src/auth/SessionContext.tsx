import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import * as AuthSession from "expo-auth-session";
import { randomUUID } from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import {
  ApiError,
  apiRequest,
  setUnauthorizedHandler,
} from "../lib/api/client";
import {
  ACCOUNT_BASE_URL,
  OAUTH_CLIENT_ID,
  OAUTH_DISCOVERY,
  OAUTH_REDIRECT_URI,
} from "../lib/api/config";
import type { StoredTokens, StoredUser } from "../lib/auth/tokens";
import {
  clearStoredTokens,
  readStoredTokens,
  refreshStoredTokens,
  saveStoredTokens,
  tokenNeedsRefresh,
  toStoredTokens,
} from "../lib/auth/tokens";

export type CloudenceUser = StoredUser;

type SessionStatus = "loading" | "authenticated" | "unauthenticated" | "error";

type SessionContextValue = {
  status: SessionStatus;
  user: CloudenceUser | null;
  error: string | null;
  isSigningIn: boolean;
  signIn: () => Promise<void>;
  getAccessToken: () => Promise<string>;
  retrySessionRestore: () => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

WebBrowser.maybeCompleteAuthSession();

async function loadCurrentUser(accessToken: string): Promise<CloudenceUser> {
  const result = await apiRequest<unknown>(
    "/oauth/userinfo",
    accessToken,
  );
  if (typeof result !== "object" || result === null) {
    throw new Error("The account response was invalid.");
  }

  const id = Reflect.get(result, "sub");
  const fullName = Reflect.get(result, "name");
  const email = Reflect.get(result, "email");
  const avatar = Reflect.get(result, "picture");
  const app = Reflect.get(result, "app");

  if (
    typeof id !== "string" ||
    typeof email !== "string" ||
    !email.includes("@") ||
    app !== "cloudence" ||
    (fullName !== undefined && typeof fullName !== "string") ||
    (avatar !== undefined && typeof avatar !== "string")
  ) {
    throw new Error("The account response was invalid.");
  }

  return {
    id,
    fullName,
    email,
    avatar,
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Unable to restore the saved sign-in.";
}

function isInvalidRefreshToken(error: unknown) {
  return error instanceof AuthSession.TokenError &&
    ["invalid_grant", "invalid_client", "unauthorized_client"].includes(error.code);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUser] = useState<CloudenceUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const tokensRef = useRef<StoredTokens | null>(null);
  const refreshPromiseRef = useRef<Promise<StoredTokens> | null>(null);
  const signInPendingRef = useRef(false);

  const setAuthenticated = useCallback(
    (nextTokens: StoredTokens, nextUser: CloudenceUser) => {
      tokensRef.current = nextTokens;
      setUser(nextUser);
      setError(null);
      setStatus("authenticated");
    },
    [],
  );

  const setUnauthenticated = useCallback((message: string | null = null) => {
    tokensRef.current = null;
    setUser(null);
    setError(message);
    setStatus("unauthenticated");
  }, []);

  const restoreSession = useCallback(async () => {
    const storedTokens = await readStoredTokens();
    setStatus("loading");
    setError(null);

    if (!storedTokens) {
      setUnauthenticated();
      return;
    }

    let activeTokens = storedTokens;
    tokensRef.current = activeTokens;
    if (activeTokens.user) {
      setAuthenticated(activeTokens, activeTokens.user);
      return;
    }

    if (tokenNeedsRefresh(activeTokens)) {
      if (!activeTokens.refreshToken) {
        await clearStoredTokens();
        setUnauthenticated("Your session expired. Sign in to continue.");
        return;
      }

      try {
        activeTokens = await refreshStoredTokens(
          activeTokens.refreshToken,
          activeTokens,
        );
        await saveStoredTokens(activeTokens);
        tokensRef.current = activeTokens;
      } catch (refreshError) {
        if (isInvalidRefreshToken(refreshError)) {
          await clearStoredTokens();
          setUnauthenticated("Your session expired. Sign in to continue.");
          return;
        }
        throw refreshError;
      }
    }

    try {
      const currentUser = await loadCurrentUser(activeTokens.accessToken);
      const tokensWithUser = { ...activeTokens, user: currentUser };
      await saveStoredTokens(tokensWithUser);
      setAuthenticated(tokensWithUser, currentUser);
    } catch (userError) {
      if (userError instanceof ApiError && userError.status === 401) {
        await clearStoredTokens();
        setUnauthenticated("Your session expired. Sign in to continue.");
        return;
      }
      throw userError;
    }
  }, [setAuthenticated, setUnauthenticated]);

  useEffect(() => {
    let active = true;
    void Promise.resolve()
      .then(restoreSession)
      .catch((restoreError: unknown) => {
        if (!active) return;
        setError(getErrorMessage(restoreError));
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [restoreSession]);

  useEffect(
    () =>
      setUnauthorizedHandler(async (rejectedToken) => {
        if (tokensRef.current?.accessToken !== rejectedToken) return;
        await clearStoredTokens();
        setUnauthenticated("Your session expired. Sign in to continue.");
      }),
    [setUnauthenticated],
  );

  const signIn = useCallback(async () => {
    if (signInPendingRef.current) return;
    signInPendingRef.current = true;
    setIsSigningIn(true);
    setError(null);

    try {
      const state = randomUUID();
      const request = new AuthSession.AuthRequest({
        clientId: OAUTH_CLIENT_ID,
        redirectUri: OAUTH_REDIRECT_URI,
        scopes: ["openid", "profile", "email"],
        responseType: AuthSession.ResponseType.Code,
        usePKCE: true,
        state,
        extraParams: { nonce: randomUUID() },
      });
      const authorizeUrl = await request.makeAuthUrlAsync(OAUTH_DISCOVERY);
      const accountUrl = new URL("/login", ACCOUNT_BASE_URL);
      accountUrl.searchParams.set("app", "cloudence");
      accountUrl.searchParams.set("returnTo", authorizeUrl);
      accountUrl.searchParams.set("prompt", "select_account");
      const result = await request.promptAsync(OAUTH_DISCOVERY, {
        url: accountUrl.toString(),
      });

      if (result.type === "error") {
        throw new Error(
          result.error?.description ??
            result.params.error_description ??
            "The account sign-in could not be completed.",
        );
      }
      if (result.type !== "success") return;

      const code = result.params.code;
      if (
        result.params.state !== state ||
        !code ||
        !request.codeVerifier
      ) {
        throw new Error("Sign-in validation failed. Please try again.");
      }

      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: OAUTH_CLIENT_ID,
          code,
          redirectUri: OAUTH_REDIRECT_URI,
          extraParams: { code_verifier: request.codeVerifier },
        },
        OAUTH_DISCOVERY,
      );
      const nextTokens = toStoredTokens(tokenResponse);
      const currentUser = await loadCurrentUser(nextTokens.accessToken);
      const tokensWithUser = { ...nextTokens, user: currentUser };
      await saveStoredTokens(tokensWithUser);
      setAuthenticated(tokensWithUser, currentUser);
    } catch (signInError) {
      if (signInError instanceof ApiError && signInError.status === 401) {
        await clearStoredTokens();
        setUnauthenticated("The sign-in token was rejected. Please try again.");
      }
      setError(
        signInError instanceof Error
          ? signInError.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      signInPendingRef.current = false;
      setIsSigningIn(false);
    }
  }, [setAuthenticated, setUnauthenticated]);

  const getAccessToken = useCallback(async () => {
    const currentTokens = tokensRef.current;
    if (!currentTokens) {
      throw new Error("Sign in to access your Cloudence workspace.");
    }
    if (!tokenNeedsRefresh(currentTokens)) return currentTokens.accessToken;
    if (!currentTokens.refreshToken) {
      await clearStoredTokens();
      setUnauthenticated("Your session expired. Sign in to continue.");
      throw new Error("Your session expired. Sign in to continue.");
    }

    let refreshPromise = refreshPromiseRef.current;
    if (!refreshPromise) {
      refreshPromise = (async () => {
        const refreshed = await refreshStoredTokens(
          currentTokens.refreshToken!,
          currentTokens,
        );
        if (tokensRef.current !== currentTokens) {
          const latestTokens = tokensRef.current;
          if (latestTokens && !tokenNeedsRefresh(latestTokens)) {
            return latestTokens;
          }
          throw new Error("Your session changed. Sign in again.");
        }
        const currentUser =
          user ?? refreshed.user ?? (await loadCurrentUser(refreshed.accessToken));
        if (tokensRef.current !== currentTokens) {
          const latestTokens = tokensRef.current;
          if (latestTokens && !tokenNeedsRefresh(latestTokens)) {
            return latestTokens;
          }
          throw new Error("Your session changed. Sign in again.");
        }
        const refreshedWithUser = { ...refreshed, user: currentUser };
        await saveStoredTokens(refreshedWithUser);
        setAuthenticated(refreshedWithUser, currentUser);
        return refreshed;
      })();
      refreshPromiseRef.current = refreshPromise;
    }

    try {
      return (await refreshPromise).accessToken;
    } catch (refreshError) {
      if (tokensRef.current !== currentTokens) {
        const latestTokens = tokensRef.current;
        if (latestTokens && !tokenNeedsRefresh(latestTokens)) {
          return latestTokens.accessToken;
        }
        throw refreshError;
      }
      if (isInvalidRefreshToken(refreshError)) {
        await clearStoredTokens();
        setUnauthenticated("Your session expired. Sign in to continue.");
      }
      throw refreshError;
    } finally {
      if (refreshPromiseRef.current === refreshPromise) {
        refreshPromiseRef.current = null;
      }
    }
  }, [setAuthenticated, setUnauthenticated, user]);

  const signOut = useCallback(async () => {
    await clearStoredTokens();
    setUnauthenticated();
  }, [setUnauthenticated]);

  const value: SessionContextValue = {
    status,
    user,
    error,
    isSigningIn,
    signIn,
    getAccessToken,
    retrySessionRestore: restoreSession,
    signOut,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("useSession must be used within a SessionProvider.");
  }
  return value;
}
