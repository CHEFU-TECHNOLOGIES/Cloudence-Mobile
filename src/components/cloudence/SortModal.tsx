import React from "react";
import {
  Pressable,
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import { Check, ArrowDownUp, X } from "lucide-react-native";
import { SortType } from "../../types/file";
import { theme } from "../../constants/theme";

export const sortOptions: { label: string; value: SortType }[] = [
  { label: "Date created (newest)", value: "$createdAt-desc" },
  { label: "Created Date (oldest)", value: "$createdAt-asc" },
  { label: "Name (A-Z)", value: "name-asc" },
  { label: "Name (Z-A)", value: "name-desc" },
  { label: "Size (Highest)", value: "size-desc" },
  { label: "Size (Lowest)", value: "size-asc" },
];

type Props = {
  visible: boolean;
  selectedSort: SortType;
  onSelect: (sort: SortType) => void;
  onClose: () => void;
};

export default function SortModal({
  visible,
  selectedSort,
  onSelect,
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.titleRow}>
                  <ArrowDownUp size={18} color={theme.colors.brand} />
                  <Text style={styles.title}>Sort Files</Text>
                </View>

                <Pressable
                  onPress={onClose}
                  hitSlop={8}
                  style={styles.closeButton}
                >
                  <X size={18} color={theme.colors.secondaryText} />
                </Pressable>
              </View>

              {/* Options */}
              <View style={styles.optionsList}>
                {sortOptions.map((option) => {
                  const isSelected = selectedSort === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        onSelect(option.value);
                        onClose();
                      }}
                      style={({ pressed }) => [
                        styles.optionItem,
                        isSelected && styles.selectedOptionItem,
                        pressed && { backgroundColor: theme.colors.surfaceSubtle },
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionLabel,
                          isSelected && styles.selectedOptionLabel,
                        ]}
                      >
                        {option.label}
                      </Text>

                      {isSelected && (
                        <View style={styles.checkCircle}>
                          <Check size={14} color="#FFFFFF" strokeWidth={2.8} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(4, 5, 12, 0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
  },
  closeButton: {
    padding: 4,
    borderRadius: theme.radius.full,
  },
  optionsList: {
    gap: 4,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
  },
  selectedOptionItem: {
    backgroundColor: theme.colors.brandLight,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  selectedOptionLabel: {
    color: theme.colors.brandDark,
    fontWeight: "700",
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
});
