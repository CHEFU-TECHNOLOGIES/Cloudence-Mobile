import { StyleSheet, View } from "react-native";
import { theme } from "../../../constants/theme";
import SkeletonBlock from "./SkeletonBlock";

type Props = {
  cardWidth: number;
  count?: number;
};

export default function FolderGridSkeleton({ cardWidth, count = 2 }: Props) {
  return (
    <View style={styles.grid} accessibilityLabel="Loading folders">
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={[styles.card, { width: cardWidth }]}>
          <SkeletonBlock width={36} height={36} borderRadius={11} />
          <View style={styles.labels}>
            <SkeletonBlock width="78%" height={12} borderRadius={6} />
            <SkeletonBlock width="44%" height={10} borderRadius={5} />
          </View>
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
  card: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  labels: {
    flex: 1,
    gap: 6,
  },
});
