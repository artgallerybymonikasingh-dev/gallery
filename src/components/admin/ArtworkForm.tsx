"use client";

import { useRef, useState, useTransition } from "react";
import type { Artwork } from "@/lib/types";
import { suggestArtworkDescription } from "@/app/admin/(protected)/actions";

export default function ArtworkForm({
  action,
  artwork,
  submitLabel,
  requireImage,
}: {
  action: (formData: FormData) => void | Promise<void>;
  artwork?: Artwork;
  submitLabel: string;
  requireImage: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState(artwork?.description ?? "");
  const [aiPending, startAiTransition] = useTransition();
  const [aiError, setAiError] = useState<string | null>(null);

  function handleGenerate() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setAiError("Choose a photo first.");
      return;
    }
    setAiError(null);

    const formData = new FormData();
    formData.set("image", file);

    startAiTransition(async () => {
      const result = await suggestArtworkDescription(formData);
      if ("error" in result) {
        setAiError(result.error);
      } else {
        setDescription(result.description);
      }
    });
  }

  return (
    <form action={action} className="space-y-2">
      <label className="block text-sm font-medium text-neutral-700">
        {requireImage ? "Photo" : "Replace photo (optional)"}
        <input
          ref={fileInputRef}
          type="file"
          name="image"
          accept="image/*"
          required={requireImage}
          className="mt-1 w-full text-sm"
        />
      </label>

      <label className="block text-sm font-medium text-neutral-700">
        Title
        <input
          name="title"
          defaultValue={artwork?.title ?? ""}
          placeholder="Untitled"
          className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        />
      </label>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor={`description-${artwork?.id ?? "new"}`} className="text-sm font-medium text-neutral-700">
            Description (optional)
          </label>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={aiPending}
            className="text-xs font-medium text-blue-600 hover:underline disabled:opacity-50"
          >
            {aiPending ? "Generating…" : "✨ Suggest with AI"}
          </button>
        </div>
        <textarea
          id={`description-${artwork?.id ?? "new"}`}
          name="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Write your own, generate a suggestion with AI, or leave blank"
          className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        />
        {aiError && <p className="mt-1 text-xs text-red-600">{aiError}</p>}
      </div>

      <label className="block text-sm font-medium text-neutral-700">
        Status
        <select
          name="status"
          defaultValue={artwork?.status ?? "available"}
          className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        >
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="sold">Sold</option>
        </select>
      </label>

      <div className="flex gap-2">
        <label className="block flex-1 text-sm font-medium text-neutral-700">
          Width (cm, optional)
          <input
            name="width_cm"
            type="number"
            step="0.1"
            min="0"
            defaultValue={artwork?.width_cm ?? ""}
            className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block flex-1 text-sm font-medium text-neutral-700">
          Height (cm, optional)
          <input
            name="height_cm"
            type="number"
            step="0.1"
            min="0"
            defaultValue={artwork?.height_cm ?? ""}
            className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </label>
      </div>

      <button
        type="submit"
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
      >
        {submitLabel}
      </button>
    </form>
  );
}
