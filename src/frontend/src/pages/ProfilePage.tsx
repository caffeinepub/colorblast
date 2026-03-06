import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { AppHeader } from "../components/game/AppHeader";
import { useApp } from "../contexts/AppContext";

const AVATAR_COLORS = [
  "#ff4d4d",
  "#4d94ff",
  "#4dff88",
  "#ffd24d",
  "#d44dff",
  "#ff8c4d",
  "#4dfff2",
  "#ff4da6",
];

export function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser, updateUser } = useApp();
  const [selectedColor, setSelectedColor] = useState(
    currentUser?.avatarColor ?? AVATAR_COLORS[0],
  );

  if (!currentUser) {
    navigate({ to: "/" });
    return null;
  }

  const winRate =
    currentUser.gamesPlayed > 0
      ? Math.round((currentUser.wins / currentUser.gamesPlayed) * 100)
      : 0;

  function handleColorChange(color: string) {
    setSelectedColor(color);
    updateUser({ avatarColor: color });
  }

  const recentHistory = currentUser.gameHistory.slice(-10).reverse();

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.1 0.02 260) 0%, oklch(0.14 0.04 270) 100%)",
      }}
    >
      <AppHeader />

      <main className="max-w-2xl mx-auto px-4 pt-8 pb-16">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: "/dashboard" })}
          className="mb-6 gap-2"
          style={{ color: "oklch(0.55 0.02 260)" }}
        >
          <ChevronLeft size={16} />
          Dashboard
        </Button>

        <div className="space-y-6">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-8"
            style={{
              background: "oklch(0.16 0.03 260)",
              border: "1px solid oklch(0.28 0.04 260)",
            }}
          >
            <div className="flex items-start gap-6">
              <div className="flex flex-col items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black font-display"
                  style={{ background: selectedColor, color: "#fff" }}
                >
                  {currentUser.username[0].toUpperCase()}
                </motion.div>
                <p className="text-xs" style={{ color: "oklch(0.5 0.02 260)" }}>
                  Click a color below to change
                </p>
              </div>

              <div className="flex-1">
                <h1
                  className="text-3xl font-display font-black mb-1"
                  style={{ color: "oklch(0.95 0.01 260)" }}
                >
                  {currentUser.username}
                </h1>
                <p
                  className="text-sm mb-4"
                  style={{ color: "oklch(0.5 0.02 260)" }}
                >
                  ColorBlast Player
                </p>

                {/* Avatar color picker */}
                <div>
                  <p
                    className="text-xs font-semibold mb-2"
                    style={{ color: "oklch(0.55 0.02 260)" }}
                  >
                    AVATAR COLOR
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => handleColorChange(c)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: c,
                          border:
                            selectedColor === c
                              ? "3px solid white"
                              : "3px solid transparent",
                          outline:
                            selectedColor === c
                              ? "2px solid oklch(0.82 0.18 195)"
                              : "none",
                          outlineOffset: 2,
                          transition: "all 0.15s",
                          cursor: "pointer",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-6"
            style={{
              background: "oklch(0.16 0.03 260)",
              border: "1px solid oklch(0.28 0.04 260)",
            }}
          >
            <h2
              className="font-display font-black text-base mb-5"
              style={{ color: "oklch(0.65 0.05 260)" }}
            >
              STATS
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: "Wins",
                  value: currentUser.wins,
                  color: "oklch(0.72 0.22 140)",
                },
                {
                  label: "Losses",
                  value: currentUser.losses,
                  color: "oklch(0.65 0.28 22)",
                },
                {
                  label: "Games",
                  value: currentUser.gamesPlayed,
                  color: "oklch(0.82 0.18 195)",
                },
                {
                  label: "Win Rate",
                  value: `${winRate}%`,
                  color: "oklch(0.88 0.2 90)",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="text-center rounded-xl p-4"
                  style={{ background: "oklch(0.12 0.02 260)" }}
                >
                  <div
                    className="text-3xl font-black font-display"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </div>
                  <div
                    className="text-xs mt-1"
                    style={{ color: "oklch(0.5 0.02 260)" }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Game History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-6"
            style={{
              background: "oklch(0.16 0.03 260)",
              border: "1px solid oklch(0.28 0.04 260)",
            }}
          >
            <h2
              className="font-display font-black text-base mb-5"
              style={{ color: "oklch(0.65 0.05 260)" }}
            >
              GAME HISTORY
            </h2>

            {recentHistory.length === 0 ? (
              <p className="text-sm" style={{ color: "oklch(0.45 0.02 260)" }}>
                No games played yet. Start a match!
              </p>
            ) : (
              <div className="space-y-2">
                {recentHistory.map((game, i) => (
                  <motion.div
                    key={game.gameId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.04 }}
                    className="flex items-center justify-between rounded-xl px-4 py-3"
                    style={{ background: "oklch(0.12 0.02 260)" }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {game.result === "win" ? "🏆" : "💀"}
                      </span>
                      <div>
                        <span
                          className="text-sm font-bold"
                          style={{
                            color:
                              game.result === "win"
                                ? "oklch(0.72 0.22 140)"
                                : "oklch(0.65 0.28 22)",
                          }}
                        >
                          {game.result === "win" ? "Victory" : "Defeat"}
                        </span>
                        <p
                          className="text-xs"
                          style={{ color: "oklch(0.45 0.02 260)" }}
                        >
                          {game.players} players · {game.turnsPlayed} turns
                        </p>
                      </div>
                    </div>
                    <span
                      className="text-xs"
                      style={{ color: "oklch(0.4 0.02 260)" }}
                    >
                      {new Date(game.date).toLocaleDateString()}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
