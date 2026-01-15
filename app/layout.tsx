import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { Analytics } from "@vercel/analytics/next";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

const fredokaMono = Fredoka({
  variable: "--font-fredoka-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Taboo - Real-Time Multiplayer Word Guessing Party Game",
  description:
    "Play Taboo online with friends! The ultimate real-time multiplayer word-guessing party game. Create rooms, form teams, and compete in this fun word game. Free to play!",
  openGraph: {
    title: "Taboo - Real-Time Multiplayer Word Guessing Party Game",
    description:
      "Play Taboo online with friends! The ultimate real-time multiplayer word-guessing party game. Create rooms, form teams, and compete in this fun word game. Free to play!",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Taboo - Real-Time Multiplayer Word Guessing Party Game",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Taboo - Real-Time Multiplayer Word Guessing Party Game",
    description:
      "Play Taboo online with friends! The ultimate real-time multiplayer word-guessing party game. Create rooms, form teams, and compete in this fun word game. Free to play!",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fredoka.variable} ${fredokaMono.variable} antialiased bg-zinc-900`}
      >
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
      <Analytics />
    </html>
  );
}

