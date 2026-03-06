import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, RotateCcw, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Confetti } from "../components/game/Confetti";
import { GameCard } from "../components/game/GameCard";
import { useApp } from "../contexts/AppContext";
import {
  playCardSound,
  playDrawSound,
  playLoseSound,
  playUnoSound,
  playWildSound,
  playWinSound,
} from "../game/audio";
import { canPlayCard } from "../game/deck";
import {
  callUno,
  drawCards,
  getBotMove,
  penalizeUnoMiss,
  playCard,
} from "../game/engine";
import {
  clearGameState,
  generateId,
  loadGameState,
  saveGameState,
} from "../game/storage";
import type { CardColor, ChatMessage, GameState } from "../game/types";

const WILD_COLORS: CardColor[] = ["red", "blue", "green", "yellow"];
const COLOR_LABELS: Record<CardColor, string> = {
  red: "Red",
  blue: "Blue",
  green: "Green",
  yellow: "Yellow",
  wild: "Wild",
};
const COLOR_BGSRC: Record<Exclude<CardColor, "wild">, string> = {
  red: "linear-gradient(135deg, oklch(0.65 0.28 22), oklch(0.5 0.25 15))",
  blue: "linear-gradient(135deg, oklch(0.62 0.22 255), oklch(0.45 0.2 250))",
  green: "linear-gradient(135deg, oklch(0.65 0.22 140), oklch(0.5 0.2 135))",
  yellow: "linear-gradient(135deg, oklch(0.88 0.2 90), oklch(0.78 0.18 85))",
};

