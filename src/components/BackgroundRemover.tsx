import React, { useState } from "react";
import {
    Text,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    StyleSheet,
    ScrollView,
    useColorScheme,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import {
    getBackgroundRemovalUnsupportedReason,
    removeImageBackground,
    type ProcessedBackgroundImage,
} from "../utils/removeBackground";

export type BackgroundRemovalSaveResult = "uploaded" | "duplicate";

interface Props {
    onSave: (file: ProcessedBackgroundImage) => Promise<BackgroundRemovalSaveResult>;
}

export default function BackgroundRemover({ onSave }: Props) {
    const [originalUri, setOriginalUri] = useState<string | null>(null);
    const [result, setResult] = useState<ProcessedBackgroundImage | null>(null);
    const [processing, setProcessing] = useState(false);
    const [saving, setSaving] = useState(false);

    const dark = useColorScheme() === "dark";
    const busy = processing || saving;
    const unsupportedReason = getBackgroundRemovalUnsupportedReason();

    const selectImage = async () => {
        try {
            const picked = await DocumentPicker.getDocumentAsync({
                type: "image/*",
                copyToCacheDirectory: true,
                multiple: false,
            });

            const asset = picked.assets?.[0];
            if (!picked.canceled && asset) {
                setOriginalUri(asset.uri);
                setResult(null);
            }
        } catch {
            Alert.alert("Error", "Unable to select an image.");
        }
    };

    const handleRemoveBackground = async () => {
        if (!originalUri || busy || unsupportedReason) return;

        try {
            setProcessing(true);
            setResult(null);

            const output = await removeImageBackground(originalUri);
            setResult(output);
        } catch (error: unknown) {
            console.error("Background removal failed:", error);

            const errorCode =
                error instanceof Error &&
                "code" in error &&
                typeof error.code === "string"
                    ? error.code
                    : null;
            Alert.alert(
                "Background removal",
                errorCode === "NO_SUBJECT_FOUND"
                    ? "No foreground subject was detected. Try another image."
                    : errorCode === "UNSUPPORTED_OS" || unsupportedReason
                      ? unsupportedReason ??
                        "Background removal is not supported on this device."
                      : "Unable to process this image. On Android, the model may need an internet connection the first time.",
            );
        } finally {
            setProcessing(false);
        }
    };

    const handleSave = async () => {
        if (!result || !onSave || busy) return;

        try {
            setSaving(true);
            const saveResult = await onSave(result);
            Alert.alert(
                saveResult === "duplicate" ? "Already uploaded" : "Success",
                saveResult === "duplicate"
                    ? "An identical image is already in your Cloudence storage."
                    : "The transparent PNG was uploaded to Cloudence.",
            );
        } catch (error: unknown) {
            Alert.alert(
                "Unable to upload image",
                error instanceof Error
                    ? error.message
                    : "Please try again.",
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <ScrollView
            style={[
                styles.container,
                { backgroundColor: dark ? "#121212" : "#FFFFFF" },
            ]}
            contentContainerStyle={styles.content}
        >
            <Text
                style={[styles.title, { color: dark ? "#FFFFFF" : "#111827" }]}
            >
                Remove Background
            </Text>

            <Text style={styles.description}>
                Separate people and objects from their backgrounds.
            </Text>

            {unsupportedReason ? (
                <Text style={styles.unsupported}>{unsupportedReason}</Text>
            ) : null}

            <TouchableOpacity
                style={[styles.button, unsupportedReason && styles.disabled]}
                onPress={selectImage}
                disabled={busy || Boolean(unsupportedReason)}
            >
                <Text style={styles.buttonText}>
                    {originalUri ? "Change Image" : "Choose Image"}
                </Text>
            </TouchableOpacity>

            {originalUri && (
                <>
                    <Text style={styles.label}>Original image</Text>

                    <Image
                        source={{ uri: originalUri }}
                        style={styles.preview}
                        resizeMode="contain"
                    />

                    <TouchableOpacity
                        style={[styles.button, busy && styles.disabled]}
                        onPress={handleRemoveBackground}
                        disabled={busy || Boolean(unsupportedReason)}
                    >
                        {processing ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>
                                Remove Background
                            </Text>
                        )}
                    </TouchableOpacity>
                </>
            )}

            {result && (
                <>
                    <Text style={styles.label}>Processed image</Text>

                    <Image
                        source={{ uri: result.uri }}
                        style={styles.preview}
                        resizeMode="contain"
                    />

                    <Text style={styles.description}>
                        PNG · {result.width} × {result.height}
                    </Text>

                    <TouchableOpacity
                        style={[styles.saveButton, busy && styles.disabled]}
                        onPress={handleSave}
                        disabled={busy}
                    >
                        {saving ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>
                                Upload to Cloudence
                            </Text>
                        )}
                    </TouchableOpacity>
                </>
            )}

            <Text style={styles.footer}>
                Images are processed locally on your device.
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
        gap: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
    },
    description: {
        fontSize: 14,
        color: "#9CA3AF",
    },
    label: {
        color: "#9CA3AF",
        fontSize: 14,
        fontWeight: "600",
    },
    preview: {
        width: "100%",
        height: 300,
        backgroundColor: "#D1D5DB",
        borderRadius: 12,
    },
    button: {
        backgroundColor: "#2563EB",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    saveButton: {
        backgroundColor: "#16A34A",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    buttonText: {
        color: "#FFFFFF",
        fontWeight: "600",
        fontSize: 16,
    },
    disabled: {
        opacity: 0.6,
    },
    unsupported: {
        color: "#B45309",
        fontSize: 13,
        lineHeight: 19,
        padding: 12,
        borderRadius: 10,
        backgroundColor: "#FEF3C7",
    },
    footer: {
        fontSize: 12,
        textAlign: "center",
        color: "#9CA3AF",
        marginTop: 8,
    },
});
