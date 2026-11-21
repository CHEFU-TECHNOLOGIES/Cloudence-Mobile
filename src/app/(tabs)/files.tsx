import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, RefreshControl, StatusBar, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "../../components/cloudence/AppHeader";
import SearchBar from "../../components/cloudence/SearchBar";
import FileCategoryFilters from "../../components/cloudence/FileCategoryFilters";
import FileListControls from "../../components/cloudence/FileListControls";
import FileResults from "../../components/cloudence/FileResults";
import SortModal from "../../components/cloudence/SortModal";
import FileActionModal from "../../components/cloudence/FileActionModal";
import BulkFileSelectionActions from "../../components/cloudence/BulkFileSelectionActions";
import FileUploadModal from "../../components/cloudence/FileUploadModal";
import FolderSectionView from "../../components/cloudence/FolderSectionView";
import FolderActionModal from "../../components/cloudence/FolderActionModal";
import FolderNameModal from "../../components/cloudence/FolderNameModal";
import WorkspaceStatus from "../../components/cloudence/WorkspaceStatus";
import { useToast } from "../../components/cloudence/ToastProvider";

import { useCloudenceData } from "../../data/CloudenceDataProvider";
import { theme } from "../../constants/theme";
import { CloudFile, SortType } from "../../types/file";
import { sortFiles } from "../../utils/fileUtils";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { useSectionListing } from "../../hooks/useSectionListing";
import { setDefaultFileView, useWorkspacePreferences } from "../../hooks/useWorkspacePreferences";
import { CloudenceFolder, FolderSection } from "../../lib/api/folders";
import { useFolderActions } from "../../hooks/useFolderActions";
import { useBulkFileActions } from "../../hooks/useBulkFileActions";
import { useFolderCreation } from "../../hooks/useFolderCreation";
import * as DocumentPicker from "expo-document-picker";
import { filesScreenStyles as styles } from "../../components/cloudence/FilesScreen.styles";

const filterCategories = ["All", "Documents", "Images", "Media", "Others"];

