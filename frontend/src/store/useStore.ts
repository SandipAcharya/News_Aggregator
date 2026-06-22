import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // Theme & UI
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;

  // Search & Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  selectedLeaning: string | null;
  setSelectedLeaning: (leaning: string | null) => void;
  selectedLanguage: string | null;
  setSelectedLanguage: (lang: string | null) => void;
  selectedCountry: string | null;
  setSelectedCountry: (country: string | null) => void;
  selectedSourceType: string | null;
  setSelectedSourceType: (type: string | null) => void;

  // Date Filters
  startDate: string | null;
  setStartDate: (date: string | null) => void;
  endDate: string | null;
  setEndDate: (date: string | null) => void;
  datePreset: number | null;         // 7, 14, or 30 days
  setDatePreset: (days: number | null) => void;

  // Clear All
  clearAllFilters: () => void;

  // Auth State
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Theme & UI Initial State
      isDarkMode: false,
      toggleDarkMode: () => set((state) => {
        const newMode = !state.isDarkMode;
        if (newMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        return { isDarkMode: newMode };
      }),
      viewMode: 'grid',
      setViewMode: (mode) => set({ viewMode: mode }),

      // Filters Initial State
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      selectedCategory: null,
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      selectedLeaning: null,
      setSelectedLeaning: (leaning) => set({ selectedLeaning: leaning }),
      selectedLanguage: null,
      setSelectedLanguage: (lang) => set({ selectedLanguage: lang }),
      selectedCountry: null,
      setSelectedCountry: (country) => set({ selectedCountry: country }),
      selectedSourceType: null,
      setSelectedSourceType: (type) => set({ selectedSourceType: type }),

      // Date Filters
      startDate: null,
      setStartDate: (date) => set({ startDate: date, datePreset: null }),
      endDate: null,
      setEndDate: (date) => set({ endDate: date, datePreset: null }),
      datePreset: null,
      setDatePreset: (days) => {
        if (!days) {
          set({ datePreset: null, startDate: null, endDate: null });
          return;
        }
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        set({
          datePreset: days,
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
        });
      },

      // Clear All Filters
      clearAllFilters: () => set({
        searchQuery: '',
        selectedCategory: null,
        selectedLeaning: null,
        selectedLanguage: null,
        selectedCountry: null,
        selectedSourceType: null,
        startDate: null,
        endDate: null,
        datePreset: null,
      }),

      // Auth Initial State
      token: null,
      setToken: (token) => set({ token }),
      logout: () => set({ token: null }),
    }),
    {
      name: 'news-aggregator-storage',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        viewMode: state.viewMode,
        token: state.token,
      }),
    }
  )
);
