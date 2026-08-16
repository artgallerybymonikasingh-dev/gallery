"use client";

import { useState, useTransition } from "react";
import type { Appreciation } from "@/lib/types";
import { submitGalleryAppreciation } from "@/app/(site)/actions";

export default function GalleryAppreciationSection({
  galleryId,
  appreciations,
}: {
  galleryId: string;
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
      const result = await submitGalleryAppreciation(galleryId, formData);
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
    <div className="mt-10 rounded-lg border border-royal-gold/25 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-lg font-medium text-royal-maroon">
          Appreciations for this gallery{" "}
          {appreciations.length > 0 && (
            <span className="font-sans text-sm font-normal text-neutral-500">
              ({appreciations.length})
            </span>
          )}
        </h2>
        {!showForm && !submitted && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="text-sm font-medium text-royal-teal hover:underline"
          >
            💛 Appreciate this gallery
          </button>
        )}
      </div>

      {appreciations.length > 0 && (
        <ul className="mt-3 space-y-2">
          {appreciations.map((a) => (
            <li key={a.id} className="rounded-md bg-royal-cream-deep px-3 py-2 text-sm text-neutral-700">
              <span className="font-medium text-royal-ink">{a.name || "Anonymous"}</span>
              {": "}
              {a.message}
            </li>
          ))}
        </ul>
      )}

      {appreciations.length === 0 && !showForm && !submitted && (
        <p className="mt-2 text-sm text-neutral-500">
          Be the first to share your thoughts on this gallery.
        </p>
      )}

      {submitted && (
        <p className="mt-3 text-sm text-royal-teal">
          Thank you! Your appreciation is awaiting approval and will appear here soon.
        </p>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            maxLength={80}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-royal-maroon focus:outline-none"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Say something about this gallery…"
            required
            maxLength={500}
            rows={3}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-royal-maroon focus:outline-none"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-royal-maroon px-4 py-1.5 text-sm font-medium text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {pending ? "Posting…" : "Post appreciation"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-neutral-500 hover:text-neutral-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
