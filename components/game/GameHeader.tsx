"use client";

import { Doc } from "../../convex/_generated/dataModel";
import Timer from "../Timer";
import TeamScores from "../TeamScores";

interface GameHeaderProps {
  room: Doc<"rooms">;
  explainer: Doc<"players"> | undefined;
  isExplainer: boolean;
}

export default function GameHeader({
  room,
  explainer,
  isExplainer,
}: GameHeaderProps) {
  return (
    <div className="grid md:grid-cols-3 gap-4 items-stretch">
      {/* Scores */}
      <div className="md:order-1">
        <TeamScores
          redScore={room.scores.red}
          blueScore={room.scores.blue}
          currentTeam={room.currentTeam}
          currentRound={room.currentRound}
          totalRounds={room.settings.rounds}
        />
      </div>

      {/* Timer */}
      <div className="md:order-2 flex items-center justify-center">
        <Timer
          endTime={room.turnEndTime}
          defaultTime={room.settings.turnTime}
        />
      </div>

      {/* Current Turn Info */}
      <div className="game-card p-4 md:order-3 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
            Explainer
          </p>
          <p className="text-xl font-semibold text-white">
            {explainer?.name || "Unknown"}
            {isExplainer && <span className="text-pink-500"> (You!)</span>}
          </p>
          <p className="text-sm mt-1 text-white">
            {room.currentTeam === "red" ? "🔴 Red Team" : "🔵 Blue Team"}
          </p>
        </div>
      </div>
    </div>
  );
}
