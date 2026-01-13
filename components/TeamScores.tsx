"use client";

interface TeamScoresProps {
  redScore: number;
  blueScore: number;
  currentTeam: "red" | "blue";
  currentRound: number;
  totalRounds: number;
}

export default function TeamScores({
  redScore,
  blueScore,
  currentTeam,
  currentRound,
  totalRounds,
}: TeamScoresProps) {
  return (
    <div className="game-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-gray-400">
          Round {currentRound} of {totalRounds}
        </span>
        <span className="text-xs uppercase tracking-wider text-gray-400">
          {currentTeam === "red" ? "🔴 Red" : "🔵 Blue"}'s Turn
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Red Score */}
        <div
          className={`flex-1 text-center p-3 rounded-lg transition-all ${
            currentTeam === "red"
              ? "bg-red-600/20 ring-2 ring-red-500"
              : "bg-gray-800"
          }`}
        >
          <p className="text-xs text-white font-semibold mb-1">RED</p>
          <p className="text-3xl font-bold text-white">{redScore}</p>
        </div>

        {/* VS */}
        <span className="text-gray-400 font-bold">VS</span>

        {/* Blue Score */}
        <div
          className={`flex-1 text-center p-3 rounded-lg transition-all ${
            currentTeam === "blue"
              ? "bg-blue-600/20 ring-2 ring-blue-500"
              : "bg-gray-800"
          }`}
        >
          <p className="text-xs text-white font-semibold mb-1">BLUE</p>
          <p className="text-3xl font-bold text-white">{blueScore}</p>
        </div>
      </div>
    </div>
  );
}
