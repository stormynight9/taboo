"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import {
  Link01Icon,
  Tick01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation } from "convex/react";
import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { api } from "../convex/_generated/api";
import { Doc, Id } from "../convex/_generated/dataModel";
import WordPackSelector from "./WordPackSelector";
interface LobbyProps {
  room: Doc<"rooms">;
  players: Doc<"players">[];
  currentPlayerId: Id<"players">;
}

export default function Lobby({ room, players, currentPlayerId }: LobbyProps) {
  const [copied, setCopied] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [localFinalScores, setLocalFinalScores] = useState<{
    red: number;
    blue: number;
  } | null>(null);
  const [hasClosedDialog, setHasClosedDialog] = useState(false);

  const selectTeam = useMutation(api.players.selectTeam);
  const startGame = useMutation(api.game.startGame);
  const kickPlayer = useMutation(api.players.kickPlayer);
  const randomizeTeams = useMutation(api.players.randomizeTeams);
  const clearFinalScores = useMutation(api.game.clearFinalScores);
  const updateSettings = useMutation(api.rooms.updateSettings);

  // Settings state
  const [settings, setSettings] = useState({
    rounds: room.settings.rounds,
    turnTime: room.settings.turnTime,
    tabooWordCount: room.settings.tabooWordCount,
  });

  // Update local settings when room settings change
  useEffect(() => {
    const timer = setTimeout(() => {
      setSettings({
        rounds: room.settings.rounds,
        turnTime: room.settings.turnTime,
        tabooWordCount: room.settings.tabooWordCount,
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [room.settings]);

  const handleUpdateSettings = async () => {
    try {
      await updateSettings({
        roomId: room._id,
        playerId: currentPlayerId,
        settings,
      });
      setShowSettingsDialog(false); // Close dialog on success
    } catch (error) {
      console.error("Failed to update settings:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update settings. Please try again."
      );
    }
  };

  // Show dialog when final scores become available and store them locally
  useEffect(() => {
    if (room.finalScores && !hasClosedDialog) {
      // Store the final scores in local state so they persist even if cleared from DB
      // Use setTimeout to defer state update and avoid linter warning
      const timer = setTimeout(() => {
        setLocalFinalScores(room.finalScores!);
        setShowResultsDialog(true);
      }, 0);
      return () => clearTimeout(timer);
    } else if (!room.finalScores && !showResultsDialog) {
      // Clear local scores when they're cleared from DB and dialog is closed
      const timer = setTimeout(() => {
        setLocalFinalScores(null);
        setHasClosedDialog(false); // Reset flag when scores are cleared
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [room.finalScores, showResultsDialog, hasClosedDialog]);

  // Trigger confetti when dialog opens and there's a winner
  // Only show confetti for players on the winning team
  useEffect(() => {
    if (showResultsDialog && localFinalScores) {
      const winner =
        localFinalScores.red > localFinalScores.blue
          ? "red"
          : localFinalScores.blue > localFinalScores.red
          ? "blue"
          : null;

      // Check if current player is on the winning team
      const currentPlayer = players.find((p) => p._id === currentPlayerId);
      const isOnWinningTeam = winner && currentPlayer?.team === winner;

      if (winner && isOnWinningTeam) {
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
          zIndex: 9999, // Higher than dialog z-index to appear on top
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
  }, [showResultsDialog, localFinalScores, players, currentPlayerId]);

  const handleCloseResultsDialog = async () => {
    setShowResultsDialog(false);
    setHasClosedDialog(true); // Mark that dialog was manually closed
    // Clear final scores from the database
    try {
      await clearFinalScores({ roomId: room._id });
    } catch (error) {
      console.error("Failed to clear final scores:", error);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      // Dialog is being closed via backdrop/escape key
      handleCloseResultsDialog();
    }
  };

  const currentPlayer = players.find((p) => p._id === currentPlayerId);
  const isHost = room.hostId === currentPlayerId;

  const redTeam = players.filter((p) => p.team === "red");
  const blueTeam = players.filter((p) => p.team === "blue");
  const noTeam = players.filter((p) => p.team === null);

  const roomUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/room/${room.code}`
      : "";

  const copyLink = async () => {
    await navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectTeam = async (team: "red" | "blue") => {
    await selectTeam({ playerId: currentPlayerId, team });
  };

  const handleStartGame = async () => {
    await startGame({ roomId: room._id, playerId: currentPlayerId });
  };

  const handleKickPlayer = async (targetPlayerId: Id<"players">) => {
    if (
      !confirm(
        `Are you sure you want to kick ${
          players.find((p) => p._id === targetPlayerId)?.name
        }?`
      )
    ) {
      return;
    }
    try {
      await kickPlayer({
        roomId: room._id,
        hostPlayerId: currentPlayerId,
        targetPlayerId,
      });
    } catch (error) {
      console.error("Failed to kick player:", error);
      alert("Failed to kick player. Please try again.");
    }
  };

  const handleRandomizeTeams = async () => {
    if (players.length < 2) {
      alert("Need at least 2 players to randomize teams");
      return;
    }
    try {
      await randomizeTeams({
        roomId: room._id,
        hostPlayerId: currentPlayerId,
      });
    } catch (error) {
      console.error("Failed to randomize teams:", error);
      alert(
        error instanceof Error ? error.message : "Failed to randomize teams"
      );
    }
  };

  const canStart = redTeam.length >= 2 && blueTeam.length >= 2;

  // Determine winner from local final scores (persists even if DB is cleared)
  const winner =
    localFinalScores && localFinalScores.red > localFinalScores.blue
      ? "red"
      : localFinalScores && localFinalScores.blue > localFinalScores.red
      ? "blue"
      : "tie";

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={handleDialogOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-md bg-zinc-900 border border-zinc-700 ring-0"
        >
          <DialogHeader>
            <DialogTitle className="text-3xl md:text-4xl font-semibold text-center">
              {winner === "tie" ? (
                "It's a Tie! 🤝"
              ) : winner === "red" ? (
                <span className="text-red-500">Red Team Wins! 🏆</span>
              ) : (
                <span className="text-blue-500">Blue Team Wins! 🏆</span>
              )}
            </DialogTitle>
            <div className="text-center pt-4">
              <div className="flex items-center justify-center gap-8 mb-4">
                <div className="text-center">
                  <div className="text-sm text-red-500 font-semibold mb-2">
                    RED
                  </div>
                  <div className="text-5xl font-semibold text-red-500">
                    {localFinalScores?.red || 0}
                  </div>
                </div>
                <span className="text-2xl text-gray-400">-</span>
                <div className="text-center">
                  <div className="text-sm text-blue-500 font-semibold mb-2">
                    BLUE
                  </div>
                  <div className="text-5xl font-semibold text-blue-500">
                    {localFinalScores?.blue || 0}
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button onClick={handleCloseResultsDialog} size="lg">
              Back to Lobby
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="max-w-4xl mx-auto relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold text-white">
            Room <span className="text-pink-500">{room.code}</span>
          </h1>
          <p className="text-gray-400">
            {room.settings.rounds} rounds • {room.settings.turnTime}s per turn •{" "}
            {room.settings.tabooWordCount} taboo words
          </p>
        </div>

        {/* Share Link */}
        <div className="game-card p-4 md:p-6">
          <h2 className="text-lg font-medium mb-3 ">Invite Players</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-3 bg-zinc-900 rounded-lg px-4 py-3.5 border border-zinc-700">
              <span className="text-gray-500 text-sm truncate sm:block">
                {roomUrl}
              </span>
            </div>
            <div className="flex gap-3">
              <Button onClick={copyLink} variant="outline">
                {copied ? (
                  <>
                    <HugeiconsIcon icon={Tick01Icon} strokeWidth={2} />
                    Copied!
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={Link01Icon} strokeWidth={2} />
                    Copy Link
                  </>
                )}
              </Button>
              {isHost && (
                <Button
                  onClick={() => setShowSettingsDialog(true)}
                  variant="outline"
                >
                  <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} />
                  Settings
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Settings Dialog (Host Only) */}
        {isHost && (
          <Dialog
            open={showSettingsDialog}
            onOpenChange={setShowSettingsDialog}
          >
            <DialogContent className="sm:max-w-md bg-zinc-900 border border-zinc-700">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold text-white">
                  Game Settings
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {/* Number of Rounds */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">
                    Number of Rounds
                  </label>
                  <div className="flex items-center gap-4">
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={[settings.rounds]}
                      onValueChange={(values) =>
                        setSettings({
                          ...settings,
                          rounds: Array.isArray(values) ? values[0] : values,
                        })
                      }
                      className="flex-1"
                    />
                    <span className="w-12 text-center font-semibold text-pink-500 text-lg">
                      {settings.rounds}
                    </span>
                  </div>
                </div>

                {/* Turn Time */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">
                    Turn Time (seconds)
                  </label>
                  <div className="flex items-center gap-4">
                    <Slider
                      min={30}
                      max={180}
                      step={10}
                      value={[settings.turnTime]}
                      onValueChange={(values) =>
                        setSettings({
                          ...settings,
                          turnTime: Array.isArray(values) ? values[0] : values,
                        })
                      }
                      className="flex-1"
                    />
                    <span className="w-16 text-center font-semibold text-pink-500 text-lg">
                      {settings.turnTime}s
                    </span>
                  </div>
                </div>

                {/* Taboo Word Count */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">
                    Taboo Words per Card
                  </label>
                  <div className="flex items-center gap-4">
                    <Slider
                      min={1}
                      max={5}
                      step={1}
                      value={[settings.tabooWordCount]}
                      onValueChange={(values) =>
                        setSettings({
                          ...settings,
                          tabooWordCount: Array.isArray(values)
                            ? values[0]
                            : values,
                        })
                      }
                      className="flex-1"
                    />
                    <span className="w-12 text-center font-semibold text-pink-500 text-lg">
                      {settings.tabooWordCount}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => setShowSettingsDialog(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateSettings}
                    variant="default"
                    className="flex-1"
                  >
                    Save Settings
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Word Packs */}
        <WordPackSelector
          roomId={room._id}
          playerId={currentPlayerId}
          isHost={isHost}
          selectedPackIds={room.selectedPackIds ?? []}
        />

        {/* Teams */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {/* Red Team */}
          <div
            className={`game-card p-4 md:p-6 border-2 transition-colors ${
              currentPlayer?.team === "red"
                ? "border-red-500"
                : "border-transparent"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">🔴 Red Team</h2>
              <span className="text-gray-400 text-sm">
                {redTeam.length} player{redTeam.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-2 mb-4 min-h-[100px]">
              {redTeam.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No players yet</p>
              ) : (
                redTeam.map((player) => (
                  <div
                    key={player._id}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-zinc-900"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="font-medium text-white truncate">
                        {player.name}
                      </span>
                      {player._id === room.hostId && (
                        <span
                          className="  shrink-0 text-sm"
                          style={{ textBox: "trim-both cap alphabetic" }}
                        >
                          👑
                        </span>
                      )}
                      {player._id === currentPlayerId && (
                        <span className="text-xs text-gray-400 shrink-0 ml-auto">
                          (You)
                        </span>
                      )}
                    </div>
                    {isHost &&
                      player._id !== currentPlayerId &&
                      player._id !== room.hostId && (
                        <button
                          onClick={() => handleKickPlayer(player._id)}
                          className="text-red-400 hover:text-red-500  shrink-0 hover:cursor-pointer"
                          title={`Kick ${player.name}`}
                        >
                          Kick
                        </button>
                      )}
                  </div>
                ))
              )}
            </div>

            {currentPlayer?.team !== "red" && (
              <Button
                onClick={() => handleSelectTeam("red")}
                variant="destructive"
                size="lg"
                className="w-full"
              >
                Join Red Team
              </Button>
            )}
          </div>

          {/* Blue Team */}
          <div
            className={`game-card p-4 md:p-6 border-2 transition-colors ${
              currentPlayer?.team === "blue"
                ? "border-blue-500"
                : "border-transparent"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">🔵 Blue Team</h2>
              <span className="text-gray-400 text-sm">
                {blueTeam.length} player{blueTeam.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-2 mb-4 min-h-[100px]">
              {blueTeam.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No players yet</p>
              ) : (
                blueTeam.map((player) => (
                  <div
                    key={player._id}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-zinc-900"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="font-medium text-white truncate">
                        {player.name}
                      </span>
                      {player._id === room.hostId && (
                        <span
                          className="shrink-0 text-sm"
                          style={{ textBox: "trim-both cap alphabetic" }}
                        >
                          👑
                        </span>
                      )}
                      {player._id === currentPlayerId && (
                        <span className="text-xs text-gray-400 shrink-0 ml-auto">
                          (You)
                        </span>
                      )}
                    </div>
                    {isHost &&
                      player._id !== currentPlayerId &&
                      player._id !== room.hostId && (
                        <button
                          onClick={() => handleKickPlayer(player._id)}
                          className="text-red-400 hover:text-red-500  shrink-0 hover:cursor-pointer"
                          title={`Kick ${player.name}`}
                        >
                          Kick
                        </button>
                      )}
                  </div>
                ))
              )}
            </div>

            {currentPlayer?.team !== "blue" && (
              <Button
                onClick={() => handleSelectTeam("blue")}
                variant="secondary"
                size="lg"
                className="w-full"
              >
                Join Blue Team
              </Button>
            )}
          </div>
        </div>

        {/* Waiting Room */}
        {noTeam.length > 0 && (
          <div className="game-card p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              Waiting to pick a team:
            </h3>
            <div className="flex flex-wrap gap-2">
              {noTeam.map((player) => (
                <div
                  key={player._id}
                  className="flex items-center gap-2 px-3 py-2 bg-zinc-900 rounded-full text-sm text-white"
                >
                  <span className="leading-none">
                    {player.name}
                    {player._id === room.hostId && " 👑"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Host Controls */}
        {isHost && (
          <div className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleRandomizeTeams}
                disabled={players.length < 2}
                variant="outline"
                size="lg"
              >
                🎲 Randomize Teams
              </Button>
              <Button onClick={handleStartGame} disabled={!canStart} size="lg">
                Start Game
              </Button>
            </div>
            {!canStart && (
              <p className="text-gray-400 text-sm">
                Each team needs at least 2 players to start
              </p>
            )}
          </div>
        )}

        {!isHost && (
          <p className="text-center text-gray-400">
            Waiting for the host to start the game...
          </p>
        )}
      </div>
    </div>
  );
}

