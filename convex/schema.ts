import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  rooms: defineTable({
    code: v.string(),
    hostId: v.optional(v.id("players")),
    settings: v.object({
      rounds: v.number(),
      turnTime: v.number(),
      tabooWordCount: v.number(),
    }),
    status: v.union(
      v.literal("lobby"),
      v.literal("playing"),
      v.literal("finished")
    ),
    currentRound: v.number(),
    currentTeam: v.union(v.literal("red"), v.literal("blue")),
    currentExplainerIndex: v.object({
      red: v.number(),
      blue: v.number(),
    }),
    currentWord: v.union(
      v.object({
        word: v.string(),
        tabooWords: v.array(v.string()),
      }),
      v.null()
    ),
    scores: v.object({
      red: v.number(),
      blue: v.number(),
    }),
    finalScores: v.optional(
      v.object({
        red: v.number(),
        blue: v.number(),
      })
    ),
    turnEndTime: v.union(v.number(), v.null()),
    usedWordIds: v.array(v.id("words")),
    turnScheduleId: v.optional(v.id("_scheduled_functions")),
    selectedPackIds: v.optional(v.array(v.id("packs"))),
  }).index("by_code", ["code"]),

  players: defineTable({
    roomId: v.id("rooms"),
    name: v.string(),
    sessionId: v.string(),
    team: v.union(v.literal("red"), v.literal("blue"), v.null()),
    joinOrder: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_session", ["sessionId"])
    .index("by_room_and_team", ["roomId", "team"]),

  guesses: defineTable({
    roomId: v.id("rooms"),
    playerId: v.id("players"),
    playerName: v.string(),
    text: v.string(),
    isCorrect: v.boolean(),
    round: v.number(),
    timestamp: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_round", ["roomId", "round"]),

  words: defineTable({
    word: v.string(),
    tabooWords: v.array(v.string()),
    packId: v.id("packs"),
  }).index("by_pack", ["packId"]),

  packs: defineTable({
    title: v.string(),
    description: v.string(),
    isDefault: v.boolean(),
    emoji: v.optional(v.string()),
    wordIds: v.optional(v.array(v.id("words"))), // Cache of word IDs for this pack
  }).index("by_isDefault", ["isDefault"]),
});

