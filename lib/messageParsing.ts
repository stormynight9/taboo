import { Doc } from "../convex/_generated/dataModel";

/**
 * Message parsing and formatting utilities for chat messages
 */

export interface ParsedMessagePart {
  type: "text" | "playerName" | "word" | "tabooWord";
  content: string;
  className?: string;
  style?: React.CSSProperties;
}

export interface ParsedMessage {
  isLogMessage: boolean;
  messageType: "buzzed" | "skipped" | "turnEnded" | "regular" | "correct" | "winner";
  parts: ParsedMessagePart[];
  className?: string;
}

/**
 * Check if a message is a log message (system message)
 */
export function isLogMessage(text: string): boolean {
  return (
    text.includes("🚨") ||
    text.includes("⏭️") ||
    text.includes("📋") ||
    text.includes("buzzed") ||
    text.includes("skipped") ||
    text.includes("Turn ended")
  );
}

/**
 * Check if a message is a winner announcement
 */
export function isWinnerMessage(text: string): boolean {
  return text.includes("🏆") && (text.includes("Wins!") || text.includes("Tie!"));
}

/**
 * Parse a buzzed message
 * Format: "🚨 {name} buzzed "{word}" - taboo: "{tabooWord}""
 */
function parseBuzzedMessage(
  text: string,
  playerId: string,
  playerColor: string
): ParsedMessagePart[] {
  const match = text.match(
    /(🚨 )(.+?)( buzzed ")([^"]+)(" - taboo: ")([^"]+)(".*)/
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
    return [
      { type: "text", content: emoji },
      {
        type: "playerName",
        content: playerName,
        className: "font-medium",
        style: { color: playerColor },
      },
      { type: "text", content: prefix },
      {
        type: "word",
        content: word,
        className: "text-yellow-400 font-medium",
      },
      { type: "text", content: middle },
      {
        type: "tabooWord",
        content: tabooWord,
        className: "text-red-400 font-medium",
      },
      { type: "text", content: suffix },
    ];
  }
  return [{ type: "text", content: text }];
}

/**
 * Parse a skipped message
 * Format: "⏭️ {name} skipped: "{word}""
 */
function parseSkippedMessage(
  text: string,
  playerId: string,
  playerColor: string
): ParsedMessagePart[] {
  const match = text.match(/(⏭️ )([^ ]+)( skipped: ")([^"]+)(".*)/);
  if (match) {
    const [, emoji, playerName, prefix, word, suffix] = match;
    return [
      { type: "text", content: emoji },
      {
        type: "playerName",
        content: playerName,
        className: "font-medium",
        style: { color: playerColor },
      },
      { type: "text", content: prefix },
      {
        type: "word",
        content: word,
        className: "text-yellow-400 font-medium",
      },
      { type: "text", content: suffix },
    ];
  }
  return [{ type: "text", content: text }];
}

/**
 * Parse a turn ended message
 * Format: "📋 Turn ended. Last word: "[word]""
 */
function parseTurnEndedMessage(text: string): ParsedMessagePart[] {
  const match = text.match(/(📋 Turn ended\. Last word: ")([^"]+)(".*)/);
  if (match) {
    const [, prefix, word, suffix] = match;
    return [
      { type: "text", content: prefix },
      {
        type: "word",
        content: word,
        className: "text-yellow-400 font-medium",
      },
      { type: "text", content: suffix },
    ];
  }
  return [{ type: "text", content: text }];
}

/**
 * Parse a guess message into a structured format
 */
export function parseMessage(
  guess: Doc<"guesses">,
  getPlayerColor: (playerId: string) => string
): ParsedMessage {
  const logMessage = isLogMessage(guess.text);
  const winnerMessage = isWinnerMessage(guess.text);
  const playerColor = getPlayerColor(guess.playerId);

  // Handle winner announcement with fancy styling
  if (winnerMessage) {
    const isRedWin = guess.text.includes("🔴 Red Team");
    const isBlueWin = guess.text.includes("🔵 Blue Team");
    const isTie = guess.text.includes("Tie!");
    
    let bgClass = "bg-yellow-500/10";
    let borderClass = "border-2 border-yellow-500/50";
    let textClass = "text-white font-semibold";
    
    if (isRedWin) {
      bgClass = "bg-red-500/10";
      borderClass = "border-2 border-red-500/50";
      textClass = "text-white font-semibold";
    } else if (isBlueWin) {
      bgClass = "bg-blue-500/10";
      borderClass = "border-2 border-blue-500/50";
      textClass = "text-white font-semibold";
    }

    return {
      isLogMessage: false,
      messageType: "winner",
      parts: [
        {
          type: "text",
          content: guess.text,
          className: `${textClass} text-center text-lg`,
        },
      ],
      className: `${bgClass} ${borderClass} -mx-3 px-3 py-3 rounded-lg shadow-lg`,
    };
  }

  if (logMessage && guess.text.includes("buzzed")) {
    return {
      isLogMessage: true,
      messageType: "buzzed",
      parts: parseBuzzedMessage(guess.text, guess.playerId, playerColor),
      className: "bg-gray-700/50 -mx-3 px-3 py-1 rounded",
    };
  }

  if (logMessage && guess.text.includes("skipped")) {
    return {
      isLogMessage: true,
      messageType: "skipped",
      parts: parseSkippedMessage(guess.text, guess.playerId, playerColor),
      className: "bg-gray-700/50 -mx-3 px-3 py-1 rounded",
    };
  }

  if (logMessage && guess.text.includes("Turn ended")) {
    return {
      isLogMessage: true,
      messageType: "turnEnded",
      parts: parseTurnEndedMessage(guess.text),
      className: "bg-gray-700/50 -mx-3 px-3 py-1 rounded",
    };
  }

  if (guess.isCorrect) {
    return {
      isLogMessage: false,
      messageType: "correct",
      parts: [
        {
          type: "playerName",
          content: `${guess.playerName}:`,
          className: "font-medium shrink-0",
          style: { color: playerColor },
        },
        {
          type: "text",
          content: `${guess.text} ✓`,
          className: "text-green-400 font-medium",
        },
      ],
      className: "bg-green-500/10 -mx-3 px-3 py-1 rounded",
    };
  }

  const parts: ParsedMessagePart[] = [];
  if (!logMessage) {
    parts.push({
      type: "playerName",
      content: `${guess.playerName}:`,
      className: "font-medium shrink-0",
      style: { color: playerColor },
    });
  }
  parts.push({
    type: "text",
    content: guess.text,
    className: logMessage ? "text-gray-300 italic" : "text-white",
  });

  return {
    isLogMessage: logMessage,
    messageType: "regular",
    parts,
    className: logMessage ? "bg-gray-700/50 -mx-3 px-3 py-1 rounded" : "",
  };
}
