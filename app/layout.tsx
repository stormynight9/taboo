import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

const fredokaMono = Fredoka({
  variable: "--font-fredoka-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Taboo - Multiplayer Word Game",
  description:
    "The ultimate real-time multiplayer word-guessing party game. Create rooms, form teams, and compete!",
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
    </html>
  );
}

