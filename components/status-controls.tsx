"use client";

import { Check, MessageCircle, PackageCheck, Star, XCircle } from "lucide-react";
import { useState, useTransition } from "react";

type Props = {
  username: string;
  reviewStatus: string;
  dmStatus: string;
  outcomeStatus: string;
  notes: string;
};

async function patchProfile(username: string, payload: Record<string, string>) {
  const response = await fetch(`/api/profiles/${username}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error("Could not update profile");
}

export function StatusControls({ username, reviewStatus, dmStatus, outcomeStatus, notes }: Props) {
  const [pending, startTransition] = useTransition();
  const [localNotes, setLocalNotes] = useState(notes);

  function update(payload: Record<string, string>) {
    startTransition(async () => {
      await patchProfile(username, payload);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        className="inline-flex h-8 w-8 items-center justify-center rounded border border-line bg-white text-ink hover:border-moss disabled:opacity-50"
        title="Mark reviewed"
        disabled={pending || reviewStatus === "reviewed"}
        onClick={() => update({ review_status: "reviewed" })}
      >
        <Check size={16} />
      </button>
      <button
        className="inline-flex h-8 w-8 items-center justify-center rounded border border-line bg-white text-ink hover:border-moss disabled:opacity-50"
        title="Shortlist"
        disabled={pending || reviewStatus === "shortlisted"}
        onClick={() => update({ review_status: "shortlisted" })}
      >
        <Star size={16} />
      </button>
      <button
        className="inline-flex h-8 w-8 items-center justify-center rounded border border-line bg-white text-ink hover:border-moss disabled:opacity-50"
        title="Mark DM sent"
        disabled={pending || dmStatus === "sent"}
        onClick={() => update({ dm_status: "sent" })}
      >
        <MessageCircle size={16} />
      </button>
      <button
        className="inline-flex h-8 w-8 items-center justify-center rounded border border-line bg-white text-ink hover:border-moss disabled:opacity-50"
        title="Mark seeded"
        disabled={pending || outcomeStatus === "seeded"}
        onClick={() => update({ outcome_status: "seeded" })}
      >
        <PackageCheck size={16} />
      </button>
      <button
        className="inline-flex h-8 w-8 items-center justify-center rounded border border-line bg-white text-ink hover:border-moss disabled:opacity-50"
        title="Do not contact"
        disabled={pending || reviewStatus === "do_not_contact"}
        onClick={() => update({ review_status: "do_not_contact" })}
      >
        <XCircle size={16} />
      </button>
      <input
        className="h-8 min-w-48 flex-1 rounded border border-line bg-white px-2 text-sm outline-none focus:border-moss"
        value={localNotes}
        placeholder="Notes"
        onChange={(event) => setLocalNotes(event.target.value)}
        onBlur={() => update({ notes: localNotes })}
      />
    </div>
  );
}
