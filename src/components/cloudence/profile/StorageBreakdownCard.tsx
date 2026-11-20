import { HardDrive } from "lucide-react-native";
import { Text, View } from "react-native";
import { profileStyles as styles } from "../ProfileScreen.styles";
import { theme } from "../../../constants/theme";
import type { CloudenceUsage } from "../../../lib/api/files";
import { convertFileSize } from "../../../utils/fileUtils";

type Props = {
  usage: CloudenceUsage;
};

export default function StorageBreakdownCard({ usage }: Props) {
  const categorySizes = {
    Documents: usage.document.size,
    Images: usage.image.size,
    Media: usage.video.size + usage.audio.size,
    Others: usage.other.size,
  };
  const percentage =
    usage.all > 0 ? Number(((usage.used / usage.all) * 100).toFixed(1)) : 0;
  const categories = [
    {
      key: "Documents",
      label: "Docs",
      size: categorySizes.Documents,
      color: theme.colors.documents.barColor,
    },
    {
      key: "Images",
      label: "Images",
      size: categorySizes.Images,
      color: theme.colors.images.barColor,
    },
    {
      key: "Media",
      label: "Media",
      size: categorySizes.Media,
      color: theme.colors.media.barColor,
    },
    {
      key: "Others",
      label: "Others",
      size: categorySizes.Others,
      color: theme.colors.others.barColor,
    },
  ];

  return (
    <View style={styles.storageBreakdownCard}>
      <View style={styles.storageHeader}>
        <View style={styles.storageIconWrapper}>
          <HardDrive size={18} color={theme.colors.brand} />
        </View>
        <View style={styles.storageHeaderText}>
          <Text style={styles.storageCardTitle}>Storage Breakdown</Text>
          <Text style={styles.storageCardSub}>
            {convertFileSize(usage.used)} used of {convertFileSize(usage.all)} (
            {percentage}%)
          </Text>
        </View>
      </View>

      <View style={styles.segmentedBar}>
        {categories.map(({ key, size, color }) => (
          <View
            key={key}
            style={[
              styles.segment,
              { flex: size || 1, backgroundColor: color },
            ]}
          />
        ))}
      </View>

      <View style={styles.legendGrid}>
        {categories.map(({ key, label, size, color }) => (
          <View key={key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>
              {label}: {convertFileSize(size)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
