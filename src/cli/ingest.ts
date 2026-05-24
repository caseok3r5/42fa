import fs from "node:fs";
import path from "node:path";
import { parseArgs, requireArg } from "@/src/cli/args";
import { createServiceClient } from "@/src/db/supabase";
import { toProfileRow } from "@/src/db/profiles";
import { scoreInstagramProfile } from "@/src/scoring/scorer";
import type { RawInstagramProfile, ScrapeType } from "@/src/types/profile";

async function main() {
  const args = parseArgs();
  const file = requireArg(args, "file");
  const source = requireArg(args, "source").replace(/^@/, "");
  const type = (args.type || "following") as ScrapeType;
  const batchId = typeof args.batch === "string" ? args.batch : `${source}-${type}-${Date.now()}`;
  const raw = JSON.parse(fs.readFileSync(path.resolve(file), "utf8")) as RawInstagramProfile[];
  const profiles = raw
    .map((item) => scoreInstagramProfile(item, { sourceProfile: source, batchId, scrapeType: type }))
    .filter((profile) => profile !== null);

  const supabase = createServiceClient();
  const { error } = await supabase.from("profiles").upsert(profiles.map(toProfileRow), { onConflict: "username" });
  if (error) throw error;

  console.log(`Ingested ${profiles.length} profiles into batch ${batchId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
