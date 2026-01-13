import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const create = mutation({
  args: {
    hostName: v.string(),
    sessionId: v.string(),
    settings: v.object({
      rounds: v.number(),
      turnTime: v.number(),
      tabooWordCount: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    // Generate unique room code
    let code = generateRoomCode();
    let existing = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    while (existing) {
      code = generateRoomCode();
      existing = await ctx.db
        .query("rooms")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first();
    }

    // Create room first without hostId
    const roomId = await ctx.db.insert("rooms", {
      code,
      settings: args.settings,
      status: "lobby",
      currentRound: 1,
      currentTeam: "red",
      currentExplainerIndex: { red: 0, blue: 0 },
      currentWord: null,
      scores: { red: 0, blue: 0 },
      turnEndTime: null,
      usedWordIds: [],
    });

    // Create the host player
    const playerId = await ctx.db.insert("players", {
      roomId,
      name: args.hostName,
      sessionId: args.sessionId,
      team: null,
      joinOrder: 0,
    });

    // Update room with hostId
    await ctx.db.patch(roomId, { hostId: playerId });

    return { code, roomId, playerId };
  },
});

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();
    return room;
  },
});

export const get = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.roomId);
  },
});

