import React from "react";
import {
    View,
    Text,
    StyleSheet,
    useWindowDimensions,
} from "react-native";
import Svg, { Circle, G, Defs, LinearGradient, Stop } from "react-native-svg";
import { HardDrive, ShieldCheck } from "lucide-react-native";
import { theme } from "../../constants/theme";
import { convertFileSize } from "../../utils/fileUtils";

type Props = {
    usedBytes?: number;
    totalBytes?: number;
};

export default function StorageChartCard({
    usedBytes = 598.5 * 1024 * 1024,
    totalBytes = 2 * 1024 * 1024 * 1024,
}: Props) {
    const { width: screenWidth } = useWindowDimensions();
    const percentage =
        totalBytes > 0
            ? Math.min(
                  Math.max(
                      Number(((usedBytes / totalBytes) * 100).toFixed(1)),
                      0,
                  ),
                  100,
              )
            : 0;

    // Responsive SVG Gauge dimensions
    const isSmallScreen = screenWidth < 380;
    const size = isSmallScreen ? 108 : 122;
    const strokeWidth = isSmallScreen ? 9 : 10.5;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (circumference * percentage) / 100;

    return (
        <View style={styles.card}>
            {/* Subtle decorative background circle */}
            <View style={styles.ambientGlow} />

            <View style={styles.row}>
                {/* Radial SVG Gauge Chart */}
                <View
                    style={[
                        styles.gaugeContainer,
                        { width: size, height: size },
                    ]}
                >
                    <Svg width={size} height={size}>
                        <Defs>
                            <LinearGradient
                                id="gaugeGradient"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                            >
                                <Stop offset="0%" stopColor="#FFFFFF" />
                                <Stop offset="100%" stopColor="#E0F7F7" />
                            </LinearGradient>
                        </Defs>

                        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
                            {/* Background Track */}
                            <Circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke="rgba(255, 255, 255, 0.2)"
                                strokeWidth={strokeWidth}
                                fill="none"
                            />
                            {/* Progress Arc */}
                            <Circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke="url(#gaugeGradient)"
                                strokeWidth={strokeWidth}
                                strokeDasharray={`${circumference} ${circumference}`}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                fill="none"
                            />
                        </G>
                    </Svg>

                    <View style={styles.gaugeTextContainer}>
                        <Text
                            style={[
                                styles.percentageText,
                                isSmallScreen && { fontSize: 19 },
                            ]}
                        >
                            {percentage}%
                        </Text>
                        <Text style={styles.spaceUsedText}>Space used</Text>
                    </View>
                </View>

                {/* Storage Details */}
                <View style={styles.detailsContainer}>
                    <View style={styles.titleRow}>
                        <HardDrive
                            size={15}
                            color="rgba(255, 255, 255, 0.95)"
                        />
                        <Text style={styles.title}>Available Storage</Text>
                    </View>

                    <View style={styles.numbersRow}>
                        <Text
                            style={[
                                styles.usedAmount,
                                isSmallScreen && { fontSize: 19 },
                            ]}
                        >
                            {convertFileSize(usedBytes)}
                        </Text>
                        <Text style={styles.totalAmount}>
                            {" "}
                            / {convertFileSize(totalBytes)}
                        </Text>
                    </View>

                    <View style={styles.featureBadge}>
                        <ShieldCheck size={12} color="#FFFFFF" />
                        <Text style={styles.featureText}>
                            Max 50MB per file
                        </Text>
                    </View>

                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.brand,
        borderRadius: theme.radius.xl,
        padding: 18,
        shadowColor: theme.colors.brand,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 14,
        elevation: 4,
        position: "relative",
        overflow: "hidden",
    },
    ambientGlow: {
        position: "absolute",
        top: -40,
        right: -40,
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    gaugeContainer: {
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    gaugeTextContainer: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
    },
    percentageText: {
        fontSize: 22,
        fontWeight: "800",
        color: "#FFFFFF",
        letterSpacing: -0.5,
    },
    spaceUsedText: {
        fontSize: 9.5,
        fontWeight: "700",
        color: "rgba(255, 255, 255, 0.78)",
        marginTop: 1,
        letterSpacing: 0.2,
    },
    detailsContainer: {
        flex: 1,
        justifyContent: "center",
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 4,
    },
    title: {
        fontSize: 13,
        fontWeight: "700",
        color: "rgba(255, 255, 255, 0.95)",
        letterSpacing: -0.2,
    },
    numbersRow: {
        flexDirection: "row",
        alignItems: "baseline",
        flexWrap: "wrap",
        marginBottom: 6,
    },
    usedAmount: {
        fontSize: 22,
        fontWeight: "800",
        color: "#FFFFFF",
        letterSpacing: -0.6,
    },
    totalAmount: {
        fontSize: 12.5,
        fontWeight: "600",
        color: "rgba(255, 255, 255, 0.75)",
        marginLeft: 3,
    },
    featureBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: "rgba(0, 0, 0, 0.12)",
        paddingHorizontal: 8,
        paddingVertical: 3.5,
        borderRadius: 6,
        alignSelf: "flex-start",
    },
    featureText: {
        fontSize: 10,
        color: "rgba(255, 255, 255, 0.9)",
        fontWeight: "600",
    },
});
