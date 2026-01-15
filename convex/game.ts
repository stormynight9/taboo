import { mutation, query, internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import type { Doc } from "./_generated/dataModel";

// Helper to pick a random word that hasn't been used
async function pickRandomWord(
  ctx: MutationCtx,
  roomId: Id<"rooms">,
  usedWordIds: Id<"words">[],
  tabooWordCount: number
) {
  const allWords = await ctx.db.query("words").collect();
  const availableWords = allWords.filter(
    (w: Doc<"words">) => !usedWordIds.includes(w._id)
  );

  if (availableWords.length === 0) {
    // Reset used words if we've gone through all
    const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
    return {
      wordId: randomWord._id,
      word: randomWord.word,
      tabooWords: randomWord.tabooWords.slice(0, tabooWordCount),
      resetUsed: true,
    };
  }

  const randomWord =
    availableWords[Math.floor(Math.random() * availableWords.length)];
  return {
    wordId: randomWord._id,
    word: randomWord.word,
    tabooWords: randomWord.tabooWords.slice(0, tabooWordCount),
    resetUsed: false,
  };
}

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

    if (room.status !== "lobby") {
      throw new Error("Game has already started");
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

    // Pick first word
    const wordData = await pickRandomWord(
      ctx,
      args.roomId,
      [],
      room.settings.tabooWordCount
    );

    const turnEndTime = Date.now() + room.settings.turnTime * 1000;

    // Schedule turn end
    const scheduleId = await ctx.scheduler.runAfter(
      room.settings.turnTime * 1000,
      internal.game.endTurn,
      { roomId: args.roomId }
    );

    await ctx.db.patch(args.roomId, {
      status: "playing",
      currentWord: {
        word: wordData.word,
        tabooWords: wordData.tabooWords,
      },
      usedWordIds: [wordData.wordId],
      turnEndTime,
      turnScheduleId: scheduleId,
    });
  },
});

export const submitGuess = mutation({
  args: {
    roomId: v.id("rooms"),
    playerId: v.id("players"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room || room.status !== "playing") {
      throw new Error("Game is not in progress");
    }

    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    // Only the guessing team (same as current team) can submit guesses
    if (player.team !== room.currentTeam) {
      throw new Error("Only the guessing team can submit answers");
    }

    // Get current team players to find explainer
    const teamPlayers = await ctx.db
      .query("players")
      .withIndex("by_room_and_team", (q) =>
        q.eq("roomId", args.roomId).eq("team", room.currentTeam)
      )
      .collect();

    const sortedTeamPlayers = teamPlayers.sort(
      (a, b) => a.joinOrder - b.joinOrder
    );
    const explainerIndex =
      room.currentTeam === "red"
        ? room.currentExplainerIndex.red
        : room.currentExplainerIndex.blue;
    const explainer =
      sortedTeamPlayers[explainerIndex % sortedTeamPlayers.length];

    // Explainer cannot guess
    if (explainer && player._id === explainer._id) {
      throw new Error("The explainer cannot guess");
    }

    // Check if guess is correct (case-insensitive)
    const isCorrect =
      room.currentWord !== null &&
      args.text.toLowerCase().trim() === room.currentWord.word.toLowerCase();

    // Record the guess
    await ctx.db.insert("guesses", {
      roomId: args.roomId,
      playerId: args.playerId,
      playerName: player.name,
      text: args.text,
      isCorrect,
      round: room.currentRound,
      timestamp: Date.now(),
    });

    // If correct, award point and get new word
    if (isCorrect) {
      const newScores = { ...room.scores };
      if (room.currentTeam === "red") {
        newScores.red += 1;
      } else {
        newScores.blue += 1;
      }

      const wordData = await pickRandomWord(
        ctx,
        args.roomId,
        room.usedWordIds,
        room.settings.tabooWordCount
      );

      await ctx.db.patch(args.roomId, {
        scores: newScores,
        currentWord: {
          word: wordData.word,
          tabooWords: wordData.tabooWords,
        },
        usedWordIds: wordData.resetUsed
          ? [wordData.wordId]
          : [...room.usedWordIds, wordData.wordId],
      });
    }

    return { isCorrect };
  },
});

