import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { theme } from "../../constants/theme";
import { CloudenceFolder } from "../../lib/api/folders";

type Props = {
  visible: boolean;
  folder: CloudenceFolder | null;
  onClose: () => void;
  onRename: (folder: CloudenceFolder, name: string) => void;
  onDelete: (folder: CloudenceFolder) => void;
};

type ActionView = "menu" | "rename" | "delete";

export default function FolderActionModal({
  visible,
  folder,
  onClose,
  onRename,
  onDelete,
}: Props) {
  const { height } = useWindowDimensions();
  const [view, setView] = useState<ActionView>("menu");
  const [name, setName] = useState("");
  if (!folder) return null;

  const close = () => {
    setView("menu");
    setName("");
    onClose();
  };

  const startRename = () => {
    setName(folder.name);
    setView("rename");
  };

  const submitRename = () => {
    const nextName = name.trim();
    if (!nextName || nextName === folder.name) {
      close();
      return;
    }
    onRename(folder, nextName);
    close();
  };

  const confirmDelete = () => {
    onDelete(folder);
    close();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable style={styles.backdrop} onPress={close}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
        <Pressable
          style={[styles.dialog, { maxHeight: height * 0.82 }]}
          onPress={(event) => event.stopPropagation()}
        >
          {view === "menu" && (
            <>
              <Text style={styles.title} numberOfLines={1}>
                {folder.name}
              </Text>
              <Text style={styles.description}>Folder options</Text>
              <Pressable style={styles.option} onPress={startRename}>
                <Text style={styles.optionText}>Rename folder</Text>
              </Pressable>
              <Pressable
                style={[styles.option, styles.deleteOption]}
                onPress={() => setView("delete")}
              >
                <Text style={styles.deleteText}>Delete folder</Text>
              </Pressable>
              <Pressable style={styles.cancelButton} onPress={close}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </>
          )}

          {view === "rename" && (
            <>
              <Text style={styles.title}>Rename folder</Text>
              <Text style={styles.description}>
                Choose a new name for this folder.
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Folder name"
                placeholderTextColor={theme.colors.mutedText}
                style={styles.input}
                maxLength={80}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={submitRename}
              />
              <View style={styles.actions}>
                <Pressable style={styles.cancelButton} onPress={() => setView("menu")}>
                  <Text style={styles.cancelText}>Back</Text>
                </Pressable>
                <Pressable
                  style={[styles.primaryButton, !name.trim() && styles.disabled]}
                  onPress={submitRename}
                  disabled={!name.trim()}
                >
                  <Text style={styles.primaryText}>Save name</Text>
                </Pressable>
              </View>
            </>
          )}

          {view === "delete" && (
            <>
              <Text style={styles.title}>Delete this folder?</Text>
              <Text style={styles.description}>
                Delete “{folder.name}”? Files inside it will stay in this
                section and move back to the folder list. This cannot be undone.
              </Text>
              <View style={styles.actions}>
                <Pressable style={styles.cancelButton} onPress={() => setView("menu")}>
                  <Text style={styles.cancelText}>Keep folder</Text>
                </Pressable>
                <Pressable style={styles.deleteButton} onPress={confirmDelete}>
                  <Text style={styles.primaryText}>Delete permanently</Text>
                </Pressable>
              </View>
            </>
          )}
        </Pressable>
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoider: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(4, 5, 12, 0.48)",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  dialog: {
    width: "100%",
    maxWidth: 420,
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
    lineHeight: 19,
    marginTop: 5,
    marginBottom: 16,
  },
  option: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSubtle,
    marginTop: 8,
  },
  optionText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  deleteOption: {
    backgroundColor: theme.colors.errorBg,
  },
  deleteText: {
    color: theme.colors.error,
    fontSize: 14,
    fontWeight: "700",
  },
  cancelButton: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 16,
  },
  cancelText: {
    color: theme.colors.secondaryText,
    fontSize: 13,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    color: theme.colors.text,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  primaryButton: {
    flex: 1.25,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brand,
    marginTop: 16,
    paddingHorizontal: 8,
  },
  deleteButton: {
    flex: 1.4,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.error,
    marginTop: 16,
    paddingHorizontal: 8,
  },
  primaryText: {
    color: theme.colors.surface,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  disabled: {
    opacity: 0.5,
  },
});
