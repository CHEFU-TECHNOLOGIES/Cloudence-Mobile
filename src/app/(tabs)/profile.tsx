import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronRight,
  ShieldCheck,
  UserRound,
  LogOut,
  Settings,
  HardDrive,
  Users,
  Bell,
  Sparkles,
} from "lucide-react-native";

import AppHeader from "../../components/cloudence/AppHeader";
import CloudenceLogo from "../../components/cloudence/CloudenceLogo";
import { theme } from "../../constants/theme";
import { mockCurrentUser, mockFiles, getStorageSummary } from "../../data/mockFiles";
import { convertFileSize } from "../../utils/fileUtils";

const settingsOptions = [
  {
    title: "Personal Information",
    subtitle: "Update name, profile picture and email",
    icon: UserRound,
  },
  {
    title: "Security & Two-Factor Auth",
    subtitle: "Encryption keys and device sessions",
    icon: ShieldCheck,
  },
  {
    title: "Shared Access & Team",
    subtitle: "Manage shared links and collaborator roles",
    icon: Users,
  },
  {
    title: "Notifications & Alerts",
    subtitle: "Quota limits and collaborator activity",
    icon: Bell,
  },
  {
    title: "Workspace Preferences",
    subtitle: "Default upload views and CDN cache",
    icon: Settings,
  },
];

