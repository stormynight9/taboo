/**
 * Player color generation utilities for consistent color assignment
 */

/**
 * Generate a consistent color for a player based on their ID or name
 */
export function getPlayerColor(playerIdOrName: string): string {
  // Hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < playerIdOrName.length; i++) {
    hash = playerIdOrName.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Expanded palette of distinct colors that work well on dark backgrounds
  const colors = [
    "#EC4899", // pink-500
    "#3B82F6", // blue-500
    "#10B981", // emerald-500
    "#F59E0B", // amber-500
    "#8B5CF6", // violet-500
    "#EF4444", // red-500
    "#06B6D4", // cyan-500
    "#F97316", // orange-500
    "#14B8A6", // teal-500
    "#A855F7", // purple-500
    "#22C55E", // green-500
    "#EAB308", // yellow-500
    "#F43F5E", // rose-500
    "#6366F1", // indigo-500
    "#84CC16", // lime-500
    "#EC4899", // pink-500 (duplicate for more variety)
    "#06B6D4", // sky-500
    "#F97316", // orange-500
    "#8B5CF6", // violet-500
    "#10B981", // emerald-500
  ];

  // Use absolute value of hash to get index
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
