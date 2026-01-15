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

    // Get or create default pack
    let defaultPack = await ctx.db
      .query("packs")
      .withIndex("by_isDefault", (q) => q.eq("isDefault", true))
      .first();

    if (!defaultPack) {
      const packId = await ctx.db.insert("packs", {
        title: "General Words",
        description: "Common English words and phrases",
        isDefault: true,
        emoji: "📚",
      });
      defaultPack = await ctx.db.get(packId);
      if (!defaultPack) {
        throw new Error("Failed to create default pack");
      }
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
      selectedPackIds: [defaultPack._id],
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

export const updateSettings = mutation({
  args: {
    roomId: v.id("rooms"),
    playerId: v.id("players"),
    settings: v.object({
      rounds: v.number(),
      turnTime: v.number(),
      tabooWordCount: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    // Only the host can update settings
    if (room.hostId !== args.playerId) {
      throw new Error("Only the host can update room settings");
    }

    // Only allow updating settings in lobby
    if (room.status !== "lobby") {
      throw new Error("Settings can only be changed in the lobby");
    }

    await ctx.db.patch(args.roomId, {
      settings: args.settings,
    });
  },
});

export const migrateRoomsToPacks = mutation({
  args: {},
  handler: async (ctx) => {
    // Get or create default pack
    let defaultPack = await ctx.db
      .query("packs")
      .withIndex("by_isDefault", (q) => q.eq("isDefault", true))
      .first();

    if (!defaultPack) {
      const packId = await ctx.db.insert("packs", {
        title: "General Words",
        description: "Common English words and phrases",
        isDefault: true,
      });
      defaultPack = await ctx.db.get(packId);
      if (!defaultPack) {
        throw new Error("Failed to create default pack");
      }
    }

    // Find all rooms without selectedPackIds
    const allRooms = await ctx.db.query("rooms").collect();
    let updatedCount = 0;

    for (const room of allRooms) {
      if (!room.selectedPackIds) {
        await ctx.db.patch(room._id, {
          selectedPackIds: [defaultPack._id],
        });
        updatedCount++;
      }
    }

    return {
      message: `Migrated ${updatedCount} rooms to use default pack`,
      updatedRooms: updatedCount,
    };
  },
});

export const updateSelectedPacks = mutation({
  args: {
    roomId: v.id("rooms"),
    playerId: v.id("players"),
    packIds: v.array(v.id("packs")),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    // Only the host can update packs
    if (room.hostId !== args.playerId) {
      throw new Error("Only the host can update selected packs");
    }

    // Only allow updating packs in lobby
    if (room.status !== "lobby") {
      throw new Error("Packs can only be changed in the lobby");
    }

    // Validate that at least one pack is selected
    if (args.packIds.length === 0) {
      throw new Error("At least one pack must be selected");
    }

    // Validate that all pack IDs exist
    for (const packId of args.packIds) {
      const pack = await ctx.db.get(packId);
      if (!pack) {
        throw new Error(`Pack with ID ${packId} not found`);
      }
    }

    await ctx.db.patch(args.roomId, {
      selectedPackIds: args.packIds,
    });
  },
});

