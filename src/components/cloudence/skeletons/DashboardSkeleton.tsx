import { StyleSheet, Text, View } from "react-native";
import { theme } from "../../../constants/theme";
import { useResponsiveLayout } from "../../../hooks/useResponsiveLayout";
import SkeletonBlock from "./SkeletonBlock";
import StorageCardSkeleton from "./StorageCardSkeleton";

export default function DashboardSkeleton() {
  const layout = useResponsiveLayout();
  const columns = Math.min(layout.gridColumns, 2);
  const gridWidth = layout.contentMaxWidth - layout.horizontalPadding * 2;
  const cardWidth = (gridWidth - layout.gridGap * (columns - 1)) / columns;

  return (
    <View accessibilityLabel="Loading dashboard">
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage</Text>
        <StorageCardSkeleton />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Browse by category</Text>
        <View style={styles.categoryGrid}>
          {Array.from({ length: 4 }, (_, index) => (
            <View
              key={index}
              style={[styles.categoryCard, { width: cardWidth }]}
            >
              <SkeletonBlock width="62%" height={15} borderRadius={7} />
              <SkeletonBlock width="40%" height={11} borderRadius={5} />
              <SkeletonBlock width="68%" height={10} borderRadius={5} />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.recentHeading}>
          <View style={styles.recentTitle}>
            <SkeletonBlock width={112} height={17} borderRadius={7} />
            <SkeletonBlock width={138} height={11} borderRadius={5} />
          </View>
          <SkeletonBlock width={54} height={13} borderRadius={6} />
        </View>
        <View style={styles.recentCard}>
          {[0, 1, 2].map((item) => (
            <View
              key={item}
              style={[styles.recentRow, item === 2 && styles.lastRecentRow]}
            >
              <SkeletonBlock width={44} height={44} borderRadius={12} />
              <View style={styles.recentText}>
                <SkeletonBlock width="74%" height={13} borderRadius={6} />
                <SkeletonBlock width="52%" height={10} borderRadius={5} />
              </View>
              <SkeletonBlock width={20} height={20} borderRadius={10} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    minHeight: 108,
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.surface,
  },
  recentHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  recentTitle: {
    gap: 5,
  },
  recentCard: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  recentRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  lastRecentRow: {
    borderBottomWidth: 0,
  },
  recentText: {
    flex: 1,
    gap: 7,
  },
});
