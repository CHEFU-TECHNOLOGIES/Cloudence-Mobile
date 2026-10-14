import React, { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Pressable,
  useWindowDimensions,
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

import { mockFiles as initialFiles } from "../../data/mockFiles";
import { theme } from "../../constants/theme";
import { CloudFile, SortType, ViewType } from "../../types/file";
import { convertFileSize, sortFiles } from "../../utils/fileUtils";

export default function MediaScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const [files, setFiles] = useState<CloudFile[]>(initialFiles);
  const [query, setQuery] = useState("");
  const [currentSort, setCurrentSort] = useState<SortType>("$createdAt-desc");
  const [currentView, setCurrentView] = useState<ViewType>("grid");
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [selectedFileForAction, setSelectedFileForAction] = useState<CloudFile | null>(null);
  const [isActionModalVisible, setIsActionModalVisible] = useState(false);

  // Responsive column calculation
  const numColumns = screenWidth >= 600 ? 3 : 2;
  const horizontalPadding = 40;
  const gap = 12;
  const itemWidth = Math.floor(
    (screenWidth - horizontalPadding - (numColumns - 1) * gap) / numColumns
  );

  const mediaFiles = useMemo(() => {
    const filtered = files.filter(
      (file) =>
        file.category === "Media" &&
        `${file.name} ${file.extension}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())
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

  const handleRename = (fileId: string, newName: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, name: newName } : f))
    );
  };

  const handleDelete = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    Alert.alert("Media Deleted", "The media file has been removed.");
  };

  const handleShare = (fileId: string, emails: string[]) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, users: emails } : f))
    );
  };

  const handleDownload = (file: CloudFile) => {
    Alert.alert("Downloaded", `${file.name}.${file.extension} downloaded.`);
  };

  const handleFileUploaded = (newFile: CloudFile) => {
    setFiles((prev) => [newFile, ...prev]);
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AppHeader onUpload={() => setIsUploadModalVisible(true)} />

        <Text style={styles.title}>Video & Audio</Text>
        <Text style={styles.subtitle}>
          Accelerated cloud streaming with adaptive bitrate playback.
        </Text>

        <View style={styles.searchSection}>
          <SearchBar value={query} onChangeText={setQuery} />
        </View>

        {/* Controls */}
        <View style={styles.controlBar}>
          <View>
            <Text style={styles.totalLabel}>
              Total:{" "}
              <Text style={styles.totalValue}>{convertFileSize(totalMediaBytes)}</Text>
            </Text>
            <Text style={styles.countLabel}>{mediaFiles.length} media files</Text>
          </View>

          <View style={styles.rightControls}>
            <Pressable
              onPress={() => setIsSortModalVisible(true)}
              style={styles.sortButton}
            >
              <ArrowDownUp size={14} color={theme.colors.brand} />
              <Text style={styles.sortButtonText}>Sort</Text>
            </Pressable>

            <ViewToggle view={currentView} onChange={setCurrentView} />
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
        ) : (
          <EmptyState
            title="No media found"
            message="Upload MP4, WebM, MP3, or WAV audio files to stream."
          />
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
        onDownload={handleDownload}
      />

      <FileUploadModal
        visible={isUploadModalVisible}
        onClose={() => setIsUploadModalVisible(false)}
        onFileUploaded={handleFileUploaded}
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