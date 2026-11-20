import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../constants/theme";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import {
  setDefaultFileView,
  useWorkspacePreferences,
} from "../hooks/useWorkspacePreferences";
import { workspacePreferencesStyles as styles } from "../components/cloudence/WorkspacePreferencesScreen.styles";

export default function WorkspacePreferencesScreen() {
  const layout = useResponsiveLayout();
  const { defaultFileView } = useWorkspacePreferences();

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
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back to account settings"
            style={styles.backButton}
          >
            <ChevronLeft size={21} color={theme.colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Workspace preferences</Text>
            <Text style={styles.subtitle}>
              Choose how Cloudence works on this device.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>File browsing</Text>
        <Text style={styles.sectionSubtitle}>
          Set your preferred layout for file collections.
        </Text>
        <View style={styles.card}>
          <Text style={styles.optionTitle}>Default file view</Text>
          <Text style={styles.optionDescription}>
            Choose the layout to use when opening your files.
          </Text>
          <View style={styles.segmented}>
            {(["grid", "list"] as const).map((view) => {
              const selected = defaultFileView === view;
              return (
                <Pressable
                  key={view}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setDefaultFileView(view)}
                  style={[styles.segment, selected && styles.segmentSelected]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      selected && styles.segmentTextSelected,
                    ]}
                  >
                    {view === "grid" ? "Grid" : "List"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
