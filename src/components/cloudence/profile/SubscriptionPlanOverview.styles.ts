import { StyleSheet } from "react-native";
import { theme } from "../../../constants/theme";

export const planOverviewStyles = StyleSheet.create({
    planHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
    planName: { fontSize: 16, fontWeight: "700", color: theme.colors.brandDark },
    badge: { backgroundColor: theme.colors.brandLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
    badgeText: { fontSize: 11, fontWeight: "700", color: theme.colors.brandDark },
    price: { fontSize: 40, fontWeight: "800", letterSpacing: -1.2, color: theme.colors.text, marginTop: 26, marginBottom: 24 },
    period: { fontSize: 13, fontWeight: "500", color: theme.colors.secondaryText },
    expiry: { fontSize: 12, color: theme.colors.brandDark, marginTop: 14 },
});
