import { ExternalLink } from "lucide-react-native";
import { Image, Linking, Pressable, Text, View } from "react-native";
import type { CloudenceUser } from "../../../auth/SessionContext";
import { theme } from "../../../constants/theme";
import { profileStyles as styles } from "../ProfileScreen.styles";
import { useToast } from "../ToastProvider";

type Props = {
  user: CloudenceUser | null;
};

export default function ProfileIdentityCard({ user }: Props) {
  const { showToast } = useToast();
  const name =
    user?.fullName?.trim() || user?.email?.split("@")[0] || "Cloudence user";
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  const openAccount = async () => {
    try {
      await Linking.openURL("https://myaccount.chefu.co.za");
    } catch {
      showToast({
        title: "Unable to open account",
        message: "Please try again in a moment.",
        variant: "error",
      });
    }
  };

  return (
    <View style={styles.profileCard}>
      <View style={styles.avatarWrapper}>
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        ) : (
          <Text style={styles.avatarInitials}>{initials}</Text>
        )}
      </View>

      <View style={styles.profileInfo}>
        <Text numberOfLines={2} style={styles.name}>
          {name}
        </Text>
        <Text numberOfLines={1} style={styles.email}>
          {user?.email || "Email unavailable"}
        </Text>
        <Pressable
          hitSlop={10}
          onPress={() => void openAccount()}
          accessibilityRole="link"
          accessibilityLabel="Open your account on Chefu Account"
          style={{
            flexDirection: "row",
            gap: 4,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "500",
              color: theme.colors.brand,
            }}
          >
            Manage my account
          </Text>
          <ExternalLink
            size={14}
            color={theme.colors.brand}
            strokeWidth={2.2}
          />
        </Pressable>
      </View>
    </View>
  );
}
