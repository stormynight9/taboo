"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export default function WordSeeder() {
  const wordCount = useQuery(api.words.count);
  const seedWords = useMutation(api.words.seed);
  const hasSeeded = useRef(false);

  useEffect(() => {
    // Only seed once, and only if no words exist
    if (wordCount === 0 && !hasSeeded.current) {
      hasSeeded.current = true;
      seedWords().catch(console.error);
    }
  }, [wordCount, seedWords]);

  return null;
}
