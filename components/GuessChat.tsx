"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

interface GuessChatProps {
  roomId: Id<"rooms">;
  playerId: Id<"players">;
  currentRound: number;
  canGuess: boolean;
}

export default function GuessChat({
  roomId,
  playerId,
  currentRound,
  canGuess,
}: GuessChatProps) {
  const [guess, setGuess] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const guesses = useQuery(api.game.getGuesses, {
    roomId,
    round: currentRound,
  });
  const submitGuess = useMutation(api.game.submitGuess);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [guesses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || !canGuess) return;

    try {
      await submitGuess({
        roomId,
        playerId,
        text: guess.trim(),
      });
      setGuess("");
    } catch (err) {
      console.error("Failed to submit guess:", err);
    }
  };

  return (
    <div className="game-card flex flex-col h-full">
      <div className="p-3 border-b border-[var(--card-border)]">
        <h3 className="font-semibold text-sm">💬 Team Guesses</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px] max-h-[300px]">
        {!guesses || guesses.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            {canGuess
              ? "Type your guesses below!"
              : "Watch the guesses here..."}
          </p>
        ) : (
          guesses.map((g) => {
            // Check for log messages (taboo buzzes and skips)
            const isLogMessage =
              g.text.includes("🚨") ||
              g.text.includes("⏭️") ||
              g.text.includes("buzzed for taboo") ||
              g.text.includes("skipped:");
            return (
              <div
                key={g._id}
                className={`flex items-start gap-2 animate-slide-up ${
                  g.isCorrect
                    ? "bg-green-500/10 -mx-3 px-3 py-1 rounded"
                    : isLogMessage
                    ? "bg-gray-700/50 -mx-3 px-3 py-1 rounded"
                    : ""
                }`}
              >
                {!isLogMessage && (
                  <span className="font-semibold text-pink-500 shrink-0">
                    {g.playerName}:
                  </span>
                )}
                <span
                  className={
                    g.isCorrect
                      ? "text-green-400 font-semibold"
                      : isLogMessage
                      ? "text-gray-300 italic"
                      : "text-white"
                  }
                >
                  {g.text}
                  {g.isCorrect && " ✓"}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {canGuess ? (
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-[var(--card-border)]"
        >
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type your guess..."
              className="game-input flex-1 py-2 px-3 text-sm"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              autoComplete="off"
            />
            <Button type="submit" disabled={!guess.trim()} variant="default">
              Send
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-3 border-t border-[var(--card-border)] text-center text-gray-500 text-sm mt-auto">
          Only the guessing team can submit answers
        </div>
      )}
    </div>
  );
}
