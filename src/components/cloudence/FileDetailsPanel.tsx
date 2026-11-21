import {
  Pressable,
  Text,
  View,
} from "react-native";
import { CloudFile } from "../../types/file";
import { convertFileSize, formatDateTime } from "../../utils/fileUtils";
import { styles } from "./FileActionModal.styles";

export default function FileDetailsPanel({
  file,
  onBack,
}: {
  file: CloudFile;
  onBack: () => void;
}) {
  const details = [
    ["Format", file.extension.toUpperCase()],
    ["Size", convertFileSize(file.size)],
    ["Owner", file.owner.fullName],
    ["Uploaded", formatDateTime(file.createdAt)],
    [
      "Shared with",
      file.users.length ? `${file.users.length} users` : "Private",
    ],
  ];

  return (
    <View style={styles.subModalContent}>
      <Text style={styles.subModalTitle}>File Details</Text>
      <View style={styles.detailsCard}>
        {details.map(([label, value]) => (
          <View key={label} style={styles.detailItem}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
          </View>
        ))}
      </View>
      <Pressable style={styles.backBtnFull} onPress={onBack}>
        <Text style={styles.backBtnText}>Back to Actions</Text>
      </Pressable>
    </View>
  );
}
