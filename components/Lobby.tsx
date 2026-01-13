"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Doc, Id } from "../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
interface LobbyProps {
  room: Doc<"rooms">;
  players: Doc<"players">[];
  currentPlayerId: Id<"players">;
}

export default function Lobby({ room, players, currentPlayerId }: LobbyProps) {
  const [copied, setCopied] = useState(false);

  const selectTeam = useMutation(api.players.selectTeam);
  const startGame = useMutation(api.game.startGame);

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

  const canStart = redTeam.length > 0 && blueTeam.length > 0;

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
          <h2 className="text-lg font-medium mb-3 text-pink-500">
            Invite Players
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-3 bg-gray-950 rounded-lg px-4 py-3.5 border border-gray-700">
              <span className="text-gray-500 text-sm truncate hidden sm:block">
                {roomUrl}
              </span>
            </div>
            <Button onClick={copyLink} variant="secondary">
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
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-900 ${
                      player._id === currentPlayerId
                        ? "ring-2 ring-pink-500"
                        : ""
                    }`}
                  >
                    <span className="font-medium text-white">
                      {player.name}
                    </span>
                    {player._id === room.hostId && (
                      <span className="text-xs bg-pink-500 text-white px-2 py-0.5 rounded-full">
                        Host
                      </span>
                    )}
                    {player._id === currentPlayerId && (
                      <span className="text-xs text-gray-400">(You)</span>
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
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-900 ${
                      player._id === currentPlayerId
                        ? "ring-2 ring-pink-500"
                        : ""
                    }`}
                  >
                    <span className="font-medium text-white">
                      {player.name}
                    </span>
                    {player._id === room.hostId && (
                      <span className="text-xs bg-pink-500 text-white px-2 py-0.5 rounded-full">
                        Host
                      </span>
                    )}
                    {player._id === currentPlayerId && (
                      <span className="text-xs text-gray-400">(You)</span>
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
                <span
                  key={player._id}
                  className="px-3 py-1 bg-gray-900 rounded-full text-sm text-white"
                >
                  {player.name}
                  {player._id === room.hostId && " 👑"}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Start Button (Host only) */}
        {isHost && (
          <div className="text-center space-y-2">
            <Button onClick={handleStartGame} disabled={!canStart} size="lg">
              Start Game
            </Button>
            {!canStart && (
              <p className="text-gray-400 text-sm">
                Each team needs at least one player to start
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

