import { Text, View } from "react-native";
import type { CloudenceUsage } from "../../../lib/api/files";
import { planOverviewStyles as styles } from "./SubscriptionPlanOverview.styles";

type Props = { active: boolean; usage: CloudenceUsage; price?: string };

export default function SubscriptionPlanOverview({ active, usage, price }: Props) {
    const expiry = usage.expiresAt ? new Date(usage.expiresAt) : null;
    const expiryLabel = expiry && Number.isFinite(expiry.getTime())
        ? expiry.toLocaleDateString() : null;
    return (
        <>
            <View>
                <View style={styles.planHeading}>
                    <Text accessibilityRole="header" style={styles.planName}>Cloudence Pro</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{active ? "Active" : "Monthly"}</Text>
                    </View>
                </View>
                {price ? (
                    <Text style={styles.price}>
                        {price}<Text style={styles.period}> / month</Text>
                    </Text>
                ) : (
                    <Text style={styles.price}>50<Text style={styles.period}> GB</Text></Text>
                )}
                {active && expiryLabel ? (
                    <Text style={styles.expiry}>Access until {expiryLabel}</Text>
                ) : null}
            </View>
        </>
    );
}
