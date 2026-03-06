import type { GameState, Room, UserProfile } from "./types";

const KEYS = {
  USER: "colorblast_user",
  USERS: "colorblast_users",
  ROOMS: "colorblast_rooms",
  CURRENT_GAME: "colorblast_current_game",
  DARK_MODE: "colorblast_dark_mode",
} as const;

export function saveUser(user: UserProfile): void {
  localStorage.setItem(KEYS.USER, JSON.stringify(user));
  // Also update in users list
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    users[idx] = user;
  } else {
    users.push(user);
  }
  saveUsers(users);
}

export function loadUser(): UserProfile | null {
  const raw = localStorage.getItem(KEYS.USER);
  return raw ? (JSON.parse(raw) as UserProfile) : null;
}

export function logoutUser(): void {
  localStorage.removeItem(KEYS.USER);
}

export function loadUsers(): UserProfile[] {
  const raw = localStorage.getItem(KEYS.USERS);
  return raw ? (JSON.parse(raw) as UserProfile[]) : [];
}

export function saveUsers(users: UserProfile[]): void {
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
}

export function findUserByUsername(username: string): UserProfile | null {
  const users = loadUsers();
  return (
    users.find((u) => u.username.toLowerCase() === username.toLowerCase()) ??
    null
  );
}

export function saveRoom(room: Room): void {
  const rooms = loadRooms();
  const idx = rooms.findIndex((r) => r.id === room.id);
  if (idx >= 0) {
    rooms[idx] = room;
  } else {
    rooms.push(room);
  }
  localStorage.setItem(KEYS.ROOMS, JSON.stringify(rooms));
}

export function loadRooms(): Room[] {
  const raw = localStorage.getItem(KEYS.ROOMS);
  return raw ? (JSON.parse(raw) as Room[]) : [];
}

export function loadRoom(roomId: string): Room | null {
  const rooms = loadRooms();
  return rooms.find((r) => r.id === roomId) ?? null;
}

export function loadRoomByCode(code: string): Room | null {
  const rooms = loadRooms();
  return rooms.find((r) => r.code === code.toUpperCase()) ?? null;
}

export function saveGameState(state: GameState): void {
  localStorage.setItem(KEYS.CURRENT_GAME, JSON.stringify(state));
}

export function loadGameState(): GameState | null {
  const raw = localStorage.getItem(KEYS.CURRENT_GAME);
  return raw ? (JSON.parse(raw) as GameState) : null;
}

export function clearGameState(): void {
  localStorage.removeItem(KEYS.CURRENT_GAME);
}

export function saveDarkMode(enabled: boolean): void {
  localStorage.setItem(KEYS.DARK_MODE, JSON.stringify(enabled));
}

export function loadDarkMode(): boolean {
  const raw = localStorage.getItem(KEYS.DARK_MODE);
  return raw !== null ? (JSON.parse(raw) as boolean) : true; // default dark
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

export function hashPassword(password: string): string {
  // Simple hash for demo — not cryptographically secure
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Seed leaderboard with demo users
export function ensureSeedUsers(): void {
  const users = loadUsers();
  if (users.length >= 5) return;

  const demoUsers: UserProfile[] = [
    {
      id: "bot_ace",
      username: "AceBlaster",
      passwordHash: "",
      avatarColor: "#ff4d4d",
      wins: 42,
      losses: 18,
      gamesPlayed: 60,
      gameHistory: [],
    },
    {
      id: "bot_nova",
      username: "NovaStar",
      passwordHash: "",
      avatarColor: "#4d94ff",
      wins: 38,
      losses: 22,
      gamesPlayed: 60,
      gameHistory: [],
    },
    {
      id: "bot_jade",
      username: "JadeStrike",
      passwordHash: "",
      avatarColor: "#4dff88",
      wins: 31,
      losses: 29,
      gamesPlayed: 60,
      gameHistory: [],
    },
    {
      id: "bot_sunny",
      username: "SunnySide",
      passwordHash: "",
      avatarColor: "#ffd24d",
      wins: 27,
      losses: 33,
      gamesPlayed: 60,
      gameHistory: [],
    },
    {
      id: "bot_vex",
      username: "VexMaster",
      passwordHash: "",
      avatarColor: "#d44dff",
      wins: 22,
      losses: 38,
      gamesPlayed: 60,
      gameHistory: [],
    },
    {
      id: "bot_thunder",
      username: "ThunderBolt",
      passwordHash: "",
      avatarColor: "#ff8c4d",
      wins: 19,
      losses: 26,
      gamesPlayed: 45,
      gameHistory: [],
    },
    {
      id: "bot_frost",
      username: "FrostByte",
      passwordHash: "",
      avatarColor: "#4dfff2",
      wins: 15,
      losses: 20,
      gamesPlayed: 35,
      gameHistory: [],
    },
    {
      id: "bot_blaze",
      username: "BlazeMaster",
      passwordHash: "",
      avatarColor: "#ff4da6",
      wins: 11,
      losses: 14,
      gamesPlayed: 25,
      gameHistory: [],
    },
  ];

  const existingIds = new Set(users.map((u) => u.id));
  const toAdd = demoUsers.filter((u) => !existingIds.has(u.id));
  saveUsers([...users, ...toAdd]);
}
