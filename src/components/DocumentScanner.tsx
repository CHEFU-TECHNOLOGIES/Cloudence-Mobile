
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
} from "react-native";

import {
  launchDocumentScannerAsync,
  ScannerModeOptions,
  ResultFormatOptions,
} from "@infinitered/react-native-mlkit-document-scanner";

export default function DocumentScanner() {
  const [scanning, setScanning] = useState(false);

  const scanDocument = async () => {
    if (Platform.OS !== "android") {
      Alert.alert(
        "Not supported",
        "This scanner is currently available on Android."
      );
      return;
    }

    try {
      setScanning(true);

      const result = await launchDocumentScannerAsync({
        pageLimit: 30,
        galleryImportAllowed: true,
        scannerMode: ScannerModeOptions.FULL,
        resultFormats: ResultFormatOptions.ALL,
      });

      console.log("Scanner result:", result);

    } catch (error) {
      console.error("Scanning error:", error);

      Alert.alert(
        "Scanner",
        "Scanning was interrupted or could not be completed."
      );
    } finally {
      setScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={scanDocument}
        disabled={scanning}
      >
        {scanning ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>
            Scan Document
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  button: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
