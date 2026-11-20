import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { FileText, Upload, X } from "lucide-react-native";
import { theme } from "../../constants/theme";
import { convertFileSize } from "../../utils/fileUtils";
import { useToast } from "./ToastProvider";

type Props = {
  visible: boolean;
  onClose: () => void;
  onFileUploaded: (
    asset: DocumentPicker.DocumentPickerAsset,
    name?: string,
  ) => Promise<void>;
  uploadProgress?: number | null;
  onCancelUpload?: () => void;
};

function messageFromError(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The file could not be uploaded.";
}

export default function FileUploadModal({
  visible,
  onClose,
  onFileUploaded,
  uploadProgress = null,
  onCancelUpload,
}: Props) {
  const { width, height } = useWindowDimensions();
  const { showToast } = useToast();
  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uploadingRef = useRef(false);

  const chooseFile = async () => {
    setError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: "*/*",
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      setSelectedFile(asset);
      setFileName("");
    } catch (pickerError) {
      const message = messageFromError(pickerError);
      setError(message);
      showToast({ title: "Could not choose file", message, variant: "error" });
    }
  };

  const handleUpload = async () => {
    if (uploadingRef.current) return;
    if (!selectedFile) {
      const message = "Choose a file before uploading.";
      setError(message);
      showToast({ title: "No file selected", message, variant: "error" });
      return;
    }

    uploadingRef.current = true;
    setUploading(true);
    setError(null);
    try {
      await onFileUploaded(selectedFile, fileName.trim() || undefined);
      setSelectedFile(null);
      setFileName("");
      onClose();
    } catch (uploadError) {
      const cancelled =
        uploadError instanceof Error && uploadError.name === "AbortError";
      const message = cancelled
        ? "Upload cancelled."
        : messageFromError(uploadError);
      setError(message);
      if (!cancelled) {
        showToast({ title: "Upload failed", message, variant: "error" });
      }
    } finally {
      uploadingRef.current = false;
      setUploading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={uploading ? undefined : onClose}>
        <View style={[styles.overlay, width >= 600 && styles.tabletOverlay]}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.sheet,
                {
                  maxHeight: height * 0.9,
                  width: width >= 600 ? 560 : "100%",
                },
              ]}
            >
              <View style={styles.header}>
                <View style={styles.titleRow}>
                  <View style={styles.iconCircle}>
                    <Upload size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.headerText}>
                    <Text style={styles.title}>Upload to Cloudence</Text>
                    <Text style={styles.subtitle}>Files up to 50 MB</Text>
                  </View>
                </View>

                <Pressable
                  onPress={onClose}
                  disabled={uploading}
                  hitSlop={8}
                  style={styles.closeBtn}
                  accessibilityLabel="Close upload"
                >
                  <X size={18} color={theme.colors.secondaryText} />
                </Pressable>
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.body}
              >
                <Text style={styles.label}>Choose a file</Text>
                <Pressable
                  onPress={() => void chooseFile()}
                  disabled={uploading}
                  style={({ pressed }) => [
                    styles.filePicker,
                    pressed && styles.pressed,
                  ]}
                >
                  <FileText size={20} color={theme.colors.brand} />
                  <View style={styles.fileDetails}>
                    <Text numberOfLines={1} style={styles.fileTitle}>
                      {selectedFile?.name ?? "Browse files on this device"}
                    </Text>
                    <Text style={styles.fileSubtitle}>
                      {selectedFile?.size === undefined
                        ? "Choose any supported file"
                        : convertFileSize(selectedFile.size)}
                    </Text>
                  </View>
                </Pressable>

                {selectedFile && (
                  <>
                    <Text style={styles.label}>Optional file name</Text>
                    <TextInput
                      value={fileName}
                      onChangeText={setFileName}
                      placeholder="Keep the original name"
                      placeholderTextColor={theme.colors.mutedText}
                      style={styles.input}
                      editable={!uploading}
                      autoCapitalize="none"
                    />
                  </>
                )}

                {error && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
              </ScrollView>

              {uploading ? (
                <View style={styles.uploadingBox}>
                  <View style={styles.uploadingStatus}>
                    <ActivityIndicator color={theme.colors.brand} />
                    <Text style={styles.uploadingText}>
                      {uploadProgress === null
                        ? "Uploading your file…"
                        : `Uploading your file… ${uploadProgress}%`}
                    </Text>
                  </View>
                  {uploadProgress !== null && (
                    <View
                      style={styles.progressTrack}
                      accessibilityRole="progressbar"
                      accessibilityValue={{
                        min: 0,
                        max: 100,
                        now: uploadProgress,
                      }}
                    >
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${uploadProgress}%` },
                        ]}
                      />
                    </View>
                  )}
                  <Pressable
                    onPress={onCancelUpload}
                    style={styles.cancelUploadButton}
                  >
                    <Text style={styles.cancelBtnText}>Cancel upload</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.footerButtons}>
                  <Pressable style={styles.cancelBtn} onPress={onClose}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.uploadSubmitBtn,
                      !selectedFile && styles.disabledButton,
                    ]}
                    disabled={!selectedFile}
                    onPress={() => void handleUpload()}
                  >
                    <Upload size={16} color="#FFFFFF" strokeWidth={2.4} />
                    <Text style={styles.uploadSubmitBtnText}>Upload file</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(4, 5, 12, 0.45)",
  },
  tabletOverlay: {
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  sheet: {
    alignSelf: "center",
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: theme.colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 11,
    color: theme.colors.secondaryText,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    paddingBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.secondaryText,
    marginBottom: 8,
  },
  filePicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSubtle,
    minHeight: 68,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  fileDetails: {
    flex: 1,
    minWidth: 0,
  },
  fileTitle: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  fileSubtitle: {
    color: theme.colors.secondaryText,
    fontSize: 11,
    marginTop: 3,
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
    marginBottom: 12,
  },
  errorBox: {
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: theme.radius.sm,
    backgroundColor: "#FEF2F2",
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    lineHeight: 18,
  },
  footerButtons: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 12,
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
  uploadSubmitBtn: {
    flex: 1.5,
    height: 46,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brand,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  disabledButton: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.82,
  },
  uploadSubmitBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  uploadingBox: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
  },
  uploadingStatus: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  progressTrack: {
    width: "100%",
    height: 6,
    overflow: "hidden",
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.borderSubtle,
  },
  progressFill: {
    height: "100%",
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brand,
  },
  cancelUploadButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  uploadingText: {
    color: theme.colors.secondaryText,
    fontSize: 13,
    fontWeight: "600",
  },
});
