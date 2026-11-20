import React, { useMemo, useState } from "react";
import {
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
    Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowDownUp } from "lucide-react-native";

import AppHeader from "../../components/cloudence/AppHeader";
import SearchBar from "../../components/cloudence/SearchBar";
import FileCard from "../../components/cloudence/FileCard";
import FileRow from "../../components/cloudence/FileRow";
import EmptyState from "../../components/cloudence/EmptyState";
import ViewToggle from "../../components/cloudence/ViewToggle";
import SortModal from "../../components/cloudence/SortModal";
import FileActionModal from "../../components/cloudence/FileActionModal";
import FileUploadModal from "../../components/cloudence/FileUploadModal";
import WorkspaceStatus from "../../components/cloudence/WorkspaceStatus";

import { useCloudenceData } from "../../data/CloudenceDataProvider";
import { theme } from "../../constants/theme";
import { CloudFile, SortType, ViewType } from "../../types/file";
import { convertFileSize, sortFiles } from "../../utils/fileUtils";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import * as DocumentPicker from "expo-document-picker";

export default function MediaScreen() {
    const layout = useResponsiveLayout();
    const {
        files,
        isLoading,
        isOffline,
        error,
        refresh,
        rename,
        remove,
        share,
        upload,
        download,
        uploadProgress,
        cancelUpload,
        cancelDownload,
    } = useCloudenceData();
    const [query, setQuery] = useState("");
    const [currentSort, setCurrentSort] = useState<SortType>("$createdAt-desc");
    const [currentView, setCurrentView] = useState<ViewType>("grid");
    const [isSortModalVisible, setIsSortModalVisible] = useState(false);
    const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
    const [selectedFileForAction, setSelectedFileForAction] =
        useState<CloudFile | null>(null);
    const [isActionModalVisible, setIsActionModalVisible] = useState(false);

    const itemWidth = layout.cardWidth;

    const mediaFiles = useMemo(() => {
        const filtered = files.filter(
            (file) =>
                file.category === "Media" &&
                `${file.name} ${file.extension}`
                    .toLowerCase()
                    .includes(query.trim().toLowerCase()),
        );
        return sortFiles(filtered, currentSort);
    }, [files, query, currentSort]);

    const totalMediaBytes = useMemo(() => {
        return mediaFiles.reduce((acc, f) => acc + f.size, 0);
    }, [mediaFiles]);

    const handleOpenFile = (file: CloudFile) => {
        setSelectedFileForAction(file);
        setIsActionModalVisible(true);
    };

    const handleDelete = async (fileId: string) => {
        await remove(fileId);
        Alert.alert("Media Deleted", "The media file was removed.");
    };

    const handleFileUploaded = async (
        asset: DocumentPicker.DocumentPickerAsset,
        name?: string,
    ) => {
        await upload(asset, name);
    };

    return (
        <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
            <StatusBar barStyle="dark-content" />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[
                    styles.content,
                    {
                        width: "100%",
                        maxWidth: layout.contentMaxWidth,
                        alignSelf: "center",
                        paddingHorizontal: layout.horizontalPadding,
                    },
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <AppHeader onUpload={() => setIsUploadModalVisible(true)} />

                <Text style={styles.title}>Video & Audio</Text>
                <Text style={styles.subtitle}>
                    Accelerated cloud streaming with adaptive bitrate playback.
                </Text>

                <WorkspaceStatus
                    loading={isLoading}
                    error={error}
                    offline={isOffline}
                    onRetry={refresh}
                />

                <View style={styles.searchSection}>
                    <SearchBar value={query} onChangeText={setQuery} />
                </View>

                {/* Controls */}
                <View style={styles.controlBar}>
                    <View>
                        <Text style={styles.totalLabel}>
                            Total:{" "}
                            <Text style={styles.totalValue}>
                                {convertFileSize(totalMediaBytes)}
                            </Text>
                        </Text>
                        <Text style={styles.countLabel}>
                            {mediaFiles.length} media files
                        </Text>
                    </View>

                    <View style={styles.rightControls}>
                        <Pressable
                            onPress={() => setIsSortModalVisible(true)}
                            style={styles.sortButton}
                        >
                            <ArrowDownUp size={14} color={theme.colors.brand} />
                            <Text style={styles.sortButtonText}>Sort</Text>
                        </Pressable>

                        <ViewToggle
                            view={currentView}
                            onChange={setCurrentView}
                        />
                    </View>
                </View>

                {/* Files Display */}
                {mediaFiles.length > 0 ? (
                    currentView === "grid" ? (
                        <View style={styles.gridContainer}>
                            {mediaFiles.map((file) => (
                                <FileCard
                                    key={file.id}
                                    file={file}
                                    width={itemWidth}
                                    onPress={handleOpenFile}
                                    onMore={handleOpenFile}
                                />
                            ))}
                        </View>
                    ) : (
                        <View style={styles.listContainer}>
                            {mediaFiles.map((file, idx) => (
                                <FileRow
                                    key={file.id}
                                    file={file}
                                    onPress={handleOpenFile}
                                    onMore={handleOpenFile}
                                    isLast={idx === mediaFiles.length - 1}
                                />
                            ))}
                        </View>
                    )
                ) : !isLoading && !error ? (
                    <EmptyState
                        title="No media found"
                        message="Upload MP4, WebM, MP3, or WAV audio files to stream."
                    />
                ) : null}
            </ScrollView>

            {/* Modals */}
            <SortModal
                visible={isSortModalVisible}
                selectedSort={currentSort}
                onSelect={setCurrentSort}
                onClose={() => setIsSortModalVisible(false)}
            />

            <FileActionModal
                visible={isActionModalVisible}
                file={selectedFileForAction}
                onClose={() => setIsActionModalVisible(false)}
                onRename={rename}
                onDelete={handleDelete}
                onShare={share}
                onDownload={download}
                onCancelDownload={cancelDownload}
            />

            <FileUploadModal
                visible={isUploadModalVisible}
                onClose={() => setIsUploadModalVisible(false)}
                onFileUploaded={handleFileUploaded}
                uploadProgress={uploadProgress}
                onCancelUpload={cancelUpload}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scroll: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 36,
    },
    title: {
        fontSize: 27,
        fontWeight: "800",
        color: theme.colors.text,
        letterSpacing: -0.7,
        marginTop: 4,
    },
    subtitle: {
        fontSize: 12.5,
        color: theme.colors.secondaryText,
        marginTop: 4,
    },
    searchSection: {
        marginTop: 16,
        marginBottom: 16,
    },
    controlBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderSubtle,
    },
    totalLabel: {
        fontSize: 12.5,
        color: theme.colors.secondaryText,
    },
    totalValue: {
        fontWeight: "800",
        color: theme.colors.text,
    },
    countLabel: {
        fontSize: 11,
        color: theme.colors.mutedText,
        marginTop: 2,
    },
    rightControls: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    sortButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    sortButtonText: {
        fontSize: 11.5,
        fontWeight: "700",
        color: theme.colors.brand,
    },
    gridContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    listContainer: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: "rgba(66, 71, 97, 0.05)",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
    },
});
