import React from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
import {
  FileText,
  Image as ImageIcon,
  Film,
  Package,
  ArrowUpRight,
} from "lucide-react-native";
import { theme } from "../../constants/theme";
import { FileCategory } from "../../types/file";
import { convertFileSize, formatDateTime } from "../../utils/fileUtils";

const categoryConfig = {
  Documents: {
    icon: FileText,
    color: theme.colors.documents.color,
    background: theme.colors.documents.background,
    border: theme.colors.documents.border,
    formats: "PDF, DOCX, XLSX",
    eyebrow: "DOCUMENTS",
  },
  Images: {
    icon: ImageIcon,
    color: theme.colors.images.color,
    background: theme.colors.images.background,
    border: theme.colors.images.border,
    formats: "PNG, JPG, SVG",
    eyebrow: "VISUALS",
  },
  Media: {
    icon: Film,
    color: theme.colors.media.color,
    background: theme.colors.media.background,
    border: theme.colors.media.border,
    formats: "MP4, MP3, WAV",
    eyebrow: "STREAMING",
  },
  Others: {
    icon: Package,
    color: theme.colors.others.color,
    background: theme.colors.others.background,
    border: theme.colors.others.border,
    formats: "ZIP, TAR, CSV",
    eyebrow: "CONTAINERS",
  },
};

type Props = {
  category: FileCategory;
  count: number;
  sizeBytes: number;
  latestDate?: string;
  onPress?: () => void;
};

export default function CategoryCard({
  category,
  count,
  sizeBytes,
  latestDate,
  onPress,
}: Props) {
  const config = categoryConfig[category];
  const Icon = config.icon;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { borderColor: config.border },
        pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
      ]}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: config.background },
          ]}
        >
          <Icon size={19} color={config.color} strokeWidth={2.4} />
        </View>

        <View style={[styles.sizeBadge, { backgroundColor: config.background }]}>
          <Text style={[styles.sizeText, { color: config.color }]}>
            {convertFileSize(sizeBytes)}
          </Text>
        </View>
      </View>

      <Text style={[styles.eyebrow, { color: config.color }]}>
        {config.eyebrow}
      </Text>

      <Text style={styles.title}>{category}</Text>

      <Text numberOfLines={1} style={styles.countText}>
        {count} {count === 1 ? "file" : "files"} · {config.formats}
      </Text>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <Text style={styles.dateText}>
          {latestDate ? formatDateTime(latestDate) : "Recent"}
        </Text>
        <View style={[styles.arrowCircle, { backgroundColor: config.background }]}>
          <ArrowUpRight size={12} color={config.color} strokeWidth={2.5} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1.2,
    padding: 13,
    shadowColor: "rgba(66, 71, 97, 0.06)",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  sizeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: theme.radius.full,
  },
  sizeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  countText: {
    fontSize: 10.5,
    color: theme.colors.secondaryText,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderSubtle,
    marginVertical: 9,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateText: {
    fontSize: 10.5,
    color: theme.colors.secondaryText,
    fontWeight: "500",
  },
  arrowCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
});