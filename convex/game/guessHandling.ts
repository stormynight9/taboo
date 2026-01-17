import { mutation } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { pickRandomWord } from "./wordSelection";
import { isFuzzyMatch } from "./fuzzyMatching";

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
    .withIndex("by_room_and_team", (q) =>
      q.eq("roomId", roomId).eq("team", currentTeam)
    )
    .collect();

  const sortedTeamPlayers = teamPlayers.sort(
    (a, b) => a.joinOrder - b.joinOrder
  );
  const index =
    currentTeam === "red"
      ? explainerIndex.red
      : explainerIndex.blue;
  return sortedTeamPlayers[index % sortedTeamPlayers.length];
}

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
    const explainer = await getExplainer(
      ctx,
      args.roomId,
      room.currentTeam,
      room.currentExplainerIndex
    );

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

    // Store the word we're buzzing for (to detect race conditions)
    const wordWeAreBuzzingFor = room.currentWord.word;

    // Re-read the room right before updating to check for race conditions
    // If the word has changed, someone else already buzzed
    const roomCheck = await ctx.db.get(args.roomId);
    if (
      !roomCheck ||
      !roomCheck.currentWord ||
      roomCheck.currentWord.word !== wordWeAreBuzzingFor
    ) {
      // Word has changed, someone else already buzzed
      throw new Error("Word has already changed - another player buzzed first");
    }

    // Deduct point from current team
    const newScores = { ...roomCheck.scores };
    if (roomCheck.currentTeam === "red") {
      newScores.red = Math.max(0, newScores.red - 1);
    } else {
      newScores.blue = Math.max(0, newScores.blue - 1);
    }

    // Get the current word before it changes (for logging)
    const currentWord = roomCheck.currentWord.word;

    // Get new word
    const wordData = await pickRandomWord(
      ctx,
      args.roomId,
      roomCheck.usedWordIds,
      roomCheck.settings.tabooWordCount,
      roomCheck.selectedPackIds ?? []
    );

    await ctx.db.patch(args.roomId, {
      scores: newScores,
      currentWord: {
        word: wordData.word,
        tabooWords: wordData.tabooWords,
      },
      usedWordIds: wordData.resetUsed
        ? [wordData.wordId]
        : [...roomCheck.usedWordIds, wordData.wordId],
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
    const explainer = await getExplainer(
      ctx,
      args.roomId,
      room.currentTeam,
      room.currentExplainerIndex
    );

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
