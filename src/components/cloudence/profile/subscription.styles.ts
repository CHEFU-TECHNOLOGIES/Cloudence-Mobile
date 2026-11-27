import { StyleSheet } from "react-native";
import { theme } from "../../../constants/theme";

const card = {
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
};

export const subscriptionStyles = StyleSheet.create({
    summaryCard: { ...card, flexDirection: "row", alignItems: "center", gap: 12 },
    summaryText: { flex: 1, gap: 2 },
    hero: { alignItems: "center", paddingTop: 12, paddingBottom: 28, gap: 8 },
    proMark: { width: 52, height: 52, borderRadius: 26, backgroundColor: theme.colors.brandLight, alignItems: "center", justifyContent: "center", marginBottom: 4 },
    proMarkText: { color: theme.colors.brand, fontSize: 13, fontWeight: "800", letterSpacing: 1 },
    heroTitle: { color: theme.colors.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.6 },
    heroSubtitle: { color: theme.colors.secondaryText, fontSize: 12 },
    planCard: { padding: 20, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.brandSurface, borderRadius: 20 },
    benefitList: { paddingTop: 12, gap: 14 },
    benefitRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    benefitText: { flex: 1, color: theme.colors.secondaryText, fontSize: 12, lineHeight: 18 },
    planActions: { gap: 10, paddingBottom: 12 },
    pressed: { opacity: 0.7 },
    disabled: { opacity: 0.6 },
    secondaryText: { color: theme.colors.secondaryText, fontSize: 12 },
    billingNote: { color: theme.colors.secondaryText, fontSize: 11, lineHeight: 16, textAlign: "center" },
    button: {
        alignItems: "center", justifyContent: "center", minHeight: 54,
        paddingHorizontal: 18, paddingVertical: 14, borderRadius: 16, backgroundColor: theme.colors.brand,
    },
    buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700", textAlign: "center" },
    restoreButton: { alignItems: "center", paddingVertical: 8 },
    restoreText: { color: theme.colors.brand, fontSize: 12, fontWeight: "700" },
});
