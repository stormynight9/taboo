"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import FloatingIcons from "@/components/home/FloatingIcons";
import FloatingWords from "@/components/home/FloatingWords";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
      <FloatingIcons />
      <FloatingWords />
      <main className="relative z-10 flex flex-col items-center gap-12 max-w-2xl text-center">
        {/* Logo / Title */}
        <div className="space-y-4">
          <h1 className="text-8xl font-bold tracking-tight text-pink-500 drop-shadow-[0_0_30px_rgba(236,72,153,0.2)]">
            TABOO
          </h1>
          <p className="text-xl text-white font-medium drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]">
            The ultimate word-guessing party game
          </p>
        </div>

        {/* Game description */}
        <div className="game-card p-8 space-y-4">
          <h2 className="text-2xl font-semibold text-pink-500">How to Play</h2>
          <div className="text-gray-300 space-y-2 text-left">
            <p>
              <span className="text-pink-500 font-semibold">1.</span> Split into
              two teams -{" "}
              <span className="text-red-500 font-semibold">Red</span> vs{" "}
              <span className="text-blue-500 font-semibold">Blue</span>
            </p>
            <p>
              <span className="text-pink-500 font-semibold">2.</span> The
              explainer describes a word without using the taboo words
            </p>
            <p>
              <span className="text-pink-500 font-semibold">3.</span> Team
              members guess in the chat - correct guesses earn points!
            </p>
            <p>
              <span className="text-pink-500 font-semibold">4.</span> The
              opposing team watches for taboo violations
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <Link href="/create">
          <Button size="lg">Create a Room</Button>
        </Link>
      </main>
    </div>
  );
}

