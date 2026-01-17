"use client";

import { Button } from "@/components/ui/button";

interface ExplainerControlsProps {
  onSkipWord: () => void;
}

export default function ExplainerControls({
  onSkipWord,
}: ExplainerControlsProps) {
  return (
    <div className="game-card p-4">
      <p className="text-xs uppercase tracking-wider text-gray-400 mb-3">
        Explainer Controls
      </p>
      <Button onClick={onSkipWord} size="lg" className="w-full">
        ⏭️ Skip Word
      </Button>
    </div>
  );
}
