"use client";

import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { api } from "../convex/_generated/api";
import { Doc, Id } from "../convex/_generated/dataModel";
import Timer from "./Timer";
import WordCard from "./WordCard";
import TeamScores from "./TeamScores";
import GuessChat from "./GuessChat";
import { Button } from "@/components/ui/button";

interface GameBoardProps {
  room: Doc<"rooms">;
  players: Doc<"players">[];
  currentPlayerId: Id<"players">;
  onGoToLobby?: () => void; // Optional callback for client-side lobby navigation
}

export default function GameBoard({
  room,
  players,
  currentPlayerId,
  onGoToLobby,
}: GameBoardProps) {
  const skipWord = useMutation(api.game.skipWord);
  const startTurn = useMutation(api.game.startTurn);
  const skipTurn = useMutation(api.game.skipTurn);
  const skipPlayerTurnAsHost = useMutation(api.game.skipPlayerTurnAsHost);
  const resetToLobby = useMutation(api.game.resetToLobby);

  const currentPlayer = players.find((p) => p._id === currentPlayerId);
  const isHost = room.hostId === currentPlayerId;

  // Get current team players
  const currentTeamPlayers = players
    .filter((p) => p.team === room.currentTeam)
    .sort((a, b) => a.joinOrder - b.joinOrder);

  const opposingTeamPlayers = players.filter(
    (p) => p.team !== room.currentTeam && p.team !== null
  );

  // Get all players by team for end screen
  const redTeamPlayers = players
    .filter((p) => p.team === "red")
    .sort((a, b) => a.joinOrder - b.joinOrder);
  const blueTeamPlayers = players
    .filter((p) => p.team === "blue")
    .sort((a, b) => a.joinOrder - b.joinOrder);

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
  const isSpectator = currentPlayer?.team === null;

  // Who can see the word: explainer, opposing team, and spectators
  const canSeeWord = isExplainer || isOnOpposingTeam || isSpectator;

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

  const handleSkipTurn = async () => {
    await skipTurn({ roomId: room._id, playerId: currentPlayerId });
  };

  const handleSkipPlayerAsHost = async () => {
    if (
      !confirm(
        `Skip ${explainer?.name || "the current explainer"}'s turn? This will pass the turn to the next teammate.`
      )
    ) {
      return;
    }
    try {
      await skipPlayerTurnAsHost({
        roomId: room._id,
        hostPlayerId: currentPlayerId,
      });
    } catch (error) {
      console.error("Failed to skip player turn:", error);
      alert(
        error instanceof Error ? error.message : "Failed to skip player turn"
      );
    }
  };

  // Check if turn has started (currentWord is not null)
  const turnStarted = room.currentWord !== null;

  // Check if game is finished
  const isGameFinished = room.status === "finished" || room.finalScores !== undefined;
  const finalScores = room.finalScores || room.scores;

  // Track if confetti has been triggered to avoid multiple triggers
  const confettiTriggered = useRef(false);

  // Trigger confetti when game finishes - show for everyone in winning team's color
  useEffect(() => {
    if (isGameFinished && finalScores && !confettiTriggered.current) {
      const winner =
        finalScores.red > finalScores.blue
          ? "red"
          : finalScores.blue > finalScores.red
          ? "blue"
          : null;

      // Show confetti for everyone (not just winning team) in winning team's color
      if (winner) {
        confettiTriggered.current = true;

        // Determine confetti color based on winning team
        const colors =
          winner === "red" ? ["#ef4444", "#dc2626"] : ["#3b82f6", "#2563eb"];

        // Create confetti effect
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = {
          startVelocity: 30,
          spread: 360,
          ticks: 60,
          zIndex: 9999,
        };

        function randomInRange(min: number, max: number) {
          return Math.random() * (max - min) + min;
        }

        const interval = setInterval(() => {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);

          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors: colors,
          });
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: colors,
          });
        }, 250);
      }
    }

    // Reset confetti trigger when game is no longer finished
    if (!isGameFinished) {
      confettiTriggered.current = false;
    }
  }, [isGameFinished, finalScores]);

  const handleGoToLobby = async () => {
    // If host, reset the game state. If not host, just change view client-side
    if (isHost) {
      try {
        await resetToLobby({
          roomId: room._id,
          playerId: currentPlayerId,
        });
      } catch (error) {
        console.error("Failed to reset to lobby:", error);
        alert(
          error instanceof Error ? error.message : "Failed to reset to lobby"
        );
      }
    } else {
      // Non-host: just change view client-side
      if (onGoToLobby) {
        onGoToLobby();
      }
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto relative z-10 space-y-4 md:space-y-6">
        {!isGameFinished && (
          <>
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

            {/* Role Banner */}
            <div
              className={`text-center py-3 px-4 rounded-lg ${
                isExplainer
                  ? "bg-pink-500/20 border border-pink-500"
                  : isOnCurrentTeam
                  ? room.currentTeam === "red"
                    ? "bg-red-500/20 border border-red-500"
                    : "bg-blue-500/20 border border-blue-500"
                  : isOnOpposingTeam
                  ? "bg-red-500/10 border border-red-400"
                  : "bg-zinc-800/50 border border-zinc-600"
              }`}
            >
              {!turnStarted ? (
                isExplainer ? (
                  <p className="font-medium text-pink-500">
                    ⏸️ It&apos;s your turn! Click &quot;Start Turn&quot; to begin.
                  </p>
                ) : isSpectator ? (
                  <p className="font-medium text-gray-300">
                    👁️ You are spectating. Waiting for{" "}
                    {explainer?.name || "the explainer"} to start the turn...
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
                <p className="font-medium text-gray-300">
                  👁️ You are SPECTATING. Watch the game unfold!
                </p>
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
                        <div className="space-y-3">
                          <Button
                            onClick={handleStartTurn}
                            size="lg"
                            className="w-full"
                          >
                            ▶️ Start Turn
                          </Button>
                          <Button
                            onClick={handleSkipTurn}
                            variant="outline"
                            size="lg"
                            className="w-full"
                          >
                            ⏭️ Skip Turn{" "}
                            <span className=" text-xs">(Pass to Teammate)</span>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="game-card p-8 md:p-12 text-center max-w-md w-full">
                        <div className="text-6xl mb-6">⏸️</div>
                        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
                          Waiting for Turn to Start
                        </h2>
                        <p className="text-gray-400 mb-4">
                          {explainer?.name || "The explainer"} will start the turn
                          soon...
                        </p>
                        {isHost && explainer && (
                          <Button
                            onClick={handleSkipPlayerAsHost}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            ⏭️ Skip {explainer.name}&apos;s Turn
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <WordCard
                      word={room.currentWord?.word || ""}
                      tabooWords={room.currentWord?.tabooWords || []}
                      showWord={canSeeWord}
                      roomId={room._id}
                      playerId={currentPlayerId}
                      canBuzz={canBuzz}
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
          </>
        )}

        {/* When game is finished, show centered layout */}
        {isGameFinished && (
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Final Scores - Show when game is finished */}
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
                <div className="text-center pt-2">
                  <p className="text-lg font-semibold text-white">
                    {finalScores.red > finalScores.blue
                      ? "🔴 Red Team Wins!"
                      : finalScores.blue > finalScores.red
                      ? "🔵 Blue Team Wins!"
                      : "🤝 It's a Tie!"}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleGoToLobby}
                size="lg"
                className="w-full"
                variant="default"
              >
                Go Back to Lobby
              </Button>
            </div>

            <GuessChat
              roomId={room._id}
              playerId={currentPlayerId}
              canGuess={canGuess}
            />
          </div>
        )}
      </div>
    </div>
  );
}
