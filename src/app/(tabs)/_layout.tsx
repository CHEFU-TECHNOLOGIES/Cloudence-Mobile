import React from "react";
import { Tabs } from "expo-router";
import {
  LayoutDashboard,
  FolderOpen,
  Image as ImageIcon,
  Film,
  UserRound,
} from "lucide-react-native";
import { theme } from "../../constants/theme";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";

export default function TabLayout() {
  const { useSideTabs, tabRailWidth } = useResponsiveLayout();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.brand,
        tabBarInactiveTintColor: "#829598",
        tabBarPosition: useSideTabs ? "left" : "bottom",
        tabBarVariant: useSideTabs ? "material" : "uikit",
        tabBarLabelPosition:
          useSideTabs && tabRailWidth < 100 ? "below-icon" : "beside-icon",
        tabBarHideOnKeyboard: true,
        tabBarStyle: useSideTabs
          ? {
              width: tabRailWidth,
              paddingTop: 20,
              paddingBottom: 16,
              backgroundColor: "#FFFFFF",
              borderRightColor: theme.colors.border,
              borderTopWidth: 0,
              elevation: 0,
            }
          : {
              height: 68,
              paddingTop: 8,
              paddingBottom: 10,
              backgroundColor: "#FFFFFF",
              borderTopColor: theme.colors.border,
              elevation: 4,
              shadowColor: "rgba(0,0,0,0.06)",
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 6,
            },
        tabBarLabelStyle: {
          fontSize: useSideTabs ? 11 : 10.5,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} strokeWidth={2.2} />
          ),
        }}
      />

      <Tabs.Screen
        name="files"
        options={{
          title: "Files",
          tabBarIcon: ({ color, size }) => (
            <FolderOpen color={color} size={size} strokeWidth={2.2} />
          ),
        }}
      />

      <Tabs.Screen
        name="images"
        options={{
          title: "Images",
          tabBarIcon: ({ color, size }) => (
            <ImageIcon color={color} size={size} strokeWidth={2.2} />
          ),
        }}
      />

      <Tabs.Screen
        name="media"
        options={{
          title: "Media",
          tabBarIcon: ({ color, size }) => (
            <Film color={color} size={size} strokeWidth={2.2} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Account",
          tabBarIcon: ({ color, size }) => (
            <UserRound color={color} size={size} strokeWidth={2.2} />
          ),
        }}
      />
    </Tabs>
  );
}