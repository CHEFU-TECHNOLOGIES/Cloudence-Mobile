import { StyleSheet, View } from "react-native";
import CloudenceLogo from "../CloudenceLogo";
import SkeletonBlock from "./SkeletonBlock";
import { theme } from "../../../constants/theme";

export default function CenteredPageSkeleton() {
  return (
    <View style={styles.container} accessibilityLabel="Loading Cloudence">
      <CloudenceLogo size={48} showText textSize={21} />
      <View style={styles.content}>
        <SkeletonBlock width="72%" height={18} borderRadius={9} />
        <SkeletonBlock width="94%" height={12} borderRadius={6} />
        <SkeletonBlock width="84%" height={12} borderRadius={6} />
        <SkeletonBlock
          width="100%"
          height={58}
          borderRadius={theme.radius.md}
          style={styles.card}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    backgroundColor: theme.colors.background,
  },
  content: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    gap: 12,
    marginTop: 32,
  },
  card: {
    marginTop: 8,
    backgroundColor: theme.colors.surface,
  },
});
