import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../contexts/AppContext";
import {
  findUserByUsername,
  generateId,
  hashPassword,
  saveUser,
} from "../game/storage";
import type { UserProfile } from "../game/types";

const AVATAR_COLORS = [
  "#ff4d4d",
  "#4d94ff",
  "#4dff88",
  "#ffd24d",
  "#d44dff",
  "#ff8c4d",
];

const CARD_EMOJIS = [
  { color: "red", label: "⊘", x: 12, y: 25, rotate: -18 },
  { color: "blue", label: "+2", x: 78, y: 15, rotate: 15 },
  { color: "green", label: "↺", x: 5, y: 60, rotate: -8 },
  { color: "yellow", label: "★", x: 82, y: 55, rotate: 20 },
  { color: "wild", label: "+4", x: 65, y: 75, rotate: -12 },
];

export function LandingPage() {
  const navigate = useNavigate();
  const { setCurrentUser } = useApp();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [loading, setLoading] = useState(false);

  const cardBgs: Record<string, string> = {
    red: "linear-gradient(135deg, oklch(0.65 0.28 22), oklch(0.5 0.25 15))",
    blue: "linear-gradient(135deg, oklch(0.62 0.22 255), oklch(0.45 0.2 250))",
    green: "linear-gradient(135deg, oklch(0.65 0.22 140), oklch(0.5 0.2 135))",
    yellow: "linear-gradient(135deg, oklch(0.88 0.2 90), oklch(0.78 0.18 85))",
    wild: "linear-gradient(135deg, oklch(0.65 0.28 22) 0%, oklch(0.62 0.22 255) 50%, oklch(0.65 0.22 140) 100%)",
  };

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    const user = findUserByUsername(username.trim());
    if (!user) {
      toast.error("No account found with that username");
      setLoading(false);
      return;
    }
    if (user.passwordHash !== hashPassword(password)) {
      toast.error("Incorrect password");
      setLoading(false);
      return;
    }
    setCurrentUser(user);
    navigate({ to: "/dashboard" });
  }

  async function handleSignup() {
    if (!username.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (username.trim().length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }
    if (password.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }
    const existing = findUserByUsername(username.trim());
    if (existing) {
      toast.error("Username already taken");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    const user: UserProfile = {
      id: generateId(),
      username: username.trim(),
      passwordHash: hashPassword(password),
      avatarColor,
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      gameHistory: [],
    };
    saveUser(user);
    setCurrentUser(user);
    navigate({ to: "/dashboard" });
  }

  async function handleGuest() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    const guestUser: UserProfile = {
      id: generateId(),
      username: `Guest${Math.floor(Math.random() * 9999)}`,
      passwordHash: "",
      avatarColor:
        AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      gameHistory: [],
    };
    saveUser(guestUser);
    setCurrentUser(guestUser);
    navigate({ to: "/dashboard" });
  }

  return (
    <div
      className="min-h-screen flex overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.1 0.02 260) 0%, oklch(0.14 0.04 270) 100%)",
      }}
    >
      {/* Decorative floating cards */}
      {CARD_EMOJIS.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.7, scale: 1 }}
          transition={{ delay: 0.3 + i * 0.15, type: "spring" }}
          style={{
            position: "fixed",
            left: `${c.x}%`,
            top: `${c.y}%`,
            width: 64,
            height: 90,
            borderRadius: 10,
            background: cardBgs[c.color],
            border: "2px solid rgba(255,255,255,0.15)",
            rotate: c.rotate,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            fontWeight: 900,
            color: c.color === "yellow" ? "#1a0f00" : "#fff",
            fontFamily: "Bricolage Grotesque, sans-serif",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            pointerEvents: "none",
            zIndex: 0,
          }}
          className="hidden lg:flex float-anim"
        >
          {c.label}
        </motion.div>
      ))}

      {/* Main content */}
      <div className="flex flex-col lg:flex-row w-full z-10">
        {/* Left panel: branding */}
        <div className="flex flex-col items-center justify-center flex-1 p-8 lg:p-16">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-center"
          >
            <div
              className="text-7xl lg:text-9xl font-display font-black mb-4 shimmer-text"
              style={{ letterSpacing: "-4px" }}
            >
              Color
              <br />
              Blast
            </div>
            <p
              className="text-lg lg:text-xl max-w-xs mx-auto"
              style={{ color: "oklch(0.7 0.05 260)" }}
            >
              The ultimate multiplayer card game. Play against bots. Challenge
              your strategy.
            </p>

            {/* Color swatches */}
            <div className="flex gap-3 justify-center mt-8">
              {["red", "blue", "green", "yellow"].map((color) => (
                <motion.div
                  key={color}
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: cardBgs[color],
                    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right panel: auth form */}
        <div className="flex items-center justify-center p-6 lg:p-16 lg:min-w-[420px]">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-sm"
          >
            <div
              className="rounded-2xl p-8"
              style={{
                background: "oklch(0.16 0.03 260)",
                border: "1px solid oklch(0.28 0.04 260)",
                boxShadow: "0 20px 60px oklch(0 0 0 / 0.5)",
              }}
            >
              {/* Tabs */}
              <div
                className="flex gap-1 mb-8 rounded-xl p-1"
                style={{ background: "oklch(0.12 0.02 260)" }}
              >
                {(["login", "signup"] as const).map((tab) => (
                  <button
                    type="button"
                    key={tab}
                    onClick={() => setMode(tab)}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={{
                      background:
                        mode === tab ? "oklch(0.82 0.18 195)" : "transparent",
                      color:
                        mode === tab
                          ? "oklch(0.1 0.02 195)"
                          : "oklch(0.6 0.02 260)",
                      fontFamily: "Outfit, sans-serif",
                    }}
                  >
                    {tab === "login" ? "Login" : "Sign Up"}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <Label
                    className="text-sm mb-1.5 block"
                    style={{ color: "oklch(0.7 0.03 260)" }}
                  >
                    Username
                  </Label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      (mode === "login" ? handleLogin() : handleSignup())
                    }
                    style={{
                      background: "oklch(0.12 0.02 260)",
                      border: "1px solid oklch(0.28 0.04 260)",
                      color: "oklch(0.95 0.01 260)",
                    }}
                  />
                </div>

                <div>
                  <Label
                    className="text-sm mb-1.5 block"
                    style={{ color: "oklch(0.7 0.03 260)" }}
                  >
                    Password
                  </Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      (mode === "login" ? handleLogin() : handleSignup())
                    }
                    style={{
                      background: "oklch(0.12 0.02 260)",
                      border: "1px solid oklch(0.28 0.04 260)",
                      color: "oklch(0.95 0.01 260)",
                    }}
                  />
                </div>

                {mode === "signup" && (
                  <div>
                    <Label
                      className="text-sm mb-2 block"
                      style={{ color: "oklch(0.7 0.03 260)" }}
                    >
                      Avatar Color
                    </Label>
                    <div className="flex gap-2">
                      {AVATAR_COLORS.map((c) => (
                        <button
                          type="button"
                          key={c}
                          onClick={() => setAvatarColor(c)}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: c,
                            border:
                              avatarColor === c
                                ? "3px solid white"
                                : "3px solid transparent",
                            transition: "all 0.15s",
                            outline:
                              avatarColor === c
                                ? "2px solid oklch(0.82 0.18 195)"
                                : "none",
                            outlineOffset: 2,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={mode === "login" ? handleLogin : handleSignup}
                  disabled={loading}
                  className="w-full h-11 font-bold text-base mt-2"
                  style={{
                    background: "oklch(0.82 0.18 195)",
                    color: "oklch(0.1 0.02 195)",
                    fontFamily: "Bricolage Grotesque, sans-serif",
                  }}
                >
                  {loading
                    ? "Loading..."
                    : mode === "login"
                      ? "Login"
                      : "Create Account"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div
                      className="w-full border-t"
                      style={{ borderColor: "oklch(0.25 0.03 260)" }}
                    />
                  </div>
                  <div className="relative flex justify-center">
                    <span
                      className="px-3 text-xs"
                      style={{
                        background: "oklch(0.16 0.03 260)",
                        color: "oklch(0.5 0.02 260)",
                      }}
                    >
                      or
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleGuest}
                  disabled={loading}
                  className="w-full h-11 font-semibold"
                  style={{
                    border: "1px solid oklch(0.28 0.04 260)",
                    background: "transparent",
                    color: "oklch(0.75 0.05 260)",
                    fontFamily: "Outfit, sans-serif",
                  }}
                >
                  🎮 Play as Guest
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
