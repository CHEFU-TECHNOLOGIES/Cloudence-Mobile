import { Pressable, Text, View } from "react-native";
import { Plus } from "lucide-react-native";
import { theme } from "../../constants/theme";
import { CloudenceFolder } from "../../lib/api/folders";
import FolderCard from "./FolderCard";
import FolderGridSkeleton from "./skeletons/FolderGridSkeleton";
import { filesScreenStyles as styles } from "./FilesScreen.styles";

type Props = {
    cardWidth: number;
    folders: CloudenceFolder[];
    loading: boolean;
    pendingFolderId?: string;
    onCreate: () => void;
    onOpen: (folder: CloudenceFolder) => void;
    onLongPress: (folder: CloudenceFolder) => void;
};

export default function FolderSectionView({
    cardWidth,
    folders,
    loading,
    pendingFolderId,
    onCreate,
    onOpen,
    onLongPress,
}: Props) {
    return (
        <View style={styles.folderSection}>
            <View style={styles.folderHeading}>
                <Text style={styles.folderHeadingText}>Folders</Text>
                <Pressable
                    onPress={onCreate}
                    style={styles.createFolderButton}
                    accessibilityRole="button"
                    accessibilityLabel="Create folder"
                >
                    <Plus size={14} color={theme.colors.brandDark} />
                    <Text style={styles.createFolderText}>New folder</Text>
                </Pressable>
            </View>
            <View style={styles.folderGrid}>
                {loading ? (
                    <FolderGridSkeleton cardWidth={cardWidth} />
                ) : (
                    folders.map((folder) => (
                        <FolderCard
                            key={folder.id}
                            folder={folder}
                            width={cardWidth}
                            onPress={onOpen}
                            onLongPress={onLongPress}
                            pending={folder.id === pendingFolderId}
                        />
                    ))
                )}
            </View>
        </View>
    );
}
