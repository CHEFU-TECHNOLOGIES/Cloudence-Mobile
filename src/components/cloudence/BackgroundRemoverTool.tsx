import React, { useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import BackgroundRemover, {
  type BackgroundRemovalSaveResult,
} from "../BackgroundRemover";
import { useCloudenceData } from "../../data/CloudenceDataProvider";
import { theme } from "../../constants/theme";
import type { ProcessedBackgroundImage } from "../../utils/removeBackground";

export default function BackgroundRemoverTool() {
  const [visible, setVisible] = useState(false);
  const { upload } = useCloudenceData();

  const saveProcessedImage = async (
    image: ProcessedBackgroundImage,
  ): Promise<BackgroundRemovalSaveResult> => {
    const uploaded = await upload(
      {
        uri: image.uri,
        name: image.name,
        size: image.size,
        mimeType: image.mimeType,
        lastModified: Date.now(),
      },
      image.name,
    );
    return uploaded.duplicate ? "duplicate" : "uploaded";
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open background remover"
        onPress={() => setVisible(true)}
        style={({ pressed }) => [
          styles.tool,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.copy}>
          <Text style={styles.title}>Background remover</Text>
          <Text style={styles.description}>
            Create a transparent PNG from a photo.
          </Text>
        </View>
        <Text style={styles.action}>Open</Text>
      </Pressable>

      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <SafeAreaView
          style={styles.modal}
          edges={["top", "bottom", "left", "right"]}
        >
          <View style={styles.header}>
            <Text style={styles.heading}>Background remover</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close background remover"
              onPress={() => setVisible(false)}
              hitSlop={8}
              style={styles.close}
            >
              <X size={21} color={theme.colors.secondaryText} />
            </Pressable>
          </View>
          {visible ? <BackgroundRemover onSave={saveProcessedImage} /> : null}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = {
  tool: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  pressed: {
    opacity: 0.8,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700" as const,
  },
  description: {
    color: theme.colors.secondaryText,
    fontSize: 12,
  },
  action: {
    color: theme.colors.brand,
    fontSize: 13,
    fontWeight: "700" as const,
  },
  modal: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  heading: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: "700" as const,
  },
  close: {
    padding: 4,
  },
};
