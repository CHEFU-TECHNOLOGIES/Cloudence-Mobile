import { ChevronRight, LogOut } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { profileStyles as styles } from "../ProfileScreen.styles";
import { theme } from "../../../constants/theme";
import LegalLinksSection from "./LegalLinksSection";

type Props = {
    onSharedAccessPress: () => void;
    onNotificationsPress: () => void;
    onWorkspacePreferencesPress: () => void;
    onSwitchAccount: () => void;
    isSwitchingAccount: boolean;
    onSignOut: () => void;
};

export default function ProfileSettingsSection({
    onSharedAccessPress,
    onWorkspacePreferencesPress,
    onSwitchAccount,
    isSwitchingAccount,
    onSignOut,
}: Props) {
    const settingsOptions = [
        {
            id: "shared-access",
            title: "Shared Access & Team",
            subtitle: "Manage collaborator access to your files",
            onPress: onSharedAccessPress,
        },
        {
            id: "workspace-preferences",
            title: "Workspace Preferences",
            subtitle: "Default upload views",
            onPress: onWorkspacePreferencesPress,
        },
    ];

    return (
        <>
            <View style={styles.optionsCard}>
                {settingsOptions.map(({ id, title, subtitle, onPress }, index) => (
                    <Pressable
                        key={id}
                        accessibilityRole="button"
                        style={[
                            styles.optionRow,
                            index === settingsOptions.length - 1 &&
                                styles.noBorder,
                        ]}
                        onPress={onPress}
                    >
                        <View style={styles.optionTextBox}>
                            <Text style={styles.optionTitle}>{title}</Text>
                            <Text style={styles.optionSubtitle}>
                                {subtitle}
                            </Text>
                        </View>
                        <ChevronRight
                            size={18}
                            color={theme.colors.secondaryText}
                        />
                    </Pressable>
                ))}
            </View>

            <LegalLinksSection />

            <View style={styles.accountActionsCard}>
                <Pressable
                    accessibilityRole="button"
                    disabled={isSwitchingAccount}
                    style={({ pressed }) => [
                        styles.accountActionRow,
                        pressed && { opacity: 0.7 },
                        isSwitchingAccount && { opacity: 0.6 },
                    ]}
                    onPress={onSwitchAccount}
                >
                    <View style={styles.optionTextBox}>
                        <Text style={styles.optionTitle}>
                            {isSwitchingAccount
                                ? "Switching account..."
                                : "Switch account"}
                        </Text>
                        <Text style={styles.optionSubtitle}>
                            Choose another Cloudence account
                        </Text>
                    </View>
                    <ChevronRight
                        size={18}
                        color={theme.colors.secondaryText}
                    />
                </Pressable>

                <Pressable
                    style={({ pressed }) => [
                        styles.logoutButton,
                        pressed && { backgroundColor: theme.colors.errorBg },
                    ]}
                    onPress={onSignOut}
                >
                    <LogOut size={18} color={theme.colors.error} />
                    <Text style={styles.logoutText}>Sign Out of Cloudence</Text>
                </Pressable>
            </View>
        </>
    );
}
