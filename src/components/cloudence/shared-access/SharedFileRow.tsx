import { ChevronRight } from "lucide-react-native";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CloudFile } from "../../../types/file";
import { theme } from "../../../constants/theme";
import FileThumbnail from "../FileThumbnail";

type Props = {
  file: CloudFile;
  onPress: (file: CloudFile) => void;
};

export default function SharedFileRow({ file, onPress }: Props) {
  const sharedCount = file.users.length;
  return (
    <Pressable
      onPress={() => onPress(file)}
      accessibilityRole="button"
      accessibilityLabel={`Manage access for ${file.name}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <FileThumbnail file={file} style={styles.thumbnail} />
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.name}>
          {file.name}
        </Text>
        <Text numberOfLines={1} style={styles.access}>
          {sharedCount === 0
            ? "Private · no collaborators"
            : `Shared with ${sharedCount} ${sharedCount === 1 ? "person" : "people"}`}
        </Text>
        {sharedCount > 0 && (
          <Text numberOfLines={1} style={styles.emails}>
            {file.users.join(", ")}
          </Text>
        )}
      </View>
      <ChevronRight size={19} color={theme.colors.secondaryText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  pressed: { backgroundColor: theme.colors.surfaceSubtle },
  thumbnail: { width: 46, height: 46, borderRadius: 12 },
  content: { flex: 1, minWidth: 0, gap: 3 },
  name: { color: theme.colors.text, fontSize: 13.5, fontWeight: "700" },
  access: { color: theme.colors.secondaryText, fontSize: 11.5 },
  emails: { color: theme.colors.mutedText, fontSize: 10.5 },
});
