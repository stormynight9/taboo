import { mutation, query, internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Helper to pick a random word that hasn't been used
async function pickRandomWord(
  ctx: MutationCtx,
  roomId: Id<"rooms">,
  usedWordIds: Id<"words">[],
  tabooWordCount: number,
  selectedPackIds: Id<"packs">[]
) {
  // Optimize: First collect only word IDs to reduce bandwidth
  let allWordIds: Id<"words">[] = [];

  // Handle case where selectedPackIds might be undefined (for existing rooms)
  const packIds = selectedPackIds || [];

  if (packIds.length === 0) {
    // If no packs selected, get all word IDs (fallback)
    const allWords = await ctx.db.query("words").collect();
    allWordIds = allWords.map((w) => w._id);
  } else {
    // Get word IDs from selected packs (more efficient than loading full documents)
    for (const packId of packIds) {
      const packWords = await ctx.db
        .query("words")
        .withIndex("by_pack", (q) => q.eq("packId", packId))
        .collect();
      allWordIds.push(...packWords.map((w) => w._id));
    }
  }

  // Filter out used words (working with IDs is faster)
  const availableWordIds = allWordIds.filter(
    (id) => !usedWordIds.includes(id)
  );

  let selectedWordId: Id<"words">;
  let resetUsed = false;

  if (availableWordIds.length === 0) {
    // Reset used words if we've gone through all
    selectedWordId =
      allWordIds[Math.floor(Math.random() * allWordIds.length)];
    resetUsed = true;
  } else {
    // Pick random word ID from available words
    selectedWordId =
      availableWordIds[
        Math.floor(Math.random() * availableWordIds.length)
      ];
  }

  // Only fetch the selected word document (much more efficient)
  const randomWord = await ctx.db.get(selectedWordId);
  if (!randomWord) {
    throw new Error("Selected word not found");
  }

  return {
    wordId: randomWord._id,
    word: randomWord.word,
    tabooWords: randomWord.tabooWords.slice(0, tabooWordCount),
    resetUsed,
  };
}

// Helper function to calculate Levenshtein distance (edit distance)
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return matrix[len1][len2];
}

// Helper function to check if a guess is a fuzzy match of the correct word
// Returns an object with match status and whether it's exact
function isFuzzyMatch(
  guess: string,
  correctWord: string
): {
  isMatch: boolean;
  isExact: boolean;
} {
  // Normalize both strings (lowercase and trim)
  const normalizedGuess = guess.toLowerCase().trim();
  const normalizedCorrect = correctWord.toLowerCase().trim();

  // Exact match (fast path)
  if (normalizedGuess === normalizedCorrect) {
    return { isMatch: true, isExact: true };
  }

  // Calculate edit distance
  const distance = levenshteinDistance(normalizedGuess, normalizedCorrect);

  // Moderate tolerance:
  // - Words ≤ 5 characters: accept edit distance ≤ 1
  // - Words > 5 characters: accept edit distance ≤ 2
  const maxDistance = normalizedCorrect.length <= 5 ? 1 : 2;

  const isMatch = distance <= maxDistance;
  return { isMatch, isExact: false };
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

    // Pick first word
    const wordData = await pickRandomWord(
      ctx,
      args.roomId,
      [],
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

    // Check if guess is correct using fuzzy matching
    let isCorrect = false;
    let isExact = false;
    let logText = args.text;

    if (room.currentWord !== null) {
      const matchResult = isFuzzyMatch(args.text, room.currentWord.word);
      isCorrect = matchResult.isMatch;
      isExact = matchResult.isExact;

      // If it's a fuzzy match (not exact), show both the guess and correct word in logs
      if (isCorrect && !isExact) {
        logText = `${args.text} (correct word: "${room.currentWord.word}")`;
      }
    }

    // Record the guess
    await ctx.db.insert("guesses", {
      roomId: args.roomId,
      playerId: args.playerId,
      playerName: player.name,
      text: logText,
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
        room.settings.tabooWordCount,
        room.selectedPackIds || []
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
    tabooWord: v.string(),
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

    // Validate that the provided tabooWord exists in the current word's taboo words
    if (!room.currentWord.tabooWords.includes(args.tabooWord)) {
      throw new Error("Invalid taboo word");
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
      room.settings.tabooWordCount,
      room.selectedPackIds ?? []
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

    // Log the taboo violation with the specific taboo word
    await ctx.db.insert("guesses", {
      roomId: args.roomId,
      playerId: args.playerId,
      playerName: player.name,
      text: `🚨 ${player.name} buzzed "${currentWord}" - taboo: "${args.tabooWord}"`,
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
      room.settings.tabooWordCount,
      room.selectedPackIds ?? []
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

    // Stay on the same team - just pass to next teammate
    // The modulo in the explainer calculation will handle wrapping around

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

      // Store final scores and reset to lobby
      await ctx.db.patch(args.roomId, {
        status: "lobby",
        finalScores: room.scores,
        currentRound: 1,
        currentTeam: "red",
        currentExplainerIndex: { red: 0, blue: 0 },
        currentWord: null,
        scores: { red: 0, blue: 0 },
        turnEndTime: null,
        usedWordIds: [],
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

export const getAllGuesses = query({
  args: { 
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    // Get room to determine current round
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      return [];
    }

    const currentRound = room.currentRound;
    // Show guesses from current round and previous round (if exists)
    const roundsToShow = currentRound > 1 
      ? [currentRound - 1, currentRound]
      : [currentRound];

    // Get guesses for the room using index for better performance
    const allGuesses = await ctx.db
      .query("guesses")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    // Filter to only current and previous round to reduce bandwidth
    const filteredGuesses = allGuesses.filter((guess) =>
      roundsToShow.includes(guess.round)
    );

    // Sort by timestamp to show in chronological order
    return filteredGuesses.sort((a, b) => a.timestamp - b.timestamp);
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

    // Only the host can reset to lobby
    if (room.hostId !== args.playerId) {
      throw new Error("Only the host can reset the game to lobby");
    }

    // Cancel any scheduled turn end function if it exists
    if (room.turnScheduleId) {
      await ctx.scheduler.cancel(room.turnScheduleId);
    }

    // Reset all game state back to lobby
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
