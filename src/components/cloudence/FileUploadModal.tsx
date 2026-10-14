import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Film,
  Package,
  X,
} from "lucide-react-native";
import { CloudFile, FileCategory } from "../../types/file";
import { theme } from "../../constants/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  onFileUploaded: (file: CloudFile) => void;
};

const categoryPresets: {
  category: FileCategory;
  extension: string;
  type: "document" | "image" | "video" | "audio" | "other";
  icon: any;
  color: string;
  bg: string;
  size: number;
}[] = [
  {
    category: "Documents",
    extension: "PDF",
    type: "document",
    icon: FileText,
    color: theme.colors.documents.color,
    bg: theme.colors.documents.background,
    size: 1.8 * 1024 * 1024,
  },
  {
    category: "Images",
    extension: "PNG",
    type: "image",
    icon: ImageIcon,
    color: theme.colors.images.color,
    bg: theme.colors.images.background,
    size: 2.9 * 1024 * 1024,
  },
  {
    category: "Media",
    extension: "MP4",
    type: "video",
    icon: Film,
    color: theme.colors.media.color,
    bg: theme.colors.media.background,
    size: 14.5 * 1024 * 1024,
  },
  {
    category: "Others",
    extension: "ZIP",
    type: "other",
    icon: Package,
    color: theme.colors.others.color,
    bg: theme.colors.others.background,
    size: 6.2 * 1024 * 1024,
  },
];

export default function FileUploadModal({
  visible,
  onClose,
  onFileUploaded,
}: Props) {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const activePreset = categoryPresets[selectedPresetIndex];

  const handleUpload = () => {
    const title = fileName.trim() || `New_${activePreset.category}_File`;
    setUploading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const newFile: CloudFile = {
              id: `file_${Date.now()}`,
              name: title,
              extension: activePreset.extension,
              type: activePreset.type,
              category: activePreset.category,
              size: activePreset.size,
              sizeFormatted: `${(activePreset.size / (1024 * 1024)).toFixed(1)} MB`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              owner: {
                id: "user_cur",
                fullName: "Alex Morgan",
                email: "alex.morgan@cloudence.io",
              },
              users: [],
              color: activePreset.color,
            };

            onFileUploaded(newFile);
            setUploading(false);
            setProgress(0);
            setFileName("");
            onClose();
          }, 350);
          return 100;
        }
        return prev + 40;
      });
    }, 180);
  };

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
            <View style={styles.sheet}>
              <View style={styles.header}>
                <View style={styles.titleRow}>
                  <View style={styles.iconCircle}>
                    <Upload size={18} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.title}>Upload to Cloudence</Text>
                    <Text style={styles.subtitle}>Max 50MB per file</Text>
                  </View>
                </View>

                <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
                  <X size={18} color={theme.colors.secondaryText} />
                </Pressable>
              </View>

              {!uploading ? (
                <>
                  <Text style={styles.label}>Select File Category</Text>
                  <View style={styles.presetsGrid}>
                    {categoryPresets.map((preset, idx) => {
                      const Icon = preset.icon;
                      const isSelected = selectedPresetIndex === idx;

                      return (
                        <Pressable
                          key={preset.category}
                          onPress={() => setSelectedPresetIndex(idx)}
                          style={[
                            styles.presetItem,
                            isSelected && {
                              borderColor: preset.color,
                              backgroundColor: preset.bg,
                            },
                          ]}
                        >
                          <Icon size={20} color={preset.color} />
                          <Text
                            style={[
                              styles.presetText,
                              isSelected && { color: preset.color, fontWeight: "700" },
                            ]}
                          >
                            {preset.category}
                          </Text>
                          <Text style={styles.presetExt}>.{preset.extension.toLowerCase()}</Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={styles.label}>File Name</Text>
                  <TextInput
                    value={fileName}
                    onChangeText={setFileName}
                    placeholder={`e.g. Project_Brief_${activePreset.extension}`}
                    placeholderTextColor={theme.colors.mutedText}
                    style={styles.input}
                  />

                  <View style={styles.footerButtons}>
                    <Pressable style={styles.cancelBtn} onPress={onClose}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </Pressable>

                    <Pressable style={styles.uploadSubmitBtn} onPress={handleUpload}>
                      <Upload size={16} color="#FFFFFF" strokeWidth={2.4} />
                      <Text style={styles.uploadSubmitBtnText}>Upload Now</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <View style={styles.uploadingBox}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.uploadingTitle}>Encrypting & Uploading...</Text>
                    <Text style={styles.progressPercent}>{progress}%</Text>
                  </View>

                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                  </View>

                  <Text style={styles.progressNote}>
                    Uploading to Cloudence secure vault via Cloudinary CDN
                  </Text>
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
    backgroundColor: "rgba(4, 5, 12, 0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 34,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.secondaryText,
    marginBottom: 8,
  },
  presetsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  presetItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    gap: 4,
  },
  presetText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.text,
  },
  presetExt: {
    fontSize: 9,
    color: theme.colors.secondaryText,
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
    marginBottom: 20,
  },
  footerButtons: {
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
  uploadSubmitBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  uploadingBox: {
    paddingVertical: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  uploadingTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.brandDark,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.borderSubtle,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.brand,
    borderRadius: 4,
  },
  progressNote: {
    fontSize: 11,
    color: theme.colors.secondaryText,
    marginTop: 10,
    textAlign: "center",
  },
});
