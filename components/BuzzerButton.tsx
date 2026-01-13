"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

interface BuzzerButtonProps {
  roomId: Id<"rooms">;
  playerId: Id<"players">;
  canBuzz: boolean;
}

export default function BuzzerButton({
  roomId,
  playerId,
  canBuzz,
}: BuzzerButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const buzzTaboo = useMutation(api.game.buzzTaboo);

  const handleBuzz = async () => {
    if (!canBuzz || isPressed) return;

    setIsPressed(true);
    try {
      await buzzTaboo({ roomId, playerId });
    } catch (err) {
      console.error("Failed to buzz:", err);
    }

    // Reset after animation
    setTimeout(() => setIsPressed(false), 500);
  };

  return (
    <button
      onClick={handleBuzz}
      disabled={!canBuzz || isPressed}
      className={`w-full py-6 rounded-xl font-bold text-xl uppercase tracking-wider transition-all text-white ${
        canBuzz
          ? isPressed
            ? "bg-red-600 scale-95"
            : "bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95"
          : "bg-gray-600 opacity-50 cursor-not-allowed"
      }`}
    >
      {isPressed ? (
        <span className="flex items-center justify-center gap-2">
          <span className="animate-ping inline-block w-3 h-3 rounded-full bg-white" />
          BUZZED!
        </span>
      ) : (
        <>🚨 TABOO!</>
      )}
    </button>
  );
}
