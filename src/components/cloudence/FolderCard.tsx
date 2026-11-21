import React, { useRef } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ChevronRight, FolderOpen } from "lucide-react-native";
import { theme } from "../../constants/theme";
import { CloudenceFolder } from "../../lib/api/folders";

type Props = {
  folder: CloudenceFolder;
  width: number;
  onPress: (folder: CloudenceFolder) => void;
  onLongPress?: (folder: CloudenceFolder) => void;
  pending?: boolean;
};

export default function FolderCard({
  folder,
  width,
  onPress,
  onLongPress,
  pending = false,
}: Props) {
  const longPressHandled = useRef(false);
  return (
    <Pressable
      onPress={() => {
        if (longPressHandled.current) {
          longPressHandled.current = false;
          return;
        }
        onPress(folder);
      }}
      onLongPress={() => {
        longPressHandled.current = true;
        onLongPress?.(folder);
      }}
      delayLongPress={450}
      disabled={pending}
      style={({ pressed }) => [
        styles.card,
        { width },
        pending && styles.pendingCard,
        pressed && !pending && { opacity: 0.75 },
      ]}
      accessibilityRole={pending ? "summary" : "button"}
      accessibilityLabel={
        pending
          ? `Creating ${folder.name} folder`
          : `${folder.name} folder. Tap to open, or press and hold for options.`
      }
    >
      <View style={styles.iconBox}>
        <FolderOpen size={19} color={theme.colors.brand} />
      </View>
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.name}>
          {folder.name}
        </Text>
        <Text style={styles.label}>{pending ? "Creating…" : "Folder"}</Text>
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
  pendingCard: { opacity: 0.65 },
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
