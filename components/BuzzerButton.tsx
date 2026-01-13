"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

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
    <Button
      onClick={handleBuzz}
      disabled={!canBuzz || isPressed}
      variant="destructive"
      size="lg"
      className={`w-full uppercase tracking-wider ${
        isPressed ? "scale-95" : ""
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
    </Button>
  );
}
