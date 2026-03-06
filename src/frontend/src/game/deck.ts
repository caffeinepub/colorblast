import type { Card, CardColor, CardValue } from "./types";

let cardIdCounter = 0;

function makeCard(color: CardColor, value: CardValue): Card {
  return { id: cardIdCounter++, color, value };
}

export function createDeck(): Card[] {
  cardIdCounter = 0;
  const colors: Exclude<CardColor, "wild">[] = [
    "red",
    "blue",
    "green",
    "yellow",
  ];
  const deck: Card[] = [];

  for (const color of colors) {
    // 0 appears once
    deck.push(makeCard(color, "0"));

    // 1-9 appear twice
    for (let n = 1; n <= 9; n++) {
      deck.push(makeCard(color, String(n) as CardValue));
      deck.push(makeCard(color, String(n) as CardValue));
    }

    // Action cards x2 each
    const actions: CardValue[] = ["skip", "reverse", "draw2"];
    for (const action of actions) {
      deck.push(makeCard(color, action));
      deck.push(makeCard(color, action));
    }
  }

  // Wild cards x4
  for (let i = 0; i < 4; i++) {
    deck.push(makeCard("wild", "wild"));
    deck.push(makeCard("wild", "wildDraw4"));
  }

  return shuffle(deck);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function canPlayCard(
  card: Card,
  topCard: Card,
  currentColor: CardColor,
  drawPending: number,
): boolean {
  // If draw is pending, only draw cards of same type can be stacked
  if (drawPending > 0) {
    if (topCard.value === "draw2") {
      return card.value === "draw2";
    }
    if (topCard.value === "wildDraw4") {
      return card.value === "wildDraw4";
    }
    return false;
  }

  if (card.color === "wild") return true;
  if (card.color === currentColor) return true;
  if (card.value === topCard.value) return true;
  return false;
}

export function getCardPoints(card: Card): number {
  if (card.color === "wild") return 50;
  if (["skip", "reverse", "draw2"].includes(card.value)) return 20;
  return Number(card.value) || 0;
}
