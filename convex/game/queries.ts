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

    // Get guesses for the room using index for better performance
    const allGuesses = await ctx.db
      .query("guesses")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    // Filter to only current and previous round to reduce bandwidth
    const filteredGuesses = allGuesses.filter((guess) =>
      roundsToShow.includes(guess.round)
    );

    // Sort by timestamp to show in chronological order
    return filteredGuesses.sort((a, b) => a.timestamp - b.timestamp);
  },
});
