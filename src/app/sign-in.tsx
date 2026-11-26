import React from "react";
import {
    Pressable,
    ActivityIndicator,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CloudenceLogo from "../components/cloudence/CloudenceLogo";
import { theme } from "../constants/theme";
import { useSession } from "../auth/SessionContext";
import { useToast } from "../components/cloudence/ToastProvider";

export default function SignInScreen() {
    const { width, height } = useWindowDimensions();
    const compact = height < 740 || width < 360;
    const { showToast } = useToast();
    const { error, isSigningIn, retrySessionRestore, signIn, status } =
        useSession();

    const handleSignIn = async (mode: "login" | "register" = "login") => {
        try {
            await signIn(mode);
        } catch (signInError) {
            showToast({
                title: mode === "register" ? "Sign-up failed" : "Sign-in failed",
                message:
                    signInError instanceof Error
                        ? signInError.message
                        : "Unable to sign in. Please try again.",
                variant: "error",
            });
        }
    };

    const handleRetryRestore = async () => {
        try {
            await retrySessionRestore();
        } catch (restoreError) {
            showToast({
                title: "Could not restore session",
                message:
                    restoreError instanceof Error
                        ? restoreError.message
                        : "Please try again in a moment.",
                variant: "error",
            });
        }
    };

    return (
        <SafeAreaView
            style={styles.root}
            edges={["top", "bottom", "left", "right"]}
        >
            <StatusBar barStyle="dark-content" />
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View
                    style={[styles.content, compact && styles.compactContent]}
                >
                    <View style={styles.brand}>
                        <CloudenceLogo
                            showText
                            textSize={24}
                            textColor="#163D39"
                        />
                    </View>

                    <View style={[styles.hero, compact && styles.compactHero]}>
                        <Text
                            accessibilityRole="header"
                            style={[
                                styles.title,
                                compact && styles.compactTitle,
                            ]}
                        >
                            Everything.{"\n"}
                            <Text style={styles.titleAccent}>
                                In one place.
                            </Text>
                        </Text>
                        <Text style={styles.description}>
                            Your files and workspace, together.
                        </Text>
                    </View>

                    <View style={styles.signInSection}>
                        {error && (
                            <View style={styles.errorBox}>
                                <Text
                                    accessibilityLiveRegion="polite"
                                    style={styles.errorText}
                                >
                                    {error}
                                </Text>
                                {status === "error" && (
                                    <Pressable
                                        onPress={() =>
                                            void handleRetryRestore()
                                        }
                                        accessibilityRole="button"
                                        hitSlop={12}
                                        style={styles.retryButton}
                                    >
                                        <Text style={styles.retryText}>
                                            Retry
                                        </Text>
                                    </Pressable>
                                )}
                            </View>
                        )}

                        <Pressable
                            accessibilityRole="button"
                            accessibilityHint="Opens account sign-up"
                            accessibilityLabel={
                                isSigningIn
                                    ? "Signing in"
                                    : "Continue with your account"
                            }
                            accessibilityState={{
                                disabled: isSigningIn,
                                busy: isSigningIn,
                            }}
                            disabled={isSigningIn}
                            onPress={() => void handleSignIn("register")}
                            style={({ pressed }) => [
                                styles.signInButton,
                                isSigningIn && styles.disabledButton,
                                pressed && styles.pressedButton,
                            ]}
                        >
                            {isSigningIn && (
                                <ActivityIndicator color="#FFFFFF" />
                            )}
                            <Text style={styles.signInText}>
                                {isSigningIn
                                    ? "Signing you in…"
                                    : "Continue with your account"}
                            </Text>
                        </Pressable>

                        <Pressable
                            accessibilityRole="link"
                            accessibilityLabel="Already have an account? Sign in"
                            accessibilityState={{ disabled: isSigningIn }}
                            disabled={isSigningIn}
                            onPress={() => void handleSignIn()}
                            style={({ pressed }) => [
                                styles.accountLink,
                                (pressed || isSigningIn) &&
                                    styles.disabledButton,
                            ]}
                        >
                            <Text style={styles.accountPrompt}>
                                Already have an account?{" "}
                                <Text style={styles.accountLinkText}>
                                    Sign in
                                </Text>
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#F8F7F2",
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: "center",
    },
    content: {
        flexGrow: 1,
        width: "100%",
        maxWidth: 560,
        paddingHorizontal: 28,
        paddingTop: 24,
        paddingBottom: 24,
    },
    compactContent: {
        paddingHorizontal: 22,
        paddingTop: 16,
    },
    brand: {
        alignItems: "flex-start",
    },
    hero: {
        flexGrow: 1,
        justifyContent: "center",
        paddingVertical: 48,
    },
    compactHero: {
        paddingVertical: 32,
    },
    title: {
        color: "#163D39",
        fontSize: 54,
        lineHeight: 58,
        fontWeight: "600",
        letterSpacing: -2.4,
    },
    compactTitle: {
        fontSize: 44,
        lineHeight: 48,
        letterSpacing: -1.8,
    },
    titleAccent: {
        color: theme.colors.brand,
    },
    description: {
        color: "#62716B",
        fontSize: 15,
        lineHeight: 24,
        maxWidth: 330,
        marginTop: 24,
    },
    signInSection: {
        paddingTop: 24,
        paddingBottom: 16,
    },
    accountPrompt: {
        color: "#62716B",
        fontSize: 13,
        lineHeight: 20,
        textAlign: "center",
    },
    accountLink: {
        minHeight: 44,
        justifyContent: "center",
    },
    accountLinkText: {
        color: theme.colors.brandDark,
        fontWeight: "700",
        textDecorationLine: "underline",
    },
    signInButton: {
        minHeight: 58,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 16,
        backgroundColor: "#006F6B",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
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
        fontSize: 15,
        fontWeight: "700",
        textAlign: "center",
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
    },
    retryButton: {
        minHeight: 44,
        justifyContent: "center",
        alignSelf: "flex-start",
    },
});
