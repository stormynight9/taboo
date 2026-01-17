"use client";

import { Button } from "@/components/ui/button";

interface HostControlsProps {
  canStart: boolean;
  onStartGame: () => void;
  onRandomizeTeams: () => void;
  totalPlayers: number;
}

export default function HostControls({
  canStart,
  onStartGame,
  onRandomizeTeams,
  totalPlayers,
}: HostControlsProps) {
  return (
    <div className="text-center space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={onRandomizeTeams}
          disabled={totalPlayers < 2}
          variant="outline"
          size="lg"
        >
          🎲 Randomize Teams
        </Button>
        <Button onClick={onStartGame} disabled={!canStart} size="lg">
          Start Game
        </Button>
      </div>
      {!canStart && (
        <p className="text-gray-400 text-sm">
          Each team needs at least 2 players to start
        </p>
      )}
    </div>
  );
}
