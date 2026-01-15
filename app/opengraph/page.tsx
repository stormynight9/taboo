"use client";

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
    const wordList = [
      // General Words
      "Pizza",
      "Beach",
      "Guitar",
      "Elephant",
      "Coffee",
      "Rainbow",
      "Vampire",
      "Astronaut",
      "Penguin",
      "Chocolate",
      "Airplane",
      "Dinosaur",
      "Fireworks",
      "Volcano",
      "Pirate",
      "Magician",
      "Tornado",
      "Lighthouse",
      "Wizard",
      "Mermaid",
      "Pumpkin",
      "Kangaroo",
      "Giraffe",
      "Octopus",
      "Flamingo",
      "Chameleon",
      "Koala",
      "Peacock",
      "Ninja",
      "Detective",
      // Countries & Cities
      "Paris",
      "Tokyo",
      "New York",
      "London",
      "Sydney",
      "Rome",
      "Berlin",
      "Barcelona",
      "Dubai",
      "Rio de Janeiro",
      "Moscow",
      "Cairo",
      "Bangkok",
      "Singapore",
      "Istanbul",
      // Famous People
      "Einstein",
      "Shakespeare",
      "Mona Lisa",
      "Cleopatra",
      "Napoleon",
      "Gandhi",
      "Mozart",
      "Leonardo da Vinci",
      "Newton",
      "Beethoven",
      "Picasso",
      "Michelangelo",
      "Galileo",
      // Movies & Series
      "Titanic",
      "Harry Potter",
      "Star Wars",
      "Friends",
      "The Matrix",
      "Game of Thrones",
      "The Lord of the Rings",
      "Breaking Bad",
      "The Avengers",
      "Inception",
      "The Office",
      "Stranger Things",
      "Pulp Fiction",
      "The Godfather",
      "Frozen",
    ];
    const count = 5 + Math.floor(Math.random() * 6);
    const shuffled = [...wordList].sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, count);

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
        size: 40 + Math.random() * 16,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 20 + Math.random() * 15,
        opacity: 0.08 + Math.random() * 0.12,
        rotation: (Math.random() - 0.5) * 15,
      });
    }
    setTimeout(() => {
      setWordData(data);
    }, 0);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
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
    const iconList = [
      "🎯",
      "🎲",
      "🎨",
      "🎭",
      "🎬",
      "🎤",
      "🎧",
      "🎮",
      "🎳",
      "🎵",
      "🎸",
      "🎹",
      "🎺",
      "🎻",
    ];
    const count = 5 + Math.floor(Math.random() * 6);
    const shuffled = [...iconList].sort(() => Math.random() - 0.5);
    const selectedIcons = shuffled.slice(0, count);

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
        size: 60 + Math.random() * 40,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 15 + Math.random() * 10,
        opacity: 0.1 + Math.random() * 0.15,
      });
    }
    setTimeout(() => {
      setIconData(data);
    }, 0);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
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

export default function OpenGraphPage() {
  return (
    <div
      className="relative bg-zinc-900 flex items-center justify-center overflow-hidden"
      style={{ width: "1200px", height: "630px" }}
    >
      <FloatingIcons />
      <FloatingWords />
      <div className="relative z-10 flex flex-col items-center gap-8 text-center px-12">
        <h1 className="text-[12rem] font-bold tracking-tight text-pink-500 drop-shadow-[0_0_30px_rgba(236,72,153,0.2)]">
          TABOO
        </h1>
        <p className="text-5xl text-white font-medium drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]">
          The ultimate word-guessing party game
        </p>
      </div>
    </div>
  );
}
