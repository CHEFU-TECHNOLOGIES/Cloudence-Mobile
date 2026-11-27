
import { File } from "expo-file-system";
import { removeBackground } from "@rbayuokt/expo-background-removal";
import { Platform } from "react-native";

export type ProcessedBackgroundImage = {
    uri: string;
    width: number;
    height: number;
    size: number;
    name: string;
    mimeType: "image/png";
};

export function getBackgroundRemovalUnsupportedReason(): string | null {
    if (Platform.OS === "web") {
        return "Background removal is not supported on web.";
    }

    const iosMajorVersion = Number.parseInt(String(Platform.Version), 10);
    if (Platform.OS === "ios" && iosMajorVersion < 17) {
        return "Background removal requires iOS 17 or later.";
    }

    return null;
}

export async function removeImageBackground(
    imageUri: string,
): Promise<ProcessedBackgroundImage> {
    const unsupportedReason = getBackgroundRemovalUnsupportedReason();
    if (unsupportedReason) {
        throw new Error(unsupportedReason);
    }

    if (!imageUri) {
        throw new Error("No image provided.");
    }

    const result = await removeBackground(imageUri, {
        cropToSubject: false,
        maxDimension: 2048,
    });

    const outputFile = new File(result.uri);
    if (!outputFile.exists || outputFile.size <= 0) {
        throw new Error("The processed PNG could not be read.");
    }

    return {
        uri: result.uri,
        width: result.width,
        height: result.height,
        size: outputFile.size,
        name: `background_removed_${Date.now()}.png`,
        mimeType: "image/png" as const,
    };
}
