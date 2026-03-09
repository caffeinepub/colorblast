export type CardColor = "red" | "blue" | "green" | "yellow" | "wild";
export type CardValue =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "skip"
  | "reverse"
  | "draw2"
  | "wild"
  | "wildDraw4";

export interface Card {
  id: number;
  color: CardColor;
  value: CardValue;
}

export interface Player {
  id: string;
  username: string;
  avatarColor: string;
  hand: Card[];
  isBot: boolean;
  hasCalledUno: boolean;
  isCurrentTurn: boolean;
}

export interface GameState {
  id: string;
  players: Player[];
  deck: Card[];
  discardPile: Card[];
  currentPlayerIndex: number;
  direction: "cw" | "ccw";
  currentColor: CardColor;
  status: "waiting" | "active" | "finished";
  winnerId: string | null;
  drawPending: number;
  unoCallRequired: string | null;
  lastActionTime: number;
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  maxPlayers: number;
  privacy: "public" | "private";
  status: "waiting" | "playing" | "finished";
  players: RoomPlayer[];
  createdAt: number;
  lastActiveAt: number;
  gameId: string | null;
}

export interface RoomPlayer {
  id: string;
  username: string;
  avatarColor: string;
  isHost: boolean;
  isBot: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  passwordHash: string;
  avatarColor: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  gameHistory: GameHistoryEntry[];
}

export interface GameHistoryEntry {
  gameId: string;
  date: number;
  result: "win" | "loss";
  players: number;
  turnsPlayed: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: "chat" | "system";
}
