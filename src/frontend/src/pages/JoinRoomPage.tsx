import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "@tanstack/react-router";
import { CheckCircle, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "../components/game/AppHeader";
import { useApp } from "../contexts/AppContext";
import { addPlayerToRoom, loadRoomByCode } from "../game/storage";

type JoinStatus = "loading" | "success" | "error" | "not_logged_in";

export function JoinRoomPage() {
  const navigate = useNavigate();
  const params = useParams({ from: "/join/$code" });
  const code = params.code?.toUpperCase() ?? "";
  const { currentUser } = useApp();
  const [status, setStatus] = useState<JoinStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!currentUser) {
      setStatus("not_logged_in");
      return;
    }

    // Short delay for UX feedback
    const timer = setTimeout(() => {
      const room = loadRoomByCode(code);

      if (!room) {
        setStatus("error");
        setErrorMessage("Room not found. Please check the code.");
        return;
      }

      if (room.status !== "waiting") {
        setStatus("error");
        setErrorMessage("This room is no longer accepting players.");
        return;
      }

      const result = addPlayerToRoom(room.id, {
        id: currentUser.id,
        username: currentUser.username,
        avatarColor: currentUser.avatarColor,
        isHost: false,
        isBot: false,
      });

      if (!result.success) {
        setStatus("error");
        setErrorMessage(result.error ?? "Failed to join room.");
        return;
      }

      setStatus("success");
      setTimeout(() => {
        navigate({ to: `/room/${room.id}` });
      }, 800);
    }, 900);

    return () => clearTimeout(timer);
  }, [code, currentUser, navigate]);

  function handleGoToDashboard() {
    navigate({ to: "/dashboard" });
  }

  function handleLogin() {
    toast.info("Please log in to join a room.");
    navigate({ to: "/" });
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.1 0.02 260) 0%, oklch(0.14 0.04 270) 100%)",
      }}
    >
      <AppHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          className="w-full max-w-md rounded-2xl p-8 text-center"
          style={{
            background: "oklch(0.16 0.03 260)",
            border: "1px solid oklch(0.28 0.04 260)",
          }}
        >
          {/* Room code display */}
          <div className="mb-8">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: "oklch(0.55 0.05 195)" }}
            >
              Room Code
            </p>
            <div
              className="rounded-2xl px-6 py-4 inline-block"
              style={{
                background: "oklch(0.12 0.04 260)",
                border: "2px solid oklch(0.82 0.18 195 / 0.3)",
              }}
            >
              <span
                className="text-4xl font-mono font-black tracking-[0.3em]"
                style={{ color: "oklch(0.82 0.18 195)" }}
              >
                {code}
              </span>
            </div>
          </div>

          {/* Status display */}
          {status === "loading" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              data-ocid="join_room.loading_state"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
                  style={{
                    borderColor: "oklch(0.82 0.18 195 / 0.3)",
                    borderTopColor: "oklch(0.82 0.18 195)",
                  }}
                />
              </div>
              <p
                className="text-lg font-bold font-display"
                style={{ color: "oklch(0.82 0.18 195)" }}
              >
                Joining room...
              </p>
              <p
                className="text-sm mt-2"
                style={{ color: "oklch(0.5 0.02 260)" }}
              >
                Verifying room code
              </p>
            </motion.div>
          )}

          {status === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              data-ocid="join_room.success_state"
            >
              <CheckCircle
                size={52}
                className="mx-auto mb-4"
                style={{ color: "oklch(0.72 0.22 140)" }}
              />
              <p
                className="text-xl font-black font-display mb-2"
                style={{ color: "oklch(0.72 0.22 140)" }}
              >
                You're in!
              </p>
              <p className="text-sm" style={{ color: "oklch(0.55 0.02 260)" }}>
                Taking you to the lobby...
              </p>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              data-ocid="join_room.error_state"
            >
              <XCircle
                size={52}
                className="mx-auto mb-4"
                style={{ color: "oklch(0.65 0.28 22)" }}
              />
              <p
                className="text-xl font-black font-display mb-2"
                style={{ color: "oklch(0.75 0.25 22)" }}
              >
                Couldn't Join
              </p>
              <p
                className="text-sm mb-6 rounded-xl px-4 py-3"
                style={{
                  color: "oklch(0.75 0.25 22)",
                  background: "oklch(0.65 0.28 22 / 0.1)",
                  border: "1px solid oklch(0.65 0.28 22 / 0.3)",
                }}
              >
                {errorMessage}
              </p>
              <Button
                data-ocid="join_room.dashboard.button"
                onClick={handleGoToDashboard}
                className="w-full h-12 rounded-xl font-bold"
                style={{
                  background: "oklch(0.82 0.18 195)",
                  color: "oklch(0.1 0.02 195)",
                  fontFamily: "Bricolage Grotesque, sans-serif",
                  border: "none",
                }}
              >
                Go to Dashboard
              </Button>
            </motion.div>
          )}

          {status === "not_logged_in" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              data-ocid="join_room.error_state"
            >
              <div className="text-5xl mb-4">🔐</div>
              <p
                className="text-xl font-black font-display mb-2"
                style={{ color: "oklch(0.95 0.01 260)" }}
              >
                Log in to Join
              </p>
              <p
                className="text-sm mb-6"
                style={{ color: "oklch(0.55 0.02 260)" }}
              >
                You need to be logged in to join a room. The code{" "}
                <span
                  className="font-mono font-bold"
                  style={{ color: "oklch(0.82 0.18 195)" }}
                >
                  {code}
                </span>{" "}
                will be waiting for you!
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  data-ocid="join_room.join.button"
                  onClick={handleLogin}
                  className="w-full h-12 rounded-xl font-bold"
                  style={{
                    background: "oklch(0.82 0.18 195)",
                    color: "oklch(0.1 0.02 195)",
                    fontFamily: "Bricolage Grotesque, sans-serif",
                    border: "none",
                  }}
                >
                  Log In to Join
                </Button>
                <Button
                  data-ocid="join_room.dashboard.button"
                  variant="outline"
                  onClick={handleGoToDashboard}
                  className="w-full h-12 rounded-xl font-semibold"
                  style={{
                    border: "1px solid oklch(0.28 0.04 260)",
                    color: "oklch(0.6 0.02 260)",
                    background: "transparent",
                  }}
                >
                  Go to Dashboard
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
