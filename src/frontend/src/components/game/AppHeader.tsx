import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { LogOut, Moon, Sun, Trophy, User } from "lucide-react";
import { useApp } from "../../contexts/AppContext";

export function AppHeader() {
  const navigate = useNavigate();
  const { currentUser, logout, darkMode, toggleDarkMode } = useApp();

  function handleLogout() {
    logout();
    navigate({ to: "/" });
  }

  return (
    <header
      className="border-b sticky top-0 z-50"
      style={{
        background: "oklch(0.12 0.02 260 / 0.9)",
        borderColor: "oklch(0.25 0.03 260)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate({ to: "/dashboard" })}
          className="text-2xl font-display font-black shimmer-text hover:opacity-80 transition-opacity"
          style={{ letterSpacing: "-1px" }}
        >
          ColorBlast
        </button>

        <nav className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/leaderboard" })}
            className="hidden sm:flex gap-1.5 text-xs font-semibold"
            style={{ color: "oklch(0.65 0.05 260)" }}
          >
            <Trophy size={14} />
            Leaderboard
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/profile" })}
            className="hidden sm:flex gap-1.5 text-xs font-semibold"
            style={{ color: "oklch(0.65 0.05 260)" }}
          >
            <User size={14} />
            {currentUser?.username}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="w-8 h-8"
            style={{ color: "oklch(0.65 0.05 260)" }}
          >
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="w-8 h-8"
            style={{ color: "oklch(0.65 0.05 260)" }}
          >
            <LogOut size={15} />
          </Button>
        </nav>
      </div>
    </header>
  );
}
