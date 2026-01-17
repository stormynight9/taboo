"use client";

import { Doc, Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

interface TurnWaitingScreenProps {
  room: Doc<"rooms">;
  explainer: Doc<"players"> | undefined;
  isExplainer: boolean;
  isHost: boolean;
  onStartTurn: () => void;
  onSkipTurn: () => void;
  onSkipPlayerAsHost: () => void;
}

export default function TurnWaitingScreen({
  room,
  explainer,
  isExplainer,
  isHost,
  onStartTurn,
  onSkipTurn,
  onSkipPlayerAsHost,
}: TurnWaitingScreenProps) {
  if (isExplainer) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="game-card p-8 md:p-12 text-center max-w-md w-full">
          <div className="text-6xl mb-6">🎯</div>
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
            Your Turn to Explain!
          </h2>
          <p className="text-gray-400 mb-6">
            {room.currentTeam === "red" ? "🔴 Red Team" : "🔵 Blue Team"} -
            Round {room.currentRound}
          </p>
          <div className="space-y-3">
            <Button onClick={onStartTurn} size="lg" className="w-full">
              ▶️ Start Turn
            </Button>
            <Button onClick={onSkipTurn} variant="outline" size="lg" className="w-full">
              ⏭️ Skip Turn{" "}
              <span className=" text-xs">(Pass to Teammate)</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="game-card p-8 md:p-12 text-center max-w-md w-full">
        <div className="text-6xl mb-6">⏸️</div>
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
          Waiting for Turn to Start
        </h2>
        <p className="text-gray-400 mb-4">
          {explainer?.name || "The explainer"} will start the turn soon...
        </p>
        {isHost && explainer && (
          <Button
            onClick={onSkipPlayerAsHost}
            variant="outline"
            size="sm"
            className="w-full"
          >
            ⏭️ Skip {explainer.name}&apos;s Turn
          </Button>
        )}
      </div>
    </div>
  );
}
