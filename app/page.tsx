"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

// Floating words component
function FloatingWords() {
  const [wordData, setWordData] = useState<
    Array<{
      word: string;
      size: number;
      left: number;
      top: number;
      delay: number;
      duration: number;
      opacity: number;
      rotation: number;
    }>
  >([]);

  useEffect(() => {
    // Only generate words on client side to avoid hydration mismatch
    const wordList = [
      "Adventure",
      "Mystery",
      "Challenge",
      "Victory",
      "Strategy",
      "Teamwork",
      "Fun",
      "Excitement",
      "Puzzle",
      "Brainstorm",
      "Creative",
      "Imagination",
      "Discover",
      "Explore",
      "Journey",
      "Quest",
      "Triumph",
      "Wisdom",
      "Courage",
      "Energy",
      "Passion",
      "Thrill",
      "Wonder",
      "Magic",
      "Legend",
    ];
    // Randomly select 10-15 words
    const count = 10 + Math.floor(Math.random() * 6);
    const shuffled = [...wordList].sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, count);

    // Pre-generate all random values for each word
    const data: Array<{
      word: string;
      size: number;
      left: number;
      top: number;
      delay: number;
      duration: number;
      opacity: number;
      rotation: number;
    }> = [];

    for (let i = 0; i < selectedWords.length; i++) {
      data.push({
        word: selectedWords[i],
        size: 20 + Math.random() * 16, // 20-36px
        left: Math.random() * 100, // 0-100%
        top: Math.random() * 100, // 0-100%
        delay: Math.random() * 5, // 0-5s delay
        duration: 20 + Math.random() * 15, // 20-35s duration
        opacity: 0.08 + Math.random() * 0.12, // 0.08-0.2 opacity
        rotation: (Math.random() - 0.5) * 15, // -7.5 to 7.5 degrees
      });
    }
    setTimeout(() => {
      setWordData(data);
    }, 0);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {wordData.map((data, index) => (
        <div
          key={index}
          className="absolute floating-word"
          style={{
            left: `${data.left}%`,
            top: `${data.top}%`,
            fontSize: `${data.size}px`,
            opacity: data.opacity,
            animationDelay: `${data.delay}s`,
            animationDuration: `${data.duration}s`,
            transform: `rotate(${data.rotation}deg)`,
          }}
        >
          {data.word}
        </div>
      ))}
    </div>
  );
}

// Floating icons component
function FloatingIcons() {
  const [iconData, setIconData] = useState<
    Array<{
      icon: string;
      size: number;
      left: number;
      top: number;
      delay: number;
      duration: number;
      opacity: number;
    }>
  >([]);

  useEffect(() => {
    // Only generate icons on client side to avoid hydration mismatch
    // This useEffect is necessary to prevent server/client HTML mismatch
    const iconList = [
      "🎯",
      "🎲",
      "🎪",
      "🎨",
      "🎭",
      "🎬",
      "🎤",
      "🎧",
      "🎮",
      "🎰",
      "🎱",
      "🎳",
      "🎴",
      "🎵",
      "🎶",
      "🎸",
      "🎹",
      "🎺",
      "🎻",
      "🎼",
    ];
    // Randomly select 15-20 icons
    const count = 15 + Math.floor(Math.random() * 6);
    const shuffled = [...iconList].sort(() => Math.random() - 0.5);
    const selectedIcons = shuffled.slice(0, count);

    // Pre-generate all random values for each icon
    const data: Array<{
      icon: string;
      size: number;
      left: number;
      top: number;
      delay: number;
      duration: number;
      opacity: number;
    }> = [];

    for (let i = 0; i < selectedIcons.length; i++) {
      data.push({
        icon: selectedIcons[i],
        size: 40 + Math.random() * 40, // 40-80px
        left: Math.random() * 100, // 0-100%
        top: Math.random() * 100, // 0-100%
        delay: Math.random() * 5, // 0-5s delay
        duration: 15 + Math.random() * 10, // 15-25s duration
        opacity: 0.1 + Math.random() * 0.15, // 0.1-0.25 opacity
      });
    }
    setTimeout(() => {
      setIconData(data);
    }, 0);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {iconData.map((data, index) => (
        <div
          key={index}
          className="absolute floating-icon"
          style={{
            left: `${data.left}%`,
            top: `${data.top}%`,
            fontSize: `${data.size}px`,
            opacity: data.opacity,
            animationDelay: `${data.delay}s`,
            animationDuration: `${data.duration}s`,
          }}
        >
          {data.icon}
        </div>
      ))}
    </div>
  );
}

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

