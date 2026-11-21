import { FolderInput, Trash2, X } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../../constants/theme";

type Props = {
  count: number;
  canMove: boolean;
  onMove: () => void;
  onDelete: () => void;
  onCancel: () => void;
};

export default function BulkFileActionBar({
  count,
  canMove,
  onMove,
  onDelete,
  onCancel,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.count} numberOfLines={1}>
        {count} selected
      </Text>
      <View style={styles.actions}>
        {canMove && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Move selected files to a folder"
            onPress={onMove}
            style={styles.moveButton}
          >
            <FolderInput size={15} color={theme.colors.brandDark} />
            <Text style={styles.moveText}>Move</Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete selected files"
          onPress={onDelete}
          style={styles.deleteButton}
        >
          <Trash2 size={15} color={theme.colors.error} />
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel file selection"
          onPress={onCancel}
          hitSlop={8}
          style={styles.cancelButton}
        >
          <X size={17} color={theme.colors.secondaryText} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 8,
    zIndex: 20,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 0,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  count: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.text,
    fontSize: 12.5,
    fontWeight: "800",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  moveButton: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 10,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brandLight,
  },
  moveText: {
    color: theme.colors.brandDark,
    fontSize: 12,
    fontWeight: "700",
  },
  deleteButton: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 10,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.errorBg,
  },
  deleteText: {
    color: theme.colors.error,
    fontSize: 12,
    fontWeight: "700",
  },
  cancelButton: {
    width: 32,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.full,
  },
});
