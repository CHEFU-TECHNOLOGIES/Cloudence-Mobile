import { StyleSheet, View } from "react-native";
import { profileStyles } from "../ProfileScreen.styles";
import SkeletonBlock from "./SkeletonBlock";

export default function StorageBreakdownSkeleton() {
  return (
    <View style={profileStyles.storageBreakdownCard} accessibilityLabel="Loading storage usage" accessibilityState={{ busy: true }}>
      <View style={profileStyles.storageHeader}>
        <SkeletonBlock width={36} height={36} borderRadius={10} />
        <View style={styles.headerText}>
          <SkeletonBlock width={140} height={17} borderRadius={6} />
          <SkeletonBlock width="88%" height={13} borderRadius={5} />
        </View>
      </View>
      <View style={profileStyles.segmentedBar}>
        <SkeletonBlock height={8} borderRadius={4} />
      </View>
      <View style={profileStyles.legendGrid}>
        {[0, 1, 2, 3].map((item) => (
          <View key={item} style={profileStyles.legendItem}>
            <SkeletonBlock width={8} height={8} borderRadius={4} />
            <SkeletonBlock width="75%" height={13} borderRadius={5} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerText: {
    flex: 1,
    gap: 2,
  },
});
