"use client";

import { useState, useEffect } from "react";

export default function FloatingIcons() {
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
