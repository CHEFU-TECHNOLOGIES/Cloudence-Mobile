import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { FolderOpen } from "lucide-react-native";
import { theme } from "../../constants/theme";

type Props = {
  title?: string;
  message?: string;
};

export default function EmptyState({
  title = "No files found",
  message = "Try another search or upload a new file.",
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <FolderOpen size={28} color={theme.colors.brand} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  icon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: theme.colors.brandLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
  },
  message: {
    fontSize: 12,
    color: theme.colors.secondaryText,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
    maxWidth: 240,
  },
});