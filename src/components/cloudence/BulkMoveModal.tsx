import { Modal, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { theme } from "../../constants/theme";
import { CloudenceFolder } from "../../lib/api/folders";

type Props = {
  visible: boolean;
  count: number;
  folders: CloudenceFolder[];
  currentFolderId: string | null;
  onClose: () => void;
  onSelect: (folderId: string | null) => void;
};

export default function BulkMoveModal({
  visible,
  count,
  folders,
  currentFolderId,
  onClose,
  onSelect,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={styles.dialog}
          onPress={(event) => event.stopPropagation()}
        >
          <Text style={styles.title}>Move {count} {count === 1 ? "file" : "files"}</Text>
          <Text style={styles.description}>Choose a destination folder.</Text>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {folders
              .filter((folder) => folder.id !== currentFolderId)
              .map((folder) => (
                <Pressable
                  key={folder.id}
                  style={styles.option}
                  onPress={() => onSelect(folder.id)}
                >
                  <Text numberOfLines={1} style={styles.optionText}>
                    {folder.name}
                  </Text>
                </Pressable>
              ))}
            {currentFolderId && (
              <Pressable style={styles.option} onPress={() => onSelect(null)}>
                <Text style={styles.optionText}>Move to section root</Text>
              </Pressable>
            )}
            {!folders.length && !currentFolderId && (
              <Text style={styles.empty}>Create a folder first to move files.</Text>
            )}
          </ScrollView>
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(4, 5, 12, 0.48)",
  },
  dialog: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "75%",
    alignSelf: "center",
    padding: 20,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
  },
  title: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  description: {
    color: theme.colors.secondaryText,
    fontSize: 13,
    marginTop: 5,
    marginBottom: 12,
  },
  list: {
    flexShrink: 1,
  },
  option: {
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: 13,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSubtle,
    marginTop: 7,
  },
  optionText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  empty: {
    color: theme.colors.secondaryText,
    fontSize: 13,
    lineHeight: 19,
    paddingVertical: 14,
  },
  cancelButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.full,
    marginTop: 14,
  },
  cancelText: {
    color: theme.colors.secondaryText,
    fontSize: 13,
    fontWeight: "700",
  },
});
