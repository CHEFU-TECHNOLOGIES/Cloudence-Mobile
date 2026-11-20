import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import CategoryCard from "./CategoryCard";
import { FileCategory, CloudFile } from "../../types/file";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";

const categories: FileCategory[] = [
  "Documents",
  "Images",
  "Media",
  "Others",
];

type Props = {
  files?: CloudFile[];
  onSelectCategory: (category: FileCategory) => void;
};

export default function CategoryGrid({
  files = [],
  onSelectCategory,
}: Props) {
  const layout = useResponsiveLayout();
  const summary = useMemo(() => {
    const result: Record<
      FileCategory,
      { count: number; size: number; latestDate?: string }
    > = {
      Documents: { count: 0, size: 0 },
      Images: { count: 0, size: 0 },
      Media: { count: 0, size: 0 },
      Others: { count: 0, size: 0 },
    };

    for (const file of files) {
      const category = result[file.category];
      category.count += 1;
      category.size += file.size;
      if (
        !category.latestDate ||
        Date.parse(file.createdAt) > Date.parse(category.latestDate)
      ) {
        category.latestDate = file.createdAt;
      }
    }

    return result;
  }, [files]);

  return (
    <View style={styles.grid}>
      {categories.map((category) => (
        <CategoryCard
          key={category}
          category={category}
          count={summary[category].count}
          sizeBytes={summary[category].size}
          latestDate={summary[category].latestDate}
          width={layout.cardWidth}
          onPress={() => onSelectCategory(category)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
});