"use client";

import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Doc, Id } from "../convex/_generated/dataModel";
import WordCard from "./WordCard";
import GuessChat from "./GuessChat";
import { useGameState } from "../hooks/useGameState";
import { useConfetti } from "../hooks/useConfetti";
import GameHeader from "./game/GameHeader";
import RoleBanner from "./game/RoleBanner";
import TurnWaitingScreen from "./game/TurnWaitingScreen";
import GameFinishedScreen from "./game/GameFinishedScreen";
import PlayerLists from "./game/PlayerLists";
import ExplainerControls from "./game/ExplainerControls";

interface GameBoardProps {
  room: Doc<"rooms">;
  players: Doc<"players">[];
  currentPlayerId: Id<"players">;
  onGoToLobby?: () => void;
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

  const gameState = useGameState(room, players, currentPlayerId);
  const {
    explainer,
    roleInfo,
    currentTeamPlayers,
    opposingTeamPlayers,
    redTeamPlayers,
    blueTeamPlayers,
    turnStarted,
    isGameFinished,
    finalScores,
  } = gameState;

  const { isHost, isExplainer, canSeeWord, canGuess, canBuzz } = roleInfo;

  // Trigger confetti when game finishes
  useConfetti(isGameFinished, finalScores);

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

  const handleGoToLobby = () => {
    // Each player controls their own view individually
    // This only changes the local view, not the global room state
    if (onGoToLobby) {
      onGoToLobby();
    }
  };

  const explainerIndex =
    room.currentTeam === "red"
      ? room.currentExplainerIndex.red
      : room.currentExplainerIndex.blue;

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto relative z-10 space-y-4 md:space-y-6">
        {!isGameFinished && (
          <>
            <GameHeader
              room={room}
              explainer={explainer}
              isExplainer={isExplainer}
            />

            <RoleBanner
              turnStarted={turnStarted}
              isExplainer={isExplainer}
              isOnCurrentTeam={roleInfo.isOnCurrentTeam}
              isOnOpposingTeam={roleInfo.isOnOpposingTeam}
              isSpectator={roleInfo.isSpectator}
              currentTeam={room.currentTeam}
              explainerName={explainer?.name}
            />

            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-4">
                {!turnStarted ? (
                  <TurnWaitingScreen
                    room={room}
                    explainer={explainer}
                    isExplainer={isExplainer}
                    isHost={isHost}
                    onStartTurn={handleStartTurn}
                    onSkipTurn={handleSkipTurn}
                    onSkipPlayerAsHost={handleSkipPlayerAsHost}
                  />
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
                    {isExplainer && (
                      <ExplainerControls onSkipWord={handleSkip} />
                    )}
                  </>
                )}
              </div>

              <div className="space-y-4">
                <GuessChat
                  roomId={room._id}
                  playerId={currentPlayerId}
                  canGuess={canGuess}
                />
                <PlayerLists
                  currentTeamPlayers={currentTeamPlayers}
                  opposingTeamPlayers={opposingTeamPlayers}
                  currentTeam={room.currentTeam}
                  currentPlayerId={currentPlayerId}
                  explainerIndex={explainerIndex}
                />
              </div>
            </div>
          </>
        )}

        {isGameFinished && (
          <GameFinishedScreen
            finalScores={finalScores}
            redTeamPlayers={redTeamPlayers}
            blueTeamPlayers={blueTeamPlayers}
            currentPlayerId={currentPlayerId}
            roomId={room._id}
            canGuess={canGuess}
            onGoToLobby={handleGoToLobby}
          />
        )}
      </div>
    </div>
  );
}
