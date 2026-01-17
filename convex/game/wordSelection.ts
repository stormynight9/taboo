import type { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Word selection utilities
 */

export interface WordSelectionResult {
  wordId: Id<"words">;
  word: string;
  tabooWords: string[];
  resetUsed: boolean;
}

/**
 * Pick a random word that hasn't been used
 */
export async function pickRandomWord(
  ctx: MutationCtx,
  roomId: Id<"rooms">,
  usedWordIds: Id<"words">[],
  tabooWordCount: number,
  selectedPackIds: Id<"packs">[]
): Promise<WordSelectionResult> {
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
