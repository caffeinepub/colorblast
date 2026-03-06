import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Bot, Copy, Crown, Send, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "../components/game/AppHeader";
import { useApp } from "../contexts/AppContext";
import { createInitialGameState } from "../game/engine";
import { generateId, loadRoom, saveGameState, saveRoom } from "../game/storage";
import type { ChatMessage, Room } from "../game/types";
import type { Player } from "../game/types";

const BOT_NAMES = ["AceBot", "NovAI", "BlastBot", "CardShark", "WildBot"];
const BOT_COLORS = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24", "#a29bfe"];

export function RoomPage() {
  const navigate = useNavigate();
  const params = useParams({ from: "/room/$roomId" });
  const roomId = params.roomId;
  const { currentUser } = useApp();
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "sys1",
      senderId: "system",
      senderName: "System",
      content: "Welcome to the room! Host can start the game when ready.",
      timestamp: Date.now(),
      type: "system",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) {
      navigate({ to: "/" });
      return;
    }
    const r = loadRoom(roomId);
    if (!r) {
      toast.error("Room not found");
      navigate({ to: "/dashboard" });
      return;
    }
    setRoom(r);
  }, [roomId, currentUser, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  if (!room || !currentUser) return null;

  const isHost = room.hostId === currentUser.id;
  const humanPlayers = room.players.filter((p) => !p.isBot);
  const botPlayers = room.players.filter((p) => p.isBot);
  // How many bots will fill the room when game starts
  const botsNeeded = Math.max(0, room.maxPlayers - room.players.length);

  function handleKick(playerId: string) {
    if (!room || !isHost) return;
    const updated: Room = {
      ...room,
      players: room.players.filter((p) => p.id !== playerId),
    };
    saveRoom(updated);
    setRoom(updated);
    addSystemMessage("A player was removed from the room.");
  }

  function handleChangeMax(delta: number) {
    if (!room || !isHost) return;
    const minAllowed = room.players.length; // can't go below current player count
    const newMax = Math.max(
      Math.max(2, minAllowed),
      Math.min(6, room.maxPlayers + delta),
    );
    if (newMax === room.maxPlayers) return;
    const updated = { ...room, maxPlayers: newMax };
    saveRoom(updated);
    setRoom(updated);
  }

  function handleStartGame() {
    if (!room || !currentUser) return;
    if (room.players.length < 1) {
      toast.error("Need at least 1 player");
      return;
    }

    // Fill remaining slots with bots
    const currentBotCount = room.players.filter((p) => p.isBot).length;
    const totalBotsNeeded = room.maxPlayers - room.players.length;
    const newBots = Array.from({ length: totalBotsNeeded }, (_, i) => {
      const botIdx = (currentBotCount + i) % BOT_NAMES.length;
      return {
        id: generateId(),
        username: BOT_NAMES[botIdx],
        avatarColor: BOT_COLORS[botIdx],
        isHost: false,
        isBot: true,
      };
    });

    const allRoomPlayers = [...room.players, ...newBots];

    const gamePlayers: Player[] = allRoomPlayers.map((rp) => ({
      id: rp.id,
      username: rp.username,
      avatarColor: rp.avatarColor,
      hand: [],
      isBot: rp.isBot,
      hasCalledUno: false,
      isCurrentTurn: false,
    }));

    // Move human player to index 0
    const humanIdx = gamePlayers.findIndex((p) => p.id === currentUser.id);
    if (humanIdx > 0) {
      const [human] = gamePlayers.splice(humanIdx, 1);
      gamePlayers.unshift(human);
    }

    const gameId = generateId();
    const gameState = createInitialGameState(gamePlayers, gameId);
    saveGameState(gameState);

    const updatedRoom: Room = {
      ...room,
      players: allRoomPlayers,
      status: "playing",
      gameId,
    };
    saveRoom(updatedRoom);

    navigate({ to: `/game/${gameId}` });
  }

  function addSystemMessage(content: string) {
    setMessages((prev) => [
      ...prev,
      {
        id: generateId(),
        senderId: "system",
        senderName: "System",
        content,
        timestamp: Date.now(),
        type: "system",
      },
    ]);
  }

  function handleSendChat() {
    if (!chatInput.trim() || !currentUser) return;
    setMessages((prev) => [
      ...prev,
      {
        id: generateId(),
        senderId: currentUser.id,
        senderName: currentUser.username,
        content: chatInput.trim(),
        timestamp: Date.now(),
        type: "chat",
      },
    ]);
    setChatInput("");

    // Bot random response
    const respondingBot =
      botPlayers[Math.floor(Math.random() * botPlayers.length)];
    if (respondingBot && Math.random() > 0.4) {
      const botReplies = [
        "Ready to blast some cards! 🃏",
        "Good luck, you'll need it! 😈",
        "Let's go!! ⚡",
        "I've been practicing my wild cards 🌈",
        "May the best player win! 🏆",
      ];
      setTimeout(
        () => {
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              senderId: respondingBot.id,
              senderName: respondingBot.username,
              content:
                botReplies[Math.floor(Math.random() * botReplies.length)],
              timestamp: Date.now(),
              type: "chat",
            },
          ]);
        },
        800 + Math.random() * 1200,
      );
    }
  }

  function copyRoomCode() {
    if (!room) return;
    navigator.clipboard.writeText(room.code);
    toast.success("Room code copied!");
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

      <main className="max-w-5xl mx-auto px-4 pt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Room info + Players */}
          <div className="lg:col-span-2 space-y-4">
            {/* Room Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-6"
              style={{
                background: "oklch(0.16 0.03 260)",
                border: "1px solid oklch(0.28 0.04 260)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1
                    className="text-2xl font-display font-black"
                    style={{ color: "oklch(0.95 0.01 260)" }}
                  >
                    Game Lobby
                  </h1>
                  <p
                    className="text-sm"
                    style={{ color: "oklch(0.5 0.02 260)" }}
                  >
                    {room.privacy === "private" ? "🔒 Private" : "🌍 Public"} ·{" "}
                    {room.players.length}/{room.maxPlayers} players
                    {botsNeeded > 0 && (
                      <span style={{ color: "oklch(0.6 0.1 260)" }}>
                        {" "}
                        · {botsNeeded} bot{botsNeeded !== 1 ? "s" : ""} joining
                        on start
                      </span>
                    )}
                  </p>
                </div>

                {room.privacy === "private" && (
                  <button
                    type="button"
                    data-ocid="room.copy_code.button"
                    onClick={copyRoomCode}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 transition-all hover:opacity-80"
                    style={{
                      background: "oklch(0.12 0.02 260)",
                      border: "1px solid oklch(0.28 0.04 260)",
                    }}
                  >
                    <span
                      className="text-xl font-mono font-black tracking-widest"
                      style={{ color: "oklch(0.82 0.18 195)" }}
                    >
                      {room.code}
                    </span>
                    <Copy size={14} style={{ color: "oklch(0.5 0.02 260)" }} />
                  </button>
                )}
              </div>

              {/* Host controls */}
              {isHost && (
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "oklch(0.55 0.02 260)" }}
                  >
                    Max players:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      data-ocid="room.max_players_dec.button"
                      onClick={() => handleChangeMax(-1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-lg font-bold transition-all hover:opacity-80"
                      style={{
                        background: "oklch(0.22 0.03 260)",
                        color: "oklch(0.8 0.02 260)",
                      }}
                    >
                      −
                    </button>
                    <span
                      className="text-lg font-black font-display w-6 text-center"
                      style={{ color: "oklch(0.82 0.18 195)" }}
                    >
                      {room.maxPlayers}
                    </span>
                    <button
                      type="button"
                      data-ocid="room.max_players_inc.button"
                      onClick={() => handleChangeMax(1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-lg font-bold transition-all hover:opacity-80"
                      style={{
                        background: "oklch(0.22 0.03 260)",
                        color: "oklch(0.8 0.02 260)",
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Player Slots */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl p-6"
              style={{
                background: "oklch(0.16 0.03 260)",
                border: "1px solid oklch(0.28 0.04 260)",
              }}
            >
              <h2
                className="font-display font-black text-base mb-4"
                style={{ color: "oklch(0.65 0.05 260)" }}
              >
                PLAYERS ({room.players.length}/{room.maxPlayers})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AnimatePresence>
                  {room.players.map((player, idx) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: idx * 0.05 }}
                      data-ocid={`room.player.${idx + 1}`}
                      className="flex items-center gap-3 rounded-xl p-3"
                      style={{
                        background:
                          player.id === currentUser.id
                            ? "oklch(0.2 0.05 260)"
                            : "oklch(0.12 0.02 260)",
                        border:
                          player.id === currentUser.id
                            ? "1px solid oklch(0.82 0.18 195 / 0.4)"
                            : "1px solid oklch(0.22 0.02 260)",
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 relative"
                        style={{
                          background: player.avatarColor,
                          color: "#fff",
                        }}
                      >
                        {player.isBot ? "🤖" : player.username[0].toUpperCase()}
                        {player.isHost && (
                          <Crown
                            size={12}
                            className="absolute -top-1 -right-1"
                            style={{ color: "oklch(0.88 0.2 90)" }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold text-sm truncate"
                          style={{
                            color:
                              player.id === currentUser.id
                                ? "oklch(0.82 0.18 195)"
                                : "oklch(0.85 0.02 260)",
                          }}
                        >
                          {player.username}
                          {player.id === currentUser.id && " (You)"}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "oklch(0.45 0.02 260)" }}
                        >
                          {player.isBot ? (
                            <span className="flex items-center gap-1">
                              <Bot size={10} /> AI Bot
                            </span>
                          ) : player.isHost ? (
                            <span className="flex items-center gap-1">
                              <Crown
                                size={10}
                                style={{ color: "oklch(0.88 0.2 90)" }}
                              />{" "}
                              Host
                            </span>
                          ) : (
                            "Human"
                          )}
                        </p>
                      </div>
                      {isHost && !player.isHost && (
                        <button
                          type="button"
                          data-ocid={`room.kick_player.${idx + 1}`}
                          onClick={() => handleKick(player.id)}
                          className="p-1 rounded-lg hover:opacity-80 transition-opacity"
                          style={{ color: "oklch(0.65 0.25 22)" }}
                          title={player.isBot ? "Remove bot" : "Kick player"}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </motion.div>
                  ))}

                  {/* Pending bot slots */}
                  {botsNeeded > 0 &&
                    Array.from({ length: botsNeeded }, (_, i) => i).map((i) => (
                      <div
                        key={`pending-bot-slot-${room.players.length + i}`}
                        className="flex items-center gap-3 rounded-xl p-3"
                        style={{
                          background: "oklch(0.11 0.015 260)",
                          border: "1px dashed oklch(0.25 0.03 260)",
                          opacity: 0.6,
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm"
                          style={{ background: "oklch(0.18 0.02 260)" }}
                        >
                          🤖
                        </div>
                        <div>
                          <p
                            className="text-sm font-semibold"
                            style={{ color: "oklch(0.5 0.02 260)" }}
                          >
                            AI Bot
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "oklch(0.38 0.02 260)" }}
                          >
                            Joins on start
                          </p>
                        </div>
                      </div>
                    ))}

                  {/* Empty slots if maxPlayers > players + botsNeeded (shouldn't happen but safety) */}
                  {Array.from({
                    length: Math.max(
                      0,
                      room.maxPlayers - room.players.length - botsNeeded,
                    ),
                  }).map((_, i) => (
                    <div
                      key={`empty-slot-${room.players.length + botsNeeded + i}`}
                      className="flex items-center gap-3 rounded-xl p-3"
                      style={{
                        background: "oklch(0.1 0.01 260)",
                        border: "1px dashed oklch(0.22 0.02 260)",
                        opacity: 0.5,
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: "oklch(0.18 0.02 260)" }}
                      >
                        <span style={{ color: "oklch(0.4 0.02 260)" }}>+</span>
                      </div>
                      <span
                        className="text-sm"
                        style={{ color: "oklch(0.4 0.02 260)" }}
                      >
                        Waiting...
                      </span>
                    </div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Human players info */}
              {humanPlayers.length > 0 && (
                <p
                  className="text-xs mt-3"
                  style={{ color: "oklch(0.45 0.02 260)" }}
                >
                  {humanPlayers.length} human player
                  {humanPlayers.length !== 1 ? "s" : ""}
                  {botsNeeded > 0 &&
                    ` · ${botsNeeded} AI bot${botsNeeded !== 1 ? "s" : ""} will fill empty slots`}
                </p>
              )}

              {/* Start Button */}
              {isHost && (
                <div className="mt-6">
                  <Button
                    data-ocid="room.start_game.button"
                    onClick={handleStartGame}
                    className="w-full h-14 text-lg font-black rounded-xl"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.72 0.22 140), oklch(0.6 0.2 155))",
                      color: "oklch(0.1 0.02 140)",
                      fontFamily: "Bricolage Grotesque, sans-serif",
                      border: "none",
                    }}
                  >
                    🚀 Start Game ({room.maxPlayers} Players)
                  </Button>
                  <p
                    className="text-xs text-center mt-2"
                    style={{ color: "oklch(0.4 0.02 260)" }}
                  >
                    Only you can start the game as host
                  </p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right: Chat */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl flex flex-col"
            style={{
              background: "oklch(0.16 0.03 260)",
              border: "1px solid oklch(0.28 0.04 260)",
              height: 520,
            }}
          >
            <div
              className="p-4 border-b"
              style={{ borderColor: "oklch(0.22 0.02 260)" }}
            >
              <h2
                className="font-display font-black text-base"
                style={{ color: "oklch(0.65 0.05 260)" }}
              >
                💬 ROOM CHAT
              </h2>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id}>
                    {msg.type === "system" ? (
                      <p
                        className="text-xs text-center italic py-1"
                        style={{ color: "oklch(0.45 0.02 260)" }}
                      >
                        {msg.content}
                      </p>
                    ) : (
                      <div className="space-y-0.5">
                        <span
                          className="text-xs font-bold"
                          style={{
                            color:
                              msg.senderId === currentUser.id
                                ? "oklch(0.82 0.18 195)"
                                : "oklch(0.7 0.05 260)",
                          }}
                        >
                          {msg.senderName}
                        </span>
                        <p
                          className="text-sm rounded-lg px-3 py-1.5"
                          style={{
                            background:
                              msg.senderId === currentUser.id
                                ? "oklch(0.25 0.05 260)"
                                : "oklch(0.12 0.02 260)",
                            color: "oklch(0.9 0.01 260)",
                          }}
                        >
                          {msg.content}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

            <div
              className="p-3 border-t flex gap-2"
              style={{ borderColor: "oklch(0.22 0.02 260)" }}
            >
              <Input
                data-ocid="room.chat.input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                placeholder="Send a message..."
                className="h-9 text-sm rounded-lg flex-1"
                style={{
                  background: "oklch(0.12 0.02 260)",
                  border: "1px solid oklch(0.25 0.03 260)",
                  color: "oklch(0.9 0.01 260)",
                }}
              />
              <Button
                data-ocid="room.chat.submit_button"
                onClick={handleSendChat}
                size="icon"
                className="h-9 w-9 rounded-lg"
                style={{
                  background: "oklch(0.82 0.18 195)",
                  color: "oklch(0.1 0.02 195)",
                  border: "none",
                }}
              >
                <Send size={14} />
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
