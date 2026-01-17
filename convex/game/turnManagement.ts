import { mutation, internalMutation } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { Id, Doc } from "../_generated/dataModel";
import { pickRandomWord } from "./wordSelection";

/**
 * Get the current explainer for a team
 */
async function getExplainer(
  ctx: MutationCtx,
  roomId: Id<"rooms">,
  currentTeam: "red" | "blue",
  explainerIndex: { red: number; blue: number }
) {
  const teamPlayers = await ctx.db
    .query("players")
    .withIndex("by_room_and_team", (q: any) =>
      q.eq("roomId", roomId).eq("team", currentTeam)
    )
    .collect();

  const sortedTeamPlayers = teamPlayers.sort(
    (a: Doc<"players">, b: Doc<"players">) => a.joinOrder - b.joinOrder
  );
  const index =
    currentTeam === "red"
      ? explainerIndex.red
      : explainerIndex.blue;
  return sortedTeamPlayers[index % sortedTeamPlayers.length];
}

export const startTurn = mutation({
  args: {
    roomId: v.id("rooms"),
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room || room.status !== "playing") {
      throw new Error("Game is not in progress");
    }

    // Get current team players to find explainer
    const explainer = await getExplainer(
      ctx,
      args.roomId,
      room.currentTeam,
      room.currentExplainerIndex
    );

    // Only the explainer can start the turn
    if (!explainer || explainer._id !== args.playerId) {
      throw new Error("Only the explainer can start the turn");
    }

    // Check if turn is already started
    if (room.currentWord !== null) {
      throw new Error("Turn has already started");
    }

    // Pick new word for this turn
    const wordData = await pickRandomWord(
      ctx,
      args.roomId,
      room.usedWordIds,
      room.settings.tabooWordCount,
      room.selectedPackIds ?? []
    );

    const turnEndTime = Date.now() + room.settings.turnTime * 1000;

    // Schedule turn end
    const scheduleId = await ctx.scheduler.runAfter(
      room.settings.turnTime * 1000,
      internal.game.endTurn,
      { roomId: args.roomId }
    );

    await ctx.db.patch(args.roomId, {
      currentWord: {
        word: wordData.word,
        tabooWords: wordData.tabooWords,
      },
      usedWordIds: wordData.resetUsed
        ? [wordData.wordId]
        : [...room.usedWordIds, wordData.wordId],
      turnEndTime,
      turnScheduleId: scheduleId,
    });
  },
});

export const endTurn = internalMutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room || room.status !== "playing") return;

    // Log the last word when turn ends (if there was one)
    if (room.currentWord) {
      // Get current explainer to log the word
      const explainer = await getExplainer(
        ctx,
        args.roomId,
        room.currentTeam,
        room.currentExplainerIndex
      );

      if (explainer) {
        // Log the last word of the turn
        await ctx.db.insert("guesses", {
          roomId: args.roomId,
          playerId: explainer._id,
          playerName: explainer.name,
          text: `📋 Turn ended. Last word: "${room.currentWord.word}"`,
          isCorrect: false,
          round: room.currentRound,
          timestamp: Date.now(),
        });
      }
    }

    const nextTeam = room.currentTeam === "red" ? "blue" : "red";
    const turnsCompleted = room.currentTeam === "blue"; // Blue just finished = round complete

    let newRound = room.currentRound;
    const newExplainerIndex = { ...room.currentExplainerIndex };

    if (turnsCompleted) {
      newRound += 1;
      // Both teams increment their explainer for next round
      newExplainerIndex.red += 1;
      newExplainerIndex.blue += 1;
    }

    // Check if game is over
    if (newRound > room.settings.rounds) {
      // Determine winner
      const winner =
        room.scores.red > room.scores.blue
          ? "red"
          : room.scores.blue > room.scores.red
          ? "blue"
          : "tie";
      
      // Create winner announcement message
      let winnerText = "";
      if (winner === "red") {
        winnerText = "🏆 🔴 Red Team Wins! 🎉";
      } else if (winner === "blue") {
        winnerText = "🏆 🔵 Blue Team Wins! 🎉";
      } else {
        winnerText = "🏆 🤝 It's a Tie! 🎉";
      }

      // Get a player to use for the system message (use host if available)
      const allPlayers = await ctx.db
        .query("players")
        .withIndex("by_room", (q: any) => q.eq("roomId", args.roomId))
        .collect();
      const systemPlayerId = room.hostId || (allPlayers.length > 0 ? allPlayers[0]._id : null);

      if (systemPlayerId) {
        // Insert winner announcement into chat
        await ctx.db.insert("guesses", {
          roomId: args.roomId,
          playerId: systemPlayerId,
          playerName: "System",
          text: winnerText,
          isCorrect: false,
          round: room.currentRound,
          timestamp: Date.now(),
        });
      }

      // Store final scores and set status to finished (don't reset to lobby)
      await ctx.db.patch(args.roomId, {
        status: "finished",
        finalScores: room.scores,
        currentWord: null,
        turnEndTime: null,
        turnScheduleId: undefined,
      });
      return;
    }

    // Switch to next team/explainer but don't start the turn yet
    // The explainer needs to click "Start Turn" to begin
    await ctx.db.patch(args.roomId, {
      currentTeam: nextTeam,
      currentRound: newRound,
      currentExplainerIndex: newExplainerIndex,
      currentWord: null,
      turnEndTime: null,
      turnScheduleId: undefined,
    });
  },
});

