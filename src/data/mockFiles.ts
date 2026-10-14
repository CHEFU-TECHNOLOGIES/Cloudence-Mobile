import { CloudFile } from "../types/file";

export const mockCurrentUser = {
  id: "user-cloudence-1",
  fullName: "Alex Morgan",
  email: "alex.morgan@cloudence.io",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  plan: "Cloudence Pro Workspace",
  storageLimitBytes: 2 * 1024 * 1024 * 1024, // 2 GB
};

export const initialMockFiles: CloudFile[] = [
  {
    id: "f1",
    name: "Quarterly_Financial_Report",
    extension: "PDF",
    type: "document",
    category: "Documents",
    size: 2.4 * 1024 * 1024, // 2.4 MB
    sizeFormatted: "2.4 MB",
    createdAt: "2026-10-11T10:42:00Z",
    updatedAt: "2026-10-11T10:42:00Z",
    owner: {
      id: "u1",
      fullName: "Alex Morgan",
      email: "alex.morgan@cloudence.io",
    },
    users: ["sarah.c@cloudence.io", "finance@cloudence.io"],
    color: "#059669",
  },
  {
    id: "f2",
    name: "Product_Roadmap_2026",
    extension: "DOCX",
    type: "document",
    category: "Documents",
    size: 840 * 1024, // 840 KB
    sizeFormatted: "840 KB",
    createdAt: "2026-10-11T09:18:00Z",
    updatedAt: "2026-10-11T09:18:00Z",
    owner: {
      id: "u2",
      fullName: "Liam Vance",
      email: "liam.v@cloudence.io",
    },
    users: ["alex.morgan@cloudence.io", "team-leads@cloudence.io"],
    color: "#059669",
  },
  {
    id: "f3",
    name: "Brand_Design_System_Cover",
    extension: "PNG",
    type: "image",
    category: "Images",
    size: 3.8 * 1024 * 1024, // 3.8 MB
    sizeFormatted: "3.8 MB",
    createdAt: "2026-10-10T16:30:00Z",
    updatedAt: "2026-10-10T16:30:00Z",
    owner: {
      id: "u1",
      fullName: "Alex Morgan",
      email: "alex.morgan@cloudence.io",
    },
    users: ["design-team@cloudence.io"],
    dimensions: "2880 × 1800",
    color: "#2563EB",
  },
  {
    id: "f4",
    name: "Keynote_Product_Announcement",
    extension: "MP4",
    type: "video",
    category: "Media",
    size: 24.6 * 1024 * 1024, // 24.6 MB
    sizeFormatted: "24.6 MB",
    createdAt: "2026-10-10T14:15:00Z",
    updatedAt: "2026-10-10T14:15:00Z",
    owner: {
      id: "u3",
      fullName: "Elena Rostova",
      email: "elena.r@cloudence.io",
    },
    users: ["alex.morgan@cloudence.io", "board@cloudence.io"],
    duration: "04:12",
    color: "#7C3AED",
  },
  {
    id: "f5",
    name: "Design_Assets_Bundle_v4",
    extension: "ZIP",
    type: "other",
    category: "Others",
    size: 18.2 * 1024 * 1024, // 18.2 MB
    sizeFormatted: "18.2 MB",
    createdAt: "2026-10-09T11:05:00Z",
    updatedAt: "2026-10-09T11:05:00Z",
    owner: {
      id: "u1",
      fullName: "Alex Morgan",
      email: "alex.morgan@cloudence.io",
    },
    users: ["external-agency@studio.co"],
    color: "#D97706",
  },
  {
    id: "f6",
    name: "Annual_Budget_Allocation",
    extension: "XLSX",
    type: "document",
    category: "Documents",
    size: 1.2 * 1024 * 1024, // 1.2 MB
    sizeFormatted: "1.2 MB",
    createdAt: "2026-10-08T17:40:00Z",
    updatedAt: "2026-10-08T17:40:00Z",
    owner: {
      id: "u4",
      fullName: "Marcus Cole",
      email: "marcus.c@cloudence.io",
    },
    users: ["alex.morgan@cloudence.io"],
    color: "#059669",
  },
  {
    id: "f7",
    name: "Mobile_Architecture_Diagram",
    extension: "SVG",
    type: "image",
    category: "Images",
    size: 420 * 1024, // 420 KB
    sizeFormatted: "420 KB",
    createdAt: "2026-10-07T08:20:00Z",
    updatedAt: "2026-10-07T08:20:00Z",
    owner: {
      id: "u1",
      fullName: "Alex Morgan",
      email: "alex.morgan@cloudence.io",
    },
    users: ["tech-arch@cloudence.io"],
    dimensions: "1920 × 1080",
    color: "#2563EB",
  },
  {
    id: "f8",
    name: "Customer_Interview_Audio",
    extension: "MP3",
    type: "audio",
    category: "Media",
    size: 8.5 * 1024 * 1024, // 8.5 MB
    sizeFormatted: "8.5 MB",
    createdAt: "2026-10-06T15:55:00Z",
    updatedAt: "2026-10-06T15:55:00Z",
    owner: {
      id: "u2",
      fullName: "Liam Vance",
      email: "liam.v@cloudence.io",
    },
    users: ["ux-research@cloudence.io"],
    duration: "18:45",
    color: "#7C3AED",
  },
  {
    id: "f9",
    name: "User_Analytics_Export_2026",
    extension: "CSV",
    type: "document",
    category: "Documents",
    size: 610 * 1024, // 610 KB
    sizeFormatted: "610 KB",
    createdAt: "2026-10-05T12:00:00Z",
    updatedAt: "2026-10-05T12:00:00Z",
    owner: {
      id: "u1",
      fullName: "Alex Morgan",
      email: "alex.morgan@cloudence.io",
    },
    users: [],
    color: "#059669",
  },
  {
    id: "f10",
    name: "App_Release_Candidate_Build",
    extension: "TAR.GZ",
    type: "other",
    category: "Others",
    size: 38.4 * 1024 * 1024, // 38.4 MB
    sizeFormatted: "38.4 MB",
    createdAt: "2026-10-04T09:12:00Z",
    updatedAt: "2026-10-04T09:12:00Z",
    owner: {
      id: "u3",
      fullName: "Elena Rostova",
      email: "elena.r@cloudence.io",
    },
    users: ["devops@cloudence.io"],
    color: "#D97706",
  },
];

