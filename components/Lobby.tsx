"use client";

import { Button } from "@/components/ui/button";
import { Link01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../convex/_generated/api";
import { Doc, Id } from "../convex/_generated/dataModel";
interface LobbyProps {
  room: Doc<"rooms">;
  players: Doc<"players">[];
  currentPlayerId: Id<"players">;
}

export default function Lobby({ room, players, currentPlayerId }: LobbyProps) {
  const [copied, setCopied] = useState(false);

  const selectTeam = useMutation(api.players.selectTeam);
  const startGame = useMutation(api.game.startGame);
  const kickPlayer = useMutation(api.players.kickPlayer);
  const randomizeTeams = useMutation(api.players.randomizeTeams);

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

  return (
    <div className="min-h-screen p-4 md:p-8">
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
              <span className="text-gray-500 text-sm truncate hidden sm:block">
                {roomUrl}
              </span>
            </div>
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
          </div>
        </div>

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

