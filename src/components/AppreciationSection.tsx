"use client";

import { useState, useTransition } from "react";
import type { Appreciation } from "@/lib/types";
import { submitAppreciation } from "@/app/(site)/actions";

export default function AppreciationSection({
  artworkId,
  appreciations,
}: {
  artworkId: string;
  appreciations: Appreciation[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("message", message);

    startTransition(async () => {
      const result = await submitAppreciation(artworkId, formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSubmitted(true);
        setShowForm(false);
        setName("");
        setMessage("");
      }
    });
  }

  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-200">
          Appreciations {appreciations.length > 0 && `(${appreciations.length})`}
        </h3>
        {!showForm && !submitted && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="text-xs font-medium text-royal-gold-light hover:underline"
          >
            💛 Appreciate this painting
          </button>
        )}
      </div>

      {appreciations.length > 0 && (
        <ul className="mt-2 space-y-2">
          {appreciations.map((a) => (
            <li key={a.id} className="rounded-md bg-white/5 px-3 py-2 text-sm text-neutral-200">
              <span className="font-medium text-white">{a.name || "Anonymous"}</span>
              {": "}
              {a.message}
            </li>
          ))}
        </ul>
      )}

      {submitted && (
        <p className="mt-2 text-xs text-royal-gold-light">
          Thank you! Your appreciation is awaiting approval and will appear here soon.
        </p>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            maxLength={80}
            className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-neutral-400 focus:border-royal-gold-light focus:outline-none"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Say something about this painting…"
            required
            maxLength={500}
            rows={2}
            className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-neutral-400 focus:border-royal-gold-light focus:outline-none"
          />
          {error && <p className="text-xs text-red-300">{error}</p>}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-royal-gold px-4 py-1.5 text-xs font-medium text-royal-ink transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {pending ? "Posting…" : "Post appreciation"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-neutral-400 hover:text-neutral-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
