"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

interface GuessChatProps {
  roomId: Id<"rooms">;
  playerId: Id<"players">;
  canGuess: boolean;
}

// Generate a consistent color for a player based on their ID or name
function getPlayerColor(playerIdOrName: string): string {
  // Hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < playerIdOrName.length; i++) {
    hash = playerIdOrName.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Expanded palette of distinct colors that work well on dark backgrounds
  const colors = [
    "#EC4899", // pink-500
    "#3B82F6", // blue-500
    "#10B981", // emerald-500
    "#F59E0B", // amber-500
    "#8B5CF6", // violet-500
    "#EF4444", // red-500
    "#06B6D4", // cyan-500
    "#F97316", // orange-500
    "#14B8A6", // teal-500
    "#A855F7", // purple-500
    "#22C55E", // green-500
    "#EAB308", // yellow-500
    "#F43F5E", // rose-500
    "#6366F1", // indigo-500
    "#84CC16", // lime-500
    "#EC4899", // pink-500 (duplicate for more variety)
    "#06B6D4", // sky-500
    "#F97316", // orange-500
    "#8B5CF6", // violet-500
    "#10B981", // emerald-500
  ];

  // Use absolute value of hash to get index
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export default function GuessChat({
  roomId,
  playerId,
  canGuess,
}: GuessChatProps) {
  const [guess, setGuess] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Get all guesses from all rounds (not just current round)
  const guesses = useQuery(api.game.getAllGuesses, {
    roomId,
  });
  const submitGuess = useMutation(api.game.submitGuess);

  // Auto-scroll to bottom within the chat container (scrolls only the container, not the page)
  useEffect(() => {
    if (messagesContainerRef.current) {
      // Scroll the container itself, not the page
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
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
    <div className="game-card  ">
      <div className="p-3 border-b border-zinc-700">
        <h3 className="font-medium text-sm">💬 Team Guesses</h3>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[300px] h-[300px]"
      >
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
              g.text.includes("buzzed") ||
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
                {isLogMessage && g.text.includes("buzzed") ? (
                  <span className="text-gray-300 italic">
                    {(() => {
                      // Parse the taboo violation message to highlight words and player name
                      // Format: "🚨 {name} buzzed "{word}" - taboo: "{tabooWord}""
                      const match = g.text.match(
                        /(🚨 )([^ ]+)( buzzed ")([^"]+)(" - taboo: ")([^"]+)(".*)/
                      );
                      if (match) {
                        const [
                          ,
                          emoji,
                          playerName,
                          prefix,
                          word,
                          middle,
                          tabooWord,
                          suffix,
                        ] = match;
                        return (
                          <>
                            {emoji}
                            <span
                              className="font-medium"
                              style={{ color: getPlayerColor(g.playerId) }}
                            >
                              {playerName}
                            </span>
                            {prefix}
                            <span className="text-yellow-400 font-medium">
                              {word}
                            </span>
                            {middle}
                            <span className="text-red-400 font-medium">
                              {tabooWord}
                            </span>
                            {suffix}
                          </>
                        );
                      }
                      return g.text;
                    })()}
                  </span>
                ) : isLogMessage && g.text.includes("skipped") ? (
                  <span className="text-gray-300 italic">
                    {(() => {
                      // Parse the skip message to highlight player name
                      // Format: "⏭️ {name} skipped: "{word}""
                      const match = g.text.match(
                        /(⏭️ )([^ ]+)( skipped: ")([^"]+)(".*)/
                      );
                      if (match) {
                        const [, emoji, playerName, prefix, word, suffix] =
                          match;
                        return (
                          <>
                            {emoji}
                            <span
                              className="font-medium"
                              style={{ color: getPlayerColor(g.playerId) }}
                            >
                              {playerName}
                            </span>
                            {prefix}
                            <span className="text-yellow-400 font-medium">
                              {word}
                            </span>
                            {suffix}
                          </>
                        );
                      }
                      return g.text;
                    })()}
                  </span>
                ) : (
                  <>
                    {!isLogMessage && (
                      <span
                        className="font-medium shrink-0"
                        style={{ color: getPlayerColor(g.playerId) }}
                      >
                        {g.playerName}:
                      </span>
                    )}
                    <span
                      className={
                        g.isCorrect
                          ? "text-green-400 font-medium"
                          : isLogMessage
                          ? "text-gray-300 italic"
                          : "text-white"
                      }
                    >
                      {g.text}
                      {g.isCorrect && " ✓"}
                    </span>
                  </>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {canGuess ? (
        <form onSubmit={handleSubmit} className="p-3 border-t border-zinc-700">
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
        <div className="p-3 border-t border-zinc-700 text-center text-gray-500 text-sm mt-auto">
          Only the guessing team can submit answers
        </div>
      )}
    </div>
  );
}
