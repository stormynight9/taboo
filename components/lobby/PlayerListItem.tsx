"use client";

import { motion } from "framer-motion";
import { Doc, Id } from "../../convex/_generated/dataModel";

interface PlayerListItemProps {
  player: Doc<"players">;
  isHost: boolean;
  isCurrentPlayer: boolean;
  isRoomHost: boolean;
  onKick?: () => void;
}

export default function PlayerListItem({
  player,
  isHost,
  isCurrentPlayer,
  isRoomHost,
  onKick,
}: PlayerListItemProps) {
  const canKick = isHost && !isCurrentPlayer && !isRoomHost;

  return (
    <motion.div
      layoutId={player._id}
      layout
      transition={{
        layout: { duration: 0.3, ease: "easeInOut" },
      }}
      className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-zinc-900"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="font-medium text-white truncate">{player.name}</span>
        {isRoomHost && (
          <span
            className="shrink-0 text-sm"
            style={{ textBox: "trim-both cap alphabetic" }}
          >
            👑
          </span>
        )}
        {isCurrentPlayer && (
          <span className="text-xs text-gray-400 shrink-0 ml-auto">(You)</span>
        )}
      </div>
      {canKick && onKick && (
        <button
          onClick={onKick}
          className="text-red-400 hover:text-red-500 shrink-0 hover:cursor-pointer"
          title={`Kick ${player.name}`}
        >
          Kick
        </button>
      )}
    </motion.div>
  );
}
