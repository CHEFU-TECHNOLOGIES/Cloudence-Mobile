import { useMemo, useState } from "react";
import { router } from "expo-router";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { useSession } from "../auth/SessionContext";
import FileActionModal from "../components/cloudence/FileActionModal";
import SearchBar from "../components/cloudence/SearchBar";
import SharedFileRow from "../components/cloudence/shared-access/SharedFileRow";
import { sharedAccessStyles as styles } from "../components/cloudence/SharedAccessScreen.styles";
import SkeletonBlock from "../components/cloudence/skeletons/SkeletonBlock";
import WorkspaceStatus from "../components/cloudence/WorkspaceStatus";
import { theme } from "../constants/theme";
import { useCloudenceData } from "../data/CloudenceDataProvider";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { useToast } from "../components/cloudence/ToastProvider";
import { CloudFile } from "../types/file";

export default function SharedAccessScreen() {
    const layout = useResponsiveLayout();
    const { user } = useSession();
    const { showToast } = useToast();
    const { files, isLoading, isRefreshing, isOffline, error, refresh, share } =
        useCloudenceData();
    const [query, setQuery] = useState("");
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

    const ownedFiles = useMemo(
        () => files.filter((file) => file.owner.id === user?.id),
        [files, user?.id],
    );
    const workspaceFiles = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return ownedFiles
            .filter((file) => file.users.length > 0)
            .filter((file) =>
                `${file.name} ${file.extension}`
                    .toLowerCase()
                    .includes(normalizedQuery),
            )
            .sort((a, b) => b.users.length - a.users.length);
    }, [ownedFiles, query]);
    const sharedFileCount = ownedFiles.filter(
        (file) => file.users.length > 0,
    ).length;
    const collaboratorCount = new Set(ownedFiles.flatMap((file) => file.users))
        .size;
    const selectedFile =
        files.find((file) => file.id === selectedFileId) ?? null;

    const handleRefresh = async () => {
        const succeeded = await refresh();
        if (!succeeded) {
            showToast({
                title: "Refresh failed",
                message: "We couldn't refresh shared access. Please try again.",
                variant: "error",
            });
        }
    };

    const handleShare = async (fileId: string, emails: string[]) => {
        await share(fileId, emails);
        showToast({
            title: "Access updated",
            message: "The file's collaborator access has been updated.",
            variant: "success",
        });
    };

    const openFileAccess = (file: CloudFile) => setSelectedFileId(file.id);

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
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => void handleRefresh()}
                        tintColor={theme.colors.brand}
                        colors={[theme.colors.brand]}
                    />
                }
            >
                <View style={styles.header}>
                    <Pressable
                        onPress={() => router.back()}
                        accessibilityRole="button"
                        accessibilityLabel="Back to account settings"
                        style={styles.backButton}
                    >
                        <ChevronLeft size={21} color={theme.colors.text} />
                    </Pressable>
                    <View style={styles.headerCopy}>
                        <Text style={styles.title}>Shared access & team</Text>
                        <Text style={styles.subtitle}>
                            Manage who can access your workspace files.
                        </Text>
                    </View>
                </View>

                <WorkspaceStatus
                    error={error}
                    offline={isOffline}
                    onRetry={handleRefresh}
                />

                <View style={styles.summaryCard}>
                    <View style={styles.summaryMetric}>
                        <Text style={styles.summaryValue}>
                            {sharedFileCount}
                        </Text>
                        <Text style={styles.summaryLabel}>Shared files</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryMetric}>
                        <Text style={styles.summaryValue}>
                            {collaboratorCount}
                        </Text>
                        <Text style={styles.summaryLabel}>
                            Unique collaborators
                        </Text>
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Shared files</Text>
                    <Text style={styles.sectionDescription}>
                        Select a file to manage its collaborators.
                    </Text>
                </View>
                <SearchBar
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search shared files"
                />

                {isLoading && files.length === 0 ? (
                    <View style={styles.skeletonList}>
                        {Array.from({ length: 5 }, (_, index) => (
                            <View key={index} style={styles.skeletonRow}>
                                <SkeletonBlock
                                    width={46}
                                    height={46}
                                    borderRadius={12}
                                />
                                <View style={styles.skeletonText}>
                                    <SkeletonBlock
                                        width="70%"
                                        height={13}
                                        borderRadius={6}
                                    />
                                    <SkeletonBlock
                                        width="48%"
                                        height={10}
                                        borderRadius={5}
                                    />
                                </View>
                            </View>
                        ))}
                    </View>
                ) : workspaceFiles.length > 0 ? (
                    <View style={styles.fileList}>
                        {workspaceFiles.map((file) => (
                            <SharedFileRow
                                key={file.id}
                                file={file}
                                onPress={openFileAccess}
                            />
                        ))}
                    </View>
                ) : !error ? (
                    <View style={styles.empty}>
                        <Text style={styles.emptyTitle}>
                            {query.trim()
                                ? "No shared files found"
                                : "No shared files yet"}
                        </Text>
                        <Text style={styles.emptyText}>
                            {query.trim()
                                ? "Try a different file name or clear your search."
                                : "Files shared with collaborators will appear here."}
                        </Text>
                    </View>
                ) : null}
            </ScrollView>

            <FileActionModal
                visible={Boolean(selectedFile)}
                file={selectedFile}
                initialAction="share"
                onClose={() => setSelectedFileId(null)}
                onShare={handleShare}
            />
        </SafeAreaView>
    );
}
