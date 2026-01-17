"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Link01Icon,
  Tick01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface InviteSectionProps {
  roomUrl: string;
  isHost: boolean;
  onOpenSettings: () => void;
}

export default function InviteSection({
  roomUrl,
  isHost,
  onOpenSettings,
}: InviteSectionProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="game-card p-4 md:p-6">
      <h2 className="text-lg font-medium mb-3">Invite Players</h2>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-3 bg-zinc-900 rounded-lg px-4 py-3.5 border border-zinc-700">
          <span className="text-gray-500 text-sm truncate sm:block">
            {roomUrl}
          </span>
        </div>
        <div className="flex gap-3">
          <Button onClick={copyLink} variant="outline">
            {copied ? (
              <>
                <HugeiconsIcon icon={Tick01Icon} strokeWidth={2} />
                Copied!
              </>
            ) : (
              <>
                <HugeiconsIcon icon={Link01Icon} strokeWidth={2} />
                Copy Link
              </>
            )}
          </Button>
          {isHost && (
            <Button onClick={onOpenSettings} variant="outline">
              <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} />
              Settings
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
