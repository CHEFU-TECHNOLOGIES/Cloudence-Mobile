import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ArrowRight } from "lucide-react-native";
import { CloudFile } from "../../types/file";
import { theme } from "../../constants/theme";
import FileRow from "./FileRow";
import EmptyState from "./EmptyState";

type Props = {
  files: CloudFile[];
  onSeeAll?: () => void;
  onFilePress?: (file: CloudFile) => void;
  onFileMore?: (file: CloudFile) => void;
};

export default function RecentFiles({
  files,
  onSeeAll,
  onFilePress,
  onFileMore,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <View>
          <Text style={styles.title}>Recent files uploaded</Text>
          <Text style={styles.subtitle}>Pick up where you left off</Text>
        </View>

        {onSeeAll && (
          <Pressable
            onPress={onSeeAll}
            style={({ pressed }) => [styles.seeAll, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.link}>See all</Text>
            <ArrowRight size={14} color={theme.colors.brand} />
          </Pressable>
        )}
      </View>

      <View style={styles.card}>
        {files.length > 0 ? (
          files.map((file, idx) => (
            <FileRow
              key={file.id}
              file={file}
              onPress={onFilePress}
              onMore={onFileMore}
              isLast={idx === files.length - 1}
            />
          ))
        ) : (
          <EmptyState
            title="No files uploaded"
            message="Upload files to have them appear here."
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 26,
  },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 16.5,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    color: theme.colors.secondaryText,
    marginTop: 2,
  },
  seeAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  link: {
    fontSize: 12.5,
    fontWeight: "700",
    color: theme.colors.brand,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "rgba(66, 71, 97, 0.05)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
});