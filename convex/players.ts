import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const join = mutation({
  args: {
    roomCode: v.string(),
    name: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate player name length
    if (args.name.trim().length === 0) {
      throw new Error("Name cannot be empty");
    }
    if (args.name.length > 30) {
      throw new Error("Name must be 30 characters or less");
    }

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
    if (!room || (room.status !== "lobby" && room.status !== "finished")) {
      throw new Error("Cannot change team while game is in progress");
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

    // Only allow randomizing in lobby or after game finished
    if (room.status !== "lobby" && room.status !== "finished") {
      throw new Error("Cannot randomize teams while game is in progress");
    }

    // Verify the requester is the host
    if (room.hostId !== args.hostPlayerId) {
      throw new Error("Only the host can randomize teams");
    }

    // Get all players in the room
    const allPlayers = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    // Filter to only players who are already in a team (exclude spectators)
    const playersInTeams = allPlayers.filter(
      (p) => p.team === "red" || p.team === "blue"
    );

    if (playersInTeams.length < 2) {
      throw new Error("Need at least 2 players in teams to randomize");
    }

    // Store original team assignments to check if anything changed
    const originalTeams = new Map<Id<"players">, "red" | "blue">();
    for (const player of playersInTeams) {
      originalTeams.set(player._id, player.team!);
    }

    // Shuffle only players in teams (Fisher-Yates shuffle)
    const shuffled = [...playersInTeams];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Assign players alternately to red and blue teams
    // If odd number, red team gets the extra player
    const newAssignments = new Map<Id<"players">, "red" | "blue">();
    for (let i = 0; i < shuffled.length; i++) {
      const team = i % 2 === 0 ? "red" : "blue";
      newAssignments.set(shuffled[i]._id, team);
    }

    // Check if any player's team actually changed
    let hasChanged = false;
    for (const player of playersInTeams) {
      if (originalTeams.get(player._id) !== newAssignments.get(player._id)) {
        hasChanged = true;
        break;
      }
    }

    // If no one changed teams, swap at least one pair to ensure change
    if (!hasChanged && shuffled.length >= 2) {
      // Find two players on different teams (or same team if only 2 players)
      let player1Index = 0;
      let player2Index = 1;
      
      // If we have more than 2 players, try to find players on different teams
      if (shuffled.length > 2) {
        const redPlayers: number[] = [];
        const bluePlayers: number[] = [];
        for (let i = 0; i < shuffled.length; i++) {
          if (newAssignments.get(shuffled[i]._id) === "red") {
            redPlayers.push(i);
          } else {
            bluePlayers.push(i);
          }
        }
        
        // Swap one player from red with one from blue
        if (redPlayers.length > 0 && bluePlayers.length > 0) {
          player1Index = redPlayers[0];
          player2Index = bluePlayers[0];
        }
      }
      
      // Swap the teams of these two players
      const temp = newAssignments.get(shuffled[player1Index]._id);
      newAssignments.set(
        shuffled[player1Index]._id,
        newAssignments.get(shuffled[player2Index]._id)!
      );
      newAssignments.set(shuffled[player2Index]._id, temp!);
    }

    // Apply the new team assignments
    // Spectators (team === null) remain unchanged
    for (const player of shuffled) {
      const newTeam = newAssignments.get(player._id)!;
      await ctx.db.patch(player._id, { team: newTeam });
    }
  },
});
