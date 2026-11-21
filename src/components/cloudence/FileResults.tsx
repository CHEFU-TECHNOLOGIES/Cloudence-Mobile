import { Pressable, Text, View } from "react-native";
import { CloudFile } from "../../types/file";
import { filesScreenStyles as styles } from "./FilesScreen.styles";
import FileCard from "./FileCard";
import FileRow from "./FileRow";
import EmptyState from "./EmptyState";
import FileCollectionSkeleton from "./skeletons/FileCollectionSkeleton";
import SkeletonBlock from "./skeletons/SkeletonBlock";

type Props = {
  files: CloudFile[];
  loading: boolean;
  error: string | null;
  view: "grid" | "list";
  cardWidth: number;
  selectionMode: boolean;
  selectedIds: string[];
  hasMore: boolean;
  loadingMore: boolean;
  onPressFile: (file: CloudFile) => void;
  onMore: (file: CloudFile) => void;
  onLongPress: (file: CloudFile) => void;
  onToggleSelection: (file: CloudFile) => void;
  onLoadMore: () => void;
};

export default function FileResults({
  files,
  loading,
  error,
  view,
  cardWidth,
  selectionMode,
  selectedIds,
  hasMore,
  loadingMore,
  onPressFile,
  onMore,
  onLongPress,
  onToggleSelection,
  onLoadMore,
}: Props) {
  if (loading) return <FileCollectionSkeleton view={view} cardWidth={cardWidth} />;
  if (!files.length) {
    return !error ? (
      <EmptyState
        title="No files match your filter"
        message="Try another category filter or search query."
      />
    ) : null;
  }

  return (
    <>
      {view === "grid" ? (
        <View style={styles.gridContainer}>
          {files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              width={cardWidth}
              onPress={onPressFile}
              onMore={onMore}
              onLongPress={onLongPress}
              selectionMode={selectionMode}
              selected={selectedIds.includes(file.id)}
              onToggleSelection={onToggleSelection}
            />
          ))}
        </View>
      ) : (
        <View style={styles.listContainer}>
          {files.map((file, index) => (
            <FileRow
              key={file.id}
              file={file}
              onPress={onPressFile}
              onMore={onMore}
              onLongPress={onLongPress}
              selectionMode={selectionMode}
              selected={selectedIds.includes(file.id)}
              onToggleSelection={onToggleSelection}
              isLast={index === files.length - 1}
            />
          ))}
        </View>
      )}
      {hasMore && (
        <Pressable
          onPress={onLoadMore}
          disabled={loadingMore}
          style={styles.loadMoreButton}
        >
          {loadingMore ? (
            <SkeletonBlock width={86} height={12} borderRadius={6} />
          ) : (
            <Text style={styles.loadMoreText}>Load more files</Text>
          )}
        </Pressable>
      )}
    </>
  );
}
