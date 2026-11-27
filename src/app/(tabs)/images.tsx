import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  RefreshControl,
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
import BulkFileSelectionActions from "../../components/cloudence/BulkFileSelectionActions";
import WorkspaceStatus from "../../components/cloudence/WorkspaceStatus";
import FileCollectionSkeleton from "../../components/cloudence/skeletons/FileCollectionSkeleton";
import { useToast } from "../../components/cloudence/ToastProvider";
import BackgroundRemoverTool from "../../components/cloudence/BackgroundRemoverTool";

import { useCloudenceData } from "../../data/CloudenceDataProvider";
import { theme } from "../../constants/theme";
import { CloudFile, SortType } from "../../types/file";
import { convertFileSize, sortFiles } from "../../utils/fileUtils";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { useFileSelection } from "../../hooks/useFileSelection";
import { useBulkFileActions } from "../../hooks/useBulkFileActions";
import * as DocumentPicker from "expo-document-picker";
import { setDefaultFileView, useWorkspacePreferences } from "../../hooks/useWorkspacePreferences";

export default function ImagesScreen() {
  const layout = useResponsiveLayout();
  const { defaultFileView } = useWorkspacePreferences();
  const { showToast } = useToast();
  const {
    files,
    isLoading,
    isRefreshing,
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
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [selectedFileForAction, setSelectedFileForAction] =
    useState<CloudFile | null>(null);
  const [isActionModalVisible, setIsActionModalVisible] = useState(false);

  const itemWidth = layout.cardWidth;
  const handleViewChange = setDefaultFileView;

  const imageFiles = useMemo(() => {
    const filtered = files.filter(
      (file) =>
        file.category === "Images" &&
        `${file.name} ${file.extension}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    );
    return sortFiles(filtered, currentSort);
  }, [files, query, currentSort]);

  const totalImageBytes = useMemo(() => {
    return imageFiles.reduce((acc, f) => acc + f.size, 0);
  }, [imageFiles]);
  const isInitialLoading = isLoading && files.length === 0 && !error;
  const selection = useFileSelection(imageFiles);
  const bulkActions = useBulkFileActions({
    removeFile: remove,
    refreshListing: refresh,
    optimisticallyMove: () => () => {},
  });

  const handleBulkDelete = (filesToDelete: CloudFile[]) => {
    selection.clear();
    void bulkActions.deleteFiles(filesToDelete);
  };

  const handleOpenFile = (file: CloudFile) => {
    setSelectedFileForAction(file);
    setIsActionModalVisible(true);
  };

  const handleDelete = async (fileId: string) => {
    await remove(fileId);
    showToast({
      title: "Image deleted",
      message: "The image file was removed.",
      variant: "success",
    });
  };

  const handleRefresh = async () => {
    const succeeded = await refresh();
    if (!succeeded) {
      showToast({
        title: "Refresh failed",
        message: "We couldn't refresh your images. Please try again.",
        variant: "error",
      });
    }
  };

  const handleFileUploaded = async (
    asset: DocumentPicker.DocumentPickerAsset,
    name?: string,
  ) => {
    const uploaded = await upload(asset, name);
    if (uploaded?.duplicate) {
      showToast({
        title: "Duplicate skipped",
        message: "An identical file already exists in your workspace.",
        variant: "info",
      });
    }
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
            paddingBottom: selection.selectionMode ? 112 : 36,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={theme.colors.brand}
            colors={[theme.colors.brand]}
          />
        }
      >
        <AppHeader onUpload={() => setIsUploadModalVisible(true)} />

        <Text style={styles.title}>Images & Vectors</Text>

        <BackgroundRemoverTool />

        <WorkspaceStatus
          error={error}
          offline={isOffline}
          onRetry={handleRefresh}
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
                {convertFileSize(totalImageBytes)}
              </Text>
            </Text>
            <Text style={styles.countLabel}>{imageFiles.length} images</Text>
          </View>

          <View style={styles.rightControls}>
            <Pressable
              onPress={() => setIsSortModalVisible(true)}
              style={styles.sortButton}
            >
              <ArrowDownUp size={14} color={theme.colors.brand} />
              <Text style={styles.sortButtonText}>Sort</Text>
            </Pressable>

            <ViewToggle view={defaultFileView} onChange={handleViewChange} />
          </View>
        </View>

        {/* Files Display */}
        {isInitialLoading ? (
          <FileCollectionSkeleton
            view={defaultFileView}
            cardWidth={itemWidth}
          />
        ) : imageFiles.length > 0 ? (
          <>
          {defaultFileView === "grid" ? (
            <View style={styles.gridContainer}>
              {imageFiles.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  width={itemWidth}
                  onPress={handleOpenFile}
                  onMore={handleOpenFile}
                  onLongPress={selection.selectOnLongPress}
                  onToggleSelection={selection.toggle}
                  selectionMode={selection.selectionMode}
                  selected={selection.selectedIds.includes(file.id)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.listContainer}>
              {imageFiles.map((file, idx) => (
                <FileRow
                  key={file.id}
                  file={file}
                  onPress={handleOpenFile}
                  onMore={handleOpenFile}
                  onLongPress={selection.selectOnLongPress}
                  onToggleSelection={selection.toggle}
                  selectionMode={selection.selectionMode}
                  selected={selection.selectedIds.includes(file.id)}
                  isLast={idx === imageFiles.length - 1}
                />
              ))}
            </View>
          )}
          </>
        ) : !isLoading && !error ? (
          <EmptyState
            title="No images found"
            message="Upload PNG, JPG, WebP, or SVG graphics to this vault."
          />
        ) : null}
      </ScrollView>

      {selection.selectionMode && (
        <BulkFileSelectionActions
          files={selection.selectedFiles}
          canMove={false}
          folders={[]}
          currentFolderId={null}
          onMove={() => {}}
          onDelete={handleBulkDelete}
          onCancel={selection.clear}
        />
      )}

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
