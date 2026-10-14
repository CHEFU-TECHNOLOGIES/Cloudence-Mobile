import React from "react";
import { View, StyleSheet } from "react-native";
import CategoryCard from "./CategoryCard";
import { FileCategory, CloudFile } from "../../types/file";
import { getStorageSummary, mockFiles } from "../../data/mockFiles";

type Props = {
  files?: CloudFile[];
  onSelectCategory: (category: FileCategory) => void;
};

export default function CategoryGrid({
  files = mockFiles,
  onSelectCategory,
}: Props) {
  const summary = getStorageSummary(files);

  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <CategoryCard
          category="Documents"
          count={summary.categories.Documents.count}
          sizeBytes={summary.categories.Documents.size}
          latestDate={summary.categories.Documents.latestDate}
          onPress={() => onSelectCategory("Documents")}
        />
        <CategoryCard
          category="Images"
          count={summary.categories.Images.count}
          sizeBytes={summary.categories.Images.size}
          latestDate={summary.categories.Images.latestDate}
          onPress={() => onSelectCategory("Images")}
        />
      </View>

      <View style={styles.row}>
        <CategoryCard
          category="Media"
          count={summary.categories.Media.count}
          sizeBytes={summary.categories.Media.size}
          latestDate={summary.categories.Media.latestDate}
          onPress={() => onSelectCategory("Media")}
        />
        <CategoryCard
          category="Others"
          count={summary.categories.Others.count}
          sizeBytes={summary.categories.Others.size}
          latestDate={summary.categories.Others.latestDate}
          onPress={() => onSelectCategory("Others")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
});