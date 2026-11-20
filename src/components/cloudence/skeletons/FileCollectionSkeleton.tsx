import { StyleSheet, View } from "react-native";
import { theme } from "../../../constants/theme";
import { ViewType } from "../../../types/file";
import SkeletonBlock from "./SkeletonBlock";

type Props = {
  view: ViewType;
  cardWidth: number;
  count?: number;
};

export default function FileCollectionSkeleton({
  view,
  cardWidth,
  count = 4,
}: Props) {
  return view === "grid" ? (
    <View style={styles.grid} accessibilityLabel="Loading files">
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={[styles.gridCard, { width: cardWidth }]}>
          <View style={styles.gridTopRow}>
            <SkeletonBlock width={48} height={48} borderRadius={13} />
            <SkeletonBlock width={44} height={13} borderRadius={6} />
          </View>
          <SkeletonBlock width="84%" height={13} borderRadius={6} />
          <SkeletonBlock width="58%" height={10} borderRadius={5} />
          <View style={styles.gridFooter}>
            <SkeletonBlock width={72} height={18} borderRadius={9} />
            <SkeletonBlock width={26} height={16} borderRadius={6} />
          </View>
        </View>
      ))}
    </View>
  ) : (
    <View style={styles.listCard} accessibilityLabel="Loading files">
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={[styles.listRow, index === count - 1 && styles.lastListRow]}
        >
          <SkeletonBlock width={44} height={44} borderRadius={12} />
          <View style={styles.listText}>
            <SkeletonBlock width="72%" height={13} borderRadius={6} />
            <SkeletonBlock width="52%" height={10} borderRadius={5} />
          </View>
          <SkeletonBlock width={20} height={20} borderRadius={10} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridCard: {
    minHeight: 164,
    padding: 13,
    gap: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  gridTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  gridFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
  },
  listCard: {
    paddingHorizontal: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  listRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  lastListRow: {
    borderBottomWidth: 0,
  },
  listText: {
    flex: 1,
    gap: 7,
  },
});
