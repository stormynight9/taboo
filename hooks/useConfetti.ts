import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

/**
 * Custom hook for confetti animation when game finishes
 */
export function useConfetti(
  isGameFinished: boolean,
  finalScores: { red: number; blue: number } | undefined
) {
  const confettiTriggered = useRef(false);

  useEffect(() => {
    if (isGameFinished && finalScores && !confettiTriggered.current) {
      const winner =
        finalScores.red > finalScores.blue
          ? "red"
          : finalScores.blue > finalScores.red
          ? "blue"
          : null;

      // Show confetti for everyone (not just winning team) in winning team's color
      if (winner) {
        confettiTriggered.current = true;

        // Determine confetti color based on winning team
        const colors =
          winner === "red" ? ["#ef4444", "#dc2626"] : ["#3b82f6", "#2563eb"];

        // Create confetti effect
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = {
          startVelocity: 30,
          spread: 360,
          ticks: 60,
          zIndex: 9999,
        };

        function randomInRange(min: number, max: number) {
          return Math.random() * (max - min) + min;
        }

        const interval = setInterval(() => {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);

          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors: colors,
          });
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: colors,
          });
        }, 250);
      }
    }

    // Reset confetti trigger when game is no longer finished
    if (!isGameFinished) {
      confettiTriggered.current = false;
    }
  }, [isGameFinished, finalScores]);
}