export const skipTurn = mutation({
  args: {
    roomId: v.id("rooms"),
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room || room.status !== "playing") {
      throw new Error("Game is not in progress");
    }

    // Get current team players to find explainer
    const explainer = await getExplainer(
      ctx,
      args.roomId,
      room.currentTeam,
      room.currentExplainerIndex
    );

    // Only the explainer can skip their turn
    if (!explainer || explainer._id !== args.playerId) {
      throw new Error("Only the explainer can skip their turn");
    }

    // Cancel scheduled turn end if turn has started
    if (room.turnScheduleId) {
      await ctx.scheduler.cancel(room.turnScheduleId);
    }

    // Increment explainer index for current team (stays on same team)
    const newExplainerIndex = { ...room.currentExplainerIndex };
    if (room.currentTeam === "red") {
      newExplainerIndex.red += 1;
    } else {
      newExplainerIndex.blue += 1;
    }

    // Log the turn skip
    await ctx.db.insert("guesses", {
      roomId: args.roomId,
      playerId: args.playerId,
      playerName: explainer.name,
      text: `⏭️ ${explainer.name} skipped their turn`,
      isCorrect: false,
      round: room.currentRound,
      timestamp: Date.now(),
    });

    // Update room state - reset turn and move to next explainer on same team
    await ctx.db.patch(args.roomId, {
      currentTeam: room.currentTeam, // Stay on same team
      currentRound: room.currentRound, // Stay on same round
      currentExplainerIndex: newExplainerIndex,
      currentWord: null,
      turnEndTime: null,
      turnScheduleId: undefined,
    });
  },
});

export const skipPlayerTurnAsHost = mutation({
  args: {
    roomId: v.id("rooms"),
    hostPlayerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room || room.status !== "playing") {
      throw new Error("Game is not in progress");
    }

    // Verify the requester is the host
    if (room.hostId !== args.hostPlayerId) {
      throw new Error("Only the host can skip a player's turn");
    }

    // Get current team players to find explainer
    const explainer = await getExplainer(
      ctx,
      args.roomId,
      room.currentTeam,
      room.currentExplainerIndex
    );

    if (!explainer) {
      throw new Error("No explainer found");
    }

    // Cancel scheduled turn end if turn has started
    if (room.turnScheduleId) {
      await ctx.scheduler.cancel(room.turnScheduleId);
    }

    // Increment explainer index for current team (stays on same team)
    const newExplainerIndex = { ...room.currentExplainerIndex };
    if (room.currentTeam === "red") {
      newExplainerIndex.red += 1;
    } else {
      newExplainerIndex.blue += 1;
    }

    // Log the turn skip by host
    await ctx.db.insert("guesses", {
      roomId: args.roomId,
      playerId: explainer._id,
      playerName: explainer.name,
      text: `⏭️ Host skipped ${explainer.name}'s turn`,
      isCorrect: false,
      round: room.currentRound,
      timestamp: Date.now(),
    });

    // Update room state - reset turn and move to next explainer on same team
    await ctx.db.patch(args.roomId, {
      currentTeam: room.currentTeam, // Stay on same team
      currentRound: room.currentRound, // Stay on same round
      currentExplainerIndex: newExplainerIndex,
      currentWord: null,
      turnEndTime: null,
      turnScheduleId: undefined,
    });
  },
});
