import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

type Props = {
  width?: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

export default function SkeletonBlock({
  width = "100%",
  height,
  borderRadius = 8,
  style,
}: Props) {
  return (
    <View
      accessible={false}
      style={[styles.block, { width, height, borderRadius }, style]}
    />
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: "#E7EDF0",
    opacity: 0.82,
  },
});
