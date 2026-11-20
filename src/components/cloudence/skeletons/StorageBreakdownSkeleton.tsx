import { StyleSheet, View } from "react-native";
import { theme } from "../../../constants/theme";
import SkeletonBlock from "./SkeletonBlock";

export default function StorageBreakdownSkeleton() {
  return (
    <View style={styles.card} accessibilityLabel="Loading storage usage">
      <View style={styles.header}>
        <SkeletonBlock width={36} height={36} borderRadius={10} />
        <View style={styles.headerText}>
          <SkeletonBlock width="64%" height={13} borderRadius={6} />
          <SkeletonBlock width="88%" height={10} borderRadius={5} />
        </View>
      </View>
      <SkeletonBlock height={8} borderRadius={4} />
      <View style={styles.legend}>
        {[0, 1, 2, 3].map((item) => (
          <SkeletonBlock key={item} width="46%" height={12} borderRadius={6} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 16,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
});
