import { Pressable, Text, TextInput, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { X } from "lucide-react-native";
import { theme } from "../../constants/theme";
import { convertFileSize } from "../../utils/fileUtils";

export type UploadQueueItem = {
  id: string;
  asset: DocumentPicker.DocumentPickerAsset;
  uploadName: string;
  status: "queued" | "uploading" | "done" | "failed";
};

type Props = {
  items: UploadQueueItem[];
  disabled: boolean;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onNameChange: (id: string, name: string) => void;
};

export default function UploadQueueList({
  items,
  disabled,
  onRemove,
  onRetry,
  onNameChange,
}: Props) {
  return (
    <View style={{ gap: 8 }}>
      {items.map((item) => (
        <View
          key={item.id}
          style={{
            minHeight: 58,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.colors.borderSubtle,
            backgroundColor: theme.colors.surfaceSubtle,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ color: theme.colors.text, fontSize: 12, fontWeight: "700" }}>
              {item.asset.name}
            </Text>
            <Text style={{ color: theme.colors.secondaryText, fontSize: 10, marginTop: 2 }}>
              {convertFileSize(item.asset.size ?? 0)} · {statusLabel(item.status)}
            </Text>
            {item.status === "queued" && (
              <TextInput
                value={item.uploadName}
                onChangeText={(name) => onNameChange(item.id, name)}
                placeholder="Optional file name"
                placeholderTextColor={theme.colors.mutedText}
                editable={!disabled}
                autoCapitalize="none"
                style={{ color: theme.colors.text, fontSize: 11, paddingVertical: 4 }}
              />
            )}
          </View>
          {item.status === "failed" ? (
            <Pressable disabled={disabled} onPress={() => onRetry(item.id)}>
              <Text style={{ color: theme.colors.brand, fontSize: 11, fontWeight: "700" }}>Retry</Text>
            </Pressable>
          ) : item.status === "queued" ? (
            <Pressable disabled={disabled} hitSlop={8} onPress={() => onRemove(item.id)} accessibilityLabel={`Remove ${item.asset.name} from upload queue`}>
              <X size={16} color={theme.colors.secondaryText} />
            </Pressable>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function statusLabel(status: UploadQueueItem["status"]) {
  switch (status) {
    case "uploading":
      return "Uploading";
    case "done":
      return "Uploaded";
    case "failed":
      return "Failed";
    default:
      return "Waiting";
  }
}
