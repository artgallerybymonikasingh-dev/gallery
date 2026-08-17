import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Supabase's free tier pauses a project after about a week with no API
// activity, which would take the whole site down until someone manually
// unpauses it from the dashboard. Vercel Cron (also free, see
// vercel.json) hits this daily with a trivial query, just to keep the
// project counted as active — nothing here is meant to do real work.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("artists").select("id").limit(1);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, pinged_at: new Date().toISOString() });
}
