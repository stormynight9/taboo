import { Doc, Id } from "../convex/_generated/dataModel";

/**
 * Player role and permission utilities
 */

export interface PlayerRoleInfo {
  isHost: boolean;
  isExplainer: boolean;
  isOnCurrentTeam: boolean;
  isOnOpposingTeam: boolean;
  isSpectator: boolean;
  canSeeWord: boolean;
  canGuess: boolean;
  canBuzz: boolean;
}

/**
 * Get the current explainer for a team
 */
export function getExplainer(
  players: Doc<"players">[],
  currentTeam: "red" | "blue",
  explainerIndex: { red: number; blue: number }
): Doc<"players"> | undefined {
  const currentTeamPlayers = players
    .filter((p) => p.team === currentTeam)
    .sort((a, b) => a.joinOrder - b.joinOrder);

  const index =
    currentTeam === "red"
      ? explainerIndex.red
      : explainerIndex.blue;

  return currentTeamPlayers[index % currentTeamPlayers.length];
}

/**
 * Calculate player role and permissions
 */
export function getPlayerRoleInfo(
  currentPlayerId: Id<"players">,
  players: Doc<"players">[],
  room: Doc<"rooms">
): PlayerRoleInfo {
  const currentPlayer = players.find((p) => p._id === currentPlayerId);
  const isHost = room.hostId === currentPlayerId;

  // Get current team players
  const currentTeamPlayers = players
    .filter((p) => p.team === room.currentTeam)
    .sort((a, b) => a.joinOrder - b.joinOrder);

  // Determine explainer
  const explainer = getExplainer(
    players,
    room.currentTeam,
    room.currentExplainerIndex
  );

  const isExplainer = explainer?._id === currentPlayerId;
  const isOnCurrentTeam = currentPlayer?.team === room.currentTeam;
  const isOnOpposingTeam =
    currentPlayer?.team !== room.currentTeam && currentPlayer?.team !== null;
  const isSpectator = currentPlayer?.team === null;

  // Who can see the word: explainer, opposing team, and spectators
  const canSeeWord = isExplainer || isOnOpposingTeam || isSpectator;

  // Who can guess: current team members except explainer
  const canGuess = isOnCurrentTeam && !isExplainer;

  // Who can buzz: opposing team
  const canBuzz = isOnOpposingTeam;

  return {
    isHost,
    isExplainer,
    isOnCurrentTeam,
    isOnOpposingTeam,
    isSpectator,
    canSeeWord,
    canGuess,
    canBuzz,
  };
}
