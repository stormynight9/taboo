"use client";

import { useState, useEffect } from "react";

export default function FloatingWords() {
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
