"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export default function Home() {
  const wordCount = useQuery(api.words.count);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500 opacity-5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 opacity-5 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 flex flex-col items-center gap-12 max-w-2xl text-center">
        {/* Logo / Title */}
        <div className="space-y-4">
          <h1 className="text-7xl font-black tracking-tight">
            <span className="text-red-500">TA</span>
            <span className="text-white">B</span>
            <span className="text-blue-500">OO</span>
          </h1>
          <p className="text-xl text-gray-400">
            The ultimate word-guessing party game
          </p>
        </div>

        {/* Game description */}
        <div className="game-card p-8 space-y-4">
          <h2 className="text-2xl font-bold text-amber-400">How to Play</h2>
          <div className="text-gray-300 space-y-2 text-left">
            <p>
              <span className="text-amber-400 font-semibold">1.</span> Split
              into two teams -{" "}
              <span className="text-red-500 font-semibold">Red</span> vs{" "}
              <span className="text-blue-500 font-semibold">Blue</span>
            </p>
            <p>
              <span className="text-amber-400 font-semibold">2.</span> The
              explainer describes a word without using the taboo words
            </p>
            <p>
              <span className="text-amber-400 font-semibold">3.</span> Team
              members guess in the chat - correct guesses earn points!
            </p>
            <p>
              <span className="text-amber-400 font-semibold">4.</span> The
              opposing team watches for taboo violations
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <Link
          href="/create"
          className="btn-primary text-xl px-12 py-4 animate-pulse-glow"
        >
          Create a Room
        </Link>

        {/* Stats */}
        <p className="text-gray-500 text-sm">
          {wordCount !== undefined
            ? `${wordCount} words ready to play`
            : "Loading..."}
        </p>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-8 text-gray-600 text-sm">
        Real-time multiplayer • Powered by Convex
      </footer>
    </div>
  );
}

