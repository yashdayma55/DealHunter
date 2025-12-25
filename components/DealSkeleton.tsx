// components/DealSkeleton.tsx
"use client";

export function DealSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 animate-pulse opacity-60" />
      <div className="relative space-y-3">
        <div className="h-3 w-40 rounded-full bg-zinc-800" />
        <div className="h-4 w-24 rounded-full bg-zinc-800" />
        <div className="h-3 w-32 rounded-full bg-zinc-800" />
        <div className="h-8 w-full rounded-full bg-zinc-800" />
      </div>
    </div>
  );
}
