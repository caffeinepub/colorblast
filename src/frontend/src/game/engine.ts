import { canPlayCard, createDeck, shuffle } from "./deck";
import type { Card, CardColor, GameState, Player } from "./types";

export function createInitialGameState(
  players: Player[],
  gameId: string,
): GameState {
  const deck = createDeck();
  const hands: Card[][] = players.map(() => []);

  // Deal 7 cards to each player
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < players.length; j++) {
      const card = deck.pop();
      if (card) hands[j].push(card);
    }
  }

  // Find first non-wild discard pile starter
  let topCard: Card | undefined;
  let deckCopy = [...deck];
  while (!topCard || topCard.color === "wild") {
    const idx = deckCopy.findIndex((c) => c.color !== "wild");
    if (idx === -1) {
      deckCopy = shuffle(deckCopy);
      continue;
    }
    topCard = deckCopy.splice(idx, 1)[0];
  }

  const initializedPlayers = players.map((p, i) => ({
    ...p,
    hand: hands[i],
    isCurrentTurn: i === 0,
    hasCalledUno: false,
  }));

  return {
    id: gameId,
    players: initializedPlayers,
    deck: deckCopy,
    discardPile: [topCard],
    currentPlayerIndex: 0,
    direction: "cw",
    currentColor: topCard.color as CardColor,
    status: "active",
    winnerId: null,
    drawPending: 0,
    unoCallRequired: null,
    lastActionTime: Date.now(),
  };
}

export function applyCardEffect(
  state: GameState,
  card: Card,
  chosenColor?: CardColor,
): GameState {
  let { direction, currentPlayerIndex, drawPending, currentColor } = state;
  const players = state.players.map((p) => ({ ...p }));
  const playerCount = players.length;

  // Update color
  currentColor = card.color === "wild" ? (chosenColor ?? "red") : card.color;

  function nextIndex(from: number, skip = 0): number {
    const step = direction === "cw" ? 1 : -1;
    return (
      (((from + step * (1 + skip)) % playerCount) + playerCount) % playerCount
    );
  }

  switch (card.value) {
    case "skip":
      currentPlayerIndex = nextIndex(currentPlayerIndex, 1);
      break;
    case "reverse":
      direction = direction === "cw" ? "ccw" : "cw";
      // In 2-player, reverse acts like skip
      if (playerCount === 2) {
        currentPlayerIndex = nextIndex(currentPlayerIndex);
      } else {
        currentPlayerIndex = nextIndex(currentPlayerIndex);
      }
      break;
    case "draw2":
      drawPending += 2;
      currentPlayerIndex = nextIndex(currentPlayerIndex);
      break;
    case "wildDraw4":
      drawPending += 4;
      currentPlayerIndex = nextIndex(currentPlayerIndex);
      break;
    case "wild":
      currentPlayerIndex = nextIndex(currentPlayerIndex);
      break;
    default:
      currentPlayerIndex = nextIndex(currentPlayerIndex);
  }

  // Update isCurrentTurn
  const updatedPlayers = players.map((p, i) => ({
    ...p,
    isCurrentTurn: i === currentPlayerIndex,
  }));

  return {
    ...state,
    direction,
    currentPlayerIndex,
    currentColor,
    drawPending,
    players: updatedPlayers,
    lastActionTime: Date.now(),
  };
}

export function playCard(
  state: GameState,
  playerIndex: number,
  cardId: number,
  chosenColor?: CardColor,
): GameState | null {
  const player = state.players[playerIndex];
  if (!player) return null;
  if (state.currentPlayerIndex !== playerIndex) return null;

  const cardIdx = player.hand.findIndex((c) => c.id === cardId);
  if (cardIdx === -1) return null;

  const card = player.hand[cardIdx];
  const topCard = state.discardPile[state.discardPile.length - 1];

  if (!canPlayCard(card, topCard, state.currentColor, state.drawPending))
    return null;

  // Remove card from hand
  const newHand = [...player.hand];
  newHand.splice(cardIdx, 1);

  const updatedPlayers = state.players.map((p, i) =>
    i === playerIndex
      ? {
          ...p,
          hand: newHand,
          hasCalledUno: newHand.length === 1 ? p.hasCalledUno : false,
        }
      : p,
  );

  const newDiscardPile = [...state.discardPile, card];
  let newState: GameState = {
    ...state,
    players: updatedPlayers,
    discardPile: newDiscardPile,
    lastActionTime: Date.now(),
  };

  // Check win condition
  if (newHand.length === 0) {
    return {
      ...newState,
      status: "finished",
      winnerId: player.id,
      players: newState.players.map((p) => ({
        ...p,
        isCurrentTurn: false,
      })),
    };
  }

  // Apply card effects
  newState = applyCardEffect(newState, card, chosenColor);

  // Check UNO requirement
  if (newHand.length === 1 && !updatedPlayers[playerIndex].hasCalledUno) {
    newState = { ...newState, unoCallRequired: player.id };
  }

  return newState;
}