// For backwards compatibility and mutable app state
export let mockFiles: CloudFile[] = [...initialMockFiles];

export const getStorageSummary = (files: CloudFile[] = mockFiles) => {
  const documentsSize = files
    .filter((f) => f.category === "Documents")
    .reduce((acc, f) => acc + f.size, 0);

  const imagesSize = files
    .filter((f) => f.category === "Images")
    .reduce((acc, f) => acc + f.size, 0);

  const mediaSize = files
    .filter((f) => f.category === "Media")
    .reduce((acc, f) => acc + f.size, 0);

  const othersSize = files
    .filter((f) => f.category === "Others")
    .reduce((acc, f) => acc + f.size, 0);

  const totalUsed = documentsSize + imagesSize + mediaSize + othersSize;
  const totalStorage = mockCurrentUser.storageLimitBytes; // 2 GB

  const latestDoc = files.find((f) => f.category === "Documents")?.createdAt;
  const latestImg = files.find((f) => f.category === "Images")?.createdAt;
  const latestMedia = files.find((f) => f.category === "Media")?.createdAt;
  const latestOther = files.find((f) => f.category === "Others")?.createdAt;

  return {
    totalUsed,
    totalStorage,
    percentage: Number(((totalUsed / totalStorage) * 100).toFixed(1)),
    categories: {
      Documents: {
        size: documentsSize,
        count: files.filter((f) => f.category === "Documents").length,
        latestDate: latestDoc || "2026-10-11T10:42:00Z",
      },
      Images: {
        size: imagesSize,
        count: files.filter((f) => f.category === "Images").length,
        latestDate: latestImg || "2026-10-10T16:30:00Z",
      },
      Media: {
        size: mediaSize,
        count: files.filter((f) => f.category === "Media").length,
        latestDate: latestMedia || "2026-10-10T14:15:00Z",
      },
      Others: {
        size: othersSize,
        count: files.filter((f) => f.category === "Others").length,
        latestDate: latestOther || "2026-10-09T11:05:00Z",
      },
    },
  };
};