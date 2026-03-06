import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Medal, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { AppHeader } from "../components/game/AppHeader";
import { Footer } from "../components/game/Footer";
import { useApp } from "../contexts/AppContext";
import { loadUsers } from "../game/storage";

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

export function LeaderboardPage() {
  const navigate = useNavigate();
  const { currentUser } = useApp();

  const rankedUsers = useMemo(() => {
    const users = loadUsers();
    return users
      .filter((u) => u.gamesPlayed > 0 || u.wins > 0)
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.gamesPlayed - a.gamesPlayed;
      })
      .slice(0, 20);
  }, []);

  const userRank = useMemo(() => {
    if (!currentUser) return -1;
    return rankedUsers.findIndex((u) => u.id === currentUser.id) + 1;
  }, [rankedUsers, currentUser]);

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
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Trophy size={28} style={{ color: "oklch(0.88 0.2 90)" }} />
            <h1
              className="text-4xl font-display font-black"
              style={{ color: "oklch(0.95 0.01 260)" }}
            >
              Leaderboard
            </h1>
          </div>
          <p className="text-sm" style={{ color: "oklch(0.5 0.02 260)" }}>
            Top ColorBlast players by wins
          </p>
          {userRank > 0 && (
            <p
              className="text-sm font-semibold mt-2"
              style={{ color: "oklch(0.82 0.18 195)" }}
            >
              Your rank: #{userRank}
            </p>
          )}
        </motion.div>

        {rankedUsers.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{
              background: "oklch(0.16 0.03 260)",
              border: "1px solid oklch(0.28 0.04 260)",
            }}
          >
            <p className="text-lg" style={{ color: "oklch(0.5 0.02 260)" }}>
              No games played yet. Be the first on the board!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {rankedUsers.map((user, i) => {
              const isCurrentUser = user.id === currentUser?.id;
              const winRate =
                user.gamesPlayed > 0
                  ? Math.round((user.wins / user.gamesPlayed) * 100)
                  : 0;
              const rank = i + 1;

              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 rounded-xl p-4 transition-all"
                  style={{
                    background: isCurrentUser
                      ? "oklch(0.22 0.05 260)"
                      : rank <= 3
                        ? "oklch(0.18 0.04 260)"
                        : "oklch(0.16 0.03 260)",
                    border: isCurrentUser
                      ? "1px solid oklch(0.82 0.18 195 / 0.5)"
                      : rank === 1
                        ? "1px solid oklch(0.88 0.2 90 / 0.4)"
                        : rank === 2
                          ? "1px solid oklch(0.7 0.02 260 / 0.4)"
                          : rank === 3
                            ? "1px solid oklch(0.72 0.22 22 / 0.4)"
                            : "1px solid oklch(0.25 0.03 260)",
                  }}
                >
                  {/* Rank */}
                  <div
                    className="w-10 h-10 flex items-center justify-center text-lg font-black font-display flex-shrink-0"
                    style={{
                      color:
                        rank === 1
                          ? "oklch(0.88 0.2 90)"
                          : rank === 2
                            ? "oklch(0.8 0.02 260)"
                            : rank === 3
                              ? "oklch(0.72 0.22 22)"
                              : "oklch(0.5 0.02 260)",
                    }}
                  >
                    {rank <= 3 ? RANK_MEDALS[rank - 1] : `#${rank}`}
                  </div>

                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: user.avatarColor, color: "#fff" }}
                  >
                    {user.username[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-bold truncate"
                      style={{
                        color: isCurrentUser
                          ? "oklch(0.82 0.18 195)"
                          : "oklch(0.9 0.01 260)",
                      }}
                    >
                      {user.username}
                      {isCurrentUser && " (You)"}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "oklch(0.5 0.02 260)" }}
                    >
                      {user.gamesPlayed} games played
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-center hidden sm:block">
                      <p
                        className="text-xl font-black font-display"
                        style={{ color: "oklch(0.72 0.22 140)" }}
                      >
                        {user.wins}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "oklch(0.5 0.02 260)" }}
                      >
                        wins
                      </p>
                    </div>
                    <div className="text-center">
                      <p
                        className="text-lg font-black font-display"
                        style={{ color: "oklch(0.88 0.2 90)" }}
                      >
                        {winRate}%
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "oklch(0.5 0.02 260)" }}
                      >
                        win rate
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Button
            variant="outline"
            onClick={() => navigate({ to: "/dashboard" })}
            className="gap-2"
            style={{
              border: "1px solid oklch(0.28 0.04 260)",
              color: "oklch(0.6 0.02 260)",
              background: "transparent",
            }}
          >
            <ChevronLeft size={16} />
            Back to Dashboard
          </Button>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
