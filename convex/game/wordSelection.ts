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
 * Get or populate word IDs for a pack (cached in pack document for performance)
 */
async function getPackWordIds(
  ctx: MutationCtx,
  packId: Id<"packs">
): Promise<Id<"words">[]> {
  const pack = await ctx.db.get(packId);
  if (!pack) {
    throw new Error("Pack not found");
  }

  // If word IDs are cached, use them
  if (pack.wordIds && pack.wordIds.length > 0) {
    return pack.wordIds;
  }

  // Otherwise, populate the cache by reading all words for this pack
  const packWords = await ctx.db
    .query("words")
    .withIndex("by_pack", (q) => q.eq("packId", packId))
    .collect();
  
  const wordIds = packWords.map((w) => w._id);

  // Cache the word IDs in the pack document for future use
  await ctx.db.patch(packId, { wordIds });

  return wordIds;
}

/**
 * Pick a random word that hasn't been used
 * Optimized to use cached word IDs from pack documents instead of reading all words
 */
export async function pickRandomWord(
  ctx: MutationCtx,
  roomId: Id<"rooms">,
  usedWordIds: Id<"words">[],
  tabooWordCount: number,
  selectedPackIds: Id<"packs">[]
): Promise<WordSelectionResult> {
  // Handle case where selectedPackIds might be undefined (for existing rooms)
  const packIds = selectedPackIds || [];

  // Convert usedWordIds to Set for O(1) lookup
  const usedSet = new Set(usedWordIds);

  let allWordIds: Id<"words">[] = [];

  if (packIds.length === 0) {
    // If no packs selected, we need to read all words (fallback case)
    // This is less common, so we accept the bandwidth cost here
    const allWords = await ctx.db.query("words").collect();
    allWordIds = allWords.map((w) => w._id);
  } else {
    // Get word IDs from pack caches (only reads pack documents, not all words!)
    for (const packId of packIds) {
      const packWordIds = await getPackWordIds(ctx, packId);
      allWordIds.push(...packWordIds);
    }
  }

  // Filter out used words
  const availableWordIds = allWordIds.filter((id) => !usedSet.has(id));

  let selectedWordId: Id<"words">;
  let resetUsed = false;

  if (availableWordIds.length === 0) {
    // Reset used words if we've gone through all
    selectedWordId =
      allWordIds[Math.floor(Math.random() * allWordIds.length)];
    resetUsed = true;
  } else {
    // Pick random word ID from available words
    const randomIndex = Math.floor(Math.random() * availableWordIds.length);
    selectedWordId = availableWordIds[randomIndex];
  }

  // Only fetch the selected word document
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
