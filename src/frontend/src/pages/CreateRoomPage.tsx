import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "../components/game/AppHeader";
import { useApp } from "../contexts/AppContext";
import { generateId, generateRoomCode, saveRoom } from "../game/storage";
import type { Room } from "../game/types";

export function CreateRoomPage() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [privacy, setPrivacy] = useState<"public" | "private">("public");
  const [roomCode] = useState(generateRoomCode());
  const [creating, setCreating] = useState(false);

  if (!currentUser) {
    navigate({ to: "/" });
    return null;
  }

  async function handleCreate() {
    if (!currentUser) return;
    setCreating(true);
    try {
      await new Promise((r) => setTimeout(r, 400));

      const room: Room = {
        id: generateId(),
        code: roomCode,
        hostId: currentUser.id,
        maxPlayers,
        privacy,
        status: "waiting",
        players: [
          {
            id: currentUser.id,
            username: currentUser.username,
            avatarColor: currentUser.avatarColor,
            isHost: true,
            isBot: false,
          },
        ],
        createdAt: Date.now(),
        gameId: null,
      };
      saveRoom(room);
      navigate({ to: `/room/${room.id}` });
    } catch (_err) {
      toast.error("Failed to create room. Please try again.");
      setCreating(false);
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.1 0.02 260) 0%, oklch(0.14 0.04 270) 100%)",
      }}
    >
      <AppHeader />

      <main className="max-w-lg mx-auto px-4 pt-12 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-8"
          style={{
            background: "oklch(0.16 0.03 260)",
            border: "1px solid oklch(0.28 0.04 260)",
          }}
        >
          <h1
            className="text-3xl font-display font-black mb-2"
            style={{ color: "oklch(0.95 0.01 260)" }}
          >
            Create Room
          </h1>
          <p className="text-sm mb-8" style={{ color: "oklch(0.55 0.02 260)" }}>
            Set up your game room. AI bots will fill empty slots when the game
            starts.
          </p>

          {/* Max Players */}
          <div className="mb-8">
            <p
              className="block text-sm font-semibold mb-3"
              style={{ color: "oklch(0.7 0.03 260)" }}
            >
              Number of Players (including you)
            </p>
            <div className="flex gap-2">
              {[2, 3, 4, 5, 6].map((n) => (
                <button
                  type="button"
                  key={n}
                  data-ocid={`create_room.players_${n}.button`}
                  onClick={() => setMaxPlayers(n)}
                  className="flex-1 h-12 rounded-xl text-lg font-black font-display transition-all"
                  style={{
                    background:
                      maxPlayers === n
                        ? "oklch(0.82 0.18 195)"
                        : "oklch(0.12 0.02 260)",
                    color:
                      maxPlayers === n
                        ? "oklch(0.1 0.02 195)"
                        : "oklch(0.6 0.02 260)",
                    border:
                      maxPlayers === n
                        ? "none"
                        : "1px solid oklch(0.25 0.03 260)",
                    transform: maxPlayers === n ? "scale(1.05)" : "scale(1)",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <p
              className="text-xs mt-2"
              style={{ color: "oklch(0.45 0.02 260)" }}
            >
              You + {maxPlayers - 1} AI bot{maxPlayers - 1 !== 1 ? "s" : ""}{" "}
              (fill empty slots on start)
            </p>
          </div>

          {/* Privacy */}
          <div className="mb-8">
            <p
              className="block text-sm font-semibold mb-3"
              style={{ color: "oklch(0.7 0.03 260)" }}
            >
              Room Privacy
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(["public", "private"] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  data-ocid={`create_room.privacy_${p}.button`}
                  onClick={() => setPrivacy(p)}
                  className="h-16 rounded-xl flex flex-col items-center justify-center gap-1 transition-all"
                  style={{
                    background:
                      privacy === p
                        ? "oklch(0.22 0.05 260)"
                        : "oklch(0.12 0.02 260)",
                    border:
                      privacy === p
                        ? "2px solid oklch(0.82 0.18 195)"
                        : "1px solid oklch(0.25 0.03 260)",
                    color:
                      privacy === p
                        ? "oklch(0.95 0.01 260)"
                        : "oklch(0.6 0.02 260)",
                  }}
                >
                  <span className="text-xl">
                    {p === "public" ? "🌍" : "🔒"}
                  </span>
                  <span className="text-sm font-semibold capitalize">{p}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Room Code Preview */}
          {privacy === "private" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-6 rounded-xl p-4"
              style={{
                background: "oklch(0.12 0.02 260)",
                border: "1px solid oklch(0.25 0.03 260)",
              }}
            >
              <p
                className="text-xs mb-2"
                style={{ color: "oklch(0.55 0.02 260)" }}
              >
                Share this code with friends:
              </p>
              <p
                className="text-3xl font-mono font-black tracking-[0.3em]"
                style={{ color: "oklch(0.82 0.18 195)" }}
              >
                {roomCode}
              </p>
            </motion.div>
          )}

          {/* Summary */}
          <div
            className="mb-8 rounded-xl p-4 flex items-center gap-4"
            style={{
              background: "oklch(0.12 0.02 260)",
              border: "1px solid oklch(0.22 0.02 260)",
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: currentUser.avatarColor, color: "#fff" }}
            >
              {currentUser.username[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <p
                className="text-sm font-semibold"
                style={{ color: "oklch(0.82 0.18 195)" }}
              >
                {currentUser.username} (Host)
              </p>
              <p className="text-xs" style={{ color: "oklch(0.5 0.02 260)" }}>
                Room for {maxPlayers} players ·{" "}
                {privacy === "private" ? `Code: ${roomCode}` : "Public"}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              data-ocid="create_room.cancel.button"
              onClick={() => navigate({ to: "/dashboard" })}
              className="flex-1 h-12 rounded-xl"
              style={{
                border: "1px solid oklch(0.28 0.04 260)",
                color: "oklch(0.6 0.02 260)",
                background: "transparent",
              }}
            >
              Cancel
            </Button>
            <Button
              data-ocid="create_room.submit_button"
              onClick={handleCreate}
              disabled={creating}
              className="flex-1 h-12 rounded-xl font-bold text-base"
              style={{
                background: creating
                  ? "oklch(0.45 0.05 260)"
                  : "oklch(0.82 0.18 195)",
                color: "oklch(0.1 0.02 195)",
                fontFamily: "Bricolage Grotesque, sans-serif",
                border: "none",
                transition: "background 0.2s",
              }}
            >
              {creating ? "Creating..." : "Create Room →"}
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
