import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
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
import { getFileIconDetails } from "./FileCard";

type Props = {
  visible: boolean;
  file: CloudFile | null;
  onClose: () => void;
  onRename?: (fileId: string, newName: string) => void;
  onDelete?: (fileId: string) => void;
  onShare?: (fileId: string, emails: string[]) => void;
  onDownload?: (file: CloudFile) => void;
};

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
  onRename?: (fileId: string, newName: string) => void;
  onDelete?: (fileId: string) => void;
  onShare?: (fileId: string, emails: string[]) => void;
  onDownload?: (file: CloudFile) => void;
}) {
  const [activeAction, setActiveAction] = useState<ActionModalType>(null);
  const [nameInput, setNameInput] = useState(file.name);
  const [emailInput, setEmailInput] = useState("");
  const [sharedEmails, setSharedEmails] = useState<string[]>(file.users);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  const iconDetails = getFileIconDetails(file);
  const Icon = iconDetails.icon;

  const handleSaveRename = () => {
    if (!nameInput.trim()) {
      Alert.alert("Invalid Name", "Please enter a valid file name.");
      return;
    }
    onRename?.(file.id, nameInput.trim());
    onClose();
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
    setSharedEmails(updated);
    setEmailInput("");
    onShare?.(file.id, updated);
  };

  const handleRemoveEmail = (email: string) => {
    const updated = sharedEmails.filter((e) => e !== email);
    setSharedEmails(updated);
    onShare?.(file.id, updated);
  };

  const handleDeleteConfirm = () => {
    onDelete?.(file.id);
    onClose();
  };

  const handleStartDownload = () => {
    setDownloadProgress(0);
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev === null) return 0;
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onDownload?.(file);
            onClose();
          }, 400);
          return 100;
        }
        return prev + 35;
      });
    }, 180);
  };

  return (
    <View style={styles.sheet}>
      {/* Sheet Drag Indicator */}
      <View style={styles.dragBar} />

      {/* File Summary Header */}
      <View style={styles.fileSummaryHeader}>
        <View
          style={[
            styles.thumbnail,
            { backgroundColor: iconDetails.background, borderColor: iconDetails.border },
          ]}
        >
          <Icon size={22} color={iconDetails.color} strokeWidth={2.2} />
        </View>

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

      {/* 1. Main Action Options List */}
      {activeAction === null && (
        <View style={styles.actionsList}>
          <Pressable
            style={styles.actionRow}
            onPress={() => setActiveAction("rename")}
          >
            <View style={[styles.actionIconBox, { backgroundColor: theme.colors.brandLight }]}>
              <Edit3 size={18} color={theme.colors.brand} />
            </View>
            <Text style={styles.actionLabel}>Rename</Text>
          </Pressable>

          <Pressable
            style={styles.actionRow}
            onPress={() => setActiveAction("details")}
          >
            <View style={[styles.actionIconBox, { backgroundColor: "#EFF6FF" }]}>
              <Info size={18} color="#2563EB" />
            </View>
            <Text style={styles.actionLabel}>Details</Text>
          </Pressable>

          <Pressable
            style={styles.actionRow}
            onPress={() => setActiveAction("share")}
          >
            <View style={[styles.actionIconBox, { backgroundColor: "#F5F3FF" }]}>
              <Share2 size={18} color="#7C3AED" />
            </View>
            <Text style={styles.actionLabel}>Share with others</Text>
          </Pressable>

          <Pressable
            style={styles.actionRow}
            onPress={() => {
              setActiveAction("download");
              handleStartDownload();
            }}
          >
            <View style={[styles.actionIconBox, { backgroundColor: "#ECFDF5" }]}>
              <Download size={18} color="#059669" />
            </View>
            <Text style={styles.actionLabel}>Download file</Text>
          </Pressable>

          <Pressable
            style={[styles.actionRow, styles.deleteRow]}
            onPress={() => setActiveAction("delete")}
          >
            <View style={[styles.actionIconBox, { backgroundColor: theme.colors.errorBg }]}>
              <Trash2 size={18} color={theme.colors.error} />
            </View>
            <Text style={[styles.actionLabel, { color: theme.colors.error }]}>
              Delete file
            </Text>
          </Pressable>
        </View>
      )}

      {/* 2. Rename View */}
      {activeAction === "rename" && (
        <View style={styles.subModalContent}>
          <Text style={styles.subModalTitle}>Rename File</Text>
          <Text style={styles.subModalDesc}>
            Enter a new name for your file.
          </Text>

          <TextInput
            value={nameInput}
            onChangeText={setNameInput}
            style={styles.input}
            placeholder="File name"
            placeholderTextColor={theme.colors.mutedText}
            autoFocus
          />

          <View style={styles.buttonRow}>
            <Pressable
              style={styles.cancelBtn}
              onPress={() => setActiveAction(null)}
            >
              <Text style={styles.cancelBtnText}>Back</Text>
            </Pressable>
            <Pressable
              style={styles.primaryBtn}
              onPress={handleSaveRename}
            >
              <Text style={styles.primaryBtnText}>Save Changes</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* 3. Details View */}
      {activeAction === "details" && (
        <View style={styles.subModalContent}>
          <Text style={styles.subModalTitle}>File Details</Text>

          <View style={styles.detailsCard}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Format</Text>
              <Text style={styles.detailValue}>{file.extension.toUpperCase()}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Size</Text>
              <Text style={styles.detailValue}>{convertFileSize(file.size)}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Owner</Text>
              <Text style={styles.detailValue}>{file.owner.fullName}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Uploaded</Text>
              <Text style={styles.detailValue}>{formatDateTime(file.createdAt)}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Shared with</Text>
              <Text style={styles.detailValue}>
                {sharedEmails.length > 0 ? `${sharedEmails.length} users` : "Private"}
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

      {/* 4. Share View */}
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
            <Pressable
              style={styles.addEmailBtn}
              onPress={handleAddEmail}
            >
              <UserPlus size={16} color="#FFFFFF" />
              <Text style={styles.addEmailBtnText}>Share</Text>
            </Pressable>
          </View>

          <Text style={styles.sharedSectionTitle}>
            Users with access ({sharedEmails.length})
          </Text>

          <ScrollView style={styles.emailList} showsVerticalScrollIndicator={false}>
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
              <Text style={styles.noEmailsText}>
                No one has access yet.
              </Text>
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

      {/* 5. Download View */}
      {activeAction === "download" && (
        <View style={styles.subModalContent}>
          <Text style={styles.subModalTitle}>Downloading File</Text>
          <Text style={styles.subModalDesc}>
            Fetching {file.name}.{file.extension.toLowerCase()} from Cloud CDN...
          </Text>

          <View style={styles.progressBarWrapper}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${downloadProgress ?? 0}%` },
              ]}
            />
          </View>

          <Text style={styles.progressPercentText}>
            {downloadProgress !== null && downloadProgress >= 100
              ? "Complete!"
              : `${downloadProgress ?? 0}%`}
          </Text>
        </View>
      )}

      {/* 6. Delete View */}
      {activeAction === "delete" && (
        <View style={styles.subModalContent}>
          <Text style={[styles.subModalTitle, { color: theme.colors.error }]}>
            Delete File?
          </Text>
          <Text style={styles.subModalDesc}>
            Are you sure you want to permanently delete{" "}
            <Text style={{ fontWeight: "800", color: theme.colors.brandDark }}>
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
              style={[styles.primaryBtn, { backgroundColor: theme.colors.error }]}
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
  if (!file) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
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
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(4, 5, 12, 0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: "85%",
  },
  dragBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: "center",
    marginBottom: 14,
  },
  fileSummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
  },
  fileMeta: {
    fontSize: 11,
    color: theme.colors.secondaryText,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: theme.radius.full,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderSubtle,
    marginVertical: 14,
  },
  actionsList: {
    gap: 2,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: theme.radius.md,
    gap: 12,
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  deleteRow: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    paddingTop: 14,
  },
  subModalContent: {
    paddingTop: 4,
  },
  subModalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 6,
  },
  subModalDesc: {
    fontSize: 12.5,
    color: theme.colors.secondaryText,
    lineHeight: 18,
    marginBottom: 16,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    fontSize: 14,
    color: theme.colors.text,
    backgroundColor: theme.colors.surfaceSubtle,
    marginBottom: 18,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.text,
  },
  primaryBtn: {
    flex: 1.3,
    height: 46,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  detailsCard: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.md,
    padding: 14,
    gap: 10,
    marginBottom: 18,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.secondaryText,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 12.5,
    fontWeight: "700",
    color: theme.colors.text,
  },
  backBtnFull: {
    height: 46,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  addEmailRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  addEmailBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: theme.colors.brand,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    justifyContent: "center",
  },
  addEmailBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  sharedSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.secondaryText,
    marginBottom: 8,
  },
  emailList: {
    maxHeight: 140,
    marginBottom: 16,
  },
  emailItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: theme.radius.sm,
    marginBottom: 6,
  },
  emailText: {
    fontSize: 12.5,
    color: theme.colors.text,
    flex: 1,
  },
  removeEmailBtn: {
    padding: 4,
  },
  noEmailsText: {
    fontSize: 12,
    color: theme.colors.mutedText,
    fontStyle: "italic",
    paddingVertical: 8,
  },
  progressBarWrapper: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.borderSubtle,
    overflow: "hidden",
    marginTop: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: theme.colors.brand,
    borderRadius: 4,
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.brandDark,
    textAlign: "center",
    marginTop: 10,
  },
});
