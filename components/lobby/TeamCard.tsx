"use client";

import { Doc, Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import PlayerListItem from "./PlayerListItem";

interface TeamCardProps {
  team: "red" | "blue";
  players: Doc<"players">[];
  currentPlayer: Doc<"players"> | undefined;
  currentPlayerId: Id<"players">;
  roomHostId: Id<"players">;
  isHost: boolean;
  onSelectTeam: (team: "red" | "blue" | null) => void;
  onKickPlayer: (playerId: Id<"players">) => void;
}

export default function TeamCard({
  team,
  players,
  currentPlayer,
  currentPlayerId,
  roomHostId,
  isHost,
  onSelectTeam,
  onKickPlayer,
}: TeamCardProps) {
  const isOnTeam = currentPlayer?.team === team;
  const teamEmoji = team === "red" ? "🔴" : "🔵";
  const teamColor = team === "red" ? "red" : "blue";

  return (
    <div
      className={`game-card p-4 md:p-6 border-2 transition-colors flex flex-col h-full ${
        isOnTeam ? `border-${teamColor}-500` : "border-transparent"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">
          {teamEmoji} {team === "red" ? "Red" : "Blue"} Team
        </h2>
        <span className="text-gray-400 text-sm">
          {players.length} player{players.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-2 mb-4 min-h-[100px]">
        {players.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No players yet</p>
        ) : (
          players.map((player) => (
            <PlayerListItem
              key={player._id}
              player={player}
              isHost={isHost}
              isCurrentPlayer={player._id === currentPlayerId}
              isRoomHost={player._id === roomHostId}
              onKick={() => onKickPlayer(player._id)}
            />
          ))
        )}
      </div>

      {!isOnTeam ? (
        <Button
          onClick={() => onSelectTeam(team)}
          variant={team === "red" ? "destructive" : "secondary"}
          size="lg"
          className="w-full mt-auto"
        >
          Join {team === "red" ? "Red" : "Blue"} Team
        </Button>
      ) : (
        <Button
          onClick={() => onSelectTeam(null)}
          variant="outline"
          size="lg"
          className="w-full mt-auto"
        >
          Go back to spectate
        </Button>
      )}
    </div>
  );
}
