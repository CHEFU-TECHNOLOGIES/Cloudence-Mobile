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
import { useLocalSearchParams } from "expo-router";
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

const filterCategories = ["All", "Documents", "Images", "Media", "Others"];

export default function FilesScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const params = useLocalSearchParams<{ category?: string }>();
  const [categoryOverride, setCategoryOverride] = useState<string | null>(null);

  const selectedCategory =
    categoryOverride ??
    (params.category && filterCategories.includes(params.category)
      ? params.category
      : "All");

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

  const filteredAndSortedFiles = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const filtered = files.filter((file) => {
      const matchesCategory =
        selectedCategory === "All" || file.category === selectedCategory;

      const matchesSearch =
        `${file.name} ${file.extension} ${file.category}`
          .toLowerCase()
          .includes(normalized);

      return matchesCategory && matchesSearch;
    });

    return sortFiles(filtered, currentSort);
  }, [files, selectedCategory, query, currentSort]);

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

  const handleRename = (fileId: string, newName: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, name: newName } : f))
    );
    Alert.alert("File Renamed", `File renamed to "${newName}".`);
  };

  const handleDelete = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    Alert.alert("File Deleted", "The file has been permanently removed.");
  };

  const handleShare = (fileId: string, emails: string[]) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, users: emails } : f))
    );
  };

  const handleDownload = (file: CloudFile) => {
    Alert.alert(
      "Download Complete",
      `${file.name}.${file.extension.toLowerCase()} is saved to your device.`
    );
  };

  const handleFileUploaded = (newFile: CloudFile) => {
    setFiles((prev) => [newFile, ...prev]);
    Alert.alert(
      "Upload Successful",
      `"${newFile.name}" has been uploaded to your workspace.`
    );
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

        {/* Title & Subtitle */}
        <Text style={styles.title}>
          {selectedCategory === "All" ? "All Files" : selectedCategory}
        </Text>
        <Text style={styles.subtitle}>
          Manage, share, and preview files in your Cloudence vault.
        </Text>

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
        ) : (
          <EmptyState
            title="No files match your filter"
            message="Try another category filter or search query."
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
  },
  pillList: {
    gap: 8,
    paddingVertical: 14,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7.5,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.2,
    borderColor: theme.colors.border,
  },
  activeFilterPill: {
    backgroundColor: theme.colors.brand,
    borderColor: theme.colors.brand,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.secondaryText,
  },
  activeFilterPillText: {
    color: "#FFFFFF",
  },
  pillBadge: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  activePillBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
  },
  pillBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.secondaryText,
  },
  activePillBadgeText: {
    color: "#FFFFFF",
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