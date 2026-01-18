import { internalMutation } from "./_generated/server";

/**
 * Cleanup function to delete old rooms and save statistics before deletion
 * This is an internal mutation that should only be called by cron jobs
 */
export const cleanupOldRooms = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    // Find all rooms older than 24 hours
    const allRooms = await ctx.db.query("rooms").collect();
    const oldRooms = allRooms.filter(
      (room) => room._creationTime < twentyFourHoursAgo
    );

    let roomsDeleted = 0;
    let playersDeleted = 0;
    let guessesDeleted = 0;

    // Process each old room
    for (const room of oldRooms) {
      // Get all players for this room
      const players = await ctx.db
        .query("players")
        .withIndex("by_room", (q) => q.eq("roomId", room._id))
        .collect();

      // Get all guesses for this room
      const guesses = await ctx.db
        .query("guesses")
        .withIndex("by_room", (q) => q.eq("roomId", room._id))
        .collect();

      // Save statistics to cleanup_logs before deletion
      await ctx.db.insert("cleanup_logs", {
        roomCode: room.code,
        status: room.status,
        createdAt: room._creationTime,
        deletedAt: now,
        playerCount: players.length,
        guessCount: guesses.length,
        finalScores: room.finalScores,
        currentRound: room.currentRound,
        settings: room.settings,
      });

      // Delete all players associated with this room
      for (const player of players) {
        await ctx.db.delete(player._id);
        playersDeleted++;
      }

      // Delete all guesses associated with this room
      for (const guess of guesses) {
        await ctx.db.delete(guess._id);
        guessesDeleted++;
      }

      // Delete the room itself
      await ctx.db.delete(room._id);
      roomsDeleted++;
    }

    return {
      roomsDeleted,
      playersDeleted,
      guessesDeleted,
      message: `Cleaned up ${roomsDeleted} rooms, ${playersDeleted} players, and ${guessesDeleted} guesses`,
    };
  },
});
