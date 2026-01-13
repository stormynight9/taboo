"use client";

import { useEffect, useState } from "react";

interface TimerProps {
  endTime: number | null;
}

export default function Timer({ endTime }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!endTime) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, [endTime]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const isLow = timeLeft <= 10;
  const isCritical = timeLeft <= 5;

  return (
    <div
      className={`text-center transition-all duration-300 ${
        isCritical ? "animate-shake" : ""
      }`}
    >
      <div
        className={`text-6xl md:text-7xl font-mono font-bold tabular-nums ${
          isCritical ? "text-red-500" : isLow ? "text-amber-400" : "text-white"
        }`}
      >
        {minutes}:{seconds.toString().padStart(2, "0")}
      </div>
      <p className="text-gray-400 text-sm mt-1">Time Remaining</p>
    </div>
  );
}
