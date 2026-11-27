import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { subscriptionSheetStyles as styles } from "./SubscriptionSheet.styles";

type Props = {
    visible: boolean;
    onClose: () => void;
    children: ReactNode;
};

export default function SubscriptionSheet({ visible, onClose, children }: Props) {
    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={styles.root}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text accessibilityRole="header" style={styles.title}>Subscription</Text>
                        <Pressable accessibilityRole="button" onPress={onClose} style={styles.close}>
                            <Text style={styles.closeText}>Done</Text>
                        </Pressable>
                    </View>
                    <ScrollView contentContainerStyle={styles.plans}>
                        {children}
                    </ScrollView>
                </View>
            </SafeAreaView>
        </Modal>
    );
}
