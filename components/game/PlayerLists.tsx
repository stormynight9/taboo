"use client";

import { Doc, Id } from "../../convex/_generated/dataModel";

interface PlayerListsProps {
  currentTeamPlayers: Doc<"players">[];
  opposingTeamPlayers: Doc<"players">[];
  currentTeam: "red" | "blue";
  currentPlayerId: Id<"players">;
  explainerIndex: number;
}

export default function PlayerLists({
  currentTeamPlayers,
  opposingTeamPlayers,
  currentTeam,
  currentPlayerId,
  explainerIndex,
}: PlayerListsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Guessing Team */}
      <div className="game-card p-3">
        <p className="text-xs font-semibold mb-2 text-white">
          {currentTeam === "red" ? "🔴" : "🔵"} Guessing
        </p>
        <div className="space-y-1">
          {currentTeamPlayers.map((p, i) => (
            <p
              key={p._id}
              className={`text-sm ${
                i === explainerIndex % currentTeamPlayers.length
                  ? "text-pink-500 font-semibold"
                  : "text-gray-300"
              }`}
            >
              {i === explainerIndex % currentTeamPlayers.length && "🎤 "}
              {p.name}
              {p._id === currentPlayerId && " (You)"}
            </p>
          ))}
        </div>
      </div>

      {/* Watching Team */}
      <div className="game-card p-3">
        <p className="text-xs font-semibold mb-2 text-white">
          {currentTeam === "red" ? "🔵" : "🔴"} Watching
        </p>
        <div className="space-y-1">
          {opposingTeamPlayers.map((p) => (
            <p key={p._id} className="text-sm text-gray-300">
              {p.name}
              {p._id === currentPlayerId && " (You)"}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
