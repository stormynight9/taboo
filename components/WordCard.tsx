"use client";

interface WordCardProps {
  word: string;
  tabooWords: string[];
  showWord: boolean;
}

export default function WordCard({
  word,
  tabooWords,
  showWord,
}: WordCardProps) {
  if (!showWord) {
    return (
      <div className="game-card p-6 md:p-8 text-center">
        <div className="text-6xl mb-4">🤫</div>
        <p className="text-gray-400 text-lg">Wait for your team to guess!</p>
      </div>
    );
  }

  return (
    <div className="game-card overflow-hidden animate-slide-up">
      {/* Main Word */}
      <div className="bg-pink-500 p-6 md:p-8 text-center">
        <p className="text-xs uppercase tracking-wider text-gray-900 opacity-75 mb-2">
          Describe this word
        </p>
        <h2 className="text-3xl md:text-4xl font-black text-gray-900">
          {word}
        </h2>
      </div>

      {/* Taboo Words */}
      <div className="p-4 md:p-6">
        <p className="text-xs uppercase tracking-wider text-red-400 mb-3 text-center">
          ⛔ Don&apos;t say these words
        </p>
        <div className="space-y-2">
          {tabooWords.map((tabooWord, index) => (
            <div
              key={index}
              className="flex items-center gap-3 px-4 py-2  rounded-lg border border-red-500/50"
            >
              <span className="text-red-400 font-semibold">✕</span>
              <span className="font-medium text-white">{tabooWord}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
