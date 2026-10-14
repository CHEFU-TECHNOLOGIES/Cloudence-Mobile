export const theme = {
  colors: {
    // Cloudence Brand Identity (Teal Palette)
    brand: "#008080",
    brandDark: "#006666",
    brandLight: "#E6F4F4",
    brandSurface: "#DFF0EF",
    primary: "#008080",
    primaryDark: "#006666",
    primaryLight: "#E6F4F4",

    // Neutrals & Surfaces matching web globals.css
    background: "#F2F4F8",
    surface: "#FFFFFF",
    surfaceSubtle: "#F8FAFC",
    text: "#131524",
    textDark: "#04050C",
    secondaryText: "#678184",
    mutedText: "#A3B2C7",
    border: "#E2E8F0",
    borderSubtle: "#EDF1F7",

    // Categories matching web constants & tailwind config
    documents: {
      color: "#059669",
      background: "#ECFDF5",
      border: "#A7F3D0",
      barColor: "#10B981",
    },
    images: {
      color: "#2563EB",
      background: "#EFF6FF",
      border: "#BFDBFE",
      barColor: "#3B82F6",
    },
    media: {
      color: "#7C3AED",
      background: "#F5F3FF",
      border: "#DDD6FE",
      barColor: "#8B5CF6",
    },
    others: {
      color: "#D97706",
      background: "#FFFBEB",
      border: "#FDE68A",
      barColor: "#F59E0B",
    },

    // Status / Actions
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    errorBg: "#FEF2F2",
    red: "#EF4444",
  },
  radius: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 22,
    full: 9999,
  },
  shadows: {
    card: {
      shadowColor: "rgba(66, 71, 97, 0.08)",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 2,
    },
    floating: {
      shadowColor: "rgba(0, 128, 128, 0.2)",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 5,
    },
  },
};