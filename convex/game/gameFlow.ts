import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const startGame = mutation({
  args: {
    roomId: v.id("rooms"),
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    if (room.hostId !== args.playerId) {
      throw new Error("Only the host can start the game");
    }

    if (room.status !== "lobby" && room.status !== "finished") {
      throw new Error("Game has already started");
    }

    // Clear final scores when starting a new game
    if (room.finalScores) {
      await ctx.db.patch(args.roomId, {
        finalScores: undefined,
      });
    }

    // Clear all guesses from previous games
    const oldGuesses = await ctx.db
      .query("guesses")
      .filter((q) => q.eq(q.field("roomId"), args.roomId))
      .collect();

    for (const guess of oldGuesses) {
      await ctx.db.delete(guess._id);
    }

    // Check both teams have at least 2 players
    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const redTeam = players.filter((p) => p.team === "red");
    const blueTeam = players.filter((p) => p.team === "blue");

    if (redTeam.length < 2 || blueTeam.length < 2) {
      throw new Error("Both teams need at least 2 players");
    }

    // Start the game but don't start the turn yet
    // The first explainer needs to click "Start Turn" to begin
    await ctx.db.patch(args.roomId, {
      status: "playing",
      currentRound: 1,
      currentTeam: "red",
      currentExplainerIndex: { red: 0, blue: 0 },
      currentWord: null,
      scores: { red: 0, blue: 0 },
      usedWordIds: [],
      turnEndTime: null,
      turnScheduleId: undefined,
    });
  },
});

export const resetToLobby = mutation({
  args: {
    roomId: v.id("rooms"),
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    // Verify the player exists in the room
    const player = await ctx.db.get(args.playerId);
    if (!player || player.roomId !== args.roomId) {
      throw new Error("Player not found in room");
    }

    // Cancel any scheduled turn end function if it exists
    if (room.turnScheduleId) {
      await ctx.scheduler.cancel(room.turnScheduleId);
    }

    // Reset all game state back to lobby
    // Any player can reset to lobby, but only host can start the game
    await ctx.db.patch(args.roomId, {
      status: "lobby",
      currentRound: 1,
      currentTeam: "red",
      currentExplainerIndex: { red: 0, blue: 0 },
      currentWord: null,
      scores: { red: 0, blue: 0 },
      finalScores: undefined,
      turnEndTime: null,
      usedWordIds: [],
      turnScheduleId: undefined,
    });
  },
});

export const clearFinalScores = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    await ctx.db.patch(args.roomId, {
      finalScores: undefined,
    });
  },
});
