import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { LayoutGrid, List } from "lucide-react-native";
import { ViewType } from "../../types/file";
import { theme } from "../../constants/theme";

type Props = {
  view: ViewType;
  onChange: (view: ViewType) => void;
};

export default function ViewToggle({ view, onChange }: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => onChange("grid")}
        accessibilityLabel="Grid View"
        style={[
          styles.button,
          view === "grid" && styles.activeButton,
        ]}
      >
        <LayoutGrid
          size={16}
          color={view === "grid" ? "#FFFFFF" : theme.colors.secondaryText}
        />
      </Pressable>

      <Pressable
        onPress={() => onChange("list")}
        accessibilityLabel="List View"
        style={[
          styles.button,
          view === "list" && styles.activeButton,
        ]}
      >
        <List
          size={16}
          color={view === "list" ? "#FFFFFF" : theme.colors.secondaryText}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  button: {
    width: 32,
    height: 30,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  activeButton: {
    backgroundColor: theme.colors.brand,
  },
});
