import { StyleSheet, View } from "react-native";
import { theme } from "../../../constants/theme";
import SkeletonBlock from "./SkeletonBlock";

export default function StorageCardSkeleton() {
  return (
    <View style={styles.card} accessibilityLabel="Loading storage">
      <SkeletonBlock
        width={112}
        height={112}
        borderRadius={56}
        style={styles.gauge}
      />
      <View style={styles.details}>
        <SkeletonBlock width="80%" height={16} borderRadius={8} />
        <SkeletonBlock width="96%" height={25} borderRadius={8} />
        <SkeletonBlock width="74%" height={24} borderRadius={8} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 176,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    padding: 18,
    overflow: "hidden",
    borderRadius: theme.radius.xl,
    backgroundColor: "#DCEBEA",
  },
  gauge: {
    backgroundColor: "#C5DBDA",
  },
  details: {
    flex: 1,
    gap: 10,
  },
});
