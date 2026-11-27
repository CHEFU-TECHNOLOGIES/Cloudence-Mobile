import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "../../components/cloudence/AppHeader";
import CategoryGrid from "../../components/cloudence/CategoryGrid";
import EmptyState from "../../components/cloudence/EmptyState";
import FileActionModal from "../../components/cloudence/FileActionModal";
import FileUploadModal from "../../components/cloudence/FileUploadModal";
import RecentFiles from "../../components/cloudence/RecentFiles";
import BulkFileSelectionActions from "../../components/cloudence/BulkFileSelectionActions";
import SearchBar from "../../components/cloudence/SearchBar";
import StorageCard from "../../components/cloudence/StorageCard";
import StorageHealthEntry from "../../components/cloudence/storage-health/StorageHealthEntry";
import WorkspaceStatus from "../../components/cloudence/WorkspaceStatus";
import DashboardSkeleton from "../../components/cloudence/skeletons/DashboardSkeleton";
import StorageCardSkeleton from "../../components/cloudence/skeletons/StorageCardSkeleton";
import SubscriptionPromotion from "../../components/cloudence/subscription/SubscriptionPromotion";
import { useToast } from "../../components/cloudence/ToastProvider";

import * as DocumentPicker from "expo-document-picker";
import { theme } from "../../constants/theme";
import { useCloudenceData } from "../../data/CloudenceDataProvider";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { useFileSelection } from "../../hooks/useFileSelection";
import { useBulkFileActions } from "../../hooks/useBulkFileActions";
import { CloudFile, FileCategory } from "../../types/file";

export default function DashboardScreen() {
  const layout = useResponsiveLayout();
  const { showToast } = useToast();
  const {
    files,
    recentFiles,
    usage,
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
  const [selectedFileForAction, setSelectedFileForAction] =
    useState<CloudFile | null>(null);
  const [isActionModalVisible, setIsActionModalVisible] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);

  const filteredFiles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return files;

    return files.filter((file) =>
      `${file.name} ${file.extension} ${file.category}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [files, query]);

  const selectCategory = (category: FileCategory) => {
    if (category === "Documents") {
      router.push("/files?category=Documents");
    } else if (category === "Images") {
      router.push("/images");
    } else if (category === "Media") {
      router.push("/media");
    } else {
      router.push("/files?category=Others");
    }
  };

  const handleOpenFile = (file: CloudFile) => {
    setSelectedFileForAction(file);
    setIsActionModalVisible(true);
  };

  const handleOpenActionMenu = (file: CloudFile) => {
    setSelectedFileForAction(file);
    setIsActionModalVisible(true);
  };

  const handleDelete = async (fileId: string) => {
    await remove(fileId);
    showToast({
      title: "File deleted",
      message: "The file has been removed from your workspace.",
      variant: "success",
    });
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
      return;
    }
    showToast({
      title: "Upload successful",
      message: `“${name || asset.name}” has been uploaded to your Cloudence workspace.`,
      variant: "success",
    });
  };

  const handleRefresh = async () => {
    const succeeded = await refresh();
    if (!succeeded) {
      showToast({
        title: "Refresh failed",
        message: "We couldn't refresh your workspace. Please try again.",
        variant: "error",
      });
    }
  };

  const displayedRecentFiles = query.trim()
    ? filteredFiles.slice(0, 5)
    : recentFiles;
  const selection = useFileSelection(displayedRecentFiles);
  const bulkActions = useBulkFileActions({
    removeFile: remove,
    refreshListing: refresh,
    optimisticallyMove: () => () => {},
  });
  const handleBulkDelete = (filesToDelete: CloudFile[]) => {
    selection.clear();
    void bulkActions.deleteFiles(filesToDelete);
  };
  const totalUsedBytes = usage?.used ?? 0;
  const totalStorageBytes = usage?.all ?? 0;
  const isInitialLoading = isLoading && files.length === 0 && !usage && !error;

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
            paddingBottom: selection.selectionMode ? 112 : 44,
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
        <AppHeader
          onUpload={() => setIsUploadModalVisible(true)}
          onProfilePress={() => router.push("/profile")}
        />

        <WorkspaceStatus
          error={error}
          offline={isOffline}
          onRetry={handleRefresh}
        />

        {/* Live Search */}
        <SearchBar value={query} onChangeText={setQuery} />

        {isInitialLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Storage Radial Gauge Card */}
            <View style={styles.section}>
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>Storage</Text>
              </View>
              {usage ? (
                <StorageCard
                  usedBytes={totalUsedBytes}
                  totalBytes={totalStorageBytes}
                />
              ) : isLoading ? (
                <StorageCardSkeleton />
              ) : null}
              <StorageHealthEntry />
            </View>

            {/* Categories Grid */}
            <View style={styles.section}>
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>Browse by category</Text>
              </View>

              <CategoryGrid files={files} onSelectCategory={selectCategory} />
            </View>

            {/* Recent Files Uploaded */}
            {(!isLoading || files.length > 0) &&
              !error &&
              (!query.trim() || filteredFiles.length > 0) && (
                <RecentFiles
                  files={displayedRecentFiles}
                  onSeeAll={() => router.push("/files")}
                  onFilePress={handleOpenFile}
                  onFileMore={handleOpenActionMenu}
                  selectionMode={selection.selectionMode}
                  selectedIds={selection.selectedIds}
                  onLongPress={selection.selectOnLongPress}
                  onToggleSelection={selection.toggle}
                />
              )}
          </>
        )}

        {!isInitialLoading &&
          query.trim().length > 0 &&
          filteredFiles.length === 0 && (
            <EmptyState
              title="No matching files"
              message="Try searching with a different name, extension, or category."
            />
          )}
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

      {/* Interactive Action Modals */}
      <SubscriptionPromotion
        blocked={isActionModalVisible || isUploadModalVisible || selection.selectionMode || !!query.trim()}
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
    backgroundColor: "#F7F9FA",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 44,
  },
  welcome: {
    backgroundColor: "#073B3D",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 20,
    marginTop: 2,
    overflow: "hidden",
  },

  heading: {
    fontSize: 25,
    lineHeight: 31,
    letterSpacing: -0.6,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  description: {
    fontSize: 12.5,
    lineHeight: 18,
    color: "#C0D8D7",
    marginTop: 7,
    maxWidth: 290,
  },
  welcomeMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    alignSelf: "flex-start",
    marginTop: 17,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: theme.radius.full,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#75D8AE",
  },
  welcomeMetaText: {
    color: "#E6F3F1",
    fontSize: 10.5,
    fontWeight: "600",
  },
  section: {
    marginTop: 25,
  },
  sectionHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
});
