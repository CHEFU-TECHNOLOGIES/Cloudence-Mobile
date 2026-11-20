import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Rect } from "react-native-svg";
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
    color = theme.colors.brand,
    showText = false,
    textSize = 19,
    textColor = theme.colors.text,
    badge,
}: Props) {
    const height = size;
    const width = (size * 83) / 82;

    return (
        <View style={styles.container}>
            <Svg width={width} height={height} viewBox="0 0 83 82" fill="none">
                <Rect
                    opacity={0.25}
                    width={74.8323}
                    height={74.8323}
                    rx={37.4161}
                    fill={color}
                />
                <Rect
                    x={32.7383}
                    y={31.1797}
                    width={49.8882}
                    height={49.8882}
                    rx={24.9441}
                    fill={color}
                />
            </Svg>

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
