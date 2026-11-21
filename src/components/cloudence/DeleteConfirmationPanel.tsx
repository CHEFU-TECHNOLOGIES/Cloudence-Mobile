import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../../constants/theme";

type Props = {
  fileName: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteConfirmationPanel({
  fileName,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delete this file?</Text>
      <Text style={styles.description}>
        This will permanently remove the file from your workspace.
      </Text>

      <View style={styles.warning}>
        <Text style={styles.warningTitle}>This action cannot be undone</Text>
        <Text numberOfLines={3} style={styles.fileName}>
          {fileName}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={onCancel}
          style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
        >
          <Text style={styles.cancelText}>Keep file</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Permanently delete ${fileName}`}
          onPress={onConfirm}
          style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
        >
          <Text style={styles.deleteText}>Delete permanently</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 4,
  },
  title: {
    color: theme.colors.text,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "800",
  },
  description: {
    color: theme.colors.secondaryText,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  warning: {
    marginTop: 18,
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: theme.colors.errorBg,
  },
  warningTitle: {
    color: theme.colors.error,
    fontSize: 13,
    fontWeight: "700",
  },
  fileName: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },
  cancelText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  deleteButton: {
    flex: 1.35,
    minHeight: 48,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.error,
    paddingHorizontal: 10,
  },
  deleteText: {
    color: theme.colors.surface,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  pressed: {
    opacity: 0.78,
  },
});
