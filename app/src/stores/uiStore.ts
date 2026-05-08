// UI store. Holds presentation state that should outlive a single render but
// not require backend round-trips. Persisted to localStorage so window reopens
// keep their tree-expansion shape.

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UIState {
  expandedFolders: Record<string, boolean>;
  toggleFolder: (path: string) => void;
  setFolder: (path: string, open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      expandedFolders: {},
      toggleFolder: (path) =>
        set((state) => ({
          expandedFolders: {
            ...state.expandedFolders,
            [path]: !state.expandedFolders[path],
          },
        })),
      setFolder: (path, open) =>
        set((state) => ({
          expandedFolders: { ...state.expandedFolders, [path]: open },
        })),
    }),
    {
      name: "memex-ui",
      version: 1,
    },
  ),
);
