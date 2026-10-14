import React from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { Plus, Bell } from "lucide-react-native";
import { theme } from "../../constants/theme";
import { mockCurrentUser } from "../../data/mockFiles";
import CloudenceLogo from "./CloudenceLogo";

type Props = {
  onUpload?: () => void;
  onNotifications?: () => void;
  onProfilePress?: () => void;
};

export default function AppHeader({
  onUpload,
  onNotifications,
  onProfilePress,
}: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onProfilePress}
        style={({ pressed }) => [
          styles.brandPressable,
          pressed && { opacity: 0.8 },
        ]}
      >
        <CloudenceLogo
          size={38}
          showText
          textSize={19}
          badge="PRO"
        />
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          onPress={onUpload}
          accessibilityLabel="Upload file"
          style={({ pressed }) => [
            styles.uploadButton,
            pressed && { opacity: 0.88, transform: [{ scale: 0.96 }] },
          ]}
        >
          <Plus size={17} color="#FFFFFF" strokeWidth={2.6} />
          <Text style={styles.uploadText}>Upload</Text>
        </Pressable>

        <Pressable
          onPress={onNotifications}
          accessibilityLabel="Notifications"
          style={({ pressed }) => [
            styles.iconButton,
            pressed && { backgroundColor: theme.colors.borderSubtle },
          ]}
        >
          <Bell size={18} color={theme.colors.text} />
          <View style={styles.notifDot} />
        </Pressable>

        <Pressable
          onPress={onProfilePress}
          accessibilityLabel="Profile"
          style={({ pressed }) => [
            styles.avatarButton,
            pressed && { opacity: 0.8 },
          ]}
        >
          {mockCurrentUser.avatar ? (
            <Image
              source={{ uri: mockCurrentUser.avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>
                {mockCurrentUser.fullName.charAt(0)}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
    paddingTop: 4,
  },
  brandPressable: {
    flexDirection: "row",
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: theme.colors.brand,
    paddingHorizontal: 12,
    paddingVertical: 7.5,
    borderRadius: theme.radius.full,
    shadowColor: theme.colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  uploadText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notifDot: {
    position: "absolute",
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.brand,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: theme.colors.brandLight,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: theme.colors.brandLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.brand,
  },
});