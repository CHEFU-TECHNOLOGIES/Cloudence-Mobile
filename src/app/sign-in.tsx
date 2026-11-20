import React, { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from "react-native";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowRight, ShieldCheck } from "lucide-react-native";
import CloudenceLogo from "../components/cloudence/CloudenceLogo";
import { theme } from "../constants/theme";
import {
    OAUTH_CLIENT_ID,
    OAUTH_DISCOVERY,
    OAUTH_REDIRECT_URI,
} from "../lib/api/config";
import { useSession } from "../auth/SessionContext";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
    const { width } = useWindowDimensions();
    const {
        completeSignIn,
        error: sessionError,
        retrySessionRestore,
    } = useSession();
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [request, , promptAsync] = AuthSession.useAuthRequest(
        {
            clientId: OAUTH_CLIENT_ID,
            redirectUri: OAUTH_REDIRECT_URI,
            responseType: AuthSession.ResponseType.Code,
            scopes: ["openid", "profile", "email"],
            prompt: AuthSession.Prompt.SelectAccount,
            usePKCE: true,
            codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
        },
        OAUTH_DISCOVERY,
    );

    const handleSignIn = async () => {
        if (!request) return;
        setError(null);
        setIsSigningIn(true);

        try {
            const result = await promptAsync();
            if (result.type === "error") {
                throw new Error(
                    result.error?.description ??
                        result.params.error_description ??
                        "The account sign-in could not be completed.",
                );
            }
            if (result.type !== "success") return;

            const code = result.params.code;
            if (!code || !request.codeVerifier) {
                throw new Error("The account sign-in response was incomplete.");
            }

            const tokens = await AuthSession.exchangeCodeAsync(
                {
                    clientId: OAUTH_CLIENT_ID,
                    code,
                    redirectUri: OAUTH_REDIRECT_URI,
                    extraParams: { code_verifier: request.codeVerifier },
                },
                OAUTH_DISCOVERY,
            );
            await completeSignIn(tokens);
        } catch (signInError) {
            setError(
                signInError instanceof Error
                    ? signInError.message
                    : "Unable to sign in. Please try again.",
            );
        } finally {
            setIsSigningIn(false);
        }
    };

    return (
        <SafeAreaView
            style={styles.root}
            edges={["top", "bottom", "left", "right"]}
        >
            <StatusBar barStyle="dark-content" />
            <View
                style={[
                    styles.content,
                    {
                        maxWidth: width >= 600 ? 480 : undefined,
                        paddingHorizontal: width < 360 ? 16 : 24,
                    },
                ]}
            >
                <View style={styles.brand}>
                    <CloudenceLogo size={48} showText textSize={23} />
                </View>
                <Text style={styles.title}>Everything in its right place.</Text>
                <Text style={styles.description}>
                    Sign in with your account to access your Cloudence
                    files and workspace.
                </Text>

                {(error || sessionError) && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>
                            {error || sessionError}
                        </Text>
                        {sessionError && (
                            <Pressable
                                onPress={() => void retrySessionRestore()}
                                accessibilityRole="button"
                            >
                                <Text style={styles.retryText}>Retry</Text>
                            </Pressable>
                        )}
                    </View>
                )}

                <Pressable
                    disabled={!request || isSigningIn}
                    onPress={() => void handleSignIn()}
                    style={({ pressed }) => [
                        styles.signInButton,
                        (!request || isSigningIn) && styles.disabledButton,
                        pressed && styles.pressedButton,
                    ]}
                >
                    {isSigningIn ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <Text style={styles.signInText}>
                                Continue with your account
                            </Text>
                            <ArrowRight size={18} color="#FFFFFF" />
                        </>
                    )}
                </Pressable>

                <View style={styles.securityNote}>
                    <ShieldCheck size={17} color={theme.colors.brand} />
                    <Text style={styles.securityText}>
                        Secure sign-in powered by our SSO
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.background,
    },
    content: {
        width: "100%",
        alignSelf: "center",
        paddingVertical: 36,
    },
    brand: {
        alignItems: "flex-start",
        marginBottom: 52,
    },
    eyebrow: {
        color: theme.colors.brand,
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    title: {
        color: "#17383B",
        fontSize: 34,
        lineHeight: 39,
        fontWeight: "800",
        letterSpacing: -1,
    },
    description: {
        color: theme.colors.secondaryText,
        fontSize: 15,
        lineHeight: 23,
        marginTop: 16,
        marginBottom: 28,
    },
    signInButton: {
        minHeight: 52,
        paddingHorizontal: 18,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.brand,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    disabledButton: {
        opacity: 0.6,
    },
    pressedButton: {
        opacity: 0.88,
    },
    signInText: {
        flexShrink: 1,
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "700",
    },
    securityNote: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        marginTop: 22,
    },
    securityText: {
        color: theme.colors.secondaryText,
        fontSize: 12,
        fontWeight: "600",
    },
    errorBox: {
        padding: 14,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: "#FECACA",
        backgroundColor: "#FEF2F2",
        marginBottom: 16,
    },
    errorText: {
        color: theme.colors.error,
        fontSize: 13,
        lineHeight: 19,
    },
    retryText: {
        color: theme.colors.brandDark,
        fontWeight: "700",
        marginTop: 8,
    },
});
