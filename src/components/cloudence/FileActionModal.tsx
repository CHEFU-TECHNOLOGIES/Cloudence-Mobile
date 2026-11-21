import { X } from "lucide-react-native";
import { useState } from "react";
import {
  Pressable,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from "react-native";
import { theme } from "../../constants/theme";
import { ActionModalType, CloudFile } from "../../types/file";
import { convertFileSize } from "../../utils/fileUtils";
import { styles } from "./FileActionModal.styles";
import FileThumbnail from "./FileThumbnail";
import { useToast } from "./ToastProvider";
import FileSharePanel from "./FileSharePanel";
import DeleteConfirmationPanel from "./DeleteConfirmationPanel";
import FileActionMenu from "./FileActionMenu";
import FileRenamePanel from "./FileRenamePanel";
import FileDetailsPanel from "./FileDetailsPanel";

type Props = {
  visible: boolean;
  file: CloudFile | null;
  initialAction?: ActionModalType;
  onClose: () => void;
  onRename?: (fileId: string, newName: string) => void | Promise<void>;
  onDelete?: (fileId: string) => void | Promise<void>;
  onShare?: (
    fileId: string,
    emails: string[],
    userExpiration?: { email: string; expiresAt: string | null },
  ) => void | Promise<void>;
  onDownload?: (
    file: CloudFile,
    onProgress?: (progress: number | null) => void,
  ) => void | Promise<void>;
  onCancelDownload?: () => void;
};

function FileActionSheetContent({
  file,
  initialAction,
  onClose,
  onRename,
  onDelete,
  onShare,
  onDownload,
}: Omit<Props, "visible" | "onCancelDownload"> & { file: CloudFile }) {
  const [activeAction, setActiveAction] = useState<ActionModalType>(
    initialAction ?? null,
  );
  const { width, height } = useWindowDimensions();
  const { showToast } = useToast();

  const handleDeleteConfirm = () => {
    onClose();
    void Promise.resolve()
      .then(() => onDelete?.(file.id))
      .catch((error: unknown) => {
        showToast({
          title: "Delete failed",
          message:
            error instanceof Error
              ? error.message
              : "The file could not be deleted.",
          variant: "error",
        });
      });
  };

  const handleStartDownload = () => {
    onClose();
    void Promise.resolve()
      .then(() => onDownload?.(file))
      .catch((error: unknown) => {
        if (!(error instanceof Error && error.name === "AbortError")) {
          showToast({
            title: "Download failed",
            message:
              error instanceof Error
                ? error.message
                : "The file could not be downloaded.",
            variant: "error",
          });
        }
      });
  };

  return (
    <View
      style={[
        styles.sheet,
        { maxHeight: height * 0.85, width: width >= 600 ? 560 : "100%" },
        width >= 600 && styles.tabletSheet,
      ]}
    >
      <View style={styles.fileSummaryHeader}>
        <FileThumbnail file={file} style={styles.thumbnail} />
        <View style={styles.headerText}>
          <Text numberOfLines={1} style={styles.fileName}>
            {file.name}
          </Text>
          <Text style={styles.fileMeta}>
            {file.extension.toUpperCase()} · {convertFileSize(file.size)}
          </Text>
        </View>
        <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
          <X size={18} color={theme.colors.secondaryText} />
        </Pressable>
      </View>

      <View style={styles.divider} />

      {activeAction === null && (
        <FileActionMenu
          onSelect={setActiveAction}
          onDownload={handleStartDownload}
        />
      )}
      {activeAction === "rename" && (
        <FileRenamePanel
          file={file}
          onBack={() => setActiveAction(null)}
          onClose={onClose}
          onRename={onRename}
        />
      )}
      {activeAction === "details" && (
        <FileDetailsPanel file={file} onBack={() => setActiveAction(null)} />
      )}
      {activeAction === "share" && (
        <FileSharePanel file={file} onClose={onClose} onShare={onShare} />
      )}
      {activeAction === "delete" && (
        <DeleteConfirmationPanel
          fileName={file.name}
          onCancel={() => setActiveAction(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </View>
  );
}

export default function FileActionModal({
  visible,
  file,
  initialAction,
  onClose,
  onRename,
  onDelete,
  onShare,
  onDownload,
}: Props) {
  const isWide = useWindowDimensions().width >= 600;
  if (!file) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, isWide && styles.tabletOverlay]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
            style={styles.keyboardAvoider}
          >
            <TouchableWithoutFeedback>
              <FileActionSheetContent
                key={`${file.id}:${initialAction ?? "menu"}`}
                file={file}
                initialAction={initialAction}
                onClose={onClose}
                onRename={onRename}
                onDelete={onDelete}
                onShare={onShare}
                onDownload={onDownload}
              />
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
