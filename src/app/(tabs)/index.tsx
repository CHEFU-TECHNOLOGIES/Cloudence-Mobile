import React, { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "../../components/cloudence/AppHeader";
import SearchBar from "../../components/cloudence/SearchBar";
import StorageCard from "../../components/cloudence/StorageCard";
import CategoryGrid from "../../components/cloudence/CategoryGrid";
import RecentFiles from "../../components/cloudence/RecentFiles";
import EmptyState from "../../components/cloudence/EmptyState";
import FileActionModal from "../../components/cloudence/FileActionModal";
import FileUploadModal from "../../components/cloudence/FileUploadModal";
import CloudenceLogo from "../../components/cloudence/CloudenceLogo";
import WorkspaceStatus from "../../components/cloudence/WorkspaceStatus";

import { useCloudenceData } from "../../data/CloudenceDataProvider";
import { theme } from "../../constants/theme";
import { CloudFile, FileCategory } from "../../types/file";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import * as DocumentPicker from "expo-document-picker";

export default function DashboardScreen() {
  const layout = useResponsiveLayout();
  const {
    files,
    recentFiles,
    usage,
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
  const [selectedFileForAction, setSelectedFileForAction] = useState<CloudFile | null>(null);
  const [isActionModalVisible, setIsActionModalVisible] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);

  const filteredFiles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return files;

    return files.filter((file) =>
      `${file.name} ${file.extension} ${file.category}`
        .toLowerCase()
        .includes(normalized)
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
    Alert.alert("File Deleted", "The file has been removed from your workspace.");
  };

  const handleFileUploaded = async (
    asset: DocumentPicker.DocumentPickerAsset,
    name?: string,
  ) => {
    await upload(asset, name);
    Alert.alert(
      "Upload Successful",
      `"${name || asset.name}" has been uploaded to your Cloudence workspace.`,
    );
  };

  const displayedRecentFiles = query.trim()
    ? filteredFiles.slice(0, 5)
    : recentFiles;
  const totalUsedBytes = usage?.used ?? 0;
  const totalStorageBytes = usage?.all ?? 0;

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
        <AppHeader
          onUpload={() => setIsUploadModalVisible(true)}
          onProfilePress={() => router.push("/profile")}
        />

        <WorkspaceStatus
          loading={isLoading}
          error={error}
          offline={isOffline}
          onRetry={refresh}
        />

        {/* Hero Welcome banner */}
        <View style={styles.welcome}>
          <Text style={styles.greeting}>Your workspace</Text>
          <Text style={styles.heading}>
            Everything in{"\n"}its right place.
          </Text>
          <Text style={styles.description}>
            Your files, organized and ready whenever you need them.
          </Text>
        </View>

        {/* Live Search */}
        <SearchBar value={query} onChangeText={setQuery} />

        {/* Storage Radial Gauge Card */}
        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Storage overview</Text>
          </View>
          {usage && (
            <StorageCard
              usedBytes={totalUsedBytes}
              totalBytes={totalStorageBytes}
              onUpgradePress={() =>
                Alert.alert(
                  "Upgrade Storage",
                  "Cloudence Pro includes 100 GB storage, team roles & custom domain access.",
                )
              }
            />
          )}
        </View>

        {/* Categories Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Your categories</Text>
            <Text style={styles.sectionHint}>Browse by type</Text>
          </View>

          <CategoryGrid
            files={files}
            onSelectCategory={selectCategory}
          />
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
          />
        )}

        {query.trim().length > 0 && filteredFiles.length === 0 && (
          <EmptyState
            title="No matching files"
            message="Try searching with a different name, extension, or category."
          />
        )}

        <View style={styles.footerContainer}>
          <CloudenceLogo size={22} showText textSize={13} />
          <Text style={styles.footerText}>
            Cloudence Secure Storage · End-to-End Encrypted
          </Text>
        </View>
      </ScrollView>

      {/* Interactive Action Modals */}
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
  welcome: {
    marginBottom: 18,
    marginTop: 4,
  },
  greeting: {
    fontSize: 12.5,
    color: theme.colors.brand,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  heading: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.9,
    fontWeight: "800",
    color: theme.colors.text,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.secondaryText,
    marginTop: 8,
    maxWidth: 320,
  },
  section: {
    marginTop: 24,
  },
  sectionHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16.5,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  sectionHint: {
    fontSize: 11.5,
    color: theme.colors.secondaryText,
    fontWeight: "500",
  },
  footerContainer: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 12,
    gap: 6,
  },
  footerText: {
    textAlign: "center",
    color: theme.colors.secondaryText,
    fontSize: 10.5,
    fontWeight: "500",
  },
});