export function GamePage() {
  const navigate = useNavigate();
  const params = useParams({ from: "/game/$gameId" });
  const { currentUser, updateUser } = useApp();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showWildPicker, setShowWildPicker] = useState(false);
  const [pendingWildCardId, setPendingWildCardId] = useState<number | null>(
    null,
  );
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [unoTimer, setUnoTimer] = useState<number | null>(null);
  const [showWinScreen, setShowWinScreen] = useState(false);
  const [turnCount, setTurnCount] = useState(0);

  const botTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const addSystemMessage = useCallback((content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: generateId(),
        senderId: "system",
        senderName: "System",
        content,
        timestamp: Date.now(),
        type: "system" as const,
      },
    ]);
  }, []);

  // Load game state
  useEffect(() => {
    if (!currentUser) {
      navigate({ to: "/" });
      return;
    }
    const state = loadGameState();
    if (!state || state.id !== params.gameId) {
      navigate({ to: "/dashboard" });
      return;
    }
    setGameState(state);
    addSystemMessage(
      `Game started! ${state.players.length} players. First card: ${state.discardPile[state.discardPile.length - 1].color} ${state.discardPile[state.discardPile.length - 1].value}`,
    );
  }, [currentUser, navigate, params.gameId, addSystemMessage]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  // Bot AI logic
  useEffect(() => {
    if (!gameState || gameState.status !== "active") return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer?.isBot) return;

    // Clear any existing bot timeout
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);

    const delay = 1500 + Math.random() * 1000;

    botTimeoutRef.current = setTimeout(() => {
      setGameState((prev) => {
        if (!prev || prev.status !== "active") return prev;
        const botIdx = prev.currentPlayerIndex;
        const bot = prev.players[botIdx];
        if (!bot?.isBot) return prev;

        const move = getBotMove(prev, botIdx);
        let newState: GameState | null = null;

        if (move.type === "play") {
          newState = playCard(prev, botIdx, move.cardId, move.chosenColor);
          if (newState) {
            playCardSound();
            setTurnCount((c) => c + 1);
            addSystemMessage(`${bot.username} played a card`);

            // Bot calls UNO automatically
            const botAfter = newState.players[botIdx];
            if (botAfter && botAfter.hand.length === 1) {
              playUnoSound();
              newState = {
                ...newState,
                players: newState.players.map((p, i) =>
                  i === botIdx ? { ...p, hasCalledUno: true } : p,
                ),
                unoCallRequired: null,
              };
              addSystemMessage(`${bot.username} shouts UNO! 🃏`);
            }

            if (newState.status === "finished") {
              setShowWinScreen(true);
            }
          }
        } else {
          newState = drawCards(prev, botIdx);
          playDrawSound();
          addSystemMessage(`${bot.username} draws a card`);
          setTurnCount((c) => c + 1);
        }

        if (newState) {
          saveGameState(newState);
          return newState;
        }
        return prev;
      });
    }, delay);

    return () => {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    };
  }, [gameState, addSystemMessage]);

  // UNO timer
  useEffect(() => {
    if (!gameState?.unoCallRequired) {
      setUnoTimer(null);
      if (unoTimerRef.current) clearTimeout(unoTimerRef.current);
      return;
    }

    const humanId = currentUser?.id;
    if (gameState.unoCallRequired !== humanId) return; // bot handled automatically

    setUnoTimer(3);
    let remaining = 3;

    const interval = setInterval(() => {
      remaining -= 1;
      setUnoTimer(remaining);
    }, 1000);

    unoTimerRef.current = setTimeout(() => {
      clearInterval(interval);
      setUnoTimer(null);
      // Penalize
      setGameState((prev) => {
        if (!prev || !prev.unoCallRequired) return prev;
        const penalized = penalizeUnoMiss(prev, prev.unoCallRequired);
        saveGameState(penalized);
        addSystemMessage("You forgot to call UNO! +2 cards penalty.");
        return penalized;
      });
    }, 3000);

    return () => {
      clearInterval(interval);
      if (unoTimerRef.current) clearTimeout(unoTimerRef.current);
    };
  }, [gameState?.unoCallRequired, currentUser?.id, addSystemMessage]);

  // Handle game end — only runs once when status becomes "finished"
  const hasHandledEndRef = useRef(false);
  useEffect(() => {
    if (!gameState || gameState.status !== "finished" || !currentUser) return;
    if (hasHandledEndRef.current) return;
    hasHandledEndRef.current = true;

    const isWin = gameState.winnerId === currentUser.id;
    const winner = gameState.players.find((p) => p.id === gameState.winnerId);

    if (isWin) {
      playWinSound();
      updateUser({
        wins: currentUser.wins + 1,
        gamesPlayed: currentUser.gamesPlayed + 1,
        gameHistory: [
          ...currentUser.gameHistory,
          {
            gameId: gameState.id,
            date: Date.now(),
            result: "win",
            players: gameState.players.length,
            turnsPlayed: turnCount,
          },
        ],
      });
    } else {
      playLoseSound();
      updateUser({
        losses: currentUser.losses + 1,
        gamesPlayed: currentUser.gamesPlayed + 1,
        gameHistory: [
          ...currentUser.gameHistory,
          {
            gameId: gameState.id,
            date: Date.now(),
            result: "loss",
            players: gameState.players.length,
            turnsPlayed: turnCount,
          },
        ],
      });
    }

    addSystemMessage(
      isWin
        ? "🎉 YOU WIN! Amazing game!"
        : `${winner?.username ?? "A bot"} wins! Better luck next time.`,
    );
    setShowWinScreen(true);
  }, [gameState, currentUser, updateUser, addSystemMessage, turnCount]);

  if (!gameState || !currentUser) return null;

  const humanPlayerIdx = gameState.players.findIndex(
    (p) => p.id === currentUser.id,
  );
  const humanPlayer = gameState.players[humanPlayerIdx];
  const isHumanTurn =
    gameState.currentPlayerIndex === humanPlayerIdx &&
    gameState.status === "active";
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];

  const otherPlayers = gameState.players.filter((p) => p.id !== currentUser.id);
  const positions = getPositions(otherPlayers.length);

  function handleCardClick(cardId: number) {
    if (!isHumanTurn || !gameState || !humanPlayer) return;
    const card = humanPlayer.hand.find((c) => c.id === cardId);
    if (!card) return;

    if (
      !canPlayCard(card, topCard, gameState.currentColor, gameState.drawPending)
    )
      return;

    if (card.color === "wild") {
      setPendingWildCardId(cardId);
      setShowWildPicker(true);
      playWildSound();
      return;
    }

    const newState = playCard(gameState, humanPlayerIdx, cardId);
    if (!newState) return;

    playCardSound();
    setTurnCount((c) => c + 1);
    saveGameState(newState);
    setGameState(newState);

    if (newState.status === "finished") {
      setShowWinScreen(true);
    }
  }

  function handleWildColorPick(color: CardColor) {
    if (pendingWildCardId === null || !gameState) return;
    setShowWildPicker(false);

    const newState = playCard(
      gameState,
      humanPlayerIdx,
      pendingWildCardId,
      color,
    );
    if (!newState) return;

    playCardSound();
    setTurnCount((c) => c + 1);
    saveGameState(newState);
    setGameState(newState);
    setPendingWildCardId(null);

    if (newState.status === "finished") {
      setShowWinScreen(true);
    }
  }

  function handleDraw() {
    if (!isHumanTurn || !gameState) return;
    const newState = drawCards(gameState, humanPlayerIdx);
    playDrawSound();
    setTurnCount((c) => c + 1);
    saveGameState(newState);
    setGameState(newState);
    addSystemMessage("You drew a card");
  }

  function handleUnoCall() {
    if (!gameState || !humanPlayer || !currentUser) return;
    if (
      humanPlayer.hand.length !== 1 &&
      gameState.unoCallRequired !== currentUser.id
    )
      return;

    const newState = callUno(gameState, currentUser.id);
    playUnoSound();
    saveGameState(newState);
    setGameState(newState);
    addSystemMessage("You called UNO! 🃏");
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
        type: "chat" as const,
      },
    ]);
    setChatInput("");
  }

  function handleLeaveGame() {
    clearGameState();
    navigate({ to: "/dashboard" });
  }

  const showUnoButton =
    (humanPlayer?.hand.length === 1 && !humanPlayer.hasCalledUno) ||
    gameState.unoCallRequired === currentUser.id;

  const currentColorStyle = (() => {
    const c = gameState.currentColor;
    if (c === "red") return { bg: "oklch(0.65 0.28 22)", label: "🔴 Red" };
    if (c === "blue") return { bg: "oklch(0.62 0.22 255)", label: "🔵 Blue" };
    if (c === "green") return { bg: "oklch(0.65 0.22 140)", label: "🟢 Green" };
    if (c === "yellow") return { bg: "oklch(0.88 0.2 90)", label: "🟡 Yellow" };
    return { bg: "oklch(0.5 0.1 260)", label: "🌈 Wild" };
  })();

  return (
    <div
      className="h-screen flex flex-col overflow-hidden relative"
      style={{ background: "oklch(0.1 0.02 260)" }}
    >
      {/* Game table area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Table background */}
        <div
          className="absolute inset-0 game-table"
          style={{ borderRadius: "0" }}
        />

        {/* Top HUD */}
        <div
          className="relative z-10 flex items-center justify-between px-4 py-2"
          style={{
            background: "oklch(0.1 0.02 260 / 0.8)",
            backdropFilter: "blur(8px)",
          }}
        >
          <button
            type="button"
            onClick={handleLeaveGame}
            className="flex items-center gap-1 text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ color: "oklch(0.55 0.02 260)" }}
          >
            <ChevronLeft size={16} />
            Leave
          </button>

          <div className="flex items-center gap-3">
            {/* Current color indicator */}
            <div
              className="flex items-center gap-2 rounded-full px-3 py-1"
              style={{
                background: "oklch(0.15 0.02 260 / 0.9)",
                border: "1px solid oklch(0.25 0.03 260)",
              }}
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ background: currentColorStyle.bg }}
              />
              <span
                className="text-xs font-semibold"
                style={{ color: "oklch(0.8 0.02 260)" }}
              >
                {COLOR_LABELS[gameState.currentColor]}
              </span>
            </div>

            {/* Direction */}
            <div
              className="flex items-center gap-1 rounded-full px-3 py-1"
              style={{
                background: "oklch(0.15 0.02 260 / 0.9)",
                border: "1px solid oklch(0.25 0.03 260)",
              }}
            >
              <RotateCcw
                size={12}
                style={{
                  color: "oklch(0.82 0.18 195)",
                  transform:
                    gameState.direction === "cw" ? "scaleX(-1)" : undefined,
                }}
              />
              <span
                className="text-xs"
                style={{ color: "oklch(0.6 0.02 260)" }}
              >
                {gameState.direction === "cw" ? "→" : "←"}
              </span>
            </div>

            {/* Draw pending */}
            {gameState.drawPending > 0 && (
              <div
                className="rounded-full px-3 py-1 font-bold text-xs"
                style={{ background: "oklch(0.65 0.28 22)", color: "#fff" }}
              >
                +{gameState.drawPending} DRAW
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowChat((s) => !s)}
            className="flex items-center gap-1 text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ color: "oklch(0.55 0.02 260)" }}
          >
            💬
            {showChat ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Main game area */}
        <div className="relative z-10 flex-1 flex">
          {/* Game table */}
          <div className="flex-1 relative">
            {/* Other players */}
            {otherPlayers.map((player, i) => {
              const pos = positions[i];
              const isCurrentTurn =
                gameState.currentPlayerIndex ===
                gameState.players.findIndex((p) => p.id === player.id);
              const faceDownCount = Math.min(player.hand.length, 7);

              return (
                <div
                  key={player.id}
                  className="absolute flex flex-col items-center"
                  style={pos.containerStyle}
                >
                  <div
                    className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all ${isCurrentTurn ? "turn-glow" : ""}`}
                    style={{
                      background: isCurrentTurn
                        ? "oklch(0.2 0.05 260 / 0.8)"
                        : "oklch(0.15 0.02 260 / 0.6)",
                      border: "1px solid oklch(0.25 0.03 260)",
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{
                          background: player.avatarColor,
                          color: "#fff",
                        }}
                      >
                        {player.isBot ? "🤖" : player.username[0].toUpperCase()}
                      </div>
                      {/* Card count badge */}
                      <div
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                        style={{
                          background: "oklch(0.65 0.28 22)",
                          color: "#fff",
                        }}
                      >
                        {player.hand.length}
                      </div>
                    </div>
                    <span
                      className="text-[11px] font-semibold max-w-[70px] truncate"
                      style={{
                        color: isCurrentTurn
                          ? "oklch(0.82 0.18 195)"
                          : "oklch(0.7 0.02 260)",
                      }}
                    >
                      {player.username}
                    </span>

                    {/* Face-down cards fan */}
                    <div className="flex" style={{ height: 48 }}>
                      {Array.from({ length: faceDownCount }).map((_, ci) => (
                        <div
                          key={`card-${player.id}-${ci}`}
                          style={{
                            marginLeft: ci > 0 ? -20 : 0,
                            zIndex: ci,
                            transform: `rotate(${(ci - (faceDownCount - 1) / 2) * 8}deg) translateY(${Math.abs(ci - (faceDownCount - 1) / 2) * 2}px)`,
                          }}
                        >
                          <GameCard faceDown mini />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Center: Discard pile + Deck */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-8">
                {/* Deck */}
                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    className="relative cursor-pointer transition-all hover:scale-105 bg-transparent border-0 p-0"
                    onClick={
                      isHumanTurn && gameState.status === "active"
                        ? handleDraw
                        : undefined
                    }
                    title={isHumanTurn ? "Draw a card" : ""}
                  >
                    {[2, 1, 0].map((offset) => (
                      <div
                        key={offset}
                        className="absolute"
                        style={{
                          top: -offset * 2,
                          left: offset * 1,
                          zIndex: 3 - offset,
                        }}
                      >
                        <GameCard faceDown />
                      </div>
                    ))}
                    <div style={{ width: 80, height: 112 }} />
                  </button>
                  <span
                    className="text-xs"
                    style={{ color: "oklch(0.5 0.02 260)" }}
                  >
                    {gameState.deck.length} cards
                  </span>
                  {isHumanTurn && (
                    <span
                      className="text-xs font-semibold animate-pulse"
                      style={{ color: "oklch(0.82 0.18 195)" }}
                    >
                      Tap to draw
                    </span>
                  )}
                </div>

                {/* Discard pile */}
                <div className="flex flex-col items-center gap-2">
                  <AnimatePresence mode="popLayout">
                    <motion.div
                      key={topCard.id}
                      initial={{ scale: 0.8, rotate: -10, y: -20, opacity: 0 }}
                      animate={{
                        scale: 1,
                        rotate: (Math.random() - 0.5) * 15,
                        y: 0,
                        opacity: 1,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                    >
                      <GameCard card={topCard} playable={false} />
                    </motion.div>
                  </AnimatePresence>
                  <span
                    className="text-xs"
                    style={{ color: "oklch(0.5 0.02 260)" }}
                  >
                    Discard
                  </span>
                </div>
              </div>
            </div>

            {/* Human player turn indicator */}
            {isHumanTurn && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-2 left-1/2 -translate-x-1/2"
              >
                <span
                  className="text-xs font-bold rounded-full px-3 py-1"
                  style={{
                    background: "oklch(0.82 0.18 195 / 0.2)",
                    border: "1px solid oklch(0.82 0.18 195)",
                    color: "oklch(0.82 0.18 195)",
                  }}
                >
                  Your Turn!
                </span>
              </motion.div>
            )}
          </div>

          {/* Chat sidebar */}
          <AnimatePresence>
            {showChat && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 260, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="flex flex-col overflow-hidden"
                style={{
                  background: "oklch(0.13 0.02 260 / 0.95)",
                  borderLeft: "1px solid oklch(0.22 0.02 260)",
                  backdropFilter: "blur(8px)",
                  minWidth: 0,
                }}
              >
                <div
                  className="p-3 border-b text-xs font-bold"
                  style={{
                    borderColor: "oklch(0.22 0.02 260)",
                    color: "oklch(0.55 0.02 260)",
                  }}
                >
                  GAME CHAT
                </div>
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-2">
                    {messages.map((msg) => (
                      <div key={msg.id}>
                        {msg.type === "system" ? (
                          <p
                            className="text-[11px] italic text-center"
                            style={{ color: "oklch(0.4 0.02 260)" }}
                          >
                            {msg.content}
                          </p>
                        ) : (
                          <div>
                            <span
                              className="text-[10px] font-bold"
                              style={{ color: "oklch(0.7 0.05 260)" }}
                            >
                              {msg.senderName}
                            </span>
                            <p
                              className="text-xs rounded-lg px-2 py-1 mt-0.5"
                              style={{
                                background:
                                  msg.senderId === currentUser.id
                                    ? "oklch(0.22 0.04 260)"
                                    : "oklch(0.18 0.02 260)",
                                color: "oklch(0.85 0.01 260)",
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
                  className="p-2 flex gap-1"
                  style={{ borderTop: "1px solid oklch(0.22 0.02 260)" }}
                >
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                    placeholder="Chat..."
                    className="h-7 text-xs rounded-md flex-1"
                    style={{
                      background: "oklch(0.1 0.02 260)",
                      border: "1px solid oklch(0.22 0.02 260)",
                      color: "oklch(0.9 0.01 260)",
                    }}
                  />
                  <Button
                    onClick={handleSendChat}
                    size="icon"
                    className="h-7 w-7 rounded-md"
                    style={{
                      background: "oklch(0.82 0.18 195)",
                      color: "oklch(0.1 0.02 195)",
                      border: "none",
                    }}
                  >
                    <Send size={10} />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Human player's hand */}
        <div
          className="relative z-10 px-4 py-3"
          style={{
            background: "oklch(0.1 0.02 260 / 0.9)",
            backdropFilter: "blur(8px)",
          }}
        >
          {/* Player info row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isHumanTurn ? "turn-glow" : ""}`}
                style={{ background: currentUser.avatarColor, color: "#fff" }}
              >
                {currentUser.username[0].toUpperCase()}
              </div>
              <div>
                <span
                  className="text-sm font-bold"
                  style={{ color: "oklch(0.9 0.01 260)" }}
                >
                  {currentUser.username}
                </span>
                <span
                  className="ml-2 text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "oklch(0.65 0.28 22 / 0.3)",
                    color: "oklch(0.65 0.28 22)",
                  }}
                >
                  {humanPlayer?.hand.length ?? 0} cards
                </span>
                {isHumanTurn && (
                  <span
                    className="ml-2 text-xs font-bold"
                    style={{ color: "oklch(0.82 0.18 195)" }}
                  >
                    YOUR TURN
                  </span>
                )}
              </div>
            </div>

            {/* UNO Button */}
            {showUnoButton && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={handleUnoCall}
                className="uno-button-glow px-6 py-2 rounded-full font-black text-lg font-display"
                style={{
                  background: "oklch(0.88 0.2 90)",
                  color: "oklch(0.1 0.02 90)",
                  letterSpacing: "2px",
                }}
              >
                UNO!{unoTimer !== null && ` (${unoTimer})`}
              </motion.button>
            )}
          </div>

          {/* Hand cards */}
          <div className="overflow-x-auto pb-1">
            <div className="flex gap-1 min-w-max px-2">
              {humanPlayer?.hand.map((card, i) => {
                const playable =
                  isHumanTurn &&
                  canPlayCard(
                    card,
                    topCard,
                    gameState.currentColor,
                    gameState.drawPending,
                  );
                return (
                  <GameCard
                    key={card.id}
                    card={card}
                    playable={playable}
                    onClick={
                      playable ? () => handleCardClick(card.id) : undefined
                    }
                    dealDelay={i * 0.05}
                    small
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Wild Color Picker Modal */}
      <AnimatePresence>
        {showWildPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center"
            style={{
              background: "oklch(0 0 0 / 0.8)",
              backdropFilter: "blur(4px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="rounded-2xl p-8 text-center"
              style={{
                background: "oklch(0.16 0.03 260)",
                border: "1px solid oklch(0.28 0.04 260)",
              }}
            >
              <h2
                className="text-2xl font-display font-black mb-6"
                style={{ color: "oklch(0.95 0.01 260)" }}
              >
                Choose a Color
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {WILD_COLORS.map((color) => (
                  <motion.button
                    key={color}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleWildColorPick(color)}
                    className="h-20 rounded-xl text-lg font-black font-display capitalize"
                    style={{
                      background: COLOR_BGSRC[color],
                      color: color === "yellow" ? "#1a0f00" : "#fff",
                    }}
                  >
                    {COLOR_LABELS[color]}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win/Lose Screen */}
      <AnimatePresence>
        {showWinScreen && gameState.status === "finished" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center"
            style={{
              background: "oklch(0 0 0 / 0.85)",
              backdropFilter: "blur(8px)",
            }}
          >
            {gameState.winnerId === currentUser.id && <Confetti />}

            <motion.div
              initial={{ scale: 0.5, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="rounded-3xl p-10 text-center max-w-sm w-full mx-4"
              style={{
                background: "oklch(0.16 0.03 260)",
                border: `2px solid ${gameState.winnerId === currentUser.id ? "oklch(0.88 0.2 90)" : "oklch(0.65 0.28 22)"}`,
                boxShadow:
                  gameState.winnerId === currentUser.id
                    ? "0 0 60px oklch(0.88 0.2 90 / 0.4)"
                    : "0 0 60px oklch(0.65 0.28 22 / 0.3)",
              }}
            >
              <div className="text-7xl mb-4">
                {gameState.winnerId === currentUser.id ? "🏆" : "💀"}
              </div>
              <h1
                className="text-4xl font-display font-black mb-2"
                style={{
                  color:
                    gameState.winnerId === currentUser.id
                      ? "oklch(0.88 0.2 90)"
                      : "oklch(0.65 0.28 22)",
                }}
              >
                {gameState.winnerId === currentUser.id
                  ? "YOU WIN!"
                  : "GAME OVER"}
              </h1>
              {gameState.winnerId !== currentUser.id && (
                <p
                  className="text-base mb-4"
                  style={{ color: "oklch(0.6 0.02 260)" }}
                >
                  {
                    gameState.players.find((p) => p.id === gameState.winnerId)
                      ?.username
                  }{" "}
                  wins
                </p>
              )}
              <p
                className="text-sm mb-8"
                style={{ color: "oklch(0.5 0.02 260)" }}
              >
                {turnCount} turns played · {gameState.players.length} players
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleLeaveGame}
                  className="h-12 font-bold rounded-xl text-base"
                  style={{
                    background: "oklch(0.82 0.18 195)",
                    color: "oklch(0.1 0.02 195)",
                    fontFamily: "Bricolage Grotesque, sans-serif",
                    border: "none",
                  }}
                >
                  Back to Dashboard
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getPositions(
  count: number,
): Array<{ containerStyle: React.CSSProperties }> {
  if (count === 1) {
    return [
      {
        containerStyle: {
          top: "8%",
          left: "50%",
          transform: "translateX(-50%)",
        },
      },
    ];
  }
  if (count === 2) {
    return [
      {
        containerStyle: {
          top: "8%",
          left: "25%",
          transform: "translateX(-50%)",
        },
      },
      {
        containerStyle: {
          top: "8%",
          left: "75%",
          transform: "translateX(-50%)",
        },
      },
    ];
  }
  if (count === 3) {
    return [
      {
        containerStyle: {
          top: "8%",
          left: "50%",
          transform: "translateX(-50%)",
        },
      },
      { containerStyle: { top: "30%", left: "6%", transform: "none" } },
      {
        containerStyle: {
          top: "30%",
          right: "6%",
          left: "auto",
          transform: "none",
        },
      },
    ];
  }
  if (count === 4) {
    return [
      {
        containerStyle: {
          top: "6%",
          left: "25%",
          transform: "translateX(-50%)",
        },
      },
      {
        containerStyle: {
          top: "6%",
          left: "75%",
          transform: "translateX(-50%)",
        },
      },
      { containerStyle: { top: "30%", left: "4%", transform: "none" } },
      {
        containerStyle: {
          top: "30%",
          right: "4%",
          left: "auto",
          transform: "none",
        },
      },
    ];
  }
  // 5
  return [
    {
      containerStyle: { top: "6%", left: "20%", transform: "translateX(-50%)" },
    },
    {
      containerStyle: { top: "6%", left: "50%", transform: "translateX(-50%)" },
    },
    {
      containerStyle: { top: "6%", left: "80%", transform: "translateX(-50%)" },
    },
    { containerStyle: { top: "32%", left: "4%", transform: "none" } },
    {
      containerStyle: {
        top: "32%",
        right: "4%",
        left: "auto",
        transform: "none",
      },
    },
  ];
}
