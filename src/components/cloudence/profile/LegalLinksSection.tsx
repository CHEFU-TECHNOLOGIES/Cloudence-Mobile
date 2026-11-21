import {
  Pressable,
  Linking,
  Text,
  View,
} from "react-native";
import { ExternalLink } from "lucide-react-native";
import { theme } from "../../../constants/theme";
import { profileStyles as styles } from "../ProfileScreen.styles";
import { useToast } from "../ToastProvider";

const legalLinks = [
    { label: "Privacy Policy", url: "https://cloudence.chefu.co.za/privacy" },
    {
        label: "Terms and Conditions",
        url: "https://cloudence.chefu.co.za/terms",
    },
];

export default function LegalLinksSection() {
    const { showToast } = useToast();

    const openLegalPage = async (url: string, label: string) => {
        try {
            await Linking.openURL(url);
        } catch {
            showToast({
                title: `Unable to open ${label.toLowerCase()}`,
                message: "Please try again in a moment.",
                variant: "error",
            });
        }
    };

    return (
        <View>
            <Text style={styles.legalSectionTitle}>Legal</Text>
            <View style={styles.legalLinksCard}>
                {legalLinks.map(({ label, url }, index) => (
                    <Pressable
                        key={label}
                        accessibilityRole="link"
                        accessibilityLabel={`Open ${label}`}
                        onPress={() => void openLegalPage(url, label)}
                        style={({ pressed }) => [
                            styles.legalLinkRow,
                            index === legalLinks.length - 1 && styles.noBorder,
                            pressed && { opacity: 0.7 },
                        ]}
                    >
                        <View style={styles.optionTextBox}>
                            <Text style={styles.optionTitle}>{label}</Text>
                        </View>
                        <ExternalLink
                            size={16}
                            color={theme.colors.secondaryText}
                        />
                    </Pressable>
                ))}
            </View>
        </View>
    );
}
