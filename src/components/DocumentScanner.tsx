import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    Pressable,
    StyleSheet,
} from "react-native";
import { ScanLine } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import {
    launchDocumentScannerAsync,
    ResultFormatOptions,
    ScannerModeOptions,
} from "@infinitered/react-native-mlkit-document-scanner";
import { theme } from "../constants/theme";

type Props = {
    visible: boolean;
    disabled?: boolean;
    onScanned: (asset: DocumentPicker.DocumentPickerAsset) => void;
    onError: (error: Error) => void;
};

export default function DocumentScanner({
    visible,
    disabled = false,
    onScanned,
    onError,
}: Props) {
    const [scanning, setScanning] = useState(false);
    const scanningRef = useRef(false);
    const insets = useSafeAreaInsets();

    if (Platform.OS !== "android" || !visible) return null;

    const scanDocument = async () => {
        if (disabled || scanningRef.current) return;

        scanningRef.current = true;
        setScanning(true);
        try {
            const result = await launchDocumentScannerAsync({
                pageLimit: 30,
                galleryImportAllowed: true,
                scannerMode: ScannerModeOptions.FULL,
                resultFormats: ResultFormatOptions.PDF,
            });
            if (result.canceled) return;
            if (!result.pdf?.uri) {
                throw new Error("The scan did not produce a PDF. Please try again.");
            }

            const scannedFile = new File(result.pdf.uri);
            if (!scannedFile.exists || scannedFile.size <= 0) {
                throw new Error("The scanned PDF could not be read. Please try again.");
            }

            onScanned({
                uri: result.pdf.uri,
                name: `document-scan-${Date.now()}.pdf`,
                mimeType: "application/pdf",
                size: scannedFile.size,
                lastModified: Date.now(),
            });
        } catch (error) {
            onError(
                error instanceof Error
                    ? error
                    : new Error("Document scanning failed. Please try again."),
            );
        } finally {
            scanningRef.current = false;
            setScanning(false);
        }
    };

    const isDisabled = disabled || scanning;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel="Scan document"
            accessibilityState={{ disabled: isDisabled, busy: scanning }}
            disabled={isDisabled}
            onPress={() => void scanDocument()}
            style={({ pressed }) => [
                styles.button,
                { bottom: insets.bottom + 82 },
                pressed && !isDisabled && styles.pressed,
                isDisabled && styles.disabled,
            ]}
        >
            {scanning ? (
                <ActivityIndicator color="#FFFFFF" />
            ) : (
                <ScanLine size={25} color="#FFFFFF" strokeWidth={2.2} />
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        position: "absolute",
        right: 20,
        width: 58,
        height: 58,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.brand,
        ...theme.shadows.floating,
        zIndex: 100,
        elevation: 8,
    },
    pressed: {
        opacity: 0.82,
    },
    disabled: {
        opacity: 0.5,
    },
});
