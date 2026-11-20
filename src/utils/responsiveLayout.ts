export type ResponsiveLayoutMetrics = {
  contentWidth: number;
  horizontalPadding: number;
  contentMaxWidth: number;
  tabRailWidth: number;
  useSideTabs: boolean;
  gridColumns: number;
  gridGap: number;
  cardWidth: number;
};

export function getResponsiveLayoutMetrics(
  windowWidth: number,
): ResponsiveLayoutMetrics {
  const useSideTabs = windowWidth >= 768;
  const tabRailWidth = useSideTabs
    ? windowWidth >= 1100
      ? 220
      : 76
    : 0;
  const contentWidth = Math.max(0, windowWidth - tabRailWidth);
  const contentMaxWidth = Math.min(contentWidth, 1200);
  const horizontalPadding =
    contentWidth < 360 ? 14 : contentWidth < 600 ? 18 : contentWidth < 900 ? 26 : 32;
  const availableWidth = Math.max(
    0,
    contentMaxWidth - horizontalPadding * 2,
  );
  const gridColumns =
    availableWidth < 320
      ? 1
      : availableWidth < 560
        ? 2
        : availableWidth < 820
          ? 3
          : 4;
  const gridGap = 12;

  return {
    contentWidth,
    horizontalPadding,
    contentMaxWidth,
    tabRailWidth,
    useSideTabs,
    gridColumns,
    gridGap,
    cardWidth:
      (availableWidth - gridGap * (gridColumns - 1)) / gridColumns,
  };
}
