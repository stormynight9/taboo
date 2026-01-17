"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import MessageRenderer from "./chat/MessageRenderer";

interface GuessChatProps {
  roomId: Id<"rooms">;
  playerId: Id<"players">;
  canGuess: boolean;
  isGameFinished?: boolean;
}

export default function GuessChat({
  roomId,
  playerId,
  canGuess,
  isGameFinished = false,
}: GuessChatProps) {
  const [guess, setGuess] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Get guesses from current and previous round only (for bandwidth optimization)
  const guesses = useQuery(api.game.getAllGuesses, {
    roomId,
  });
  const submitGuess = useMutation(api.game.submitGuess);
  const submitChatMessage = useMutation(api.game.submitChatMessage);

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
    if (!guess.trim()) return;

    // If game is finished, allow everyone to chat
    const canSubmit = isGameFinished || canGuess;
    if (!canSubmit) return;

    try {
      if (isGameFinished) {
        await submitChatMessage({
          roomId,
          playerId,
          text: guess.trim(),
        });
      } else {
        await submitGuess({
          roomId,
          playerId,
          text: guess.trim(),
        });
      }
      setGuess("");
    } catch (err) {
      console.error("Failed to submit message:", err);
    }
  };

  return (
    <div className="game-card  ">
      <div className="p-3 border-b border-zinc-700">
        <h3 className="font-medium text-sm">
          {isGameFinished ? "💬 Chat" : "💬 Team Guesses"}
        </h3>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[300px] h-[300px]"
      >
        {!guesses || guesses.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            {isGameFinished
              ? "Start chatting..."
              : canGuess
              ? "Type your guesses below!"
              : "Watch the guesses here..."}
          </p>
        ) : (
          guesses.map((g) => (
            <MessageRenderer key={g._id} guess={g} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {isGameFinished || canGuess ? (
        <form onSubmit={handleSubmit} className="p-3 border-t border-zinc-700">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={isGameFinished ? "Type a message..." : "Type your guess..."}
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