export default function FilesScreen() {
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
  const params = useLocalSearchParams<{ category?: string }>();
  const [categoryOverride, setCategoryOverride] = useState<string | null>(null);

  const selectedCategory =
    categoryOverride ??
    (params.category && filterCategories.includes(params.category)
      ? params.category
      : "All");
  const [folderNavigation, setFolderNavigation] = useState<{
    category: string;
    folderId: string | null;
  }>({ category: selectedCategory, folderId: null });
  const activeFolderId =
    folderNavigation.category === selectedCategory
      ? folderNavigation.folderId
      : null;
  const sectionByCategory: Record<string, FolderSection> = {
    Documents: "documents",
    Images: "images",
    Media: "media",
    Others: "others",
  };
  const activeSection = sectionByCategory[selectedCategory] ?? null;
  const sectionListing = useSectionListing(activeSection, activeFolderId);
  const folderCreation = useFolderCreation(activeSection, () => sectionListing.refresh());
  const folderActions = useFolderActions(
    () => sectionListing.refresh(),
    sectionListing.updateFolderOptimistically,
  );
  const pendingFolder = folderCreation.pendingFolder?.section === activeSection
    ? folderCreation.pendingFolder
    : null;
  const folderAlreadyCreated = Boolean(
    pendingFolder &&
      sectionListing.listing.folders.some(
        (folder) =>
          folder.name.toLowerCase() === pendingFolder.name.toLowerCase(),
      ),
  );
  const visibleFolders = pendingFolder && !folderAlreadyCreated
    ? [
        ...sectionListing.listing.folders,
        pendingFolder,
      ]
    : sectionListing.listing.folders;

  const [query, setQuery] = useState("");
  const [currentSort, setCurrentSort] = useState<SortType>("$createdAt-desc");
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [selectedFileForAction, setSelectedFileForAction] =
    useState<CloudFile | null>(null);
  const [isActionModalVisible, setIsActionModalVisible] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  const itemWidth = layout.cardWidth;
  const handleViewChange = setDefaultFileView;
  const sourceFiles = activeSection
    ? sectionListing.listing.files.filter((file) =>
        activeFolderId
          ? file.folderId === activeFolderId
          : file.folderId === undefined,
      )
    : files;
  const selectedFiles = sourceFiles.filter((file) =>
    selectedFileIds.includes(file.id),
  );
  const selectionMode = selectedFileIds.length > 0;
  const screenLoading = activeSection ? sectionListing.isLoading : isLoading;
  const screenError = activeSection ? sectionListing.error : error;
  const handleRefresh = async () => {
    const succeeded = await (activeSection
      ? sectionListing.refresh()
      : refresh());
    if (!succeeded) {
      showToast({
        title: "Refresh failed",
        message: "We couldn't refresh this file list. Please try again.",
        variant: "error",
      });
    }
  };

  const refreshSectionAfterAction = async () => {
    if (!activeSection) return true;
    const succeeded = await sectionListing.refresh();
    if (!succeeded) {
      showToast({
        title: "Folder refresh failed",
        message:
          "Your action may have completed, but this folder couldn't refresh.",
        variant: "error",
      });
    }
    return succeeded;
  };

  const refreshBulkListing = () =>
    activeSection ? sectionListing.refresh() : refresh();
  const bulkActions = useBulkFileActions({
    removeFile: remove,
    refreshListing: refreshBulkListing,
    optimisticallyMove: sectionListing.moveFilesOptimistically,
  });

  const filteredAndSortedFiles = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const filtered = sourceFiles.filter((file) => {
      const matchesCategory =
        selectedCategory === "All" || file.category === selectedCategory;

      const matchesSearch = `${file.name} ${file.extension} ${file.category}`
        .toLowerCase()
        .includes(normalized);

      return matchesCategory && matchesSearch;
    });

    return sortFiles(filtered, currentSort);
  }, [sourceFiles, selectedCategory, query, currentSort]);

  const totalBytes = useMemo(() => {
    return filteredAndSortedFiles.reduce((acc, f) => acc + f.size, 0);
  }, [filteredAndSortedFiles]);

  const handleOpenFile = (file: CloudFile) => {
    setSelectedFileForAction(file);
    setIsActionModalVisible(true);
  };

  const toggleFileSelection = (file: CloudFile) => {
    setSelectedFileIds((current) =>
      current.includes(file.id)
        ? current.filter((id) => id !== file.id)
        : [...current, file.id],
    );
  };

  const handleLongPressFile = (file: CloudFile) => {
    setSelectedFileIds((current) =>
      current.includes(file.id) ? current : [...current, file.id],
    );
  };

  const handlePressFile = (file: CloudFile) => {
    if (selectionMode) toggleFileSelection(file);
    else handleOpenFile(file);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedFileIds([]);
    setCategoryOverride(category);
  };

  const handleBulkDelete = (filesToDelete: CloudFile[]) => {
    setSelectedFileIds([]);
    void bulkActions.deleteFiles(filesToDelete);
  };

  const handleBulkMove = (filesToMove: CloudFile[], folderId: string | null) => {
    setSelectedFileIds([]);
    void bulkActions.moveFiles(filesToMove, folderId);
  };

  const handleOpenMore = (file: CloudFile) => {
    setSelectedFileForAction(file);
    setIsActionModalVisible(true);
  };

  const handleDelete = async (fileId: string) => {
    await remove(fileId);
    if (!(await refreshSectionAfterAction())) return;
    showToast({
      title: "File deleted",
      message: "The file has been removed from your workspace.",
      variant: "success",
    });
  };

  const handleRename = async (fileId: string, name: string) => {
    await rename(fileId, name);
    await refreshSectionAfterAction();
  };

  const handleShare = async (
    fileId: string,
    users: string[],
    userExpiration?: { email: string; expiresAt: string | null },
  ) => {
    const normalizedUsers = users.map((email) => email.trim().toLowerCase());
    const rollback = sectionListing.updateFilesOptimistically(fileId, (file) => {
      const shareExpiresAtByUser = Object.fromEntries(
        Object.entries(file.shareExpiresAtByUser ?? {}).filter(([email]) =>
          normalizedUsers.includes(email.toLowerCase()),
        ),
      );
      if (userExpiration) {
        shareExpiresAtByUser[userExpiration.email.trim().toLowerCase()] =
          userExpiration.expiresAt;
      }
      return { ...file, users, shareExpiresAtByUser };
    });
    try {
      await share(fileId, users, userExpiration);
      await refreshSectionAfterAction();
    } catch (error) {
      rollback();
      throw error;
    }
  };

  const handleFileUploaded = async (
    asset: DocumentPicker.DocumentPickerAsset,
    name?: string,
  ) => {
    const uploaded = await upload(asset, name, activeFolderId);
    if (!(await refreshSectionAfterAction())) return;
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
      message: `“${name || asset.name}” was uploaded.`,
      variant: "success",
    });
  };

  const handleOpenFolder = (folder: CloudenceFolder) => {
    setQuery("");
    setFolderNavigation({ category: selectedCategory, folderId: folder.id });
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
            paddingBottom: selectionMode ? 112 : 36,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={
              activeSection ? sectionListing.isRefreshing : isRefreshing
            }
            onRefresh={() => void handleRefresh()}
            tintColor={theme.colors.brand}
            colors={[theme.colors.brand]}
          />
        }
      >
        <AppHeader onUpload={() => setIsUploadModalVisible(true)} />

        {/* Title & Subtitle */}
        <Text style={styles.title}>
          {activeFolderId
            ? (sectionListing.listing.folders.find(
                (folder) => folder.id === activeFolderId,
              )?.name ?? selectedCategory)
            : selectedCategory === "All"
              ? "All Files"
              : selectedCategory}
        </Text>
        <Text style={styles.subtitle}>
          Manage, share, and preview files in your Cloudence vault.
        </Text>

        <WorkspaceStatus
          error={screenError}
          offline={isOffline}
          onRetry={handleRefresh}
        />

        {/* Live Search */}
        <View style={styles.searchSection}>
          <SearchBar value={query} onChangeText={setQuery} />
        </View>

        <FileCategoryFilters
          files={files}
          selectedCategory={selectedCategory}
          onSelect={handleCategorySelect}
        />

        {activeSection && !activeFolderId && (
          <FolderSectionView
            cardWidth={itemWidth}
            folders={visibleFolders}
            loading={sectionListing.isLoading && !pendingFolder}
            pendingFolderId={
              folderAlreadyCreated ? undefined : pendingFolder?.id
            }
            onCreate={folderCreation.open}
            onOpen={handleOpenFolder}
            onLongPress={folderActions.open}
          />
        )}

        {activeFolderId && (
          <Pressable
            onPress={() => {
              setSelectedFileIds([]);
              setFolderNavigation({ category: selectedCategory, folderId: null });
            }}
            style={styles.folderBreadcrumb}
            accessibilityRole="button"
          >
            <Text style={styles.folderBreadcrumbText}>
              ‹ Back to {selectedCategory}
            </Text>
          </Pressable>
        )}

        <FileListControls
          totalBytes={totalBytes}
          fileCount={filteredAndSortedFiles.length}
          view={defaultFileView}
          onSort={() => setIsSortModalVisible(true)}
          onViewChange={handleViewChange}
        />

        <FileResults
          files={filteredAndSortedFiles}
          loading={screenLoading}
          error={screenError}
          view={defaultFileView}
          cardWidth={itemWidth}
          selectionMode={selectionMode}
          selectedIds={selectedFileIds}
          hasMore={Boolean(activeFolderId && sectionListing.listing.nextOffset !== undefined)}
          loadingMore={sectionListing.isLoadingMore}
          onPressFile={handlePressFile}
          onMore={handleOpenMore}
          onLongPress={handleLongPressFile}
          onToggleSelection={toggleFileSelection}
          onLoadMore={() => void sectionListing.loadMore()}
        />
      </ScrollView>

      {selectionMode && (
        <BulkFileSelectionActions
          files={selectedFiles}
          canMove={Boolean(activeSection)}
          folders={activeSection ? sectionListing.listing.folders : []}
          currentFolderId={activeFolderId}
          onMove={handleBulkMove}
          onDelete={handleBulkDelete}
          onCancel={() => setSelectedFileIds([])}
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
        onRename={handleRename}
        onDelete={handleDelete}
        onShare={handleShare}
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
      <FolderNameModal
        visible={folderCreation.visible}
        onClose={folderCreation.close}
        onCreate={folderCreation.create}
      />
      <FolderActionModal
        visible={folderActions.visible}
        folder={folderActions.selectedFolder}
        onClose={folderActions.close}
        onRename={folderActions.rename}
        onDelete={folderActions.remove}
      />
    </SafeAreaView>
  );
}
