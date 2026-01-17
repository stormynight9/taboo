/**
 * Fuzzy matching utilities for guess validation
 */

/**
 * Calculate Levenshtein distance (edit distance) between two strings
 */
export function levenshteinDistance(str1: string, str2: string): number {
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

/**
 * Check if a guess is a fuzzy match of the correct word
 * Returns an object with match status and whether it's exact
 */
export function isFuzzyMatch(
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
