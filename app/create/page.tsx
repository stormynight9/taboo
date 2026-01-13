"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

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
      <main className="relative z-10 w-full max-w-md">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-pink-500 mb-8 transition-colors"
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

        <div className="game-card p-8 md:p-10">
          <h1 className="text-3xl md:text-4xl font-semibold mb-8 text-center text-white">
            Create a <span className="text-pink-500">Room</span>
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Host Name */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white">
                Your Name
              </label>
              <Input
                type="text"
                required
                maxLength={20}
                placeholder="Jared"
                value={formData.hostName}
                onChange={(e) =>
                  setFormData({ ...formData, hostName: e.target.value })
                }
              />
            </div>

            {/* Number of Rounds */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white">
                Number of Rounds
              </label>
              <div className="flex items-center gap-4">
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={[formData.rounds]}
                  onValueChange={(values) =>
                    setFormData({
                      ...formData,
                      rounds: Array.isArray(values) ? values[0] : values,
                    })
                  }
                  className="flex-1"
                />
                <span className="w-12 text-center font-semibold text-pink-500 text-lg">
                  {formData.rounds}
                </span>
              </div>
            </div>

            {/* Turn Time */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white">
                Turn Time (seconds)
              </label>
              <div className="flex items-center gap-4">
                <Slider
                  min={30}
                  max={180}
                  step={10}
                  value={[formData.turnTime]}
                  onValueChange={(values) =>
                    setFormData({
                      ...formData,
                      turnTime: Array.isArray(values) ? values[0] : values,
                    })
                  }
                  className="flex-1"
                />
                <span className="w-16 text-center font-semibold text-pink-500 text-lg">
                  {formData.turnTime}s
                </span>
              </div>
            </div>

            {/* Taboo Word Count */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white">
                Taboo Words per Card
              </label>
              <div className="flex items-center gap-4">
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[formData.tabooWordCount]}
                  onValueChange={(values) =>
                    setFormData({
                      ...formData,
                      tabooWordCount: Array.isArray(values)
                        ? values[0]
                        : values,
                    })
                  }
                  className="flex-1"
                />
                <span className="w-12 text-center font-semibold text-pink-500 text-lg">
                  {formData.tabooWordCount}
                </span>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              variant="default"
              size="lg"
              className="w-full"
            >
              {isLoading ? "Creating..." : "Create Room"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}

