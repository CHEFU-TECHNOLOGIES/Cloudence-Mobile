import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StatusBar,
  Text,
  View,
  Pressable,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowDownUp, Plus } from "lucide-react-native";

import AppHeader from "../../components/cloudence/AppHeader";
import SearchBar from "../../components/cloudence/SearchBar";
import FileCard from "../../components/cloudence/FileCard";
import FileRow from "../../components/cloudence/FileRow";
import EmptyState from "../../components/cloudence/EmptyState";
import ViewToggle from "../../components/cloudence/ViewToggle";
import SortModal from "../../components/cloudence/SortModal";
import FileActionModal from "../../components/cloudence/FileActionModal";
import FileUploadModal from "../../components/cloudence/FileUploadModal";
import FolderCard from "../../components/cloudence/FolderCard";
import FolderNameModal from "../../components/cloudence/FolderNameModal";
import WorkspaceStatus from "../../components/cloudence/WorkspaceStatus";

import { useCloudenceData } from "../../data/CloudenceDataProvider";
import { useSession } from "../../auth/SessionContext";
import { theme } from "../../constants/theme";
import { CloudFile, SortType, ViewType } from "../../types/file";
import { convertFileSize, sortFiles } from "../../utils/fileUtils";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { useSectionListing } from "../../hooks/useSectionListing";
import {
  CloudenceFolder,
  createFolder as createFolderRequest,
  FolderSection,
} from "../../lib/api/folders";
import * as DocumentPicker from "expo-document-picker";
import { filesScreenStyles as styles } from "../../components/cloudence/FilesScreen.styles";

const filterCategories = ["All", "Documents", "Images", "Media", "Others"];

