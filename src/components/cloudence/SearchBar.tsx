import React, { useState } from "react";
import { View, TextInput, Pressable, StyleSheet } from "react-native";
import { Search, X } from "lucide-react-native";
import { theme } from "../../constants/theme";

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
};

export default function SearchBar({
  value,
  onChangeText,
  placeholder = "Search files, formats, categories...",
}: Props) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        isFocused && styles.focusedContainer,
      ]}
    >
      <Search
        size={18}
        color={isFocused ? theme.colors.brand : theme.colors.secondaryText}
        strokeWidth={2.2}
      />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.mutedText}
        style={styles.input}
        returnKeyType="search"
        autoCapitalize="none"
        accessibilityLabel="Search files"
      />

      {value.length > 0 && (
        <Pressable
          hitSlop={8}
          onPress={() => onChangeText("")}
          style={styles.clearBtn}
        >
          <X size={15} color={theme.colors.secondaryText} strokeWidth={2.4} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.2,
    borderColor: theme.colors.border,
    shadowColor: "rgba(66, 71, 97, 0.04)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 1,
  },
  focusedContainer: {
    borderColor: theme.colors.brand,
    backgroundColor: "#FFFFFF",
    shadowColor: theme.colors.brand,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    color: theme.colors.text,
    paddingVertical: 0,
    fontWeight: "500",
  },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
});