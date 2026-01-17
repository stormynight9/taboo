/**
 * Game mutations and queries
 * 
 * This file re-exports all game-related functions from modular files
 * to maintain backward compatibility with existing imports.
 */

// Re-export all game functions
export { startGame, resetToLobby, clearFinalScores } from "./game/gameFlow";
export { submitGuess, buzzTaboo, skipWord } from "./game/guessHandling";
export { startTurn, endTurn, skipTurn, skipPlayerTurnAsHost } from "./game/turnManagement";
export { getGuesses, getAllGuesses } from "./game/queries";
export { submitChatMessage } from "./game/chat";

// Re-export utilities (for internal use)
export { pickRandomWord } from "./game/wordSelection";
export { isFuzzyMatch, levenshteinDistance } from "./game/fuzzyMatching";