export default function ProfileScreen() {
  const summary = getStorageSummary(mockFiles);

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out of your Cloudence workspace?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () =>
            Alert.alert("Signed Out", "You have been logged out safely."),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader />

        <Text style={styles.title}>Account & Workspace</Text>
        <Text style={styles.subtitle}>
          Manage your personal profile, storage quota, and security.
        </Text>

        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            {mockCurrentUser.avatar ? (
              <Image
                source={{ uri: mockCurrentUser.avatar }}
                style={styles.avatar}
              />
            ) : (
              <UserRound size={32} color={theme.colors.brand} />
            )}
          </View>

          <Text style={styles.name}>{mockCurrentUser.fullName}</Text>
          <Text style={styles.email}>{mockCurrentUser.email}</Text>

          <View style={styles.planBadge}>
            <Sparkles size={13} color={theme.colors.brandDark} />
            <Text style={styles.planText}>{mockCurrentUser.plan}</Text>
          </View>
        </View>

        {/* Storage Breakdown Card */}
        <View style={styles.storageBreakdownCard}>
          <View style={styles.storageHeader}>
            <View style={styles.storageIconWrapper}>
              <HardDrive size={18} color={theme.colors.brand} />
            </View>
            <View style={styles.storageHeaderText}>
              <Text style={styles.storageCardTitle}>Storage Breakdown</Text>
              <Text style={styles.storageCardSub}>
                {convertFileSize(summary.totalUsed)} used of{" "}
                {convertFileSize(summary.totalStorage)} ({summary.percentage}%)
              </Text>
            </View>
          </View>

          {/* Segmented Progress Bar */}
          <View style={styles.segmentedBar}>
            <View
              style={[
                styles.segment,
                {
                  flex: summary.categories.Documents.size || 1,
                  backgroundColor: theme.colors.documents.barColor,
                },
              ]}
            />
            <View
              style={[
                styles.segment,
                {
                  flex: summary.categories.Images.size || 1,
                  backgroundColor: theme.colors.images.barColor,
                },
              ]}
            />
            <View
              style={[
                styles.segment,
                {
                  flex: summary.categories.Media.size || 1,
                  backgroundColor: theme.colors.media.barColor,
                },
              ]}
            />
            <View
              style={[
                styles.segment,
                {
                  flex: summary.categories.Others.size || 1,
                  backgroundColor: theme.colors.others.barColor,
                },
              ]}
            />
          </View>

          {/* Legend Items */}
          <View style={styles.legendGrid}>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: theme.colors.documents.barColor },
                ]}
              />
              <Text style={styles.legendText}>
                Docs: {convertFileSize(summary.categories.Documents.size)}
              </Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: theme.colors.images.barColor },
                ]}
              />
              <Text style={styles.legendText}>
                Images: {convertFileSize(summary.categories.Images.size)}
              </Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: theme.colors.media.barColor },
                ]}
              />
              <Text style={styles.legendText}>
                Media: {convertFileSize(summary.categories.Media.size)}
              </Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: theme.colors.others.barColor },
                ]}
              />
              <Text style={styles.legendText}>
                Others: {convertFileSize(summary.categories.Others.size)}
              </Text>
            </View>
          </View>
        </View>

        {/* Settings Group */}
        <View style={styles.optionsCard}>
          {settingsOptions.map(({ title, subtitle, icon: Icon }, idx) => (
            <Pressable
              key={title}
              style={[
                styles.optionRow,
                idx === settingsOptions.length - 1 && styles.noBorder,
              ]}
              onPress={() =>
                Alert.alert(title, `Managing your ${title.toLowerCase()}.`)
              }
            >
              <View style={styles.optionIconBox}>
                <Icon size={19} color={theme.colors.brand} />
              </View>

              <View style={styles.optionTextBox}>
                <Text style={styles.optionTitle}>{title}</Text>
                <Text style={styles.optionSubtitle}>{subtitle}</Text>
              </View>

              <ChevronRight size={18} color={theme.colors.secondaryText} />
            </Pressable>
          ))}
        </View>

        {/* Sign Out Button matching web */}
        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && { backgroundColor: theme.colors.errorBg },
          ]}
          onPress={handleSignOut}
        >
          <LogOut size={18} color={theme.colors.error} />
          <Text style={styles.logoutText}>Sign Out of Cloudence</Text>
        </Pressable>

        {/* Brand Footer */}
        <View style={styles.brandingFooter}>
          <CloudenceLogo size={26} showText textSize={14} badge="v1.0" />
          <Text style={styles.brandingSubtext}>
            Cloudence Multi-Platform Storage · Encrypted Sync
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  brandingFooter: {
    alignItems: "center",
    marginTop: 28,
    marginBottom: 10,
    gap: 6,
  },
  brandingSubtext: {
    fontSize: 10.5,
    color: theme.colors.secondaryText,
    fontWeight: "500",
  },

  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  title: {
    fontSize: 27,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.7,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 12.5,
    color: theme.colors.secondaryText,
    marginTop: 4,
    marginBottom: 20,
  },
  profileCard: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 22,
    shadowColor: "rgba(66, 71, 97, 0.05)",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  avatarWrapper: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: theme.colors.brandLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: theme.colors.brandLight,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  name: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  email: {
    fontSize: 12.5,
    color: theme.colors.secondaryText,
    marginTop: 4,
  },
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: theme.colors.brandLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    marginTop: 14,
  },
  planText: {
    fontSize: 11.5,
    color: theme.colors.brandDark,
    fontWeight: "700",
  },
  storageBreakdownCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 16,
  },
  storageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  storageIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.brandLight,
    alignItems: "center",
    justifyContent: "center",
  },
  storageHeaderText: {
    flex: 1,
  },
  storageCardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.text,
  },
  storageCardSub: {
    fontSize: 11,
    color: theme.colors.secondaryText,
    marginTop: 2,
  },
  segmentedBar: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: theme.colors.borderSubtle,
    marginBottom: 12,
  },
  segment: {
    height: "100%",
  },
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    width: "46%",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: theme.colors.secondaryText,
    fontWeight: "600",
  },
  optionsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  optionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: theme.colors.brandLight,
    alignItems: "center",
    justifyContent: "center",
  },
  optionTextBox: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: theme.colors.text,
  },
  optionSubtitle: {
    fontSize: 11,
    color: theme.colors.secondaryText,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginTop: 4,
  },
  logoutText: {
    color: theme.colors.error,
    fontSize: 13,
    fontWeight: "700",
  },
});