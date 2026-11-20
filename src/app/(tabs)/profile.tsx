import React from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    RefreshControl,
    StatusBar,
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
import WorkspaceStatus from "../../components/cloudence/WorkspaceStatus";
import { useSession } from "../../auth/SessionContext";
import { useCloudenceData } from "../../data/CloudenceDataProvider";
import { theme } from "../../constants/theme";
import { convertFileSize } from "../../utils/fileUtils";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { profileStyles as styles } from "../../components/cloudence/ProfileScreen.styles";

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
    const layout = useResponsiveLayout();
    const { user, signOut } = useSession();
    const { usage, isLoading, isRefreshing, isOffline, error, refresh } = useCloudenceData();
    const categorySizes = {
        Documents: usage?.document.size ?? 0,
        Images: usage?.image.size ?? 0,
        Media: (usage?.video.size ?? 0) + (usage?.audio.size ?? 0),
        Others: usage?.other.size ?? 0,
    };
    const totalUsed = usage?.used ?? 0;
    const totalStorage = usage?.all ?? 0;
    const percentage =
        totalStorage > 0
            ? Number(((totalUsed / totalStorage) * 100).toFixed(1))
            : 0;

    const handleSignOut = () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out of your Cloudence workspace?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: () => {
                        void signOut().catch((signOutError: unknown) => {
                            Alert.alert(
                                "Sign Out Failed",
                                signOutError instanceof Error
                                    ? signOutError.message
                                    : "Your session could not be cleared.",
                            );
                        });
                    },
                },
            ],
        );
    };

    return (
        <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
            <StatusBar barStyle="dark-content" />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[
                    styles.content,
                    {
                        width: "100%",
                        maxWidth: layout.contentMaxWidth,
                        alignSelf: "center",
                        paddingHorizontal: layout.horizontalPadding,
                    },
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => void refresh()}
                        tintColor={theme.colors.brand}
                        colors={[theme.colors.brand]}
                    />
                }
            >
                <AppHeader />

                <Text style={styles.title}>Account & Workspace</Text>
                <Text style={styles.subtitle}>
                    Manage your personal profile, storage quota, and security.
                </Text>

                <WorkspaceStatus
                    loading={isLoading}
                    error={error}
                    offline={isOffline}
                    onRetry={refresh}
                />

                {/* User Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarWrapper}>
                        {user?.avatar ? (
                            <Image
                                source={{ uri: user.avatar }}
                                style={styles.avatar}
                            />
                        ) : (
                            <UserRound size={32} color={theme.colors.brand} />
                        )}
                    </View>

                    <Text style={styles.name}>
                        {user?.fullName ||
                            user?.email?.split("@")[0] ||
                            "Cloudence user"}
                    </Text>
                    <Text style={styles.email}>
                        {user?.email || "Email unavailable"}
                    </Text>

                    
                </View>

                {/* Storage Breakdown Card */}
                {usage && (
                    <View style={styles.storageBreakdownCard}>
                        <View style={styles.storageHeader}>
                            <View style={styles.storageIconWrapper}>
                                <HardDrive
                                    size={18}
                                    color={theme.colors.brand}
                                />
                            </View>
                            <View style={styles.storageHeaderText}>
                                <Text style={styles.storageCardTitle}>
                                    Storage Breakdown
                                </Text>
                                <Text style={styles.storageCardSub}>
                                    {convertFileSize(totalUsed)} used of{" "}
                                    {convertFileSize(totalStorage)} (
                                    {percentage}%)
                                </Text>
                            </View>
                        </View>

                        {/* Segmented Progress Bar */}
                        <View style={styles.segmentedBar}>
                            <View
                                style={[
                                    styles.segment,
                                    {
                                        flex: categorySizes.Documents || 1,
                                        backgroundColor:
                                            theme.colors.documents.barColor,
                                    },
                                ]}
                            />
                            <View
                                style={[
                                    styles.segment,
                                    {
                                        flex: categorySizes.Images || 1,
                                        backgroundColor:
                                            theme.colors.images.barColor,
                                    },
                                ]}
                            />
                            <View
                                style={[
                                    styles.segment,
                                    {
                                        flex: categorySizes.Media || 1,
                                        backgroundColor:
                                            theme.colors.media.barColor,
                                    },
                                ]}
                            />
                            <View
                                style={[
                                    styles.segment,
                                    {
                                        flex: categorySizes.Others || 1,
                                        backgroundColor:
                                            theme.colors.others.barColor,
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
                                        {
                                            backgroundColor:
                                                theme.colors.documents.barColor,
                                        },
                                    ]}
                                />
                                <Text style={styles.legendText}>
                                    Docs:{" "}
                                    {convertFileSize(categorySizes.Documents)}
                                </Text>
                            </View>

                            <View style={styles.legendItem}>
                                <View
                                    style={[
                                        styles.legendDot,
                                        {
                                            backgroundColor:
                                                theme.colors.images.barColor,
                                        },
                                    ]}
                                />
                                <Text style={styles.legendText}>
                                    Images:{" "}
                                    {convertFileSize(categorySizes.Images)}
                                </Text>
                            </View>

                            <View style={styles.legendItem}>
                                <View
                                    style={[
                                        styles.legendDot,
                                        {
                                            backgroundColor:
                                                theme.colors.media.barColor,
                                        },
                                    ]}
                                />
                                <Text style={styles.legendText}>
                                    Media:{" "}
                                    {convertFileSize(categorySizes.Media)}
                                </Text>
                            </View>

                            <View style={styles.legendItem}>
                                <View
                                    style={[
                                        styles.legendDot,
                                        {
                                            backgroundColor:
                                                theme.colors.others.barColor,
                                        },
                                    ]}
                                />
                                <Text style={styles.legendText}>
                                    Others:{" "}
                                    {convertFileSize(categorySizes.Others)}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Settings Group */}
                <View style={styles.optionsCard}>
                    {settingsOptions.map(
                        ({ title, subtitle, icon: Icon }, idx) => (
                            <Pressable
                                key={title}
                                style={[
                                    styles.optionRow,
                                    idx === settingsOptions.length - 1 &&
                                        styles.noBorder,
                                ]}
                                onPress={() =>
                                    Alert.alert(
                                        title,
                                        `Managing your ${title.toLowerCase()}.`,
                                    )
                                }
                            >
                                <View style={styles.optionIconBox}>
                                    <Icon
                                        size={19}
                                        color={theme.colors.brand}
                                    />
                                </View>

                                <View style={styles.optionTextBox}>
                                    <Text style={styles.optionTitle}>
                                        {title}
                                    </Text>
                                    <Text style={styles.optionSubtitle}>
                                        {subtitle}
                                    </Text>
                                </View>

                                <ChevronRight
                                    size={18}
                                    color={theme.colors.secondaryText}
                                />
                            </Pressable>
                        ),
                    )}
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
                {/* <View style={styles.brandingFooter}>
                    <CloudenceLogo
                        size={26}
                        showText
                        textSize={14}
                        badge="v1.0"
                    />
                    <Text style={styles.brandingSubtext}>
                        Cloudence Multi-Platform Storage · Encrypted Sync
                    </Text>
                </View> */}
            </ScrollView>
        </SafeAreaView>
    );
}
