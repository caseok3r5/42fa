import { parseArgs } from "@/src/cli/args";
import { createServiceClient } from "@/src/db/supabase";
import { writeCsv, writeXlsx } from "@/src/export/exporters";
import type { EnrichedProfile } from "@/src/types/profile";

async function main() {
  const args = parseArgs();
  const format = args.format === "csv" ? "csv" : "xlsx";
  const output = typeof args.output === "string" ? args.output : `data/exports/profiles.${format}`;
  const supabase = createServiceClient();
  let query = supabase.from("profiles").select("*").order("fit_score", { ascending: false });

  if (typeof args.tier === "string") query = query.eq("tier", args.tier);
  if (typeof args.category === "string") query = query.eq("category", args.category);
  if (typeof args.source === "string") query = query.eq("source_profile", args.source.replace(/^@/, ""));

  const { data, error } = await query;
  if (error) throw error;

  const profiles = (data ?? []) as EnrichedProfile[];
  if (format === "csv") {
    writeCsv(profiles, output);
  } else {
    await writeXlsx(profiles, output);
  }

  console.log(`Exported ${profiles.length} profiles to ${output}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
