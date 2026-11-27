import { StyleSheet } from "react-native";
import { theme } from "../../../constants/theme";

export const subscriptionSheetStyles = StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.background },
    content: { flex: 1, width: "100%", maxWidth: 640, alignSelf: "center" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 12,
    },
    title: { flex: 1, fontSize: 22, fontWeight: "800", color: theme.colors.text },
    close: { minHeight: 44, justifyContent: "center", paddingHorizontal: 12 },
    closeText: { fontSize: 15, fontWeight: "700", color: theme.colors.brand },
    plans: { padding: 20, paddingTop: 8 },
});