export default function FilesScreen() {
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
  const { getAccessToken } = useSession();
  const params = useLocalSearchParams<{ category?: string }>();
  const [categoryOverride, setCategoryOverride] = useState<string | null>(null);

  const selectedCategory =
    categoryOverride ??
    (params.category && filterCategories.includes(params.category)
      ? params.category
      : "All");
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [isCreateFolderVisible, setIsCreateFolderVisible] = useState(false);
  const sectionByCategory: Record<string, FolderSection> = {
    Documents: "documents",
    Images: "images",
    Media: "media",
    Others: "others",
  };
  const activeSection = sectionByCategory[selectedCategory] ?? null;
  const sectionListing = useSectionListing(activeSection, activeFolderId);

  const [query, setQuery] = useState("");
  const [currentSort, setCurrentSort] = useState<SortType>("$createdAt-desc");
  const [currentView, setCurrentView] = useState<ViewType>("grid");
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [selectedFileForAction, setSelectedFileForAction] = useState<CloudFile | null>(null);
  const [isActionModalVisible, setIsActionModalVisible] = useState(false);

  const itemWidth = layout.cardWidth;
  const sourceFiles = activeSection
    ? sectionListing.listing.files.filter((file) =>
        activeFolderId
          ? file.folderId === activeFolderId
          : file.folderId === undefined,
      )
    : files;
  const screenLoading = activeSection
    ? sectionListing.isLoading
    : isLoading;
  const screenError = activeSection ? sectionListing.error : error;
  const handleRefresh = activeSection ? sectionListing.refresh : refresh;

  useEffect(() => {
    setActiveFolderId(null);
  }, [selectedCategory]);

  const filteredAndSortedFiles = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const filtered = sourceFiles.filter((file) => {
      const matchesCategory =
        selectedCategory === "All" || file.category === selectedCategory;

      const matchesSearch =
        `${file.name} ${file.extension} ${file.category}`
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

  const handleOpenMore = (file: CloudFile) => {
    setSelectedFileForAction(file);
    setIsActionModalVisible(true);
  };

  const handleDelete = async (fileId: string) => {
    await remove(fileId);
    if (activeSection) await sectionListing.refresh();
    Alert.alert("File Deleted", "The file has been removed from your workspace.");
  };

  const handleRename = async (fileId: string, name: string) => {
    await rename(fileId, name);
    if (activeSection) await sectionListing.refresh();
  };

  const handleShare = async (fileId: string, users: string[]) => {
    await share(fileId, users);
    if (activeSection) await sectionListing.refresh();
  };

  const handleFileUploaded = async (
    asset: DocumentPicker.DocumentPickerAsset,
    name?: string,
  ) => {
    await upload(asset, name, activeFolderId);
    if (activeSection) await sectionListing.refresh();
    Alert.alert("Upload Successful", `"${name || asset.name}" was uploaded.`);
  };

  const handleCreateFolder = async (name: string) => {
    if (!activeSection) return;
    const accessToken = await getAccessToken();
    await createFolderRequest(accessToken, activeSection, name);
    await sectionListing.refresh();
  };

  const handleOpenFolder = (folder: CloudenceFolder) => {
    setQuery("");
    setActiveFolderId(folder.id);
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

        {/* Title & Subtitle */}
        <Text style={styles.title}>
          {activeFolderId
            ? sectionListing.listing.folders.find(
                (folder) => folder.id === activeFolderId,
              )?.name ?? selectedCategory
            : selectedCategory === "All"
              ? "All Files"
              : selectedCategory}
        </Text>
        <Text style={styles.subtitle}>
          Manage, share, and preview files in your Cloudence vault.
        </Text>

        <WorkspaceStatus
          loading={screenLoading}
          error={screenError}
          offline={isOffline}
          onRetry={handleRefresh}
        />

        {/* Live Search */}
        <View style={styles.searchSection}>
          <SearchBar value={query} onChangeText={setQuery} />
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillList}
        >
          {filterCategories.map((category) => {
            const isActive = selectedCategory === category;
            const count =
              category === "All"
                ? files.length
                : files.filter((f) => f.category === category).length;

            return (
              <Pressable
                key={category}
                onPress={() => setCategoryOverride(category)}
                style={[
                  styles.filterPill,
                  isActive && styles.activeFilterPill,
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isActive && styles.activeFilterPillText,
                  ]}
                >
                  {category}
                </Text>
                <View
                  style={[
                    styles.pillBadge,
                    isActive && styles.activePillBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillBadgeText,
                      isActive && styles.activePillBadgeText,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {activeSection && !activeFolderId && (
          <View style={styles.folderSection}>
            <View style={styles.folderHeading}>
              <Text style={styles.folderHeadingText}>Folders</Text>
              <Pressable
                onPress={() => setIsCreateFolderVisible(true)}
                style={styles.createFolderButton}
                accessibilityRole="button"
                accessibilityLabel="Create folder"
              >
                <Plus size={14} color={theme.colors.brandDark} />
                <Text style={styles.createFolderText}>New folder</Text>
              </Pressable>
            </View>
            <View style={styles.folderGrid}>
              {sectionListing.listing.folders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  width={itemWidth}
                  onPress={handleOpenFolder}
                />
              ))}
            </View>
          </View>
        )}

        {activeFolderId && (
          <Pressable
            onPress={() => setActiveFolderId(null)}
            style={styles.folderBreadcrumb}
            accessibilityRole="button"
          >
            <Text style={styles.folderBreadcrumbText}>
              ‹ Back to {selectedCategory}
            </Text>
          </Pressable>
        )}

        {/* Bar: Total size + Sort + ViewToggle */}
        <View style={styles.controlBar}>
          <View>
            <Text style={styles.totalLabel}>
              Total:{" "}
              <Text style={styles.totalValue}>{convertFileSize(totalBytes)}</Text>
            </Text>
            <Text style={styles.countLabel}>
              {filteredAndSortedFiles.length}{" "}
              {filteredAndSortedFiles.length === 1 ? "file" : "files"}
            </Text>
          </View>

          <View style={styles.rightControls}>
            <Pressable
              onPress={() => setIsSortModalVisible(true)}
              style={styles.sortButton}
            >
              <ArrowDownUp size={14} color={theme.colors.brand} />
              <Text numberOfLines={1} style={styles.sortButtonText}>
                Sort
              </Text>
            </Pressable>

            <ViewToggle view={currentView} onChange={setCurrentView} />
          </View>
        </View>

        {/* Files View: Grid or List */}
        {filteredAndSortedFiles.length > 0 ? (
          currentView === "grid" ? (
            <View style={styles.gridContainer}>
              {filteredAndSortedFiles.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  width={itemWidth}
                  onPress={handleOpenFile}
                  onMore={handleOpenMore}
                />
              ))}
            </View>
          ) : (
            <View style={styles.listContainer}>
              {filteredAndSortedFiles.map((file, idx) => (
                <FileRow
                  key={file.id}
                  file={file}
                  onPress={handleOpenFile}
                  onMore={handleOpenMore}
                  isLast={idx === filteredAndSortedFiles.length - 1}
                />
              ))}
            </View>
          )
        ) : !screenLoading && !screenError ? (
          <EmptyState
            title="No files match your filter"
            message="Try another category filter or search query."
          />
        ) : null}
        {activeFolderId && sectionListing.listing.nextOffset !== undefined && (
          <Pressable
            onPress={() => void sectionListing.loadMore()}
            disabled={sectionListing.isLoadingMore}
            style={styles.loadMoreButton}
          >
            <Text style={styles.loadMoreText}>
              {sectionListing.isLoadingMore ? "Loading more…" : "Load more files"}
            </Text>
          </Pressable>
        )}
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
        visible={isCreateFolderVisible}
        onClose={() => setIsCreateFolderVisible(false)}
        onCreate={handleCreateFolder}
      />
    </SafeAreaView>
  );
}
