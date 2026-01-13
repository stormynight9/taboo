"use client";

import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "flex h-12 w-full rounded-xl border-2 border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-2 text-base text-white placeholder:text-slate-400 focus-visible:border-pink-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
        className
      )}
      {...props}
    />
  );
}

export { Input };

