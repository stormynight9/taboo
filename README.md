This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## About the Game

**Taboo** is a real-time multiplayer word-guessing game where two teams compete to guess words. Here's how it works:

- **Two Teams**: Players join either the Red or Blue team
- **The Explainer**: One player from the current team describes a word without using forbidden "taboo" words
- **The Guessers**: Other team members try to guess the word by typing in the chat
- **The Watchers**: The opposing team watches for taboo violations and can buzz if the explainer says a forbidden word
- **Scoring**: Teams earn points for correct guesses, lose points for taboo violations
- **Word Packs**: Hosts can select from different word packs (General Words, Countries & Cities, Famous People, Movies & Series, or custom packs)

The game features real-time updates, customizable settings (rounds, turn time, taboo word count), and support for spectators who can watch games in progress.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Adding Custom Words

You can add your own words to packs using the Convex dashboard. There are two ways to do this:

### Option 1: Add Words to an Existing Pack

1. Go to the Convex dashboard → **Data** → `packs` table
2. Find the pack you want to add words to and copy its `_id`
3. Go to **Functions** → `packs.addWordsToPack`
4. Use this format:

```json
{
  "packId": "paste_pack_id_here",
  "words": [
    {
      "word": "Example Word",
      "tabooWords": ["Forbidden", "Word1", "Word2", "Word3", "Word4"]
    },
    {
      "word": "Another Word",
      "tabooWords": ["Taboo1", "Taboo2", "Taboo3", "Taboo4", "Taboo5"]
    }
  ]
}
```

### Option 2: Create a New Pack with Words

1. Go to **Functions** → `packs.createPackWithWords`
2. Use this format:

```json
{
  "title": "My Custom Pack",
  "description": "Words I created",
  "words": [
    {
      "word": "Custom Word 1",
      "tabooWords": [
        "Forbidden1",
        "Forbidden2",
        "Forbidden3",
        "Forbidden4",
        "Forbidden5"
      ]
    },
    {
      "word": "Custom Word 2",
      "tabooWords": ["Taboo1", "Taboo2", "Taboo3", "Taboo4", "Taboo5"]
    }
  ]
}
```

After running either function, refresh your app and the new words will be available in the selected pack(s).

