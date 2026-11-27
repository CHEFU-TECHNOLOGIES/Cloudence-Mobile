import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Check } from "lucide-react-native";
import { theme } from "../../../constants/theme";
import { CLOUDENCE_PLAY_PRODUCTS } from "../../../lib/api/cloudenceBilling";
import type { CloudenceUsage } from "../../../lib/api/files";
import type { useCloudenceSubscription } from "./useCloudenceSubscription";
import SubscriptionPlanOverview from "./SubscriptionPlanOverview";
import { subscriptionStyles as styles } from "./subscription.styles";

type Props = {
    usage: CloudenceUsage;
    billing: ReturnType<typeof useCloudenceSubscription>;
};

export default function SubscriptionPlans({ usage, billing }: Props) {
    const {
        active,
        loading,
        billingEnabled,
        processing,
        restoring,
        subscriptions,
        purchaseProduct,
        restorePurchases,
        manageSubscription,
        plansLoading,
        plansError,
        reloadPlans,
    } = billing;
    const product = subscriptions.find(
        (item) => item.id === CLOUDENCE_PLAY_PRODUCTS[0],
    );
    const busy = processing || restoring;
    return (
        <View>
            <View style={styles.planCard}>
                <SubscriptionPlanOverview
                    active={active}
                    usage={usage}
                    price={product?.displayPrice}
                />
                <View style={styles.planActions}>
                    {loading ? (
                        <ActivityIndicator
                            color={theme.colors.brand}
                            accessibilityLabel="Loading subscription"
                        />
                    ) : active ? (
                        <Pressable
                            accessibilityRole="button"
                            onPress={() => void manageSubscription()}
                            style={styles.button}
                        >
                            <Text style={styles.buttonText}>
                                Manage subscription
                            </Text>
                        </Pressable>
                    ) : !billingEnabled ? (
                        <Text style={styles.secondaryText}>
                            Google Play subscriptions are not available yet.
                        </Text>
                    ) : plansLoading ? (
                        <ActivityIndicator
                            color={theme.colors.brand}
                            accessibilityLabel="Loading price"
                        />
                    ) : plansError ? (
                        <>
                            <Text style={styles.secondaryText}>
                                {plansError}
                            </Text>
                            <Pressable
                                accessibilityRole="button"
                                onPress={() => void reloadPlans()}
                                style={styles.button}
                            >
                                <Text style={styles.buttonText}>Try again</Text>
                            </Pressable>
                        </>
                    ) : product ? (
                        <>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={`Subscribe to Cloudence Pro for ${product.displayPrice} per month`}
                                disabled={busy}
                                onPress={() =>
                                    void purchaseProduct(
                                        CLOUDENCE_PLAY_PRODUCTS[0],
                                    )
                                }
                                style={({ pressed }) => [
                                    styles.button,
                                    busy && styles.disabled,
                                    pressed && styles.pressed,
                                ]}
                            >
                                <Text style={styles.buttonText}>
                                    {processing
                                        ? "Processing..."
                                        : "Upgrade plan"}
                                </Text>
                            </Pressable>
                            <Text style={styles.billingNote}>
                                Renews monthly. Cancel anytime.
                            </Text>
                        </>
                    ) : (
                        <Text style={styles.secondaryText}>
                            No subscription plans are available.
                        </Text>
                    )}
                </View>
                <View style={styles.benefitList}>
                    {[
                        "50 GB total cloud storage",
                        "25 times the space of Free",
                        "Photos, videos & documents",
                        "Your existing sharing tools included",
                    ].map((benefit) => (
                        <View key={benefit} style={styles.benefitRow}>
                            <Check
                                size={15}
                                color={theme.colors.brand}
                                accessible={false}
                            />
                            <Text style={styles.benefitText}>{benefit}</Text>
                        </View>
                    ))}
                </View>
            </View>
            {billingEnabled && !active ? (
                <Pressable
                    accessibilityRole="button"
                    disabled={busy || plansLoading}
                    onPress={() => void restorePurchases()}
                    style={styles.restoreButton}
                >
                    <Text style={styles.restoreText}>
                        {restoring ? "Restoring..." : "Restore purchases"}
                    </Text>
                </Pressable>
            ) : null}
        </View>
    );
}
