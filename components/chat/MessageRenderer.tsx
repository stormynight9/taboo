"use client";

import { Doc } from "../../convex/_generated/dataModel";
import { parseMessage } from "../../lib/messageParsing";
import { getPlayerColor } from "../../lib/playerColors";

interface MessageRendererProps {
  guess: Doc<"guesses">;
}

export default function MessageRenderer({ guess }: MessageRendererProps) {
  const parsed = parseMessage(guess, getPlayerColor);

  const content = (
    <>
      {parsed.parts.map((part, index) => {
        if (part.type === "text") {
          return (
            <span key={index} className={part.className}>
              {part.content}
            </span>
          );
        }
        if (part.type === "playerName") {
          return (
            <span
              key={index}
              className={part.className}
              style={part.style}
            >
              {part.content}
            </span>
          );
        }
        if (part.type === "word") {
          return (
            <span key={index} className={part.className}>
              {part.content}
            </span>
          );
        }
        if (part.type === "tabooWord") {
          return (
            <span key={index} className={part.className}>
              {part.content}
            </span>
          );
        }
        return <span key={index}>{part.content}</span>;
      })}
    </>
  );

  const isWinner = parsed.messageType === "winner";

  return (
    <div
      className={`flex items-start gap-2 animate-slide-up ${
        parsed.className || ""
      } ${isWinner ? "justify-center" : ""}`}
    >
      {parsed.isLogMessage ? (
        <span className="text-gray-300 italic">{content}</span>
      ) : isWinner ? (
        <div className="w-full text-center">{content}</div>
      ) : (
        content
      )}
    </div>
  );
}
