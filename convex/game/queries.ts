import { query } from "../_generated/server";
import { v } from "convex/values";

export const getGuesses = query({
  args: { roomId: v.id("rooms"), round: v.number() },
  handler: async (ctx, args) => {
    const guesses = await ctx.db
      .query("guesses")
      .withIndex("by_room_and_round", (q) =>
        q.eq("roomId", args.roomId).eq("round", args.round)
      )
      .collect();

    // Sort by timestamp to show in chronological order
    return guesses.sort((a, b) => a.timestamp - b.timestamp);
  },
});

export const getAllGuesses = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    // Get room to determine current round
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      return [];
    }

    const currentRound = room.currentRound;
    // Show guesses from current round and previous round (if exists)
    const roundsToShow = currentRound > 1
      ? [currentRound - 1, currentRound]
      : [currentRound];

    // Query each round separately using the by_room_and_round index
    // This is much more efficient than reading all guesses and filtering
    const guessesPromises = roundsToShow.map((round) =>
      ctx.db
        .query("guesses")
        .withIndex("by_room_and_round", (q) =>
          q.eq("roomId", args.roomId).eq("round", round)
        )
        .collect()
    );

    const guessesArrays = await Promise.all(guessesPromises);
    const allGuesses = guessesArrays.flat();

    // Sort by timestamp to show in chronological order
    return allGuesses.sort((a, b) => a.timestamp - b.timestamp);
  },
});
