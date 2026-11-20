import { StyleSheet } from "react-native";
import { theme } from "../../constants/theme";

export const filesScreenStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 36,
  },
  title: {
    fontSize: 27,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.7,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 12.5,
    color: theme.colors.secondaryText,
    marginTop: 4,
  },
  searchSection: {
    marginTop: 16,
  },
  pillList: {
    gap: 8,
    paddingVertical: 14,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7.5,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.2,
    borderColor: theme.colors.border,
  },
  activeFilterPill: {
    backgroundColor: theme.colors.brand,
    borderColor: theme.colors.brand,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.secondaryText,
  },
  activeFilterPillText: {
    color: "#FFFFFF",
  },
  pillBadge: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  activePillBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
  },
  pillBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.secondaryText,
  },
  activePillBadgeText: {
    color: "#FFFFFF",
  },
  folderSection: {
    marginBottom: 18,
  },
  folderHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  folderHeadingText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  createFolderButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brandLight,
  },
  createFolderText: {
    color: theme.colors.brandDark,
    fontSize: 11,
    fontWeight: "700",
  },
  folderGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  folderBreadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  folderBreadcrumbText: {
    color: theme.colors.brand,
    fontSize: 12,
    fontWeight: "700",
  },
  controlBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  totalLabel: {
    fontSize: 12.5,
    color: theme.colors.secondaryText,
  },
  totalValue: {
    fontWeight: "800",
    color: theme.colors.text,
  },
  countLabel: {
    fontSize: 11,
    color: theme.colors.mutedText,
    marginTop: 2,
  },
  rightControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sortButtonText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: theme.colors.brand,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  listContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "rgba(66, 71, 97, 0.05)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  loadMoreButton: {
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 14,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  loadMoreText: {
    color: theme.colors.brand,
    fontSize: 12,
    fontWeight: "700",
  },
});
