import { useEffect, useState } from "react";
import { Check, Crown, X } from "lucide-react-native";
import { Image } from "expo-image";
import {
    AppState,
    Modal,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { router, usePathname } from "expo-router";
import { useSession } from "../../../auth/SessionContext";
import { useCloudenceData } from "../../../data/CloudenceDataProvider";
import { getCachedBillingStatus } from "../../../lib/cache/billingCache";
import { useSubscriptionPromotion } from "./SubscriptionPromotionProvider";
import { promotionStyles as styles } from "./SubscriptionPromotion.styles";

type Props = {
    blocked: boolean;
};

export default function SubscriptionPromotion({ blocked }: Props) {
    const { user, getAccessToken } = useSession();
    const { usage, isOffline } = useCloudenceData();
    const { readyUserId, readySequence, claim } = useSubscriptionPromotion();
    const pathname = usePathname();
    const [openUserId, setOpenUserId] = useState<string | null>(null);
    const [appState, setAppState] = useState(AppState.currentState);
    const onHome = pathname === "/";
    const free = !!usage && usage.plan !== "50gb" && usage.all <= 2 * 1024 ** 3;
    const available =
        onHome && !blocked && !isOffline && free && appState === "active";

    useEffect(() => {
        const subscription = AppState.addEventListener("change", setAppState);
        return () => subscription.remove();
    }, []);

    useEffect(() => {
        if (!available || !user?.id || readyUserId !== user.id) return;
        let current = true;
        void getCachedBillingStatus(user.id, getAccessToken)
            .then(async (status) => {
                if (!current || !status.enabled) return;
                if ((await claim()) && current) setOpenUserId(user.id);
            })
            .catch(() => undefined);
        return () => {
            current = false;
        };
    }, [
        available,
        claim,
        getAccessToken,
        readyUserId,
        readySequence,
        user?.id,
    ]);

    const dismiss = () => {
        setOpenUserId(null);
    };
    const viewPlan = () => {
        dismiss();
        router.push({ pathname: "/profile", params: { subscription: "1" } });
    };

    return (
        <Modal
            visible={!!user?.id && openUserId === user.id && available}
            transparent
            animationType="fade"
            onRequestClose={dismiss}
        >
            <View style={styles.backdrop}>
                <Pressable
                    style={styles.dismissArea}
                    onPress={dismiss}
                    accessibilityLabel="Dismiss subscription invitation"
                    accessibilityRole="button"
                />
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.card} accessibilityViewIsModal>
                        <View
                            style={styles.headerArtwork}
                            pointerEvents="none"
                            accessible={false}
                        >
                            <View style={styles.headerWave} />
                            <View style={styles.headerWaveSmall} />
                        </View>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Close subscription invitation"
                            onPress={dismiss}
                            style={({ pressed }) => [
                                styles.closeButton,
                                pressed && styles.pressed,
                            ]}
                        >
                            <X size={19} color={styles.closeIcon.color} />
                        </Pressable>
                        <View style={styles.proBadge} accessible={false}>
                            <Crown size={29} color="#FFD66B" fill="#FFD66B" />
                            <Text style={styles.proBadgeText}>PRO</Text>
                        </View>
                        <Text
                            accessibilityRole="header"
                            style={styles.headline}
                        >
                            Upgrade to Cloudence Pro
                        </Text>
                        <Text style={styles.subtitle}>
                            Get more space and powerful features for your files
                            and collaboration.
                        </Text>
                        <View style={styles.storagePanel}>
                            <Image
                                source={require("../../../../assets/images/subscription-cloud.png")}
                                style={styles.illustration}
                                contentFit="contain"
                                accessible={false}
                            />
                            <View style={styles.storageDivider} />
                            <View style={styles.storageCopy}>
                                <Text style={styles.capacity}>50 GB</Text>
                                <Text style={styles.caption}>
                                    Total cloud storage
                                </Text>
                            </View>
                        </View>
                        <View style={styles.benefitList}>
                            {[
                                "50 GB of secure cloud storage",
                                "Larger file uploads and sharing",
                                "Priority support and faster sync",
                                "AI-powered background removal",
                            ].map((benefit) => (
                                <View key={benefit} style={styles.benefitRow}>
                                    <View style={styles.checkCircle}>
                                        <Check
                                            size={13}
                                            color="#FFFFFF"
                                            strokeWidth={3}
                                        />
                                    </View>
                                    <Text style={styles.benefitText}>
                                        {benefit}
                                    </Text>
                                </View>
                            ))}
                        </View>
                        <Pressable
                            accessibilityRole="button"
                            onPress={viewPlan}
                            style={({ pressed }) => [
                                styles.button,
                                pressed && styles.pressed,
                            ]}
                        >
                            <Text style={styles.buttonText}>
                                Upgrade to Pro
                            </Text>
                        </Pressable>
                        <Text style={styles.billingNote}>
                            Monthly plan. Cancel anytime.
                        </Text>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}
