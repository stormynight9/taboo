"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Doc, Id } from "../convex/_generated/dataModel";
import WordPackSelector from "./WordPackSelector";
import { getRedTeamPlayers, getBlueTeamPlayers, getSpectators } from "../lib/teamUtils";
import InviteSection from "./lobby/InviteSection";
import SettingsDialog from "./lobby/SettingsDialog";
import TeamCard from "./lobby/TeamCard";
import WaitingRoom from "./lobby/WaitingRoom";
import HostControls from "./lobby/HostControls";

interface LobbyProps {
  room: Doc<"rooms">;
  players: Doc<"players">[];
  currentPlayerId: Id<"players">;
}

export default function Lobby({ room, players, currentPlayerId }: LobbyProps) {
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  const selectTeam = useMutation(api.players.selectTeam);
  const startGame = useMutation(api.game.startGame);
  const kickPlayer = useMutation(api.players.kickPlayer);
  const randomizeTeams = useMutation(api.players.randomizeTeams);
  const updateSettings = useMutation(api.rooms.updateSettings);

  const currentPlayer = players.find((p) => p._id === currentPlayerId);
  const isHost = room.hostId === currentPlayerId;

  const redTeam = getRedTeamPlayers(players);
  const blueTeam = getBlueTeamPlayers(players);
  const noTeam = getSpectators(players);

  const roomUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/room/${room.code}`
      : "";

  const handleSelectTeam = async (team: "red" | "blue" | null) => {
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

  const handleUpdateSettings = async (settings: {
    rounds: number;
    turnTime: number;
    tabooWordCount: number;
  }) => {
    await updateSettings({
      roomId: room._id,
      playerId: currentPlayerId,
      settings,
    });
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

        <InviteSection
          roomUrl={roomUrl}
          isHost={isHost}
          onOpenSettings={() => setShowSettingsDialog(true)}
        />

        {isHost && (
          <SettingsDialog
            open={showSettingsDialog}
            onOpenChange={setShowSettingsDialog}
            room={room}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        <WordPackSelector
          roomId={room._id}
          playerId={currentPlayerId}
          isHost={isHost}
          selectedPackIds={room.selectedPackIds ?? []}
        />

        {/* Teams */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <TeamCard
            team="red"
            players={redTeam}
            currentPlayer={currentPlayer}
            currentPlayerId={currentPlayerId}
            roomHostId={room.hostId!}
            isHost={isHost}
            onSelectTeam={handleSelectTeam}
            onKickPlayer={handleKickPlayer}
          />
          <TeamCard
            team="blue"
            players={blueTeam}
            currentPlayer={currentPlayer}
            currentPlayerId={currentPlayerId}
            roomHostId={room.hostId!}
            isHost={isHost}
            onSelectTeam={handleSelectTeam}
            onKickPlayer={handleKickPlayer}
          />
        </div>

        {noTeam.length > 0 && (
          <WaitingRoom players={noTeam} roomHostId={room.hostId!} />
        )}

        {isHost && (room.status === "lobby" || room.status === "finished") && (
          <HostControls
            canStart={canStart}
            onStartGame={handleStartGame}
            onRandomizeTeams={handleRandomizeTeams}
            totalPlayers={redTeam.length + blueTeam.length}
          />
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
