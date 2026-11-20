import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import * as AuthSession from "expo-auth-session";
import {
  ApiError,
  apiRequest,
} from "../lib/api/client";
import {
  clearStoredTokens,
  readStoredTokens,
  refreshStoredTokens,
  saveStoredTokens,
  StoredTokens,
  tokenNeedsRefresh,
  toStoredTokens,
} from "../lib/auth/tokens";

export type CloudenceUser = {
  id: string;
  fullName?: string;
  email?: string;
  avatar?: string;
};

type SessionStatus = "loading" | "authenticated" | "unauthenticated" | "error";

type SessionContextValue = {
  status: SessionStatus;
  user: CloudenceUser | null;
  error: string | null;
  completeSignIn: (response: AuthSession.TokenResponse) => Promise<void>;
  getAccessToken: () => Promise<string>;
  retrySessionRestore: () => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

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

  if (
    typeof id !== "string" ||
    (fullName !== undefined && typeof fullName !== "string") ||
    (email !== undefined && typeof email !== "string") ||
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
  return (
    error instanceof AuthSession.TokenError &&
    error.code === "invalid_grant"
  );
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUser] = useState<CloudenceUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tokensRef = useRef<StoredTokens | null>(null);
  const refreshPromiseRef = useRef<Promise<StoredTokens> | null>(null);

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
    setStatus("loading");
    setError(null);

    const storedTokens = await readStoredTokens();
    if (!storedTokens) {
      setUnauthenticated();
      return;
    }

    tokensRef.current = storedTokens;
    let activeTokens = storedTokens;
    if (tokenNeedsRefresh(storedTokens)) {
      if (!storedTokens.refreshToken) {
        await clearStoredTokens();
        setUnauthenticated("Your session expired. Sign in to continue.");
        return;
      }

      try {
        activeTokens = await refreshStoredTokens(
          storedTokens.refreshToken,
          storedTokens,
        );
        await saveStoredTokens(activeTokens);
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
      setAuthenticated(activeTokens, currentUser);
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
    void restoreSession().catch((restoreError: unknown) => {
      setError(getErrorMessage(restoreError));
      setStatus("error");
    });
  }, [restoreSession]);

  const completeSignIn = useCallback(
    async (response: AuthSession.TokenResponse) => {
      const nextTokens = toStoredTokens(response);
      await saveStoredTokens(nextTokens);
      tokensRef.current = nextTokens;

      try {
        const currentUser = await loadCurrentUser(nextTokens.accessToken);
        setAuthenticated(nextTokens, currentUser);
      } catch (signInError) {
        if (signInError instanceof ApiError && signInError.status === 401) {
          await clearStoredTokens();
          setUnauthenticated("The sign-in token was rejected. Please try again.");
        }
        throw signInError;
      }
    },
    [setAuthenticated, setUnauthenticated],
  );

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
        await saveStoredTokens(refreshed);
        const currentUser = user ?? (await loadCurrentUser(refreshed.accessToken));
        setAuthenticated(refreshed, currentUser);
        return refreshed;
      })();
      refreshPromiseRef.current = refreshPromise;
    }

    try {
      return (await refreshPromise).accessToken;
    } catch (refreshError) {
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
    completeSignIn,
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
