import { MoreVertical, Users } from "lucide-react-native";
import { useRef } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { theme } from "../../constants/theme";
import { CloudFile } from "../../types/file";
import { convertFileSize, formatDateTime } from "../../utils/fileUtils";
import FileThumbnail from "./FileThumbnail";
import FileSelectionCheckbox from "./FileSelectionCheckbox";

type Props = {
    file: CloudFile;
    onPress?: (file: CloudFile) => void;
    onMore?: (file: CloudFile) => void;
    onLongPress?: (file: CloudFile) => void;
    onToggleSelection?: (file: CloudFile) => void;
    selectionMode?: boolean;
    selected?: boolean;
    width?: number | string;
};

export default function FileCard({
    file,
    onPress,
    onMore,
    onLongPress,
    onToggleSelection,
    selectionMode = false,
    selected = false,
    width,
}: Props) {
    const longPressHandled = useRef(false);
    const ownerInitial = file.owner.fullName
        ? file.owner.fullName.charAt(0).toUpperCase()
        : "U";

    return (
        <Pressable
            onPress={() => {
                if (longPressHandled.current) {
                    longPressHandled.current = false;
                    return;
                }
                if (selectionMode) onToggleSelection?.(file);
                else onPress?.(file);
            }}
            onLongPress={() => {
                longPressHandled.current = true;
                onLongPress?.(file);
            }}
            delayLongPress={450}
            style={({ pressed }) => [
                styles.card,
                width !== undefined && { width },
                selected && styles.selectedCard,
                pressed && { transform: [{ scale: 0.975 }], opacity: 0.9 },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
        >
            {/* Top Section */}
            <View style={styles.topRow}>
                <FileThumbnail file={file} style={styles.thumbnail} />

                <View style={styles.topRight}>
                    {selectionMode ? (
                        <FileSelectionCheckbox
                            selected={selected}
                            fileName={file.name}
                            onPress={() => onToggleSelection?.(file)}
                        />
                    ) : <Pressable
                        hitSlop={8}
                        onPress={(e) => {
                            e.stopPropagation();
                            onMore?.(file);
                        }}
                        accessibilityLabel={`Actions for ${file.name}`}
                        style={({ pressed }) => [
                            styles.moreButton,
                            pressed && {
                                backgroundColor: theme.colors.borderSubtle,
                            },
                        ]}
                    >
                        <MoreVertical
                            size={17}
                            color={theme.colors.secondaryText}
                        />
                    </Pressable>}
                    <Text style={styles.sizeText}>
                        {convertFileSize(file.size)}
                    </Text>
                </View>
            </View>

            {/* Title & Metadata */}
            <View style={styles.content}>
                <Text numberOfLines={1} style={styles.fileName}>
                    {file.name}
                </Text>

                <Text style={styles.dateText}>
                    {formatDateTime(file.createdAt)}
                </Text>

                <View style={styles.footerRow}>
                    <View style={styles.ownerPill}>
                        <View style={styles.ownerAvatar}>
                            <Text style={styles.ownerAvatarText}>
                                {ownerInitial}
                            </Text>
                        </View>
                        <Text numberOfLines={1} style={styles.ownerName}>
                            {file.owner.fullName.split(" ")[0]}
                        </Text>
                    </View>

                    {file.users.length > 0 && (
                        <View style={styles.sharedBadge}>
                            <Users size={10} color={theme.colors.brandDark} />
                            <Text style={styles.sharedCount}>
                                {file.users.length}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 13,
        shadowColor: "rgba(66, 71, 97, 0.05)",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 2,
    },
    selectedCard: {
        borderColor: theme.colors.brand,
        backgroundColor: theme.colors.brandLight,
    },
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 10,
    },
    thumbnail: {
        width: 48,
        height: 48,
        borderRadius: 13,
    },
    topRight: {
        alignItems: "flex-end",
        gap: 8,
    },
    moreButton: {
        padding: 4,
        borderRadius: theme.radius.sm,
    },
    sizeText: {
        fontSize: 11,
        fontWeight: "700",
        color: theme.colors.secondaryText,
    },
    content: {
        gap: 3,
    },
    fileName: {
        fontSize: 13,
        fontWeight: "800",
        color: theme.colors.text,
        letterSpacing: -0.2,
    },
    dateText: {
        fontSize: 10.5,
        color: theme.colors.secondaryText,
        marginBottom: 4,
    },
    footerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    ownerPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        maxWidth: 90,
    },
    ownerAvatar: {
        width: 17,
        height: 17,
        borderRadius: 8.5,
        backgroundColor: theme.colors.brandLight,
        alignItems: "center",
        justifyContent: "center",
    },
    ownerAvatarText: {
        fontSize: 8.5,
        fontWeight: "800",
        color: theme.colors.brandDark,
    },
    ownerName: {
        fontSize: 10,
        color: theme.colors.secondaryText,
        fontWeight: "600",
    },
    sharedBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        backgroundColor: theme.colors.brandLight,
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 5,
    },
    sharedCount: {
        fontSize: 9.5,
        fontWeight: "800",
        color: theme.colors.brandDark,
    },
});
