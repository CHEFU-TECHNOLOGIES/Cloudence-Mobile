export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL || "https://api.chefu.co.za"
).replace(/\/$/, "");

export const CHEFU_APP_ID = "cloudence";
export const OAUTH_CLIENT_ID = "cloudence-mobile";
export const OAUTH_REDIRECT_URI = "cloudence://sso-callback";
export const OAUTH_DISCOVERY = {
  authorizationEndpoint: `${API_BASE_URL}/oauth/authorize`,
  tokenEndpoint: `${API_BASE_URL}/oauth/token`,
};
