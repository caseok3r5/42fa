import fs from "node:fs";
import path from "node:path";
import { optionalInt, parseArgs, requireArg } from "@/src/cli/args";
import { createServiceClient } from "@/src/db/supabase";
import { toProfileRow } from "@/src/db/profiles";
import { runInstagramScrape } from "@/src/instagram/apify";
import { scoreInstagramProfile } from "@/src/scoring/scorer";
import type { ScrapeType } from "@/src/types/profile";

async function main() {
  const args = parseArgs();
  const source = requireArg(args, "source").replace(/^@/, "");
  const type = requireArg(args, "type") as ScrapeType;
  const limit = optionalInt(args, "limit", 1000);
  const batchId = `${source}-${type}-${Date.now()}`;
  const scrapedAt = new Date().toISOString();

  const result = await runInstagramScrape({ source, type, limit });
  const rawPath = path.join(process.cwd(), "data", "raw", `${batchId}.json`);
  fs.writeFileSync(rawPath, JSON.stringify(result.items, null, 2));

  const profiles = result.items
    .map((item) => scoreInstagramProfile(item, { sourceProfile: source, batchId, scrapeType: type, scrapedAt }))
    .filter((profile) => profile !== null);

  const supabase = createServiceClient();
  await supabase.from("batches").insert({
    id: batchId,
    source_profile: source,
    scrape_type: type,
    requested_limit: limit,
    apify_dataset_id: result.datasetId,
    status: "scraped"
  });
  const { error } = await supabase.from("profiles").upsert(profiles.map(toProfileRow), { onConflict: "username" });
  if (error) throw error;

  console.log(`Scraped ${result.items.length}; stored ${profiles.length}; raw JSON: ${rawPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
