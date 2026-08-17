import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { updateSiteSettings } from "../actions";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("whatsapp_number")
    .eq("id", "default")
    .maybeSingle();

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-neutral-500 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-neutral-500">Site-wide defaults used across Chitrashala.</p>
      </div>

      <form
        action={updateSiteSettings}
        className="max-w-md space-y-3 rounded-lg border border-neutral-200 bg-white p-4"
      >
        <label className="block text-sm font-medium text-neutral-700">
          Site-wide WhatsApp number
          <input
            name="whatsapp_number"
            defaultValue={settings?.whatsapp_number ?? ""}
            placeholder="e.g. 919876543210"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <span className="mt-1 block text-xs text-neutral-500">
            Digits only, country code first, e.g. 919876543210 for +91 98765 43210. Used
            everywhere on the site unless an artist, gallery, or photo has its own number set.
          </span>
        </label>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Save
        </button>
      </form>
    </div>
  );
}
