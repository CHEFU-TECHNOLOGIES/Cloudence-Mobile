import React, { createContext, useContext } from "react";
import type { CloudenceDataContextValue } from "./CloudenceDataContext";
import { useCloudenceWorkspace } from "./useCloudenceWorkspace";

const CloudenceDataContext = createContext<CloudenceDataContextValue | null>(
  null,
);

export function CloudenceDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useCloudenceWorkspace();

  return (
    <CloudenceDataContext.Provider value={value}>
      {children}
    </CloudenceDataContext.Provider>
  );
}

export function useCloudenceData() {
  const value = useContext(CloudenceDataContext);
  if (!value) {
    throw new Error(
      "useCloudenceData must be used within a CloudenceDataProvider.",
    );
  }
  return value;
}
