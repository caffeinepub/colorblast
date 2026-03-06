import { motion } from "motion/react";
import type { Card, CardColor } from "../../game/types";

interface GameCardProps {
  card?: Card;
  faceDown?: boolean;
  playable?: boolean;
  selected?: boolean;
  small?: boolean;
  mini?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
  dealDelay?: number;
}

const COLOR_STYLES: Record<
  CardColor,
  { bg: string; text: string; border: string; glow: string }
> = {
  red: {
    bg: "linear-gradient(135deg, oklch(0.65 0.28 22), oklch(0.5 0.25 15))",
    text: "#fff",
    border: "oklch(0.75 0.3 22)",
    glow: "0 0 15px oklch(0.65 0.28 22 / 0.6), 0 4px 12px oklch(0 0 0 / 0.5)",
  },
  blue: {
    bg: "linear-gradient(135deg, oklch(0.62 0.22 255), oklch(0.45 0.2 250))",
    text: "#fff",
    border: "oklch(0.72 0.24 255)",
    glow: "0 0 15px oklch(0.62 0.22 255 / 0.6), 0 4px 12px oklch(0 0 0 / 0.5)",
  },
  green: {
    bg: "linear-gradient(135deg, oklch(0.65 0.22 140), oklch(0.5 0.2 135))",
    text: "#fff",
    border: "oklch(0.75 0.24 140)",
    glow: "0 0 15px oklch(0.65 0.22 140 / 0.6), 0 4px 12px oklch(0 0 0 / 0.5)",
  },
  yellow: {
    bg: "linear-gradient(135deg, oklch(0.88 0.2 90), oklch(0.78 0.18 85))",
    text: "#1a0f00",
    border: "oklch(0.92 0.18 90)",
    glow: "0 0 15px oklch(0.88 0.2 90 / 0.6), 0 4px 12px oklch(0 0 0 / 0.5)",
  },
  wild: {
    bg: "linear-gradient(135deg, oklch(0.65 0.28 22) 0%, oklch(0.62 0.22 255) 33%, oklch(0.65 0.22 140) 66%, oklch(0.88 0.2 90) 100%)",
    text: "#fff",
    border: "oklch(0.75 0.25 340)",
    glow: "0 0 15px oklch(0.75 0.25 340 / 0.6), 0 4px 12px oklch(0 0 0 / 0.5)",
  },
};

const VALUE_LABELS: Record<string, string> = {
  skip: "⊘",
  reverse: "↺",
  draw2: "+2",
  wild: "★",
  wildDraw4: "+4",
};

function getCardLabel(card: Card): { symbol: string; isAction: boolean } {
  if (["skip", "reverse", "draw2", "wild", "wildDraw4"].includes(card.value)) {
    return { symbol: VALUE_LABELS[card.value] ?? card.value, isAction: true };
  }
  return { symbol: card.value, isAction: false };
}

export function GameCard({
  card,
  faceDown = false,
  playable = true,
  selected = false,
  small = false,
  mini = false,
  onClick,
  style,
  className = "",
  dealDelay = 0,
}: GameCardProps) {
  if (mini) {
    return (
      <div
        style={{
          width: 28,
          height: 40,
          borderRadius: 4,
          background: faceDown
            ? "linear-gradient(135deg, oklch(0.18 0.05 260), oklch(0.25 0.06 260))"
            : card
              ? COLOR_STYLES[card.color].bg
              : "linear-gradient(135deg, oklch(0.18 0.05 260), oklch(0.25 0.06 260))",
          border: `1px solid ${faceDown ? "oklch(0.35 0.05 260)" : card ? COLOR_STYLES[card.color].border : "oklch(0.35 0.05 260)"}`,
          ...style,
        }}
        className={className}
      />
    );
  }

  const w = small ? 56 : 80;
  const h = small ? 80 : 112;
  const fontSize = small ? 14 : 20;
  const actionFontSize = small ? 18 : 28;

  if (faceDown) {
    return (
      <motion.div
        initial={
          dealDelay > 0 ? { opacity: 0, scale: 0.7, rotate: -15 } : false
        }
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{
          delay: dealDelay,
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
        style={{
          width: w,
          height: h,
          borderRadius: 8,
          background:
            "linear-gradient(135deg, oklch(0.2 0.06 260), oklch(0.15 0.04 260))",
          border: "2px solid oklch(0.35 0.08 260)",
          boxShadow: "0 4px 12px oklch(0 0 0 / 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...style,
        }}
        className={className}
      >
        <div
          style={{
            width: w - 12,
            height: h - 12,
            borderRadius: 6,
            background:
              "repeating-linear-gradient(45deg, oklch(0.25 0.06 260), oklch(0.25 0.06 260) 4px, oklch(0.22 0.05 260) 4px, oklch(0.22 0.05 260) 8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: small ? 16 : 22,
            fontWeight: 900,
            color: "oklch(0.82 0.18 195)",
            fontFamily: "Bricolage Grotesque, sans-serif",
          }}
        >
          CB
        </div>
      </motion.div>
    );
  }

  if (!card) return null;

  const styles = COLOR_STYLES[card.color];
  const { symbol, isAction } = getCardLabel(card);

  return (
    <motion.div
      initial={dealDelay > 0 ? { opacity: 0, scale: 0.7, y: -20 } : false}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay: dealDelay,
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
      whileHover={
        onClick && playable
          ? { y: -12, scale: 1.08, transition: { duration: 0.15 } }
          : undefined
      }
      onClick={onClick}
      style={{
        width: w,
        height: h,
        borderRadius: 10,
        background: styles.bg,
        border: `2px solid ${styles.border}`,
        boxShadow:
          selected || (onClick && playable)
            ? styles.glow
            : "0 3px 8px oklch(0 0 0 / 0.5)",
        cursor: onClick && playable ? "pointer" : "default",
        opacity: playable ? 1 : 0.45,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: small ? "4px 3px" : "6px 5px",
        userSelect: "none",
        position: "relative",
        transform: selected ? "translateY(-10px)" : undefined,
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        ...style,
      }}
      className={className}
    >
      {/* Top-left value */}
      <div
        style={{
          alignSelf: "flex-start",
          fontSize,
          fontWeight: 900,
          color: styles.text,
          lineHeight: 1,
          fontFamily: "Bricolage Grotesque, sans-serif",
          textShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
      >
        {isAction ? symbol : symbol}
      </div>

      {/* Center symbol */}
      <div
        style={{
          fontSize: isAction ? actionFontSize : actionFontSize + 4,
          fontWeight: 900,
          color: styles.text,
          textAlign: "center",
          lineHeight: 1,
          fontFamily: "Bricolage Grotesque, sans-serif",
          textShadow: "0 2px 6px rgba(0,0,0,0.4)",
          letterSpacing: isAction ? "0px" : "-1px",
        }}
      >
        {isAction ? symbol : symbol}
      </div>

      {/* Bottom-right value (rotated) */}
      <div
        style={{
          alignSelf: "flex-end",
          fontSize,
          fontWeight: 900,
          color: styles.text,
          lineHeight: 1,
          fontFamily: "Bricolage Grotesque, sans-serif",
          textShadow: "0 1px 3px rgba(0,0,0,0.3)",
          transform: "rotate(180deg)",
        }}
      >
        {symbol}
      </div>

      {/* Inner oval overlay */}
      <div
        style={{
          position: "absolute",
          inset: small ? "8px 5px" : "10px 6px",
          borderRadius: "50%",
          border: "1.5px solid rgba(255,255,255,0.25)",
          pointerEvents: "none",
        }}
      />
    </motion.div>
  );
}
