import { StyleSheet, Text, View } from "react-native";
import { theme } from "../../constants/theme";

type Props = {
    size?: number;
    color?: string;
    showText?: boolean;
    textSize?: number;
    textColor?: string;
    badge?: string;
};

export default function CloudenceLogo({
    size = 36,
    showText = false,
    textSize = 19,
    textColor = theme.colors.text,
    badge,
}: Props) {
    return (
        <View style={styles.container}>
            {showText && (
                <View style={styles.textContainer}>
                    <View style={styles.titleRow}>
                        <Text
                            style={[
                                styles.title,
                                { fontSize: textSize, color: textColor },
                            ]}
                        >
                            Cloudence
                        </Text>
                        {badge && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{badge}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.subtitle}>Cloud Workspace</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    textContainer: {
        justifyContent: "center",
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    title: {
        fontWeight: "800",
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 11,
        color: theme.colors.secondaryText,
        fontWeight: "500",
        marginTop: 0.5,
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        backgroundColor: theme.colors.brandLight,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: "800",
        color: theme.colors.brandDark,
        letterSpacing: 0.4,
    },
});
