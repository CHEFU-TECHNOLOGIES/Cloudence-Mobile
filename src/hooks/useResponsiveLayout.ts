import { useWindowDimensions } from "react-native";
import { getResponsiveLayoutMetrics } from "../utils/responsiveLayout";

export function useResponsiveLayout() {
  const { width } = useWindowDimensions();
  return getResponsiveLayoutMetrics(width);
}
