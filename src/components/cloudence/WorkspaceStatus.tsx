import React from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { RefreshCw } from "lucide-react-native";
import { theme } from "../../constants/theme";

type Props = {
    loading: boolean;
    error: string | null;
    offline?: boolean;
    onRetry: () => void | Promise<unknown>;
};

export default function WorkspaceStatus({
    loading,
    error,
    offline = false,
    onRetry,
}: Props) {
    if (!loading && !error && !offline) return null;

    return (
        <View
            style={[
                styles.container,
                error && !offline ? styles.errorContainer : undefined,
            ]}
            accessibilityRole={error && !offline ? "alert" : "summary"}
        >
            {loading && !offline && (
                <ActivityIndicator size="small" color={theme.colors.brand} />
            )}
            <Text style={styles.message}>
                {offline
                    ? "You're offline. Previously cached file metadata is available when present; opening, uploading, and changing files requires a connection."
                    : (error ?? "Loading your Cloudence workspace…")}
            </Text>
            {error && !offline && (
                <Pressable
                    onPress={() => void onRetry()}
                    accessibilityRole="button"
                    accessibilityLabel="Retry loading workspace"
                    style={({ pressed }) => [
                        styles.retryButton,
                        pressed && { opacity: 0.7 },
                    ]}
                >
                    <RefreshCw size={15} color={theme.colors.brand} />
                    <Text style={styles.retryText}>Retry</Text>
                </Pressable>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 14,
        marginBottom: 16,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    errorContainer: {
        alignItems: "flex-start",
        borderColor: "#FECACA",
        backgroundColor: "#FEF2F2",
        flexWrap: "wrap",
    },
    message: {
        flex: 1,
        flexShrink: 1,
        color: theme.colors.secondaryText,
        fontSize: 12,
        lineHeight: 18,
    },
    retryButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingVertical: 4,
    },
    retryText: {
        color: theme.colors.brand,
        fontSize: 12,
        fontWeight: "700",
    },
});
