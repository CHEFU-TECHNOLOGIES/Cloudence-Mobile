import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronRight, FolderOpen } from "lucide-react-native";
import { theme } from "../../constants/theme";
import { CloudenceFolder } from "../../lib/api/folders";

type Props = {
  folder: CloudenceFolder;
  width: number;
  onPress: (folder: CloudenceFolder) => void;
};

export default function FolderCard({ folder, width, onPress }: Props) {
  return (
    <Pressable
      onPress={() => onPress(folder)}
      style={({ pressed }) => [
        styles.card,
        { width },
        pressed && { opacity: 0.75 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${folder.name} folder`}
    >
      <View style={styles.iconBox}>
        <FolderOpen size={19} color={theme.colors.brand} />
      </View>
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.name}>
          {folder.name}
        </Text>
        <Text style={styles.label}>Folder</Text>
      </View>
      <ChevronRight size={17} color={theme.colors.secondaryText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
    padding: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  iconBox: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: theme.colors.brandLight,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: theme.colors.text,
    fontSize: 12.5,
    fontWeight: "700",
  },
  label: {
    color: theme.colors.secondaryText,
    fontSize: 10.5,
    marginTop: 2,
  },
});
