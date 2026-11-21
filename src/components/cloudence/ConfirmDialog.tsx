import {
  Pressable,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { theme } from "../../constants/theme";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  embedded?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  destructive = false,
  embedded = false,
  onCancel,
  onConfirm,
}: Props) {
  if (!visible) return null;

  const content = (
    <View style={[styles.backdrop, embedded && styles.embeddedBackdrop]}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onCancel}
      />
      <View style={styles.dialog} accessibilityRole="alert">
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.actions}>
          <Pressable onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            style={[
              styles.confirmButton,
              destructive && styles.destructiveButton,
            ]}
          >
            <Text style={styles.confirmText}>{confirmLabel}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  if (embedded) return content;

  return (
    <Modal transparent animationType="fade" onRequestClose={onCancel}>
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "rgba(19, 21, 36, 0.42)",
  },
  embeddedBackdrop: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
  },
  dialog: {
    width: "100%",
    maxWidth: 400,
    padding: 22,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
  },
  title: { color: theme.colors.text, fontSize: 18, fontWeight: "800" },
  message: {
    color: theme.colors.secondaryText,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 24,
  },
  cancelButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  cancelText: {
    color: theme.colors.secondaryText,
    fontSize: 14,
    fontWeight: "700",
  },
  confirmButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: theme.colors.brand,
  },
  destructiveButton: { backgroundColor: theme.colors.error },
  confirmText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
