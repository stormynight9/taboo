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

    // Allow joining mid-game - players will spectate if game is in progress
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
    team: v.union(v.literal("red"), v.literal("blue"), v.null()),
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

export const kickPlayer = mutation({
  args: {
    roomId: v.id("rooms"),
    hostPlayerId: v.id("players"),
    targetPlayerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Only allow kicking in lobby
    if (room.status !== "lobby") {
      throw new Error("Cannot kick players after game has started");
    }

    // Verify the requester is the host
    if (room.hostId !== args.hostPlayerId) {
      throw new Error("Only the host can kick players");
    }

    // Prevent kicking the host
    if (args.targetPlayerId === args.hostPlayerId) {
      throw new Error("Host cannot kick themselves");
    }

    const targetPlayer = await ctx.db.get(args.targetPlayerId);
    if (!targetPlayer) {
      throw new Error("Player not found");
    }

    // Verify the target player is in the same room
    if (targetPlayer.roomId !== args.roomId) {
      throw new Error("Player is not in this room");
    }

    // Delete the player - they will be redirected on the frontend
    await ctx.db.delete(args.targetPlayerId);
  },
});

export const randomizeTeams = mutation({
  args: {
    roomId: v.id("rooms"),
    hostPlayerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Only allow randomizing in lobby
    if (room.status !== "lobby") {
      throw new Error("Cannot randomize teams after game has started");
    }

    // Verify the requester is the host
    if (room.hostId !== args.hostPlayerId) {
      throw new Error("Only the host can randomize teams");
    }

    // Get all players in the room
    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    if (players.length < 2) {
      throw new Error("Need at least 2 players to randomize teams");
    }

    // Shuffle players array (Fisher-Yates shuffle)
    const shuffled = [...players];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Assign players alternately to red and blue teams
    // If odd number, red team gets the extra player
    for (let i = 0; i < shuffled.length; i++) {
      const team = i % 2 === 0 ? "red" : "blue";
      await ctx.db.patch(shuffled[i]._id, { team });
    }
  },
});
