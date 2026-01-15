import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("packs").collect();
  },
});

export const getDefault = query({
  args: {},
  handler: async (ctx) => {
    const defaultPack = await ctx.db
      .query("packs")
      .withIndex("by_isDefault", (q) => q.eq("isDefault", true))
      .first();
    return defaultPack;
  },
});

export const seedDefaultPack = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if default pack already exists
    const existing = await ctx.db
      .query("packs")
      .withIndex("by_isDefault", (q) => q.eq("isDefault", true))
      .first();

    if (existing) {
      return { packId: existing._id, message: "Default pack already exists" };
    }

    // Create default pack
    const packId = await ctx.db.insert("packs", {
      title: "General Words",
      description: "Common English words and phrases",
      isDefault: true,
    });

    return { packId, message: "Default pack created" };
  },
});

export const createPack = mutation({
  args: {
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const packId = await ctx.db.insert("packs", {
      title: args.title,
      description: args.description,
      isDefault: false,
    });

    return { packId };
  },
});

export const addWordsToPack = mutation({
  args: {
    packId: v.id("packs"),
    words: v.array(
      v.object({
        word: v.string(),
        tabooWords: v.array(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Verify pack exists
    const pack = await ctx.db.get(args.packId);
    if (!pack) {
      throw new Error("Pack not found");
    }

    // Insert all words
    const wordIds: Id<"words">[] = [];
    for (const wordData of args.words) {
      const wordId = await ctx.db.insert("words", {
        word: wordData.word,
        tabooWords: wordData.tabooWords,
        packId: args.packId,
      });
      wordIds.push(wordId);
    }

    return {
      message: `Added ${wordIds.length} words to pack "${pack.title}"`,
      wordIds,
    };
  },
});

export const createPackWithWords = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    words: v.array(
      v.object({
        word: v.string(),
        tabooWords: v.array(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Create the pack
    const packId = await ctx.db.insert("packs", {
      title: args.title,
      description: args.description,
      isDefault: false,
    });

    // Insert all words
    const wordIds: Id<"words">[] = [];
    for (const wordData of args.words) {
      const wordId = await ctx.db.insert("words", {
        word: wordData.word,
        tabooWords: wordData.tabooWords,
        packId: packId,
      });
      wordIds.push(wordId);
    }

    return {
      packId,
      message: `Created pack "${args.title}" with ${wordIds.length} words`,
      wordIds,
    };
  },
});

export const migrateExistingWords = mutation({
  args: {},
  handler: async (ctx) => {
    // Get or create default pack
    let defaultPack = await ctx.db
      .query("packs")
      .withIndex("by_isDefault", (q) => q.eq("isDefault", true))
      .first();

    if (!defaultPack) {
      const packId = await ctx.db.insert("packs", {
        title: "General Words",
        description: "Common English words and phrases",
        isDefault: true,
      });
      defaultPack = await ctx.db.get(packId);
      if (!defaultPack) {
        throw new Error("Failed to create default pack");
      }
    }

    // Find all words without packId (this will fail if packId is required, so we'll need to handle existing words differently)
    // For now, we'll update all words to have the default pack
    const allWords = await ctx.db.query("words").collect();
    let updatedCount = 0;

    for (const word of allWords) {
      // Check if word has packId (if schema allows optional, we need to check)
      // Since we made packId required, existing words might cause issues
      // We'll need to handle this carefully
      try {
        await ctx.db.patch(word._id, {
          packId: defaultPack._id,
        });
        updatedCount++;
      } catch (error) {
        // Word might already have packId or other error
        console.error(`Failed to update word ${word._id}:`, error);
      }
    }

    return {
      packId: defaultPack._id,
      updatedWords: updatedCount,
      message: `Migrated ${updatedCount} words to default pack`,
    };
  },
});

// Example pack data
const COUNTRIES_CITIES_WORDS = [
  {
    word: "Paris",
    tabooWords: ["France", "Eiffel", "City", "Capital", "Europe"],
  },
  { word: "Tokyo", tabooWords: ["Japan", "Capital", "City", "Asia", "Sushi"] },
  {
    word: "New York",
    tabooWords: ["City", "USA", "America", "Big Apple", "Statue"],
  },
  {
    word: "London",
    tabooWords: ["England", "UK", "Capital", "Big Ben", "Thames"],
  },
  {
    word: "Sydney",
    tabooWords: ["Australia", "Opera House", "Harbor", "City", "Down Under"],
  },
  {
    word: "Rome",
    tabooWords: ["Italy", "Colosseum", "Ancient", "Capital", "Vatican"],
  },
  {
    word: "Berlin",
    tabooWords: ["Germany", "Capital", "Wall", "City", "Europe"],
  },
  {
    word: "Barcelona",
    tabooWords: ["Spain", "Sagrada", "City", "Catalonia", "Beach"],
  },
  { word: "Dubai", tabooWords: ["UAE", "Burj", "Desert", "City", "Luxury"] },
  {
    word: "Rio de Janeiro",
    tabooWords: ["Brazil", "Carnival", "Beach", "Christ", "City"],
  },
  {
    word: "Moscow",
    tabooWords: ["Russia", "Capital", "Red Square", "Kremlin", "Cold"],
  },
  {
    word: "Cairo",
    tabooWords: ["Egypt", "Pyramids", "Nile", "Capital", "Ancient"],
  },
  {
    word: "Bangkok",
    tabooWords: ["Thailand", "Temples", "City", "Asia", "Food"],
  },
  {
    word: "Singapore",
    tabooWords: ["City", "Asia", "Island", "Modern", "Clean"],
  },
  {
    word: "Istanbul",
    tabooWords: ["Turkey", "Bosphorus", "City", "Europe", "Asia"],
  },
];

const FAMOUS_PEOPLE_WORDS = [
  {
    word: "Einstein",
    tabooWords: ["Scientist", "Physics", "E=mc²", "Genius", "Relativity"],
  },
  {
    word: "Shakespeare",
    tabooWords: ["Writer", "Playwright", "Hamlet", "Poet", "English"],
  },
  {
    word: "Mona Lisa",
    tabooWords: ["Painting", "Da Vinci", "Smile", "Louvre", "Art"],
  },
  {
    word: "Cleopatra",
    tabooWords: ["Egypt", "Queen", "Ancient", "Antony", "Nile"],
  },
  {
    word: "Napoleon",
    tabooWords: ["France", "Emperor", "War", "Short", "Bonaparte"],
  },
  {
    word: "Gandhi",
    tabooWords: ["India", "Peace", "Mahatma", "Independence", "Non-violence"],
  },
  {
    word: "Einstein",
    tabooWords: ["Scientist", "Physics", "E=mc²", "Genius", "Relativity"],
  },
  {
    word: "Mozart",
    tabooWords: ["Composer", "Music", "Classical", "Austria", "Piano"],
  },
  {
    word: "Leonardo da Vinci",
    tabooWords: ["Artist", "Renaissance", "Mona Lisa", "Inventor", "Italy"],
  },
  {
    word: "Newton",
    tabooWords: ["Scientist", "Apple", "Gravity", "Physics", "England"],
  },
  {
    word: "Beethoven",
    tabooWords: ["Composer", "Deaf", "Symphony", "Music", "Germany"],
  },
  {
    word: "Picasso",
    tabooWords: ["Artist", "Painter", "Cubism", "Spain", "Modern"],
  },
  {
    word: "Einstein",
    tabooWords: ["Scientist", "Physics", "E=mc²", "Genius", "Relativity"],
  },
  {
    word: "Michelangelo",
    tabooWords: ["Artist", "Sistine", "David", "Renaissance", "Sculptor"],
  },
  {
    word: "Galileo",
    tabooWords: ["Scientist", "Telescope", "Italy", "Astronomy", "Earth"],
  },
];

const MOVIES_SERIES_WORDS = [
  { word: "Titanic", tabooWords: ["Ship", "Iceberg", "Rose", "Jack", "Sink"] },
  {
    word: "Harry Potter",
    tabooWords: ["Wizard", "Hogwarts", "Voldemort", "Magic", "Book"],
  },
  {
    word: "Star Wars",
    tabooWords: ["Space", "Jedi", "Darth Vader", "Force", "Lightsaber"],
  },
  {
    word: "Friends",
    tabooWords: ["TV", "Show", "Ross", "Rachel", "Central Perk"],
  },
  {
    word: "The Matrix",
    tabooWords: ["Neo", "Red Pill", "Agent", "Reality", "Computer"],
  },
  {
    word: "Game of Thrones",
    tabooWords: ["Dragons", "Winter", "Throne", "HBO", "Fantasy"],
  },
  {
    word: "The Lord of the Rings",
    tabooWords: ["Frodo", "Ring", "Gandalf", "Hobbit", "Middle-earth"],
  },
  {
    word: "Breaking Bad",
    tabooWords: ["Walter", "Meth", "Heisenberg", "Chemistry", "TV"],
  },
  {
    word: "The Avengers",
    tabooWords: ["Superhero", "Marvel", "Iron Man", "Captain", "Team"],
  },
  {
    word: "Inception",
    tabooWords: ["Dream", "Leo", "Nolan", "Reality", "Dream"],
  },
  {
    word: "The Office",
    tabooWords: ["Michael", "Dunder", "Paper", "TV", "Comedy"],
  },
  {
    word: "Stranger Things",
    tabooWords: ["Upside Down", "Eleven", "Netflix", "Monster", "Kids"],
  },
  {
    word: "Pulp Fiction",
    tabooWords: ["Tarantino", "Vincent", "Jules", "Dance", "Crime"],
  },
  {
    word: "The Godfather",
    tabooWords: ["Mafia", "Don", "Family", "Offer", "Mario"],
  },
  {
    word: "Frozen",
    tabooWords: ["Elsa", "Let It Go", "Anna", "Disney", "Ice"],
  },
];

export const seedExamplePacks = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if packs already exist
    const existingPacks = await ctx.db.query("packs").collect();
    const packTitles = existingPacks.map((p) => p.title);

    let countriesPackId: Id<"packs"> | null = null;
    let famousPeoplePackId: Id<"packs"> | null = null;
    let moviesSeriesPackId: Id<"packs"> | null = null;

    // Create Countries & Cities pack
    if (!packTitles.includes("Countries & Cities")) {
      countriesPackId = await ctx.db.insert("packs", {
        title: "Countries & Cities",
        description: "Famous places around the world",
        isDefault: false,
      });

      for (const wordData of COUNTRIES_CITIES_WORDS) {
        await ctx.db.insert("words", {
          word: wordData.word,
          tabooWords: wordData.tabooWords,
          packId: countriesPackId,
        });
      }
    }

    // Create Famous People pack
    if (!packTitles.includes("Famous People")) {
      famousPeoplePackId = await ctx.db.insert("packs", {
        title: "Famous People",
        description: "Historical figures and celebrities",
        isDefault: false,
      });

      for (const wordData of FAMOUS_PEOPLE_WORDS) {
        await ctx.db.insert("words", {
          word: wordData.word,
          tabooWords: wordData.tabooWords,
          packId: famousPeoplePackId,
        });
      }
    }

    // Create Movies & Series pack
    if (!packTitles.includes("Movies & Series")) {
      moviesSeriesPackId = await ctx.db.insert("packs", {
        title: "Movies & Series",
        description: "Popular films and TV shows",
        isDefault: false,
      });

      for (const wordData of MOVIES_SERIES_WORDS) {
        await ctx.db.insert("words", {
          word: wordData.word,
          tabooWords: wordData.tabooWords,
          packId: moviesSeriesPackId,
        });
      }
    }

    return {
      message: "Example packs seeded",
      countriesPackId,
      famousPeoplePackId,
      moviesSeriesPackId,
    };
  },
});
