import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from "react-native";
import { theme } from "../../constants/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
};

export default function FolderNameModal({ visible, onClose, onCreate }: Props) {
  const { width, height } = useWindowDimensions();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName("");
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (saving) return;
    if (!name.trim()) {
      setError("Enter a folder name.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onCreate(name.trim());
      onClose();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "The folder could not be created.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={saving ? undefined : onClose}
    >
      <TouchableWithoutFeedback onPress={saving ? undefined : onClose}>
        <View
          style={[
            styles.overlay,
            width >= 600 && styles.tabletOverlay,
          ]}
        >
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.sheet,
                { width: width >= 600 ? 480 : "100%", maxHeight: height * 0.85 },
              ]}
            >
              <Text style={styles.title}>Create folder</Text>
              <Text style={styles.description}>
                Keep related workspace files together.
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Folder name"
                placeholderTextColor={theme.colors.mutedText}
                style={styles.input}
                editable={!saving}
                maxLength={80}
                autoFocus
              />
              {error && <Text style={styles.error}>{error}</Text>}
              <View style={styles.actions}>
                <Pressable
                  onPress={onClose}
                  disabled={saving}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => void handleCreate()}
                  disabled={saving}
                  style={[styles.createButton, saving && styles.disabled]}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.createText}>Create folder</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(4, 5, 12, 0.45)",
  },
  tabletOverlay: {
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  sheet: {
    alignSelf: "center",
    padding: 22,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
  },
  title: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  description: {
    color: theme.colors.secondaryText,
    fontSize: 12,
    marginTop: 5,
    marginBottom: 18,
  },
  input: {
    height: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  error: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.full,
  },
  cancelText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  createButton: {
    flex: 1.3,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brand,
  },
  createText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.75,
  },
});
