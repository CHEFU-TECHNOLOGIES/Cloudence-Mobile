import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { theme } from "../../constants/theme";

type Props = {
  name: string;
  error: string | null;
  saving: boolean;
  onNameChange: (name: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

export default function FolderNameForm({
  name,
  error,
  saving,
  onNameChange,
  onCancel,
  onSubmit,
}: Props) {
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Create folder</Text>
      <Text style={styles.description}>
        Keep related workspace files together.
      </Text>
      <TextInput
        value={name}
        onChangeText={onNameChange}
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
          onPress={onCancel}
          disabled={saving}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={onSubmit}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
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
  disabled: { opacity: 0.75 },
});
