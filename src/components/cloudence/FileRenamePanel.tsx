import { useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { theme } from "../../constants/theme";
import { CloudFile } from "../../types/file";
import { styles } from "./FileActionModal.styles";
import { useToast } from "./ToastProvider";

type Props = {
  file: CloudFile;
  onBack: () => void;
  onClose: () => void;
  onRename?: (fileId: string, newName: string) => void | Promise<void>;
};

function getFileBaseName(file: CloudFile) {
  const suffix = `.${file.extension}`;
  return file.name.toLowerCase().endsWith(suffix.toLowerCase())
    ? file.name.slice(0, -suffix.length)
    : file.name;
}

export default function FileRenamePanel({
  file,
  onBack,
  onClose,
  onRename,
}: Props) {
  const [name, setName] = useState(() => getFileBaseName(file));
  const { showToast } = useToast();

  const save = () => {
    if (!name.trim()) {
      showToast({
        title: "Invalid name",
        message: "Please enter a valid file name.",
        variant: "error",
      });
      return;
    }

    try {
      const result = onRename?.(file.id, `${name.trim()}.${file.extension}`);
      onClose();
      void Promise.resolve(result).catch((error: unknown) => {
        showToast({
          title: "Rename failed",
          message:
            error instanceof Error
              ? error.message
              : "The file could not be renamed.",
          variant: "error",
        });
      });
    } catch (error) {
      onClose();
      showToast({
        title: "Rename failed",
        message:
          error instanceof Error
            ? error.message
            : "The file could not be renamed.",
        variant: "error",
      });
    }
  };

  return (
    <View style={styles.subModalContent}>
      <Text style={styles.subModalTitle}>Rename File</Text>
      <Text style={styles.subModalDesc}>Enter a new name for your file.</Text>
      <View style={styles.renameField}>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.renameInput}
          placeholder="File name"
          placeholderTextColor={theme.colors.mutedText}
          autoFocus
          autoCapitalize="none"
          selectTextOnFocus
        />
      </View>
      <View style={styles.buttonRow}>
        <Pressable style={styles.cancelBtn} onPress={onBack}>
          <Text style={styles.cancelBtnText}>Back</Text>
        </Pressable>
        <Pressable style={styles.primaryBtn} onPress={save}>
          <Text style={styles.primaryBtnText}>Save Changes</Text>
        </Pressable>
      </View>
    </View>
  );
}
