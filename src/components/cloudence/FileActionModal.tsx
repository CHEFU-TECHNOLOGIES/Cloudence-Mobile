import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Edit3,
  Info,
  Share2,
  Download,
  Trash2,
  X,
  UserPlus,
  Trash,
} from "lucide-react-native";
import { CloudFile, ActionModalType } from "../../types/file";
import { theme } from "../../constants/theme";
import { convertFileSize, formatDateTime } from "../../utils/fileUtils";
import FileThumbnail from "./FileThumbnail";
import { styles } from "./FileActionModal.styles";

type Props = {
  visible: boolean;
  file: CloudFile | null;
  onClose: () => void;
  onRename?: (fileId: string, newName: string) => void | Promise<void>;
  onDelete?: (fileId: string) => void | Promise<void>;
  onShare?: (fileId: string, emails: string[]) => void | Promise<void>;
  onDownload?: (
    file: CloudFile,
    onProgress?: (progress: number | null) => void,
  ) => void | Promise<void>;
  onCancelDownload?: () => void;
};

function getFileBaseName(file: CloudFile) {
  const suffix = `.${file.extension}`;
  return file.name.toLowerCase().endsWith(suffix.toLowerCase())
    ? file.name.slice(0, -suffix.length)
    : file.name;
}

function FileActionSheetContent({
  file,
  onClose,
  onRename,
  onDelete,
  onShare,
  onDownload,
}: {
  file: CloudFile;
  onClose: () => void;
  onRename?: (fileId: string, newName: string) => void | Promise<void>;
  onDelete?: (fileId: string) => void | Promise<void>;
  onShare?: (fileId: string, emails: string[]) => void | Promise<void>;
  onDownload?: (
    file: CloudFile,
    onProgress?: (progress: number | null) => void,
  ) => void | Promise<void>;
}) {
  const [activeAction, setActiveAction] = useState<ActionModalType>(null);
  const [nameInput, setNameInput] = useState(getFileBaseName(file));
  const [emailInput, setEmailInput] = useState("");
  const [sharedEmails, setSharedEmails] = useState<string[]>(file.users);
  const { width, height } = useWindowDimensions();

  const handleSaveRename = () => {
    if (!nameInput.trim()) {
      Alert.alert("Invalid Name", "Please enter a valid file name.");
      return;
    }

    const nextName = `${nameInput.trim()}.${file.extension}`;
    try {
      const renamePromise = onRename?.(file.id, nextName);
      onClose();
      void Promise.resolve(renamePromise).catch((error: unknown) => {
        Alert.alert(
          "Rename Failed",
          error instanceof Error
            ? error.message
            : "The file could not be renamed.",
        );
      });
    } catch (error) {
      onClose();
      Alert.alert(
        "Rename Failed",
        error instanceof Error
          ? error.message
          : "The file could not be renamed.",
      );
    }
  };

  const handleAddEmail = () => {
    const trimmed = emailInput.trim();
    if (!trimmed || !trimmed.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    if (sharedEmails.includes(trimmed)) {
      Alert.alert("Already Shared", "This user already has access.");
      return;
    }
    const updated = [...sharedEmails, trimmed];
    onClose();
    void Promise.resolve()
      .then(() => onShare?.(file.id, updated))
      .catch((error: unknown) => {
        Alert.alert(
          "Share Failed",
          error instanceof Error
            ? error.message
            : "File access could not be updated.",
        );
      });
  };

  const handleRemoveEmail = (email: string) => {
    const updated = sharedEmails.filter((e) => e !== email);
    onClose();
    void Promise.resolve()
      .then(() => onShare?.(file.id, updated))
      .catch((error: unknown) => {
        Alert.alert(
          "Update Failed",
          error instanceof Error
            ? error.message
            : "File access could not be updated.",
        );
      });
  };

  const handleDeleteConfirm = () => {
    onClose();
    void Promise.resolve()
      .then(() => onDelete?.(file.id))
      .catch((error: unknown) => {
        Alert.alert(
          "Delete Failed",
          error instanceof Error
            ? error.message
            : "The file could not be deleted.",
        );
      });
  };

  const handleStartDownload = () => {
    onClose();
    void Promise.resolve()
      .then(() => onDownload?.(file))
      .catch((error: unknown) => {
        if (!(error instanceof Error && error.name === "AbortError")) {
          Alert.alert(
            "Download Failed",
            error instanceof Error
              ? error.message
              : "The file could not be downloaded.",
          );
        }
      });
  };

  return (
    <View
      style={[
        styles.sheet,
        {
          maxHeight: height * 0.85,
          width: width >= 600 ? 560 : "100%",
        },
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
        <View style={styles.actionsList}>
          <Pressable
            style={styles.actionRow}
            onPress={() => setActiveAction("rename")}
          >
            <View
              style={[
                styles.actionIconBox,
                { backgroundColor: theme.colors.brandLight },
              ]}
            >
              <Edit3 size={18} color={theme.colors.brand} />
            </View>
            <Text style={styles.actionLabel}>Rename</Text>
          </Pressable>

          <Pressable
            style={styles.actionRow}
            onPress={() => setActiveAction("details")}
          >
            <View
              style={[styles.actionIconBox, { backgroundColor: "#EFF6FF" }]}
            >
              <Info size={18} color="#2563EB" />
            </View>
            <Text style={styles.actionLabel}>Details</Text>
          </Pressable>

          <Pressable
            style={styles.actionRow}
            onPress={() => setActiveAction("share")}
          >
            <View
              style={[styles.actionIconBox, { backgroundColor: "#F5F3FF" }]}
            >
              <Share2 size={18} color="#7C3AED" />
            </View>
            <Text style={styles.actionLabel}>Share with others</Text>
          </Pressable>

          <Pressable
            style={styles.actionRow}
            onPress={() => {
              handleStartDownload();
            }}
          >
            <View
              style={[styles.actionIconBox, { backgroundColor: "#ECFDF5" }]}
            >
              <Download size={18} color="#059669" />
            </View>
            <Text style={styles.actionLabel}>Download file</Text>
          </Pressable>

          <Pressable
            style={[styles.actionRow, styles.deleteRow]}
            onPress={() => setActiveAction("delete")}
          >
            <View
              style={[
                styles.actionIconBox,
                { backgroundColor: theme.colors.errorBg },
              ]}
            >
              <Trash2 size={18} color={theme.colors.error} />
            </View>
            <Text style={[styles.actionLabel, { color: theme.colors.error }]}>
              Delete file
            </Text>
          </Pressable>
        </View>
      )}

      {activeAction === "rename" && (
        <View style={styles.subModalContent}>
          <Text style={styles.subModalTitle}>Rename File</Text>
          <Text style={styles.subModalDesc}>
            Enter a new name for your file.
          </Text>

          <View style={styles.renameField}>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              style={styles.renameInput}
              placeholder="File name"
              placeholderTextColor={theme.colors.mutedText}
              autoFocus
              autoCapitalize="none"
              selectTextOnFocus
            />
          </View>

          <View style={styles.buttonRow}>
            <Pressable
              style={styles.cancelBtn}
              onPress={() => setActiveAction(null)}
            >
              <Text style={styles.cancelBtnText}>Back</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={handleSaveRename}>
              <Text style={styles.primaryBtnText}>Save Changes</Text>
            </Pressable>
          </View>
        </View>
      )}

      {activeAction === "details" && (
        <View style={styles.subModalContent}>
          <Text style={styles.subModalTitle}>File Details</Text>

          <View style={styles.detailsCard}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Format</Text>
              <Text style={styles.detailValue}>
                {file.extension.toUpperCase()}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Size</Text>
              <Text style={styles.detailValue}>
                {convertFileSize(file.size)}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Owner</Text>
              <Text style={styles.detailValue}>{file.owner.fullName}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Uploaded</Text>
              <Text style={styles.detailValue}>
                {formatDateTime(file.createdAt)}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Shared with</Text>
              <Text style={styles.detailValue}>
                {sharedEmails.length > 0
                  ? `${sharedEmails.length} users`
                  : "Private"}
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.backBtnFull}
            onPress={() => setActiveAction(null)}
          >
            <Text style={styles.backBtnText}>Back to Actions</Text>
          </Pressable>
        </View>
      )}

      {activeAction === "share" && (
        <View style={styles.subModalContent}>
          <Text style={styles.subModalTitle}>Share File</Text>
          <Text style={styles.subModalDesc}>
            Grant access by email to collaborate on this file.
          </Text>

          <View style={styles.addEmailRow}>
            <TextInput
              value={emailInput}
              onChangeText={setEmailInput}
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="user@example.com"
              placeholderTextColor={theme.colors.mutedText}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Pressable style={styles.addEmailBtn} onPress={handleAddEmail}>
              <UserPlus size={16} color="#FFFFFF" />
              <Text style={styles.addEmailBtnText}>Share</Text>
            </Pressable>
          </View>

          <Text style={styles.sharedSectionTitle}>
            Users with access ({sharedEmails.length})
          </Text>

          <ScrollView
            style={styles.emailList}
            showsVerticalScrollIndicator={false}
          >
            {sharedEmails.map((email) => (
              <View key={email} style={styles.emailItem}>
                <Text numberOfLines={1} style={styles.emailText}>
                  {email}
                </Text>
                <Pressable
                  hitSlop={8}
                  onPress={() => handleRemoveEmail(email)}
                  style={styles.removeEmailBtn}
                >
                  <Trash size={15} color={theme.colors.error} />
                </Pressable>
              </View>
            ))}
            {sharedEmails.length === 0 && (
              <Text style={styles.noEmailsText}>No one has access yet.</Text>
            )}
          </ScrollView>

          <Pressable
            style={styles.backBtnFull}
            onPress={() => setActiveAction(null)}
          >
            <Text style={styles.backBtnText}>Done</Text>
          </Pressable>
        </View>
      )}

      {activeAction === "delete" && (
        <View style={styles.subModalContent}>
          <Text style={[styles.subModalTitle, { color: theme.colors.error }]}>
            Delete File?
          </Text>
          <Text style={styles.subModalDesc}>
            Are you sure you want to permanently delete{" "}
            <Text
              style={{
                fontWeight: "800",
                color: theme.colors.brandDark,
              }}
            >
              {file.name}
            </Text>
            ? This action cannot be undone.
          </Text>

          <View style={styles.buttonRow}>
            <Pressable
              style={styles.cancelBtn}
              onPress={() => setActiveAction(null)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.primaryBtn,
                { backgroundColor: theme.colors.error },
              ]}
              onPress={handleDeleteConfirm}
            >
              <Text style={styles.primaryBtnText}>Delete Permanently</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

export default function FileActionModal({
  visible,
  file,
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
                key={file.id}
                file={file}
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
