import React, { useRef } from "react";
import {
  Pressable,
  View,
  Text,
  StyleSheet,
} from "react-native";
import { MoreHorizontal } from "lucide-react-native";
import { CloudFile } from "../../types/file";
import { theme } from "../../constants/theme";
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
    isLast?: boolean;
};

export default function FileRow({
    file,
    onPress,
    onMore,
    onLongPress,
    onToggleSelection,
    selectionMode = false,
    selected = false,
    isLast = false,
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
                styles.container,
                isLast && styles.noBorder,
                pressed && { backgroundColor: theme.colors.surfaceSubtle },
                selected && styles.selectedContainer,
            ]}
        >
            <FileThumbnail file={file} style={styles.thumbnail} />

            {/* Main Info */}
            <View style={styles.centerDetails}>
                <Text numberOfLines={1} style={styles.fileName}>
                    {file.name}
                </Text>
                <View style={styles.metaRow}>
                    <Text style={styles.dateText}>
                        {formatDateTime(file.createdAt)}
                    </Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.sizeText}>
                        {convertFileSize(file.size)}
                    </Text>
                    <Text style={styles.dot}>•</Text>
                    <View style={styles.ownerRow}>
                        <View style={styles.ownerAvatar}>
                            <Text style={styles.ownerAvatarText}>
                                {ownerInitial}
                            </Text>
                        </View>
                        <Text numberOfLines={1} style={styles.ownerName}>
                            {file.owner.fullName.split(" ")[0]}
                        </Text>
                    </View>
                </View>
            </View>

            {/* More actions */}
            {selectionMode ? (
                <FileSelectionCheckbox
                    selected={selected}
                    fileName={file.name}
                    onPress={() => onToggleSelection?.(file)}
                />
            ) : <Pressable
                hitSlop={10}
                onPress={(e) => {
                    e.stopPropagation();
                    onMore?.(file);
                }}
                accessibilityLabel={`Actions for ${file.name}`}
                style={styles.moreButton}
            >
                <MoreHorizontal size={20} color={theme.colors.secondaryText} />
            </Pressable>}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderSubtle,
        gap: 12,
    },
    noBorder: {
        borderBottomWidth: 0,
    },
    selectedContainer: {
        backgroundColor: theme.colors.brandLight,
        marginHorizontal: -16,
        paddingHorizontal: 16,
        borderRadius: theme.radius.md,
    },
    thumbnail: {
        width: 44,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
    },
    centerDetails: {
        flex: 1,
        minWidth: 0,
        gap: 3,
    },
    fileName: {
        fontSize: 13.5,
        fontWeight: "700",
        color: theme.colors.text,
        letterSpacing: -0.2,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "nowrap",
        gap: 4,
    },
    dateText: {
        fontSize: 11,
        color: theme.colors.secondaryText,
    },
    dot: {
        fontSize: 10,
        color: theme.colors.mutedText,
    },
    sizeText: {
        fontSize: 11,
        fontWeight: "600",
        color: theme.colors.secondaryText,
    },
    ownerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
    },
    ownerAvatar: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: theme.colors.brandLight,
        alignItems: "center",
        justifyContent: "center",
    },
    ownerAvatarText: {
        fontSize: 8,
        fontWeight: "800",
        color: theme.colors.brandDark,
    },
    ownerName: {
        fontSize: 10.5,
        color: theme.colors.secondaryText,
        maxWidth: 60,
    },
    moreButton: {
        padding: 6,
        borderRadius: theme.radius.sm,
    },
});
