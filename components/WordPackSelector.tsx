"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WordPackSelectorProps {
  roomId: Id<"rooms">;
  playerId: Id<"players">;
  isHost: boolean;
  selectedPackIds: Id<"packs">[];
}

export default function WordPackSelector({
  roomId,
  playerId,
  isHost,
  selectedPackIds,
}: WordPackSelectorProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [localSelectedPacks, setLocalSelectedPacks] =
    useState<Id<"packs">[]>(selectedPackIds);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalSelectedPacks(selectedPackIds);
  }, [selectedPackIds]);

  const packs = useQuery(api.packs.getAll);
  const updateSelectedPacks = useMutation(api.rooms.updateSelectedPacks);

  const handlePackToggle = (packId: Id<"packs">) => {
    if (!isHost) return;

    setLocalSelectedPacks((prev) => {
      if (prev.includes(packId)) {
        // Don't allow deselecting if it's the only pack
        if (prev.length === 1) {
          return prev;
        }
        return prev.filter((id) => id !== packId);
      } else {
        return [...prev, packId];
      }
    });
  };

  const handleSave = async () => {
    if (!isHost || localSelectedPacks.length === 0) return;

    try {
      await updateSelectedPacks({
        roomId,
        playerId,
        packIds: localSelectedPacks,
      });
      setShowDialog(false);
    } catch (error) {
      console.error("Failed to update packs:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update packs. Please try again."
      );
    }
  };

  const handleCancel = () => {
    setLocalSelectedPacks(selectedPackIds);
    setShowDialog(false);
  };

  if (packs === undefined) {
    return (
      <div className="game-card p-4">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  const selectedPacks = packs.filter((p) => selectedPackIds.includes(p._id));

  return (
    <>
      <div className="game-card p-4 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium ">Word Packs</h2>
          {isHost && (
            <Button
              onClick={() => setShowDialog(true)}
              variant="outline"
              size="sm"
            >
              Change Packs
            </Button>
          )}
        </div>
        <div className=" grid grid-cols-1 md:grid-cols-2 gap-2">
          {selectedPacks.length === 0 ? (
            <p className="text-gray-400 text-sm">No packs selected</p>
          ) : (
            selectedPacks.map((pack) => (
              <div
                key={pack._id}
                className="flex items-start gap-2 p-2 bg-zinc-900 rounded-lg"
              >
                <div className="flex items-center gap-2 justify-between w-full">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium text-sm">
                        {pack.title}
                      </p>
                      <span className="text-xs text-gray-500">
                        ({pack.wordCount || 0} words)
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      {pack.description}
                    </p>
                  </div>
                  {pack.emoji && <span className="text-2xl">{pack.emoji}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isHost && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md bg-zinc-900 border border-zinc-700 ring-0">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-center text-white">
                Select Word Packs
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
              {packs.length === 0 ? (
                <p className="text-gray-400 text-center py-4">
                  No packs available
                </p>
              ) : (
                packs.map((pack) => {
                  const isSelected = localSelectedPacks.includes(pack._id);
                  const isOnlySelected =
                    localSelectedPacks.length === 1 && isSelected;

                  return (
                    <div
                      key={pack._id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-pink-500/20 border-pink-500"
                          : "bg-zinc-800 border-zinc-700 hover:border-zinc-600"
                      } ${isOnlySelected ? "opacity-75" : ""}`}
                      onClick={() => handlePackToggle(pack._id)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected
                              ? "bg-pink-500 border-pink-500"
                              : "border-zinc-600"
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium text-sm">
                              {pack.title}
                            </p>
                            <span className="text-xs text-gray-500">
                              ({pack.wordCount || 0} words)
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs mt-1">
                            {pack.description}
                          </p>
                        </div>
                        {pack.emoji && (
                          <div className="text-2xl shrink-0">{pack.emoji}</div>
                        )}
                      </div>
                      {isOnlySelected && (
                        <p className="text-xs text-amber-400 mt-2 ml-8">
                          At least one pack must be selected
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button onClick={handleCancel} variant="outline" size="lg">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                variant="default"
                size="lg"
                disabled={localSelectedPacks.length === 0}
              >
                Save Packs
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
