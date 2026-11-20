import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../../constants/theme";
import { FileCategory } from "../../types/file";
import { convertFileSize } from "../../utils/fileUtils";


type Props = {
    category: FileCategory;
    count: number;
    sizeBytes: number;
    width?: number;
    onPress?: () => void;
};

export default function CategoryCard({
    category,
    count,
    sizeBytes,
    width,
    onPress,
}: Props) {

    return (
        <Pressable
            accessibilityRole="button"
            onPress={onPress}
            style={({ pressed }) => [
                styles.card,
                width !== undefined && { width },
                pressed && styles.pressed,
            ]}
        >
            <Text style={styles.title}>{category}</Text>
            <Text style={styles.countText}>
                {count} {count === 1 ? "file" : "files"}
            </Text>

            <View style={styles.bottomRow}>
                <Text style={styles.sizeText}>
                    Using {convertFileSize(sizeBytes)}
                </Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
        padding: 12,
        minHeight: 108,
        shadowColor: "#263C40",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 1,
    },
    pressed: {
        opacity: 0.88,
        transform: [{ scale: 0.98 }],
    },

    title: {
        fontSize: 15,
        fontWeight: "700",
        color: theme.colors.text,
        letterSpacing: -0.25,
    },
    countText: {
        fontSize: 11,
        color: theme.colors.secondaryText,
        marginTop: 3,
    },
    bottomRow: {
        flexGrow: 1,
        justifyContent: "flex-end",
        marginTop: 8,
        paddingTop: 6,
    },
    sizeText: {
        fontSize: 10,
        color: theme.colors.secondaryText,
        fontWeight: "600",
    },
});
