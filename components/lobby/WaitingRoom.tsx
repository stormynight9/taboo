"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Doc, Id } from "../../convex/_generated/dataModel";

interface WaitingRoomProps {
  players: Doc<"players">[];
  roomHostId: Id<"players">;
}

export default function WaitingRoom({ players, roomHostId }: WaitingRoomProps) {
  if (players.length === 0) return null;

  return (
    <div className="game-card p-4">
      <h3 className="text-sm font-medium text-gray-400 mb-2">
        Waiting to pick a team:
      </h3>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {players.map((player) => (
            <motion.div
              key={player._id}
              layoutId={player._id}
              layout
              transition={{
                layout: { duration: 0.3, ease: "easeInOut" },
              }}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-900 rounded-full text-sm text-white"
            >
              <span className="leading-none">
                {player.name}
                {player._id === roomHostId && " 👑"}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
