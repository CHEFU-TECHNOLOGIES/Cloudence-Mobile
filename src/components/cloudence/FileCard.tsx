import {
  FileText,
  Film,
  Image as ImageIcon,
  MoreVertical,
  Music,
  Package,
  Users,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../../constants/theme";
import { CloudFile } from "../../types/file";
import { convertFileSize, formatDateTime } from "../../utils/fileUtils";

type Props = {
  file: CloudFile;
  onPress?: (file: CloudFile) => void;
  onMore?: (file: CloudFile) => void;
  width?: number | string;
};

export const getFileIconDetails = (file: CloudFile) => {
  switch (file.category) {
    case "Documents":
      return {
        icon: FileText,
        color: theme.colors.documents.color,
        background: theme.colors.documents.background,
        border: theme.colors.documents.border,
      };
    case "Images":
      return {
        icon: ImageIcon,
        color: theme.colors.images.color,
        background: theme.colors.images.background,
        border: theme.colors.images.border,
      };
    case "Media":
      return {
        icon: file.type === "audio" ? Music : Film,
        color: theme.colors.media.color,
        background: theme.colors.media.background,
        border: theme.colors.media.border,
      };
    default:
      return {
        icon: Package,
        color: theme.colors.others.color,
        background: theme.colors.others.background,
        border: theme.colors.others.border,
      };
  }
};

export default function FileCard({ file, onPress, onMore, width }: Props) {
  const iconDetails = getFileIconDetails(file);
  const Icon = iconDetails.icon;
  const ownerInitial = file.owner.fullName
    ? file.owner.fullName.charAt(0).toUpperCase()
    : "U";

  return (
    <Pressable
      onPress={() => onPress?.(file)}
      style={({ pressed }) => [
        styles.card,
        width !== undefined && { width },
        pressed && { transform: [{ scale: 0.975 }], opacity: 0.9 },
      ]}
    >
      {/* Top Section */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.thumbnail,
            {
              backgroundColor: iconDetails.background,
              borderColor: iconDetails.border,
            },
          ]}
        >
          <Icon size={22} color={iconDetails.color} strokeWidth={2.3} />
          <View
            style={[
              styles.extBadge,
              { backgroundColor: iconDetails.color },
            ]}
          >
            <Text style={styles.extBadgeText}>
              {file.extension.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.topRight}>
          <Pressable
            hitSlop={8}
            onPress={(e) => {
              e.stopPropagation();
              onMore?.(file);
            }}
            accessibilityLabel={`Actions for ${file.name}`}
            style={({ pressed }) => [
              styles.moreButton,
              pressed && { backgroundColor: theme.colors.borderSubtle },
            ]}
          >
            <MoreVertical size={17} color={theme.colors.secondaryText} />
          </Pressable>
          <Text style={styles.sizeText}>{convertFileSize(file.size)}</Text>
        </View>
      </View>

      {/* Title & Metadata */}
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.fileName}>
          {file.name}
        </Text>

        <Text style={styles.dateText}>{formatDateTime(file.createdAt)}</Text>

        <View style={styles.footerRow}>
          <View style={styles.ownerPill}>
            <View style={styles.ownerAvatar}>
              <Text style={styles.ownerAvatarText}>{ownerInitial}</Text>
            </View>
            <Text numberOfLines={1} style={styles.ownerName}>
              {file.owner.fullName.split(" ")[0]}
            </Text>
          </View>

          {file.users.length > 0 && (
            <View style={styles.sharedBadge}>
              <Users size={10} color={theme.colors.brandDark} />
              <Text style={styles.sharedCount}>{file.users.length}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 13,
    shadowColor: "rgba(66, 71, 97, 0.05)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  extBadge: {
    position: "absolute",
    bottom: -5,
    paddingHorizontal: 4.5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  extBadgeText: {
    fontSize: 7.5,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.4,
  },
  topRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  moreButton: {
    padding: 4,
    borderRadius: theme.radius.sm,
  },
  sizeText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.secondaryText,
  },
  content: {
    gap: 3,
  },
  fileName: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.2,
  },
  dateText: {
    fontSize: 10.5,
    color: theme.colors.secondaryText,
    marginBottom: 4,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ownerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: 90,
  },
  ownerAvatar: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: theme.colors.brandLight,
    alignItems: "center",
    justifyContent: "center",
  },
  ownerAvatarText: {
    fontSize: 8.5,
    fontWeight: "800",
    color: theme.colors.brandDark,
  },
  ownerName: {
    fontSize: 10,
    color: theme.colors.secondaryText,
    fontWeight: "600",
  },
  sharedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: theme.colors.brandLight,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  sharedCount: {
    fontSize: 9.5,
    fontWeight: "800",
    color: theme.colors.brandDark,
  },
});
