import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/src/db/supabase";

export const dynamic = "force-dynamic";

const allowedFields = new Set([
  "review_status",
  "dm_status",
  "outcome_status",
  "notes",
  "dm_template"
]);

export async function PATCH(request: NextRequest, context: { params: Promise<{ username: string }> }) {
  const { username } = await context.params;
  const body = (await request.json()) as Record<string, string>;
  const updates = Object.fromEntries(Object.entries(body).filter(([key]) => allowedFields.has(key)));

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "No supported fields" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("profiles").update(updates).eq("username", username);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
