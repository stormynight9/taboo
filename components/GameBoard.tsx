"use client";

import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Doc, Id } from "../convex/_generated/dataModel";
import Timer from "./Timer";
import WordCard from "./WordCard";
import TeamScores from "./TeamScores";
import GuessChat from "./GuessChat";
import BuzzerButton from "./BuzzerButton";
import { Button } from "@/components/ui/button";

interface GameBoardProps {
  room: Doc<"rooms">;
  players: Doc<"players">[];
  currentPlayerId: Id<"players">;
}

export default function GameBoard({
  room,
  players,
  currentPlayerId,
}: GameBoardProps) {
  const skipWord = useMutation(api.game.skipWord);
  const startTurn = useMutation(api.game.startTurn);

  const currentPlayer = players.find((p) => p._id === currentPlayerId);

  // Get current team players
  const currentTeamPlayers = players
    .filter((p) => p.team === room.currentTeam)
    .sort((a, b) => a.joinOrder - b.joinOrder);

  const opposingTeamPlayers = players.filter(
    (p) => p.team !== room.currentTeam && p.team !== null
  );

  // Determine explainer
  const explainerIndex =
    room.currentTeam === "red"
      ? room.currentExplainerIndex.red
      : room.currentExplainerIndex.blue;
  const explainer =
    currentTeamPlayers[explainerIndex % currentTeamPlayers.length];

  const isExplainer = explainer?._id === currentPlayerId;
  const isOnCurrentTeam = currentPlayer?.team === room.currentTeam;
  const isOnOpposingTeam =
    currentPlayer?.team !== room.currentTeam && currentPlayer?.team !== null;

  // Who can see the word: explainer and opposing team
  const canSeeWord = isExplainer || isOnOpposingTeam;

  // Who can guess: current team members except explainer
  const canGuess = isOnCurrentTeam && !isExplainer;

  // Who can buzz: opposing team
  const canBuzz = isOnOpposingTeam;

  // Note: Game now automatically resets to lobby when finished,
  // so the finished status should not be reached here.
  // The results dialog is shown in the Lobby component.

  const handleSkip = async () => {
    await skipWord({ roomId: room._id, playerId: currentPlayerId });
  };

  const handleStartTurn = async () => {
    await startTurn({ roomId: room._id, playerId: currentPlayerId });
  };

  // Check if turn has started (currentWord is not null)
  const turnStarted = room.currentWord !== null;

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto relative z-10 space-y-4 md:space-y-6">
        {/* Header with Timer and Scores */}
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
            <Timer endTime={room.turnEndTime} />
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

        {/* Role Banner */}
        <div
          className={`text-center py-3 px-4 rounded-lg ${
            isExplainer
              ? "bg-pink-500/20 border border-pink-500"
              : isOnCurrentTeam
              ? room.currentTeam === "red"
                ? "bg-red-500/20 border border-red-500"
                : "bg-blue-500/20 border border-blue-500"
              : "bg-red-500/10 border border-red-400"
          }`}
        >
          {!turnStarted ? (
            isExplainer ? (
              <p className="font-medium text-pink-500">
                ⏸️ It&apos;s your turn! Click &quot;Start Turn&quot; to begin.
              </p>
            ) : (
              <p className="font-medium text-white">
                ⏸️ Waiting for {explainer?.name || "the explainer"} to start the
                turn...
              </p>
            )
          ) : isExplainer ? (
            <p className="font-medium text-white">
              🎤 You are the EXPLAINER! Describe the word without using the
              taboo words.
            </p>
          ) : isOnCurrentTeam ? (
            <p className="font-medium text-white">
              🎯 Your team is guessing! Type your answers in the chat.
            </p>
          ) : isOnOpposingTeam ? (
            <p className="font-medium text-white">
              👀 Watch for taboo violations! Press the buzzer if they say a
              forbidden word.
            </p>
          ) : (
            <p className="text-gray-400">Spectating...</p>
          )}
        </div>

        {/* Main Game Area */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {/* Left Column: Word Card */}
          <div className="space-y-4">
            {!turnStarted ? (
              /* Waiting for turn to start - only show on left side */
              <div className="flex items-center justify-center min-h-[400px]">
                {isExplainer ? (
                  <div className="game-card p-8 md:p-12 text-center max-w-md w-full">
                    <div className="text-6xl mb-6">🎯</div>
                    <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
                      Your Turn to Explain!
                    </h2>
                    <p className="text-gray-400 mb-6">
                      {room.currentTeam === "red"
                        ? "🔴 Red Team"
                        : "🔵 Blue Team"}{" "}
                      - Round {room.currentRound}
                    </p>
                    <Button onClick={handleStartTurn} size="lg">
                      ▶️ Start Turn
                    </Button>
                  </div>
                ) : (
                  <div className="game-card p-8 md:p-12 text-center max-w-md w-full">
                    <div className="text-6xl mb-6">⏸️</div>
                    <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
                      Waiting for Turn to Start
                    </h2>
                    <p className="text-gray-400">
                      {explainer?.name || "The explainer"} will start the turn
                      soon...
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <WordCard
                  word={room.currentWord?.word || ""}
                  tabooWords={room.currentWord?.tabooWords || []}
                  showWord={canSeeWord}
                />

                {/* Explainer Controls */}
                {isExplainer && (
                  <div className="game-card p-4">
                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-3">
                      Explainer Controls
                    </p>
                    <Button onClick={handleSkip} size="lg" className="w-full">
                      ⏭️ Skip Word
                    </Button>
                  </div>
                )}

                {/* Buzzer for opposing team */}
                {isOnOpposingTeam && (
                  <BuzzerButton
                    roomId={room._id}
                    playerId={currentPlayerId}
                    canBuzz={canBuzz}
                  />
                )}
              </>
            )}
          </div>

          {/* Right Column: Chat and Players - Always visible */}
          <div className="space-y-4">
            <GuessChat
              roomId={room._id}
              playerId={currentPlayerId}
              canGuess={canGuess}
            />

            {/* Player Lists */}
            <div className="grid grid-cols-2 gap-3">
              {/* Guessing Team */}
              <div className="game-card p-3">
                <p className="text-xs font-semibold mb-2 text-white">
                  {room.currentTeam === "red" ? "🔴" : "🔵"} Guessing
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
                      {i === explainerIndex % currentTeamPlayers.length &&
                        "🎤 "}
                      {p.name}
                      {p._id === currentPlayerId && " (You)"}
                    </p>
                  ))}
                </div>
              </div>

              {/* Watching Team */}
              <div className="game-card p-3">
                <p className="text-xs font-semibold mb-2 text-white">
                  {room.currentTeam === "red" ? "🔵" : "🔴"} Watching
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
          </div>
        </div>
      </div>
    </div>
  );
}
