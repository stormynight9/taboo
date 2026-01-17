"use client";

import { Doc, Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import GuessChat from "../GuessChat";

interface GameFinishedScreenProps {
  finalScores: { red: number; blue: number };
  redTeamPlayers: Doc<"players">[];
  blueTeamPlayers: Doc<"players">[];
  currentPlayerId: Id<"players">;
  roomId: Id<"rooms">;
  canGuess: boolean;
  onGoToLobby: () => void;
}

export default function GameFinishedScreen({
  finalScores,
  redTeamPlayers,
  blueTeamPlayers,
  currentPlayerId,
  roomId,
  onGoToLobby,
}: GameFinishedScreenProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Final Scores */}
      <div className="game-card p-6">
        <h2 className="text-2xl font-semibold text-white mb-4 text-center">
          🏆 Game Over!
        </h2>
        <div className="space-y-4 mb-4">
          <div className="p-4 rounded-lg bg-red-500/10 border-2 border-red-500/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold text-white">
                🔴 Red Team
              </span>
              <span className="text-2xl font-bold text-red-400">
                {finalScores.red}
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-red-500/30">
              <div className="flex flex-wrap gap-2">
                {redTeamPlayers.map((p) => (
                  <span
                    key={p._id}
                    className="text-sm text-gray-300 bg-red-500/20 px-2 py-1 rounded"
                  >
                    {p.name}
                    {p._id === currentPlayerId && " (You)"}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-blue-500/10 border-2 border-blue-500/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold text-white">
                🔵 Blue Team
              </span>
              <span className="text-2xl font-bold text-blue-400">
                {finalScores.blue}
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-blue-500/30">
              <div className="flex flex-wrap gap-2">
                {blueTeamPlayers.map((p) => (
                  <span
                    key={p._id}
                    className="text-sm text-gray-300 bg-blue-500/20 px-2 py-1 rounded"
                  >
                    {p.name}
                    {p._id === currentPlayerId && " (You)"}
                  </span>
                ))}
              </div>
            </div>
          </div>
         
        </div>
        <Button
          onClick={onGoToLobby}
          size="lg"
          className="w-full"
          variant="default"
        >
          Go Back to Lobby
        </Button>
      </div>

      <GuessChat 
        roomId={roomId} 
        playerId={currentPlayerId} 
        canGuess={true}
        isGameFinished={true}
      />
    </div>
  );
}
