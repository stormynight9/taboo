"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

interface WordCardProps {
  word: string;
  tabooWords: string[];
  showWord: boolean;
  roomId?: Id<"rooms">;
  playerId?: Id<"players">;
  canBuzz?: boolean;
}

export default function WordCard({
  word,
  tabooWords,
  showWord,
  roomId,
  playerId,
  canBuzz = false,
}: WordCardProps) {
  const [clickedTabooWord, setClickedTabooWord] = useState<string | null>(null);
  const buzzTaboo = useMutation(api.game.buzzTaboo);

  const handleTabooWordClick = async (tabooWord: string) => {
    if (!canBuzz || !roomId || !playerId || clickedTabooWord !== null) return;

    setClickedTabooWord(tabooWord);
    try {
      await buzzTaboo({ roomId, playerId, tabooWord });
    } catch (err) {
      console.error("Failed to buzz:", err);
    }

    // Reset after animation
    setTimeout(() => setClickedTabooWord(null), 500);
  };
  if (!showWord) {
    return (
      <div className="game-card p-6 md:p-8 text-center">
        <div className="text-6xl mb-4">🤫</div>
        <p className="text-gray-400 text-lg">Wait for your team to guess!</p>
      </div>
    );
  }

  return (
    <div className="game-card overflow-hidden animate-slide-up">
      {/* Main Word */}
      <div className="p-6 md:p-8 text-center border-b border-zinc-700">
        <p className="text-xs uppercase tracking-wider text-white opacity-75 mb-2">
          Describe this word
        </p>
        <h2 className="text-3xl md:text-4xl font-semibold text-white">
          {word}
        </h2>
      </div>

      {/* Taboo Words */}
      <div className="p-4 md:p-6">
        <p className="text-xs uppercase tracking-wider text-red-400 mb-3 text-center">
          {canBuzz
            ? "🚨 Click to buzz if they say these words"
            : "⛔ Don't say these words"}
        </p>
        <div className="space-y-2">
          {tabooWords.map((tabooWord, index) => {
            const isClicked = clickedTabooWord === tabooWord;
            const isClickable = canBuzz && !clickedTabooWord;

            return (
              <div
                key={index}
                onClick={() => handleTabooWordClick(tabooWord)}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg border transition-all ${
                  isClickable
                    ? "cursor-pointer border-red-500/50 hover:border-red-500 hover:bg-red-500/10 active:scale-95"
                    : isClicked
                    ? "border-red-500 bg-red-500/20 scale-95"
                    : "border-red-500/50"
                }`}
              >
                <span className="text-red-400 font-semibold">
                  {isClicked ? (
                    <span className="flex items-center gap-1">
                      <span className="animate-ping inline-block w-2 h-2 rounded-full bg-red-400" />
                      🚨
                    </span>
                  ) : (
                    "✕"
                  )}
                </span>
                <span className="font-medium text-white">{tabooWord}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
