"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
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
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500 opacity-5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 opacity-5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Room <span className="text-amber-400">{room.code}</span>
          </h1>
          <p className="text-gray-400">
            {room.settings.rounds} rounds • {room.settings.turnTime}s per turn •{" "}
            {room.settings.tabooWordCount} taboo words
          </p>
        </div>

        {/* Share Link */}
        <div className="game-card p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-3 text-amber-400">
            Invite Players
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-3 bg-gray-900 rounded-lg px-4 py-3 border border-gray-700">
              <span className="font-mono text-lg tracking-wider text-amber-400">
                {room.code}
              </span>
              <span className="text-gray-500 text-sm truncate hidden sm:block">
                {roomUrl}
              </span>
            </div>
            <button
              onClick={copyLink}
              className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {copied ? (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy Link
                </>
              )}
            </button>
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
              <h2 className="text-xl font-bold text-white">🔴 Red Team</h2>
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
                        ? "ring-2 ring-amber-400"
                        : ""
                    }`}
                  >
                    <span className="font-medium text-white">
                      {player.name}
                    </span>
                    {player._id === room.hostId && (
                      <span className="text-xs bg-amber-500 text-gray-900 px-2 py-0.5 rounded-full">
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
              <button
                onClick={() => handleSelectTeam("red")}
                className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
              >
                Join Red Team
              </button>
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
              <h2 className="text-xl font-bold text-white">🔵 Blue Team</h2>
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
                        ? "ring-2 ring-amber-400"
                        : ""
                    }`}
                  >
                    <span className="font-medium text-white">
                      {player.name}
                    </span>
                    {player._id === room.hostId && (
                      <span className="text-xs bg-amber-500 text-gray-900 px-2 py-0.5 rounded-full">
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
              <button
                onClick={() => handleSelectTeam("blue")}
                className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
              >
                Join Blue Team
              </button>
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
            <button
              onClick={handleStartGame}
              disabled={!canStart}
              className={`btn-primary text-xl px-12 py-4 ${
                canStart
                  ? "animate-pulse-glow"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              Start Game
            </button>
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

