import { styles } from "./FileUploadModal.styles";
import React, { useRef, useState } from "react";
import {
  Pressable,
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { FileText, Upload, X } from "lucide-react-native";
import { theme } from "../../constants/theme";
import { useToast } from "./ToastProvider";
import UploadQueueList, { type UploadQueueItem } from "./UploadQueueList";

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

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

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
    const [queue, setQueue] = useState<UploadQueueItem[]>([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const uploadingRef = useRef(false);

    const chooseFile = async () => {
        setError(null);
        try {
            const result = await DocumentPicker.getDocumentAsync({
                copyToCacheDirectory: true,
                multiple: true,
                type: "*/*",
            });
            if (result.canceled) return;

            setQueue((current) => {
                const knownUris = new Set(current.map((item) => item.asset.uri));
                const newItems: UploadQueueItem[] = [];
                for (const asset of result.assets) {
                    if (knownUris.has(asset.uri)) continue;
                    knownUris.add(asset.uri);
                    newItems.push({
                        id: `${asset.uri}:${Date.now()}:${Math.random()}`,
                        asset,
                        uploadName: "",
                        status:
                            asset.size !== undefined && asset.size > MAX_UPLOAD_BYTES
                                ? "invalid"
                                : "queued",
                    });
                }
                return [
                    ...current,
                    ...newItems,
                ];
            });
        } catch (pickerError) {
            const message = messageFromError(pickerError);
            setError(message);
            showToast({
                title: "Could not choose file",
                message,
                variant: "error",
            });
        }
    };

    const handleUpload = async () => {
        if (uploadingRef.current) return;
        const queuedItems = queue.filter((item) => item.status === "queued");
        if (!queuedItems.length) {
            const message = "Add files to the queue before uploading.";
            setError(message);
            showToast({ title: "No file selected", message, variant: "error" });
            return;
        }

        uploadingRef.current = true;
        setUploading(true);
        setError(null);
        let wasCancelled = false;
        let hadFailure = false;
        try {
            for (const item of queuedItems) {
                setQueue((current) =>
                    current.map((queued) =>
                        queued.id === item.id
                            ? { ...queued, status: "uploading" }
                            : queued,
                    ),
                );
                try {
                    await onFileUploaded(
                        item.asset,
                        item.uploadName.trim() || undefined,
                    );
                    setQueue((current) =>
                        current.filter((queued) => queued.id !== item.id),
                    );
                } catch (uploadError) {
                    const cancelled =
                        uploadError instanceof Error &&
                        uploadError.name === "AbortError";
                    if (cancelled) wasCancelled = true;
                    else hadFailure = true;
                    setQueue((current) =>
                        current.map((queued) =>
                            queued.id === item.id
                                ? {
                                      ...queued,
                                      status: cancelled ? "queued" : "failed",
                                  }
                                : queued,
                        ),
                    );
                    if (cancelled) break;
                    const message = messageFromError(uploadError);
                    setError(message);
                    showToast({
                        title: "Upload failed",
                        message,
                        variant: "error",
                    });
                }
            }
            if (
                !wasCancelled &&
                !hadFailure &&
                !queue.some((item) => item.status === "failed")
            )
                onClose();
        } finally {
            uploadingRef.current = false;
            setUploading(false);
        }
    };

    const retryUpload = async (id: string) => {
        const item = queue.find((queued) => queued.id === id);
        if (!item || uploadingRef.current) return;
        uploadingRef.current = true;
        setUploading(true);
        setQueue((current) =>
            current.map((queued) =>
                queued.id === id ? { ...queued, status: "uploading" } : queued,
            ),
        );
        try {
            await onFileUploaded(
                item.asset,
                item.uploadName.trim() || undefined,
            );
            setQueue((current) =>
                current.filter((queued) => queued.id !== id),
            );
        } catch (retryError) {
            const cancelled =
                retryError instanceof Error && retryError.name === "AbortError";
            const message = messageFromError(retryError);
            setQueue((current) =>
                current.map((queued) =>
                    queued.id === id
                        ? { ...queued, status: cancelled ? "queued" : "failed" }
                        : queued,
                ),
            );
            if (!cancelled)
                showToast({ title: "Retry failed", message, variant: "error" });
        } finally {
            uploadingRef.current = false;
            setUploading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View
                style={[
                    styles.overlay,
                    width >= 600 && styles.tabletOverlay,
                ]}
            >
                <Pressable
                    accessibilityLabel="Close upload dialog"
                    disabled={uploading}
                    onPress={onClose}
                    style={StyleSheet.absoluteFill}
                />
                <View
                    style={[
                        styles.sheet,
                        {
                            maxHeight: height * 0.65,
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
                                        <Text style={styles.title}>
                                            Upload to Cloudence
                                        </Text>
                                        <Text style={styles.subtitle}>
                                            Size limits vary by file type
                                        </Text>
                                    </View>
                                </View>

                                <Pressable
                                    onPress={onClose}
                                    disabled={uploading}
                                    hitSlop={8}
                                    style={styles.closeBtn}
                                    accessibilityLabel="Close upload"
                                >
                                    <X
                                        size={18}
                                        color={theme.colors.secondaryText}
                                    />
                                </Pressable>
                            </View>

                            <ScrollView
                                style={styles.bodyScroll}
                                nestedScrollEnabled
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.body}
                            >
                                <Text style={styles.label}>Upload queue</Text>
                                <Pressable
                                    onPress={() => void chooseFile()}
                                    disabled={uploading}
                                    style={({ pressed }) => [
                                        styles.filePicker,
                                        pressed && styles.pressed,
                                    ]}
                                >
                                    <FileText
                                        size={20}
                                        color={theme.colors.brand}
                                    />
                                    <View style={styles.fileDetails}>
                                        <Text
                                            numberOfLines={1}
                                            style={styles.fileTitle}
                                        >
                                            {queue.length
                                                ? "Add more files"
                                                : "Choose files from this device"}
                                        </Text>
                                        <Text style={styles.fileSubtitle}>
                                            {`${queue.length} ${queue.length === 1 ? "file" : "files"} in queue`}
                                        </Text>
                                    </View>
                                </Pressable>

                                <UploadQueueList
                                    items={queue}
                                    disabled={uploading}
                                    onRemove={(id) =>
                                        setQueue((current) =>
                                            current.filter(
                                                (item) => item.id !== id,
                                            ),
                                        )
                                    }
                                    onRetry={(id) => void retryUpload(id)}
                                    onNameChange={(id, uploadName) =>
                                        setQueue((current) =>
                                            current.map((item) =>
                                                item.id === id
                                                    ? { ...item, uploadName }
                                                    : item,
                                            ),
                                        )
                                    }
                                />

                                {error && (
                                    <View style={styles.errorBox}>
                                        <Text style={styles.errorText}>
                                            {error}
                                        </Text>
                                    </View>
                                )}
                            </ScrollView>

                            {uploading ? (
                                <View style={styles.uploadingBox}>
                                    <View style={styles.uploadingStatus}>
                                        <ActivityIndicator
                                            color={theme.colors.brand}
                                        />
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
                                                    {
                                                        width: `${uploadProgress}%`,
                                                    },
                                                ]}
                                            />
                                        </View>
                                    )}
                                    <Pressable
                                        onPress={onCancelUpload}
                                        style={styles.cancelUploadButton}
                                    >
                                        <Text style={styles.cancelBtnText}>
                                            Cancel upload
                                        </Text>
                                    </Pressable>
                                </View>
                            ) : (
                                <View style={styles.footerButtons}>
                                    <Pressable
                                        style={styles.cancelBtn}
                                        onPress={onClose}
                                    >
                                        <Text style={styles.cancelBtnText}>
                                            Cancel
                                        </Text>
                                    </Pressable>
                                    <Pressable
                                        style={[
                                            styles.uploadSubmitBtn,
                                            !queue.some(
                                                (item) =>
                                                    item.status === "queued",
                                            ) && styles.disabledButton,
                                        ]}
                                        disabled={
                                            !queue.some(
                                                (item) =>
                                                    item.status === "queued",
                                            )
                                        }
                                        onPress={() => void handleUpload()}
                                    >
                                        <Upload
                                            size={16}
                                            color="#FFFFFF"
                                            strokeWidth={2.4}
                                        />
                                        <Text
                                            style={styles.uploadSubmitBtnText}
                                        >
                                            Upload{" "}
                                            {
                                                queue.filter(
                                                    (item) =>
                                                        item.status ===
                                                        "queued",
                                                ).length
                                            }{" "}
                                            files
                                        </Text>
                                    </Pressable>
                                </View>
                            )}
                </View>
            </View>
        </Modal>
    );
}
