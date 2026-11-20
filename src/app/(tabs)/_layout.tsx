import React from "react";
import { NativeTabs } from "expo-router/native-tabs";
import { theme } from "../../constants/theme";

export default function TabLayout() {
  return (
    <NativeTabs
      backgroundColor="#FFFFFF"
      indicatorColor={theme.colors.brandLight}
      tintColor={theme.colors.brand}
      iconColor={{ default: "#829598", selected: theme.colors.brand }}
      labelStyle={{
        color: "#829598",
        selected: { color: theme.colors.brand },
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }}
          md={{ default: "dashboard", selected: "dashboard" }}
          selectedColor={theme.colors.brand}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="files">
        <NativeTabs.Trigger.Label>Files</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "folder", selected: "folder.fill" }}
          md={{ default: "folder_open", selected: "folder_open" }}
          selectedColor={theme.colors.brand}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="images">
        <NativeTabs.Trigger.Label>Images</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "photo", selected: "photo.fill" }}
          md={{ default: "image", selected: "image" }}
          selectedColor={theme.colors.brand}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="media">
        <NativeTabs.Trigger.Label>Media</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "play.rectangle", selected: "play.rectangle.fill" }}
          md={{ default: "movie", selected: "movie" }}
          selectedColor={theme.colors.brand}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Account</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }}
          md={{ default: "account_circle", selected: "account_circle" }}
          selectedColor={theme.colors.brand}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
