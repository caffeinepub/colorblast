import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ensureSeedUsers,
  loadDarkMode,
  loadUser,
  logoutUser,
  saveDarkMode,
  saveUser,
} from "../game/storage";
import type { UserProfile } from "../game/types";

interface AppContextValue {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  logout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(true);

  useEffect(() => {
    ensureSeedUsers();
    const user = loadUser();
    if (user) setCurrentUserState(user);
    const dm = loadDarkMode();
    setDarkMode(dm);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const setCurrentUser = useCallback((user: UserProfile | null) => {
    setCurrentUserState(user);
    if (user) {
      saveUser(user);
    }
  }, []);

  const updateUser = useCallback(
    (updates: Partial<UserProfile>) => {
      if (!currentUser) return;
      const updated = { ...currentUser, ...updates };
      setCurrentUserState(updated);
      saveUser(updated);
    },
    [currentUser],
  );

  const logout = useCallback(() => {
    logoutUser();
    setCurrentUserState(null);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      saveDarkMode(!prev);
      return !prev;
    });
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      setCurrentUser,
      updateUser,
      logout,
      darkMode,
      toggleDarkMode,
    }),
    [currentUser, setCurrentUser, updateUser, logout, darkMode, toggleDarkMode],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
