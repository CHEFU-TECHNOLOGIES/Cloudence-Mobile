import { Pressable, ScrollView, Text, View } from "react-native";
import { CloudFile } from "../../types/file";
import { filesScreenStyles as styles } from "./FilesScreen.styles";

const categories = ["All", "Documents", "Images", "Media", "Others"];

type Props = {
  files: CloudFile[];
  selectedCategory: string;
  onSelect: (category: string) => void;
};

export default function FileCategoryFilters({
  files,
  selectedCategory,
  onSelect,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.pillList}
    >
      {categories.map((category) => {
        const active = selectedCategory === category;
        const count =
          category === "All"
            ? files.length
            : files.filter((file) => file.category === category).length;
        return (
          <Pressable
            key={category}
            onPress={() => onSelect(category)}
            style={[styles.filterPill, active && styles.activeFilterPill]}
          >
            <Text style={[styles.filterPillText, active && styles.activeFilterPillText]}>
              {category}
            </Text>
            <View style={[styles.pillBadge, active && styles.activePillBadge]}>
              <Text style={[styles.pillBadgeText, active && styles.activePillBadgeText]}>
                {count}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
