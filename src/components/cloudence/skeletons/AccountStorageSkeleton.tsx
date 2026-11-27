import { Platform, View } from "react-native";
import { subscriptionStyles } from "../profile/subscription.styles";
import SkeletonBlock from "./SkeletonBlock";
import StorageBreakdownSkeleton from "./StorageBreakdownSkeleton";

export default function AccountStorageSkeleton() {
    return (
        <>
            <StorageBreakdownSkeleton />
            {Platform.OS === "android" ? (
                <View
                    style={subscriptionStyles.summaryCard}
                    accessibilityLabel="Loading subscription"
                    accessibilityState={{ busy: true }}
                >
                    <View style={subscriptionStyles.summaryText}>
                        <SkeletonBlock width={100} height={16} borderRadius={5} />
                        <SkeletonBlock width={132} height={13} borderRadius={5} />
                    </View>
                    <SkeletonBlock width={18} height={18} borderRadius={5} />
                </View>
            ) : null}
        </>
    );
}