export const buzzTaboo = mutation({
  args: {
    roomId: v.id("rooms"),
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room || room.status !== "playing") {
      throw new Error("Game is not in progress");
    }

    if (room.currentWord === null) {
      throw new Error("Turn has not started yet");
    }

    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    // Only the opposing team can buzz
    if (player.team === room.currentTeam || player.team === null) {
      throw new Error("Only the opposing team can buzz for taboo violations");
    }

    // Deduct point from current team
    const newScores = { ...room.scores };
    if (room.currentTeam === "red") {
      newScores.red = Math.max(0, newScores.red - 1);
    } else {
      newScores.blue = Math.max(0, newScores.blue - 1);
    }

    // Get the current word before it changes (for logging)
    const currentWord = room.currentWord.word;

    // Get new word
    const wordData = await pickRandomWord(
      ctx,
      args.roomId,
      room.usedWordIds,
      room.settings.tabooWordCount
    );

    await ctx.db.patch(args.roomId, {
      scores: newScores,
      currentWord: {
        word: wordData.word,
        tabooWords: wordData.tabooWords,
      },
      usedWordIds: wordData.resetUsed
        ? [wordData.wordId]
        : [...room.usedWordIds, wordData.wordId],
    });

    // Log the taboo violation
    await ctx.db.insert("guesses", {
      roomId: args.roomId,
      playerId: args.playerId,
      playerName: player.name,
      text: `🚨 ${player.name} buzzed for taboo violation on "${currentWord}"!`,
      isCorrect: false,
      round: room.currentRound,
      timestamp: Date.now(),
    });
  },
});

export const skipWord = mutation({
  args: {
    roomId: v.id("rooms"),
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room || room.status !== "playing") {
      throw new Error("Game is not in progress");
    }

    if (room.currentWord === null) {
      throw new Error("Turn has not started yet");
    }

    // Get current team players to find explainer
    const teamPlayers = await ctx.db
      .query("players")
      .withIndex("by_room_and_team", (q) =>
        q.eq("roomId", args.roomId).eq("team", room.currentTeam)
      )
      .collect();

    const sortedTeamPlayers = teamPlayers.sort(
      (a, b) => a.joinOrder - b.joinOrder
    );
    const explainerIndex =
      room.currentTeam === "red"
        ? room.currentExplainerIndex.red
        : room.currentExplainerIndex.blue;
    const explainer =
      sortedTeamPlayers[explainerIndex % sortedTeamPlayers.length];

    // Only the explainer can skip
    if (!explainer || explainer._id !== args.playerId) {
      throw new Error("Only the explainer can skip words");
    }

    // Get the current word before skipping
    const skippedWord = room.currentWord?.word || "unknown";

    // Get new word (no penalty)
    const wordData = await pickRandomWord(
      ctx,
      args.roomId,
      room.usedWordIds,
      room.settings.tabooWordCount
    );

    await ctx.db.patch(args.roomId, {
      currentWord: {
        word: wordData.word,
        tabooWords: wordData.tabooWords,
      },
      usedWordIds: wordData.resetUsed
        ? [wordData.wordId]
        : [...room.usedWordIds, wordData.wordId],
    });

    // Log the skip
    await ctx.db.insert("guesses", {
      roomId: args.roomId,
      playerId: args.playerId,
      playerName: explainer.name,
      text: `⏭️ ${explainer.name} skipped: "${skippedWord}"`,
      isCorrect: false,
      round: room.currentRound,
      timestamp: Date.now(),
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
      await ctx.db.patch(args.roomId, {
        status: "finished",
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
    const teamPlayers = await ctx.db
      .query("players")
      .withIndex("by_room_and_team", (q) =>
        q.eq("roomId", args.roomId).eq("team", room.currentTeam)
      )
      .collect();

    const sortedTeamPlayers = teamPlayers.sort(
      (a, b) => a.joinOrder - b.joinOrder
    );
    const explainerIndex =
      room.currentTeam === "red"
        ? room.currentExplainerIndex.red
        : room.currentExplainerIndex.blue;
    const explainer =
      sortedTeamPlayers[explainerIndex % sortedTeamPlayers.length];

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
      room.settings.tabooWordCount
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
