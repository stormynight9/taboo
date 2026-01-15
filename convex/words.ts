import { mutation, query } from "./_generated/server";

// Predefined word bank with taboo words
const WORD_BANK = [
  {
    word: "Pizza",
    tabooWords: ["Italian", "Cheese", "Slice", "Pepperoni", "Dough"],
  },
  { word: "Beach", tabooWords: ["Sand", "Ocean", "Sun", "Water", "Wave"] },
  {
    word: "Guitar",
    tabooWords: ["Music", "Strings", "Play", "Instrument", "Rock"],
  },
  { word: "Birthday", tabooWords: ["Cake", "Party", "Candles", "Gift", "Age"] },
  { word: "Elephant", tabooWords: ["Trunk", "Big", "Gray", "Africa", "Ears"] },
  {
    word: "Coffee",
    tabooWords: ["Drink", "Caffeine", "Morning", "Bean", "Hot"],
  },
  {
    word: "Football",
    tabooWords: ["Sport", "Ball", "Touchdown", "NFL", "Team"],
  },
  {
    word: "Hospital",
    tabooWords: ["Doctor", "Sick", "Nurse", "Patient", "Medical"],
  },
  { word: "Rainbow", tabooWords: ["Colors", "Sky", "Rain", "Arc", "Sun"] },
  {
    word: "Vampire",
    tabooWords: ["Blood", "Bite", "Fangs", "Night", "Dracula"],
  },
  {
    word: "Astronaut",
    tabooWords: ["Space", "NASA", "Moon", "Rocket", "Suit"],
  },
  {
    word: "Library",
    tabooWords: ["Books", "Read", "Quiet", "Shelves", "Borrow"],
  },
  { word: "Sunglasses", tabooWords: ["Sun", "Eyes", "Shade", "Wear", "Cool"] },
  {
    word: "Microwave",
    tabooWords: ["Heat", "Kitchen", "Food", "Cook", "Oven"],
  },
  {
    word: "Penguin",
    tabooWords: ["Bird", "Ice", "Antarctica", "Black", "White"],
  },
  {
    word: "Chocolate",
    tabooWords: ["Candy", "Sweet", "Brown", "Cocoa", "Milk"],
  },
  {
    word: "Toothbrush",
    tabooWords: ["Teeth", "Brush", "Clean", "Dentist", "Mouth"],
  },
  {
    word: "Airplane",
    tabooWords: ["Fly", "Pilot", "Wings", "Airport", "Travel"],
  },
  {
    word: "Snowman",
    tabooWords: ["Snow", "Winter", "Cold", "Carrot", "Frosty"],
  },
  {
    word: "Hamburger",
    tabooWords: ["Beef", "Bun", "Fast Food", "Patty", "Grill"],
  },
  {
    word: "Dinosaur",
    tabooWords: ["Extinct", "Fossil", "Prehistoric", "T-Rex", "Jurassic"],
  },
  {
    word: "Fireworks",
    tabooWords: ["Explosion", "July", "Sky", "Celebrate", "Colorful"],
  },
  { word: "Umbrella", tabooWords: ["Rain", "Wet", "Cover", "Open", "Handle"] },
  { word: "Popcorn", tabooWords: ["Movie", "Corn", "Butter", "Snack", "Pop"] },
  {
    word: "Lighthouse",
    tabooWords: ["Light", "Ocean", "Ship", "Coast", "Beacon"],
  },
  { word: "Magician", tabooWords: ["Magic", "Trick", "Hat", "Rabbit", "Wand"] },
  {
    word: "Tornado",
    tabooWords: ["Wind", "Storm", "Spin", "Destroy", "Weather"],
  },
  {
    word: "Keyboard",
    tabooWords: ["Type", "Computer", "Keys", "Letters", "QWERTY"],
  },
  { word: "Volcano", tabooWords: ["Lava", "Erupt", "Mountain", "Hot", "Ash"] },
  {
    word: "Skateboard",
    tabooWords: ["Wheels", "Ride", "Trick", "Board", "Park"],
  },
  {
    word: "Waffle",
    tabooWords: ["Breakfast", "Syrup", "Square", "Belgian", "Pancake"],
  },
  {
    word: "Pirate",
    tabooWords: ["Ship", "Treasure", "Eye Patch", "Arrr", "Sea"],
  },
  {
    word: "Cactus",
    tabooWords: ["Desert", "Spike", "Plant", "Water", "Prickly"],
  },
  {
    word: "Jellyfish",
    tabooWords: ["Ocean", "Sting", "Tentacles", "Float", "Clear"],
  },
  {
    word: "Backpack",
    tabooWords: ["Bag", "School", "Carry", "Straps", "Back"],
  },
  {
    word: "Firefighter",
    tabooWords: ["Fire", "Hose", "Truck", "Save", "Hero"],
  },
  {
    word: "Spaghetti",
    tabooWords: ["Pasta", "Italian", "Noodles", "Sauce", "Meatballs"],
  },
  { word: "Telescope", tabooWords: ["Stars", "See", "Space", "Lens", "Zoom"] },
  {
    word: "Pumpkin",
    tabooWords: ["Halloween", "Orange", "Carve", "Pie", "Jack"],
  },
  {
    word: "Rollercoaster",
    tabooWords: ["Ride", "Fast", "Theme Park", "Loop", "Scream"],
  },
  {
    word: "Dentist",
    tabooWords: ["Teeth", "Drill", "Cavity", "Doctor", "Chair"],
  },
  {
    word: "Kangaroo",
    tabooWords: ["Australia", "Jump", "Pouch", "Joey", "Hop"],
  },
  { word: "Sandwich", tabooWords: ["Bread", "Lunch", "Meat", "Cheese", "Eat"] },
  {
    word: "Pyramid",
    tabooWords: ["Egypt", "Triangle", "Ancient", "Pharaoh", "Tomb"],
  },
  {
    word: "Laptop",
    tabooWords: ["Computer", "Portable", "Screen", "Type", "Work"],
  },
  { word: "Giraffe", tabooWords: ["Tall", "Neck", "Africa", "Spots", "Zoo"] },
  { word: "Surfing", tabooWords: ["Wave", "Beach", "Board", "Ocean", "Ride"] },
  { word: "Mermaid", tabooWords: ["Fish", "Tail", "Ocean", "Sing", "Ariel"] },
  {
    word: "Campfire",
    tabooWords: ["Fire", "Wood", "Camping", "Marshmallow", "Smoke"],
  },
  { word: "Ballerina", tabooWords: ["Dance", "Ballet", "Tutu", "Spin", "Toe"] },
  {
    word: "Submarine",
    tabooWords: ["Underwater", "Navy", "Ocean", "Dive", "Yellow"],
  },
  {
    word: "Pancake",
    tabooWords: ["Breakfast", "Flat", "Syrup", "Flip", "Stack"],
  },
  { word: "Wizard", tabooWords: ["Magic", "Wand", "Spell", "Harry", "Robe"] },
  {
    word: "Honeybee",
    tabooWords: ["Honey", "Sting", "Buzz", "Hive", "Yellow"],
  },
  {
    word: "Trampoline",
    tabooWords: ["Jump", "Bounce", "Spring", "High", "Fun"],
  },
  { word: "Parachute", tabooWords: ["Fall", "Sky", "Jump", "Land", "Dive"] },
  {
    word: "Compass",
    tabooWords: ["Direction", "North", "Navigate", "Map", "Needle"],
  },
  { word: "Hedgehog", tabooWords: ["Spike", "Small", "Sonic", "Curl", "Pet"] },
  { word: "Treehouse", tabooWords: ["Tree", "House", "Climb", "Wood", "Kids"] },
  {
    word: "Referee",
    tabooWords: ["Sport", "Whistle", "Call", "Rules", "Striped"],
  },
  { word: "Igloo", tabooWords: ["Ice", "Eskimo", "Cold", "Snow", "House"] },
  {
    word: "Pretzel",
    tabooWords: ["Twist", "Salt", "Snack", "German", "Bread"],
  },
  { word: "Hammock", tabooWords: ["Hang", "Relax", "Swing", "Sleep", "Tree"] },
  {
    word: "Scarecrow",
    tabooWords: ["Farm", "Bird", "Straw", "Field", "Scare"],
  },
  {
    word: "Quicksand",
    tabooWords: ["Sink", "Sand", "Stuck", "Danger", "Trap"],
  },
  {
    word: "Thunderstorm",
    tabooWords: ["Lightning", "Rain", "Loud", "Weather", "Cloud"],
  },
  { word: "Flamingo", tabooWords: ["Pink", "Bird", "Leg", "Stand", "Florida"] },
  {
    word: "Boomerang",
    tabooWords: ["Throw", "Return", "Australia", "Curve", "Catch"],
  },
  {
    word: "Chameleon",
    tabooWords: ["Color", "Change", "Lizard", "Camouflage", "Tongue"],
  },
  { word: "Donut", tabooWords: ["Hole", "Sweet", "Glazed", "Police", "Round"] },
  { word: "Escalator", tabooWords: ["Stairs", "Moving", "Mall", "Up", "Down"] },
  { word: "Gondola", tabooWords: ["Venice", "Boat", "Italy", "Canal", "Ride"] },
  {
    word: "Harmonica",
    tabooWords: ["Music", "Blow", "Instrument", "Blues", "Mouth"],
  },
  { word: "Jacuzzi", tabooWords: ["Hot", "Tub", "Bubbles", "Water", "Relax"] },
  {
    word: "Koala",
    tabooWords: ["Australia", "Bear", "Eucalyptus", "Tree", "Sleep"],
  },
  {
    word: "Lemonade",
    tabooWords: ["Lemon", "Drink", "Sweet", "Summer", "Stand"],
  },
  { word: "Mosquito", tabooWords: ["Bite", "Bug", "Itch", "Blood", "Buzz"] },
  {
    word: "Ninja",
    tabooWords: ["Black", "Japan", "Fight", "Stealth", "Warrior"],
  },
  {
    word: "Octopus",
    tabooWords: ["Eight", "Arms", "Ocean", "Tentacles", "Ink"],
  },
  {
    word: "Peacock",
    tabooWords: ["Feathers", "Bird", "Colorful", "Fan", "Tail"],
  },
  {
    word: "Quicksilver",
    tabooWords: ["Mercury", "Fast", "Metal", "Liquid", "Silver"],
  },
  {
    word: "Raccoon",
    tabooWords: ["Mask", "Trash", "Night", "Animal", "Bandit"],
  },
  {
    word: "Saxophone",
    tabooWords: ["Jazz", "Music", "Blow", "Instrument", "Brass"],
  },
  {
    word: "Tarantula",
    tabooWords: ["Spider", "Hairy", "Legs", "Big", "Scary"],
  },
  {
    word: "Unicycle",
    tabooWords: ["Wheel", "One", "Balance", "Ride", "Circus"],
  },
  { word: "Volleyball", tabooWords: ["Beach", "Net", "Ball", "Hit", "Sport"] },
  {
    word: "Waterfall",
    tabooWords: ["Water", "Fall", "Nature", "River", "Cliff"],
  },
  {
    word: "Xylophone",
    tabooWords: ["Music", "Keys", "Hit", "Instrument", "Bars"],
  },
  {
    word: "Yogurt",
    tabooWords: ["Dairy", "Milk", "Healthy", "Greek", "Fruit"],
  },
  { word: "Zeppelin", tabooWords: ["Fly", "Air", "Blimp", "Led", "Balloon"] },
  {
    word: "Astronomer",
    tabooWords: ["Stars", "Space", "Telescope", "Science", "Planet"],
  },
  {
    word: "Blender",
    tabooWords: ["Mix", "Kitchen", "Smoothie", "Blend", "Fruit"],
  },
  { word: "Carousel", tabooWords: ["Ride", "Horse", "Spin", "Music", "Fair"] },
  {
    word: "Detective",
    tabooWords: ["Solve", "Mystery", "Clue", "Police", "Investigate"],
  },
  {
    word: "Earthquake",
    tabooWords: ["Shake", "Ground", "Fault", "Disaster", "Richter"],
  },
  { word: "Flamingo", tabooWords: ["Pink", "Bird", "Leg", "Stand", "Florida"] },
  {
    word: "Gladiator",
    tabooWords: ["Rome", "Fight", "Arena", "Sword", "Spartacus"],
  },
  {
    word: "Hurricane",
    tabooWords: ["Storm", "Wind", "Eye", "Tropical", "Disaster"],
  },
  {
    word: "Inventor",
    tabooWords: ["Create", "New", "Edison", "Patent", "Idea"],
  },
];

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if words already exist
    const existingWords = await ctx.db.query("words").first();
    if (existingWords) {
      return { message: "Words already seeded" };
    }

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
        emoji: "📚",
      });
      defaultPack = await ctx.db.get(packId);
      if (!defaultPack) {
        throw new Error("Failed to create default pack");
      }
    }

    // Insert all words with default pack
    for (const wordData of WORD_BANK) {
      await ctx.db.insert("words", {
        word: wordData.word,
        tabooWords: wordData.tabooWords,
        packId: defaultPack._id,
      });
    }

    return { message: `Seeded ${WORD_BANK.length} words` };
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("words").collect();
  },
});

export const count = query({
  args: {},
  handler: async (ctx) => {
    const words = await ctx.db.query("words").collect();
    return words.length;
  },
});
