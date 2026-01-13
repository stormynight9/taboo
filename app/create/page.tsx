"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";

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

export default function CreateRoom() {
  const router = useRouter();
  const createRoom = useMutation(api.rooms.create);

  const [formData, setFormData] = useState({
    hostName: "",
    rounds: 3,
    turnTime: 60,
    tabooWordCount: 5,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const sessionId = getOrCreateSessionId();
      const result = await createRoom({
        hostName: formData.hostName,
        sessionId,
        settings: {
          rounds: formData.rounds,
          turnTime: formData.turnTime,
          tabooWordCount: formData.tabooWordCount,
        },
      });

      // Store player ID
      localStorage.setItem(`taboo_player_${result.code}`, result.playerId);

      router.push(`/room/${result.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500 opacity-5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 opacity-5 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 w-full max-w-md">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-amber-400 mb-8 transition-colors"
        >
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Home
        </Link>

        <div className="game-card p-8">
          <h1 className="text-3xl font-bold mb-8 text-center text-white">
            Create a <span className="text-amber-400">Room</span>
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Host Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Your Name
              </label>
              <input
                type="text"
                required
                maxLength={20}
                placeholder="Alex"
                className="game-input w-full"
                value={formData.hostName}
                onChange={(e) =>
                  setFormData({ ...formData, hostName: e.target.value })
                }
              />
            </div>

            {/* Number of Rounds */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Number of Rounds
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={1}
                  max={10}
                  className="flex-1 accent-amber-500"
                  value={formData.rounds}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rounds: parseInt(e.target.value),
                    })
                  }
                />
                <span className="w-8 text-center font-bold text-amber-400">
                  {formData.rounds}
                </span>
              </div>
            </div>

            {/* Turn Time */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Turn Time (seconds)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={30}
                  max={180}
                  step={10}
                  className="flex-1 accent-amber-500"
                  value={formData.turnTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      turnTime: parseInt(e.target.value),
                    })
                  }
                />
                <span className="w-12 text-center font-bold text-amber-400">
                  {formData.turnTime}s
                </span>
              </div>
            </div>

            {/* Taboo Word Count */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Taboo Words per Card
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={1}
                  max={5}
                  className="flex-1 accent-amber-500"
                  value={formData.tabooWordCount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tabooWordCount: parseInt(e.target.value),
                    })
                  }
                />
                <span className="w-8 text-center font-bold text-amber-400">
                  {formData.tabooWordCount}
                </span>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating..." : "Create Room"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

