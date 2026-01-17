import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Submit a chat message when the game is finished
 * Allows all players to chat after the game ends
 */
export const submitChatMessage = mutation({
  args: {
    roomId: v.id("rooms"),
    playerId: v.id("players"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Only allow chat messages when game is finished
    if (room.status !== "finished") {
      throw new Error("Chat is only available after the game ends");
    }

    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    // Verify player is in the room
    if (player.roomId !== args.roomId) {
      throw new Error("Player not in this room");
    }

    // Record the chat message (not a guess, so isCorrect is always false)
    await ctx.db.insert("guesses", {
      roomId: args.roomId,
      playerId: args.playerId,
      playerName: player.name,
      text: args.text.trim(),
      isCorrect: false,
      round: room.currentRound,
      timestamp: Date.now(),
    });
  },
});
