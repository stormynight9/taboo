"use client";

interface RoleBannerProps {
  turnStarted: boolean;
  isExplainer: boolean;
  isOnCurrentTeam: boolean;
  isOnOpposingTeam: boolean;
  isSpectator: boolean;
  currentTeam: "red" | "blue";
  explainerName: string | undefined;
}

export default function RoleBanner({
  turnStarted,
  isExplainer,
  isOnCurrentTeam,
  isOnOpposingTeam,
  isSpectator,
  currentTeam,
  explainerName,
}: RoleBannerProps) {
  const getBannerClasses = () => {
    if (isExplainer || isOnCurrentTeam) {
      return currentTeam === "red"
        ? "bg-red-500/10 border border-red-400"
        : "bg-blue-500/20 border border-blue-500";
    }
    if (isOnOpposingTeam) {
      // Opposing team is the opposite of current team
      return currentTeam === "red"
        ? "bg-blue-500/10 border border-blue-400"
        : "bg-red-500/10 border border-red-400";
    }
    return "bg-zinc-800/50 border border-zinc-600";
  };

  const getBannerText = () => {
    if (!turnStarted) {
      if (isExplainer) {
        return (
          <p className="font-medium text-white">
            ⏸️ It&apos;s your turn! Click &quot;Start Turn&quot; to begin.
          </p>
        );
      }
      if (isSpectator) {
        return (
          <p className="font-medium text-white">
            👁️ You are spectating. Waiting for{" "}
            {explainerName || "the explainer"} to start the turn...
          </p>
        );
      }
      return (
        <p className="font-medium text-white">
          ⏸️ Waiting for {explainerName || "the explainer"} to start the
          turn...
        </p>
      );
    }

    if (isExplainer) {
      return (
        <p className="font-medium text-white">
          🎤 You are the EXPLAINER! Describe the word without using the taboo
          words.
        </p>
      );
    }
    if (isOnCurrentTeam) {
      return (
        <p className="font-medium text-white">
          🎯 Your team is guessing! Type your answers in the chat.
        </p>
      );
    }
    if (isOnOpposingTeam) {
      return (
        <p className="font-medium text-white">
          👀 Watch for taboo violations! Press the buzzer if they say a forbidden
          word.
        </p>
      );
    }
    return (
      <p className="font-medium text-white">
        👁️ You are SPECTATING. Watch the game unfold!
      </p>
    );
  };

  return (
    <div className={`text-center py-3 px-4 rounded-lg ${getBannerClasses()}`}>
      {getBannerText()}
    </div>
  );
}
