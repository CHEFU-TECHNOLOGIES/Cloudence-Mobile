import { Pressable, Text, View } from "react-native";
import { ArrowDownUp } from "lucide-react-native";
import { theme } from "../../constants/theme";
import { convertFileSize } from "../../utils/fileUtils";
import { filesScreenStyles as styles } from "./FilesScreen.styles";
import ViewToggle from "./ViewToggle";

type Props = {
  totalBytes: number;
  fileCount: number;
  view: "grid" | "list";
  onSort: () => void;
  onViewChange: (view: "grid" | "list") => void;
};

export default function FileListControls({
  totalBytes,
  fileCount,
  view,
  onSort,
  onViewChange,
}: Props) {
  return (
    <View style={styles.controlBar}>
      <View>
        <Text style={styles.totalLabel}>
          Total: <Text style={styles.totalValue}>{convertFileSize(totalBytes)}</Text>
        </Text>
        <Text style={styles.countLabel}>
          {fileCount} {fileCount === 1 ? "file" : "files"}
        </Text>
      </View>
      <View style={styles.rightControls}>
        <Pressable onPress={onSort} style={styles.sortButton}>
          <ArrowDownUp size={14} color={theme.colors.brand} />
          <Text numberOfLines={1} style={styles.sortButtonText}>Sort</Text>
        </Pressable>
        <ViewToggle view={view} onChange={onViewChange} />
      </View>
    </View>
  );
}
