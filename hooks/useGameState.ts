import { Doc, Id } from "../convex/_generated/dataModel";
import { getPlayerRoleInfo, getExplainer } from "../lib/playerUtils";
import {
  getCurrentTeamPlayers,
  getOpposingTeamPlayers,
  getRedTeamPlayers,
  getBlueTeamPlayers,
} from "../lib/teamUtils";

export interface GameState {
  currentPlayer: Doc<"players"> | undefined;
  explainer: Doc<"players"> | undefined;
  roleInfo: ReturnType<typeof getPlayerRoleInfo>;
  currentTeamPlayers: Doc<"players">[];
  opposingTeamPlayers: Doc<"players">[];
  redTeamPlayers: Doc<"players">[];
  blueTeamPlayers: Doc<"players">[];
  turnStarted: boolean;
  isGameFinished: boolean;
  finalScores: { red: number; blue: number };
}

/**
 * Custom hook for calculating game state
 */
export function useGameState(
  room: Doc<"rooms">,
  players: Doc<"players">[],
  currentPlayerId: Id<"players">
): GameState {
  const currentPlayer = players.find((p) => p._id === currentPlayerId);
  const roleInfo = getPlayerRoleInfo(currentPlayerId, players, room);
  const explainer = getExplainer(
    players,
    room.currentTeam,
    room.currentExplainerIndex
  );

  const currentTeamPlayers = getCurrentTeamPlayers(players, room.currentTeam);
  const opposingTeamPlayers = getOpposingTeamPlayers(players, room.currentTeam);
  const redTeamPlayers = getRedTeamPlayers(players);
  const blueTeamPlayers = getBlueTeamPlayers(players);

  const turnStarted = room.currentWord !== null;
  const isGameFinished =
    room.status === "finished" || room.finalScores !== undefined;
  const finalScores = room.finalScores || room.scores;

  return {
    currentPlayer,
    explainer,
    roleInfo,
    currentTeamPlayers,
    opposingTeamPlayers,
    redTeamPlayers,
    blueTeamPlayers,
    turnStarted,
    isGameFinished,
    finalScores,
  };
}
