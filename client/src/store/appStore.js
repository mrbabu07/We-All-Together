import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAppStore = create(
  persist(
    (set) => ({
      filterPresets: [],
      previewAppearance: null,
      themePreference: null,
      removeFilterPreset: (name) =>
        set((state) => ({
          filterPresets: state.filterPresets.filter((preset) => preset.name !== name),
        })),
      saveFilterPreset: (preset) =>
        set((state) => ({
          filterPresets: [
            ...state.filterPresets.filter((item) => item.name !== preset.name),
            preset,
          ],
        })),
      setPreviewAppearance: (previewAppearance) => set({ previewAppearance }),
      setThemePreference: (themePreference) => set({ themePreference }),
    }),
    {
      name: 'dargah-para-app-store',
    },
  ),
)

export default useAppStore
