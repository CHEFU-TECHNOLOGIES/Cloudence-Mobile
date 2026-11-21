import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from "react-native";
import { theme } from "../../constants/theme";
import { useToast } from "./ToastProvider";
import FolderNameForm from "./FolderNameForm";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
};

export default function FolderNameModal({ visible, onClose, onCreate }: Props) {
  const { width, height } = useWindowDimensions();
  const { showToast } = useToast();
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
      const message = "Enter a folder name.";
      setError(message);
      showToast({ title: "Folder name required", message, variant: "error" });
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onCreate(name.trim());
      onClose();
    } catch (createError) {
      const message =
        createError instanceof Error
          ? createError.message
          : "The folder could not be created.";
      setError(message);
      showToast({ title: "Folder creation failed", message, variant: "error" });
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
        <KeyboardAvoidingView
          style={styles.keyboardAvoiding}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={[styles.overlay, width >= 600 && styles.tabletOverlay]}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.sheet,
                  {
                    width: width >= 600 ? 480 : "100%",
                    maxHeight: height * 0.85,
                  },
                ]}
              >
                <FolderNameForm
                  name={name}
                  error={error}
                  saving={saving}
                  onNameChange={setName}
                  onCancel={onClose}
                  onSubmit={() => void handleCreate()}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoiding: { flex: 1 },
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
});
