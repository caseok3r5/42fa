import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/src/db/supabase";
import { createXlsxBuffer } from "@/src/export/xlsx";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const format = params.get("format") === "csv" ? "csv" : "xlsx";
  const supabase = createServiceClient();
  let query = supabase.from("profiles").select("*").order("fit_score", { ascending: false });

  for (const key of ["tier", "category", "source_profile", "review_status", "dm_status"]) {
    const value = params.get(key);
    if (value) query = query.eq(key, value);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []).map((profile) => ({
    Tier: profile.tier,
    Score: profile.fit_score,
    Username: profile.username,
    URL: profile.instagram_url,
    Name: profile.full_name,
    Category: profile.category,
    Location: profile.location,
    Practice: profile.practice,
    Followers: profile.followers,
    Review: profile.review_status,
    DM: profile.dm_status,
    Outcome: profile.outcome_status,
    Source: profile.source_profile,
    Reason: profile.score_reason,
    Notes: profile.notes
  }));

  if (format === "csv") {
    const header = Object.keys(rows[0] ?? { Tier: "", Score: "", Username: "", URL: "" });
    const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [header.join(","), ...rows.map((row) => header.map((key) => escape(row[key as keyof typeof row])).join(","))].join("\n");
    return new NextResponse(csv, {
      headers: {
        "content-type": "text/csv",
        "content-disposition": "attachment; filename=profiles.csv"
      }
    });
  }

  const headers = Object.keys(rows[0] ?? { Tier: "", Score: "", Username: "", URL: "" });
  const buffer = await createXlsxBuffer({
    headers,
    rows,
    hyperlinks: Object.fromEntries(rows.map((row, index) => [index + 1, { column: "URL", target: row.URL, tooltip: `Open @${row.Username}` }])),
    widths: headers.map((header) => (header === "Reason" ? 60 : 18))
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": "attachment; filename=profiles.xlsx"
    }
  });
}
