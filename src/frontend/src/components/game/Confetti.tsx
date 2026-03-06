import { useEffect, useState } from "react";

interface Piece {
  id: number;
  x: number;
  color: string;
  size: number;
  duration: number;
  delay: number;
  rotation: number;
}

const COLORS = [
  "oklch(0.65 0.28 22)",
  "oklch(0.62 0.22 255)",
  "oklch(0.72 0.22 140)",
  "oklch(0.88 0.2 90)",
  "oklch(0.75 0.25 340)",
  "oklch(0.82 0.18 195)",
];

export function Confetti() {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    const newPieces: Piece[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 8 + Math.random() * 10,
      duration: 2 + Math.random() * 2,
      delay: Math.random() * 1.5,
      rotation: Math.random() * 360,
    }));
    setPieces(newPieces);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[60]">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          style={{
            position: "absolute",
            left: `${piece.x}%`,
            top: -20,
            width: piece.size,
            height: piece.size * 0.6,
            background: piece.color,
            borderRadius: 2,
            transform: `rotate(${piece.rotation}deg)`,
            animation: `confetti-fall ${piece.duration}s ${piece.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}
