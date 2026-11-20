import React, { useEffect, useState } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { CloudFile } from "../../types/file";
import { getApiUrl, getAuthHeaders } from "../../lib/api/client";
import { useSession } from "../../auth/SessionContext";
import { getFileIconDetails } from "./fileIconDetails";

type Props = {
  file: CloudFile;
  style?: StyleProp<ViewStyle>;
};

export default function FileThumbnail({ file, style }: Props) {
  const { getAccessToken: getSessionToken, user } = useSession();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const iconDetails = getFileIconDetails(file);
  const Icon = iconDetails.icon;
  const previewUrl =
    file.type === "image"
      ? getApiUrl(
          `/cloudence/files/${encodeURIComponent(file.id)}/content?preview=1`,
        )
      : undefined;

  useEffect(() => {
    if (!previewUrl) return;
    let isCurrent = true;
    void getSessionToken()
      .then((token) => {
        if (isCurrent) setAccessToken(token);
      })
      .catch(() => undefined);
    return () => {
      isCurrent = false;
    };
  }, [getSessionToken, previewUrl]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: iconDetails.background,
          borderColor: iconDetails.border,
        },
        style,
      ]}
    >
      <View
        style={[styles.fallback, { backgroundColor: iconDetails.background }]}
      >
        <Icon size={20} color={iconDetails.color} strokeWidth={2.2} />
        <Text style={[styles.extension, { color: iconDetails.color }]}>
          {file.extension.toUpperCase()}
        </Text>
      </View>
      {previewUrl && accessToken && !previewFailed && (
        <Image
          source={{
            uri: previewUrl,
            headers: getAuthHeaders(accessToken),
            cacheKey: `${user?.id ?? "account"}:${file.id}:preview`,
          }}
          style={styles.preview}
          contentFit="cover"
          cachePolicy="memory"
          transition={120}
          accessibilityLabel={`Preview of ${file.name}`}
          onError={() => setPreviewFailed(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  fallback: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  preview: {
    ...StyleSheet.absoluteFill,
    borderRadius: 11,
  },
  extension: {
    fontSize: 7,
    fontWeight: "900",
    marginTop: 1,
  },
});
