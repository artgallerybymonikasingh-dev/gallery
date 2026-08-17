import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// A free, independent safety net alongside whatever Supabase itself
// retains — downloads every row from every table as one JSON file.
// Route Handlers aren't covered by the (protected) layout's session
// check (that only guards page renders), so this re-verifies admin auth
// itself, same as every mutation in admin/actions.ts does.
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const [artists, galleries, artworks, exhibitions, appreciations] = await Promise.all([
    admin.from("artists").select("*"),
    admin.from("galleries").select("*"),
    admin.from("artworks").select("*"),
    admin.from("exhibitions").select("*"),
    admin.from("appreciations").select("*"),
  ]);

  const firstError = [artists, galleries, artworks, exhibitions, appreciations].find(
    (r) => r.error
  )?.error;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const payload = {
    exported_at: new Date().toISOString(),
    artists: artists.data,
    galleries: galleries.data,
    artworks: artworks.data,
    exhibitions: exhibitions.data,
    appreciations: appreciations.data,
  };

  const filename = `chitrashala-export-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
