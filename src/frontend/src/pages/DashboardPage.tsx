import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "../components/game/AppHeader";
import { Footer } from "../components/game/Footer";
import { useApp } from "../contexts/AppContext";
import {
  generateId,
  generateRoomCode,
  loadRoomByCode,
  saveRoom,
} from "../game/storage";
import type { Room } from "../game/types";

const BOT_NAMES = ["AceBot", "NovAI", "BlastBot", "CardShark", "WildBot"];
const BOT_COLORS = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24", "#a29bfe"];

export function DashboardPage() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [roomCode, setRoomCode] = useState("");

  if (!currentUser) {
    navigate({ to: "/" });
    return null;
  }

  const winRate =
    currentUser.gamesPlayed > 0
      ? Math.round((currentUser.wins / currentUser.gamesPlayed) * 100)
      : 0;

  function handleCreateRoom() {
    navigate({ to: "/room/create" });
  }

  function handleJoinRoom() {
    if (!roomCode.trim()) {
      toast.error("Enter a room code");
      return;
    }
    const room = loadRoomByCode(roomCode.trim());
    if (!room) {
      toast.error("Room not found. Check the code and try again.");
      return;
    }
    if (room.status !== "waiting") {
      toast.error("This room is no longer accepting players.");
      return;
    }
    navigate({ to: `/room/${room.id}` });
  }

  function handleQuickMatch() {
    // Create a quick 4-player room and start immediately
    if (!currentUser) return;
    const roomId = generateId();
    const botCount = 3;
    const bots = Array.from({ length: botCount }, (_, i) => ({
      id: generateId(),
      username: BOT_NAMES[i % BOT_NAMES.length],
      avatarColor: BOT_COLORS[i % BOT_COLORS.length],
      isHost: false,
      isBot: true,
    }));

    const room: Room = {
      id: roomId,
      code: generateRoomCode(),
      hostId: currentUser.id,
      maxPlayers: 4,
      privacy: "public",
      status: "waiting",
      players: [
        {
          id: currentUser.id,
          username: currentUser.username,
          avatarColor: currentUser.avatarColor,
          isHost: true,
          isBot: false,
        },
        ...bots,
      ],
      createdAt: Date.now(),
      gameId: null,
    };
    saveRoom(room);
    navigate({ to: `/room/${roomId}` });
  }

  const recentGames = currentUser.gameHistory.slice(-5).reverse();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.1 0.02 260) 0%, oklch(0.14 0.04 270) 100%)",
      }}
    >
      <AppHeader />

      <main className="max-w-5xl mx-auto px-4 pt-8 pb-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Welcome */}
          <motion.div variants={itemVariants}>
            <h1
              className="text-3xl font-display font-black"
              style={{ color: "oklch(0.95 0.01 260)" }}
            >
              Welcome back,{" "}
              <span className="shimmer-text">{currentUser.username}</span>!
            </h1>
            <p style={{ color: "oklch(0.55 0.02 260)" }}>
              Ready to blast some cards?
            </p>
          </motion.div>

          {/* Stats + Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Stats Card */}
            <motion.div
              variants={itemVariants}
              className="md:col-span-1 rounded-2xl p-6"
              style={{
                background: "oklch(0.16 0.03 260)",
                border: "1px solid oklch(0.28 0.04 260)",
              }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
                  style={{ background: currentUser.avatarColor, color: "#fff" }}
                >
                  {currentUser.username[0].toUpperCase()}
                </div>
                <div>
                  <p
                    className="font-bold"
                    style={{ color: "oklch(0.95 0.01 260)" }}
                  >
                    {currentUser.username}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "oklch(0.55 0.02 260)" }}
                  >
                    Player Stats
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Wins",
                    value: currentUser.wins,
                    color: "oklch(0.72 0.22 140)",
                  },
                  {
                    label: "Games",
                    value: currentUser.gamesPlayed,
                    color: "oklch(0.82 0.18 195)",
                  },
                  {
                    label: "Win %",
                    value: `${winRate}%`,
                    color: "oklch(0.88 0.2 90)",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="text-center rounded-xl p-3"
                    style={{ background: "oklch(0.12 0.02 260)" }}
                  >
                    <div
                      className="text-2xl font-black font-display"
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

            {/* Action Buttons */}
            <motion.div
              variants={itemVariants}
              className="md:col-span-2 rounded-2xl p-6 flex flex-col justify-center gap-4"
              style={{
                background: "oklch(0.16 0.03 260)",
                border: "1px solid oklch(0.28 0.04 260)",
              }}
            >
              <h2
                className="font-display font-black text-xl mb-1"
                style={{ color: "oklch(0.95 0.01 260)" }}
              >
                Play Now
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={handleCreateRoom}
                  className="h-14 text-base font-bold rounded-xl"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.82 0.18 195), oklch(0.72 0.22 220))",
                    color: "oklch(0.1 0.02 195)",
                    fontFamily: "Bricolage Grotesque, sans-serif",
                    border: "none",
                  }}
                >
                  🏠 Create Room
                </Button>
                <Button
                  onClick={handleQuickMatch}
                  className="h-14 text-base font-bold rounded-xl"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.72 0.22 140), oklch(0.6 0.2 155))",
                    color: "oklch(0.1 0.02 140)",
                    fontFamily: "Bricolage Grotesque, sans-serif",
                    border: "none",
                  }}
                >
                  ⚡ Quick Match
                </Button>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Enter room code (e.g. ABC123)"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                  maxLength={6}
                  className="h-12 rounded-xl flex-1 font-mono tracking-wider"
                  style={{
                    background: "oklch(0.12 0.02 260)",
                    border: "1px solid oklch(0.28 0.04 260)",
                    color: "oklch(0.95 0.01 260)",
                    fontSize: "1rem",
                  }}
                />
                <Button
                  onClick={handleJoinRoom}
                  className="h-12 px-6 rounded-xl font-bold"
                  style={{
                    background: "oklch(0.75 0.25 340)",
                    color: "#fff",
                    fontFamily: "Bricolage Grotesque, sans-serif",
                    border: "none",
                  }}
                >
                  Join
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Recent Games + Leaderboard Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              variants={itemVariants}
              className="rounded-2xl p-6"
              style={{
                background: "oklch(0.16 0.03 260)",
                border: "1px solid oklch(0.28 0.04 260)",
              }}
            >
              <h2
                className="font-display font-black text-lg mb-4"
                style={{ color: "oklch(0.95 0.01 260)" }}
              >
                Recent Games
              </h2>
              {recentGames.length === 0 ? (
                <p className="text-sm" style={{ color: "oklch(0.5 0.02 260)" }}>
                  No games played yet. Start a match!
                </p>
              ) : (
                <div className="space-y-2">
                  {recentGames.map((game) => (
                    <div
                      key={game.gameId}
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: "oklch(0.12 0.02 260)" }}
                    >
                      <span
                        className="text-sm font-bold"
                        style={{
                          color:
                            game.result === "win"
                              ? "oklch(0.72 0.22 140)"
                              : "oklch(0.65 0.28 22)",
                        }}
                      >
                        {game.result === "win" ? "🏆 WIN" : "💀 LOSS"}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "oklch(0.5 0.02 260)" }}
                      >
                        {game.players}P • {game.turnsPlayed} turns
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "oklch(0.4 0.02 260)" }}
                      >
                        {new Date(game.date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="rounded-2xl p-6 flex flex-col justify-between"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.18 0.04 260), oklch(0.22 0.06 270))",
                border: "1px solid oklch(0.28 0.04 260)",
              }}
            >
              <div>
                <h2
                  className="font-display font-black text-lg mb-2"
                  style={{ color: "oklch(0.95 0.01 260)" }}
                >
                  🏆 Leaderboard
                </h2>
                <p
                  className="text-sm mb-4"
                  style={{ color: "oklch(0.55 0.02 260)" }}
                >
                  See how you rank against all players globally.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => navigate({ to: "/leaderboard" })}
                  className="h-11 font-bold rounded-xl"
                  style={{
                    background: "oklch(0.88 0.2 90)",
                    color: "oklch(0.1 0.02 90)",
                    fontFamily: "Bricolage Grotesque, sans-serif",
                    border: "none",
                  }}
                >
                  View Leaderboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: "/profile" })}
                  className="h-11 font-semibold rounded-xl"
                  style={{
                    border: "1px solid oklch(0.28 0.04 260)",
                    color: "oklch(0.7 0.05 260)",
                    background: "transparent",
                  }}
                >
                  My Profile
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
