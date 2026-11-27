import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { Platform, Pressable, Text, View } from "react-native";
import { theme } from "../../../constants/theme";
import type { CloudenceUsage } from "../../../lib/api/files";
import SubscriptionSheet from "./SubscriptionSheet";
import SubscriptionPlans from "./SubscriptionPlans";
import { useCloudenceSubscription } from "./useCloudenceSubscription";
import { subscriptionStyles as styles } from "./subscription.styles";
import { profileStyles } from "../ProfileScreen.styles";

type Props = {
    usage: CloudenceUsage;
    onEntitlementUpdated: () => Promise<boolean>;
};

export default function CloudenceSubscriptionCard(props: Props) {
    const [openedLocally, setOpenedLocally] = useState(false);
    const { subscription } = useLocalSearchParams<{ subscription?: string }>();
    const plansVisible = openedLocally || subscription === "1";
    const closePlans = () => {
        setOpenedLocally(false);
        if (subscription === "1") router.setParams({ subscription: undefined });
    };
    const billing = useCloudenceSubscription({ ...props, plansVisible });
    if (Platform.OS !== "android") return null;

    return (
        <>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                    billing.active
                        ? "Manage subscription"
                        : "View subscription plans"
                }
                accessibilityHint="Opens subscription details and available plans"
                onPress={() => setOpenedLocally(true)}
                style={({ pressed }) => [
                    styles.summaryCard,
                    pressed && styles.pressed,
                ]}
            >
                <View style={profileStyles.optionTextBox}>
                    <Text style={profileStyles.optionTitle}>Subscription</Text>
                    <Text style={profileStyles.optionSubtitle}>
                        {billing.active
                            ? "50 GB plan active"
                            : "Explore storage plans"}
                    </Text>
                </View>
                <ChevronRight size={18} color={theme.colors.secondaryText} />
            </Pressable>
            <SubscriptionSheet
                visible={plansVisible}
                onClose={closePlans}
            >
                <SubscriptionPlans usage={props.usage} billing={billing} />
            </SubscriptionSheet>
        </>
    );
}