export function drawCards(state: GameState, playerIndex: number): GameState {
  const drawCount = state.drawPending > 0 ? state.drawPending : 1;
  let deck = [...state.deck];
  let discardPile = [...state.discardPile];

  // Reshuffle if needed
  if (deck.length < drawCount) {
    const topCard = discardPile[discardPile.length - 1];
    const reshuffled = shuffle(discardPile.slice(0, -1));
    deck = [...deck, ...reshuffled];
    discardPile = [topCard];
  }

  const drawnCards = deck.splice(deck.length - drawCount);
  const updatedPlayers = state.players.map((p, i) =>
    i === playerIndex ? { ...p, hand: [...p.hand, ...drawnCards] } : p,
  );

  const playerCount = updatedPlayers.length;
  const step = state.direction === "cw" ? 1 : -1;
  const nextPlayerIndex =
    state.drawPending > 0
      ? state.currentPlayerIndex
      : (((state.currentPlayerIndex + step) % playerCount) + playerCount) %
        playerCount;

  const finalPlayers = updatedPlayers.map((p, i) => ({
    ...p,
    isCurrentTurn: i === nextPlayerIndex,
  }));

  return {
    ...state,
    deck,
    discardPile,
    players: finalPlayers,
    currentPlayerIndex: nextPlayerIndex,
    drawPending: 0,
    lastActionTime: Date.now(),
  };
}

export function callUno(state: GameState, playerId: string): GameState {
  const updatedPlayers = state.players.map((p) =>
    p.id === playerId ? { ...p, hasCalledUno: true } : p,
  );
  return {
    ...state,
    players: updatedPlayers,
    unoCallRequired: null,
  };
}

export function penalizeUnoMiss(state: GameState, playerId: string): GameState {
  const playerIdx = state.players.findIndex((p) => p.id === playerId);
  if (playerIdx === -1) return state;

  let deck = [...state.deck];
  let discardPile = [...state.discardPile];

  if (deck.length < 2) {
    const topCard = discardPile[discardPile.length - 1];
    const reshuffled = shuffle(discardPile.slice(0, -1));
    deck = [...deck, ...reshuffled];
    discardPile = [topCard];
  }

  const drawnCards = deck.splice(deck.length - 2);
  const updatedPlayers = state.players.map((p, i) =>
    i === playerIdx ? { ...p, hand: [...p.hand, ...drawnCards] } : p,
  );

  return {
    ...state,
    deck,
    discardPile,
    players: updatedPlayers,
    unoCallRequired: null,
  };
}

export function getBotMove(
  state: GameState,
  botIndex: number,
):
  | { type: "play"; cardId: number; chosenColor?: CardColor }
  | { type: "draw" } {
  const bot = state.players[botIndex];
  const topCard = state.discardPile[state.discardPile.length - 1];

  const playableCards = bot.hand.filter((c) =>
    canPlayCard(c, topCard, state.currentColor, state.drawPending),
  );

  if (playableCards.length === 0) {
    return { type: "draw" };
  }

  // Prefer action/wild cards, then highest number
  const actionCards = playableCards.filter((c) =>
    ["skip", "reverse", "draw2", "wild", "wildDraw4"].includes(c.value),
  );
  const numberCards = playableCards.filter((c) => !actionCards.includes(c));

  let chosenCard: Card;
  if (actionCards.length > 0) {
    chosenCard = actionCards[Math.floor(Math.random() * actionCards.length)];
  } else {
    chosenCard = numberCards.sort(
      (a, b) => Number(b.value) - Number(a.value),
    )[0];
  }

  // Choose color for wild cards
  let chosenColor: CardColor | undefined;
  if (chosenCard.color === "wild") {
    // Pick the color the bot has most of
    const colorCounts: Record<string, number> = {
      red: 0,
      blue: 0,
      green: 0,
      yellow: 0,
    };
    for (const c of bot.hand) {
      if (c.color !== "wild" && colorCounts[c.color] !== undefined) {
        colorCounts[c.color]++;
      }
    }
    chosenColor =
      (Object.entries(colorCounts).sort(
        (a, b) => b[1] - a[1],
      )[0][0] as CardColor) ?? "red";
  }

  return { type: "play", cardId: chosenCard.id, chosenColor };
}
