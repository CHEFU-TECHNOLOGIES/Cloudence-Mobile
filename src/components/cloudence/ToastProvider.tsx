import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../constants/theme";

export type ToastVariant = "success" | "error" | "info";

type ToastOptions = {
    title: string;
    message?: string;
    variant?: ToastVariant;
};

type ToastContextValue = {
    showToast: (options: ToastOptions) => void;
};

type ToastState = ToastOptions & { id: number };

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within ToastProvider");
    }
    return context;
}

export function ToastProvider({ children }: React.PropsWithChildren) {
    const [toast, setToast] = useState<ToastState | null>(null);
    const nextId = useRef(0);
    const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const insets = useSafeAreaInsets();

    const showToast = useCallback((options: ToastOptions) => {
        if (timeout.current) clearTimeout(timeout.current);
        const id = ++nextId.current;
        setToast({ ...options, id });
        timeout.current = setTimeout(() => setToast(null), 3200);
    }, []);

    useEffect(
        () => () => {
            if (timeout.current) clearTimeout(timeout.current);
        },
        [],
    );

    const variant = toast?.variant ?? "info";

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Modal
                visible={Boolean(toast)}
                transparent
                statusBarTranslucent
                animationType="fade"
                presentationStyle="overFullScreen"
                onRequestClose={() => setToast(null)}
            >
                {toast && (
                    <View pointerEvents="none" style={styles.modalFill}>
                        <View
                            key={toast.id}
                            accessibilityRole={
                                variant === "error" ? "alert" : "summary"
                            }
                            accessibilityLiveRegion="polite"
                            style={[
                                styles.position,
                                { top: Math.max(insets.top, 12) + 8 },
                            ]}
                        >
                            <View
                                style={[
                                    styles.toast,
                                    styles[`${variant}Toast`],
                                ]}
                            >
                                <View
                                    style={[
                                        styles.accent,
                                        styles[`${variant}Accent`],
                                    ]}
                                />
                                <View style={styles.copy}>
                                    <Text style={styles.title}>
                                        {toast.title}
                                    </Text>
                                    {toast.message ? (
                                        <Text style={styles.message}>
                                            {toast.message}
                                        </Text>
                                    ) : null}
                                </View>
                            </View>
                        </View>
                    </View>
                )}
            </Modal>
        </ToastContext.Provider>
    );
}

const styles = StyleSheet.create({
    modalFill: { flex: 1 },
    position: {
        position: "absolute",
        left: 16,
        right: 16,
        alignItems: "center",
        zIndex: 1000,
        elevation: 20,
    },
    toast: {
        width: "100%",
        maxWidth: 520,
        minHeight: 58,
        flexDirection: "row",
        alignItems: "stretch",
        overflow: "hidden",
        borderRadius: 16,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: "#172B4D",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.14,
        shadowRadius: 16,
        elevation: 8,
    },
    successToast: { borderColor: "#B7E8D3" },
    errorToast: { borderColor: "#FECACA" },
    infoToast: { borderColor: theme.colors.border },
    accent: { width: 4 },
    successAccent: { backgroundColor: theme.colors.success },
    errorAccent: { backgroundColor: theme.colors.error },
    infoAccent: { backgroundColor: theme.colors.brand },
    copy: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 14,
        paddingVertical: 11,
    },
    title: { color: theme.colors.text, fontSize: 14, fontWeight: "700" },
    message: {
        color: theme.colors.secondaryText,
        fontSize: 12,
        lineHeight: 17,
        marginTop: 2,
    },
});
