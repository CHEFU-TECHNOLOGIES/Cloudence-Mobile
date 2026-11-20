import {
    FileText,
    Film,
    Image as ImageIcon,
    Music,
    Package,
} from "lucide-react-native";
import { theme } from "../../constants/theme";
import { CloudFile } from "../../types/file";

export const getFileIconDetails = (file: CloudFile) => {
    switch (file.category) {
        case "Documents":
            return {
                icon: FileText,
                color: theme.colors.documents.color,
                background: theme.colors.documents.background,
                border: theme.colors.documents.border,
            };
        case "Images":
            return {
                icon: ImageIcon,
                color: theme.colors.images.color,
                background: theme.colors.images.background,
                border: theme.colors.images.border,
            };
        case "Media":
            return {
                icon: file.type === "audio" ? Music : Film,
                color: theme.colors.media.color,
                background: theme.colors.media.background,
                border: theme.colors.media.border,
            };
        default:
            return {
                icon: Package,
                color: theme.colors.others.color,
                background: theme.colors.others.background,
                border: theme.colors.others.border,
            };
    }
};
