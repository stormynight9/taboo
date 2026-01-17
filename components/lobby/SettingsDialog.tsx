"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Doc } from "../../convex/_generated/dataModel";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Doc<"rooms">;
  onUpdateSettings: (settings: {
    rounds: number;
    turnTime: number;
    tabooWordCount: number;
  }) => Promise<void>;
}

export default function SettingsDialog({
  open,
  onOpenChange,
  room,
  onUpdateSettings,
}: SettingsDialogProps) {
  const [settings, setSettings] = useState({
    rounds: room.settings.rounds,
    turnTime: room.settings.turnTime,
    tabooWordCount: room.settings.tabooWordCount,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setSettings({
        rounds: room.settings.rounds,
        turnTime: room.settings.turnTime,
        tabooWordCount: room.settings.tabooWordCount,
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [room.settings]);

  const handleSave = async () => {
    try {
      await onUpdateSettings(settings);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update settings:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update settings. Please try again."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-white">
            Game Settings
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Number of Rounds
            </label>
            <div className="flex items-center gap-4">
              <Slider
                min={1}
                max={10}
                step={1}
                value={[settings.rounds]}
                onValueChange={(values) =>
                  setSettings({
                    ...settings,
                    rounds: Array.isArray(values) ? values[0] : values,
                  })
                }
                className="flex-1"
              />
              <span className="w-12 text-center font-semibold text-pink-500 text-lg">
                {settings.rounds}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Turn Time (seconds)
            </label>
            <div className="flex items-center gap-4">
              <Slider
                min={30}
                max={180}
                step={10}
                value={[settings.turnTime]}
                onValueChange={(values) =>
                  setSettings({
                    ...settings,
                    turnTime: Array.isArray(values) ? values[0] : values,
                  })
                }
                className="flex-1"
              />
              <span className="w-16 text-center font-semibold text-pink-500 text-lg">
                {settings.turnTime}s
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Taboo Words per Card
            </label>
            <div className="flex items-center gap-4">
              <Slider
                min={1}
                max={5}
                step={1}
                value={[settings.tabooWordCount]}
                onValueChange={(values) =>
                  setSettings({
                    ...settings,
                    tabooWordCount: Array.isArray(values)
                      ? values[0]
                      : values,
                  })
                }
                className="flex-1"
              />
              <span className="w-12 text-center font-semibold text-pink-500 text-lg">
                {settings.tabooWordCount}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} variant="default" className="flex-1">
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
