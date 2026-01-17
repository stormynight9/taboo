import { Doc } from "../convex/_generated/dataModel";

/**
 * Team filtering and organization utilities
 */

export function getTeamPlayers(
  players: Doc<"players">[],
  team: "red" | "blue" | null
): Doc<"players">[] {
  return players
    .filter((p) => p.team === team)
    .sort((a, b) => a.joinOrder - b.joinOrder);
}

export function getRedTeamPlayers(
  players: Doc<"players">[]
): Doc<"players">[] {
  return getTeamPlayers(players, "red");
}

export function getBlueTeamPlayers(
  players: Doc<"players">[]
): Doc<"players">[] {
  return getTeamPlayers(players, "blue");
}

export function getSpectators(
  players: Doc<"players">[]
): Doc<"players">[] {
  return getTeamPlayers(players, null);
}

export function getCurrentTeamPlayers(
  players: Doc<"players">[],
  currentTeam: "red" | "blue"
): Doc<"players">[] {
  return getTeamPlayers(players, currentTeam);
}

export function getOpposingTeamPlayers(
  players: Doc<"players">[],
  currentTeam: "red" | "blue"
): Doc<"players">[] {
  return players.filter(
    (p) => p.team !== currentTeam && p.team !== null
  );
}
