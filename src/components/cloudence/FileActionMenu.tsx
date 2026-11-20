import { Download, Edit3, Info, Share2, Trash2 } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { theme } from "../../constants/theme";
import { ActionModalType } from "../../types/file";
import { styles } from "./FileActionModal.styles";

type Props = {
  onSelect: (action: Exclude<ActionModalType, null>) => void;
  onDownload: () => void;
};

export default function FileActionMenu({ onSelect, onDownload }: Props) {
  return (
    <View style={styles.actionsList}>
      <ActionRow
        label="Rename"
        icon={<Edit3 size={18} color={theme.colors.brand} />}
        iconBackground={theme.colors.brandLight}
        onPress={() => onSelect("rename")}
      />
      <ActionRow
        label="Details"
        icon={<Info size={18} color="#2563EB" />}
        iconBackground="#EFF6FF"
        onPress={() => onSelect("details")}
      />
      <ActionRow
        label="Share with others"
        icon={<Share2 size={18} color="#7C3AED" />}
        iconBackground="#F5F3FF"
        onPress={() => onSelect("share")}
      />
      <ActionRow
        label="Download file"
        icon={<Download size={18} color="#059669" />}
        iconBackground="#ECFDF5"
        onPress={onDownload}
      />
      <ActionRow
        label="Delete file"
        icon={<Trash2 size={18} color={theme.colors.error} />}
        iconBackground={theme.colors.errorBg}
        destructive
        onPress={() => onSelect("delete")}
      />
    </View>
  );
}

function ActionRow({
  label,
  icon,
  iconBackground,
  destructive = false,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  iconBackground: string;
  destructive?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.actionRow, destructive && styles.deleteRow]}
      onPress={onPress}
    >
      <View style={[styles.actionIconBox, { backgroundColor: iconBackground }]}>
        {icon}
      </View>
      <Text
        style={[
          styles.actionLabel,
          destructive && { color: theme.colors.error },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
