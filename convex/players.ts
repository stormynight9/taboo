import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const join = mutation({
  args: {
    roomCode: v.string(),
    name: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.roomCode.toUpperCase()))
      .first();

    if (!room) {
      throw new Error("Room not found");
    }

    if (room.status !== "lobby") {
      throw new Error("Game has already started");
    }

    // Check if player with this session already exists in this room
    const existingPlayer = await ctx.db
      .query("players")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .filter((q) => q.eq(q.field("roomId"), room._id))
      .first();

    if (existingPlayer) {
      return { playerId: existingPlayer._id, roomId: room._id };
    }

    // Get current player count for join order
    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();

    const playerId = await ctx.db.insert("players", {
      roomId: room._id,
      name: args.name,
      sessionId: args.sessionId,
      team: null,
      joinOrder: players.length,
    });

    return { playerId, roomId: room._id };
  },
});

export const selectTeam = mutation({
  args: {
    playerId: v.id("players"),
    team: v.union(v.literal("red"), v.literal("blue")),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    const room = await ctx.db.get(player.roomId);
    if (!room || room.status !== "lobby") {
      throw new Error("Cannot change team after game started");
    }

    await ctx.db.patch(args.playerId, { team: args.team });
  },
});

export const getByRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
  },
});

export const getBySession = query({
  args: { sessionId: v.string(), roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("players")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .filter((q) => q.eq(q.field("roomId"), args.roomId))
      .first();
  },
});

export const get = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.playerId);
  },
});
