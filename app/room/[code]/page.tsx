"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Lobby from "../../../components/Lobby";
import GameBoard from "../../../components/GameBoard";
import { Button } from "@/components/ui/button";

function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function getOrCreateSessionId() {
  if (typeof window === "undefined") return "";
  let sessionId = localStorage.getItem("taboo_session_id");
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem("taboo_session_id", sessionId);
  }
  return sessionId;
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string)?.toUpperCase();

  const [sessionId, setSessionId] = useState<string>("");
  const [playerId, setPlayerId] = useState<Id<"players"> | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [forceLobbyView, setForceLobbyView] = useState(false);

  const room = useQuery(api.rooms.getByCode, code ? { code } : "skip");
  const players = useQuery(
    api.players.getByRoom,
    room?._id ? { roomId: room._id } : "skip"
  );
  const currentPlayer = useQuery(
    api.players.getBySession,
    room?._id && sessionId ? { sessionId, roomId: room._id } : "skip"
  );

  const joinRoom = useMutation(api.players.join);

  // Initialize session
  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  // Reset forced lobby view when room status changes to lobby (host reset the game)
  useEffect(() => {
    if (room?.status === "lobby") {
      setForceLobbyView(false);
    }
  }, [room?.status]);

  // Set player ID from existing player
  useEffect(() => {
    if (currentPlayer) {
      setPlayerId(currentPlayer._id);
    }
  }, [currentPlayer]);

  // Auto-redirect if player was kicked (after showing message)
  useEffect(() => {
    if (
      playerId &&
      players !== undefined &&
      room &&
      room.status === "lobby" &&
      !players.some((p) => p._id === playerId)
    ) {
      // Player was kicked - redirect to home after showing message
      const timer = setTimeout(() => {
        router.push("/");
      }, 3000); // Give 3 seconds to read the message
      return () => clearTimeout(timer);
    }
  }, [playerId, players, room, router]);

  // Handle join
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !playerName.trim()) return;

    setIsJoining(true);
    setJoinError("");

    try {
      const result = await joinRoom({
        roomCode: code,
        name: playerName.trim(),
        sessionId,
      });
      setPlayerId(result.playerId);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Failed to join");
    } finally {
      setIsJoining(false);
    }
  };

  // Loading state
  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Invalid room code</p>
      </div>
    );
  }

  if (room === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400">Loading room...</p>
        </div>
      </div>
    );
  }

  if (room === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="game-card p-8 text-center space-y-4">
          <h1 className="text-2xl font-semibold text-red-400">
            Room Not Found
          </h1>
          <p className="text-gray-400">
            The room code{" "}
            <span className="font-mono text-pink-500">{code}</span> doesn&apos;t
            exist.
          </p>
          <Button onClick={() => router.push("/")} variant="default">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  // Join form for new players
  if (!playerId && !currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="game-card p-8 w-full max-w-md relative z-10">
          <h1 className="text-2xl font-semibold text-center mb-2 text-white">
            Join Room <span className="text-pink-500">{code}</span>
          </h1>
          <p className="text-gray-400 text-center mb-6">
            Enter your name to join the game
          </p>

          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Your Name
              </label>
              <input
                type="text"
                required
                maxLength={30}
                placeholder="Enter your name"
                className="game-input w-full"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </div>

            {joinError && (
              <p className="text-red-400 text-sm text-center">{joinError}</p>
            )}

            <Button
              type="submit"
              disabled={isJoining}
              variant="default"
              size="lg"
              className="w-full"
            >
              {isJoining ? "Joining..." : "Join Room"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const actualPlayerId = playerId || currentPlayer?._id;

  // Check if player was kicked (had playerId but no longer exists)
  if (
    playerId &&
    players !== undefined &&
    !players.some((p) => p._id === playerId) &&
    room &&
    room.status === "lobby"
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="game-card p-8 text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-semibold text-red-400">
            You Were Kicked
          </h1>
          <p className="text-gray-400">
            The host has removed you from the room.
          </p>
          <Button onClick={() => router.push("/")} variant="default" size="lg">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (!actualPlayerId || !players) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Lobby or Game based on status or forced lobby view
  // Show lobby if: room is in lobby status OR player forced lobby view
  if (room.status === "lobby" || forceLobbyView) {
    return (
      <Lobby 
        room={room} 
        players={players} 
        currentPlayerId={actualPlayerId}
      />
    );
  }

  return (
    <GameBoard 
      room={room} 
      players={players} 
      currentPlayerId={actualPlayerId}
      onGoToLobby={() => setForceLobbyView(true)}
    />
  );
}
