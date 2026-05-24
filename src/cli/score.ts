import fs from "node:fs";
import path from "node:path";
import { parseArgs, requireArg } from "@/src/cli/args";
import { scoreInstagramProfile } from "@/src/scoring/scorer";
import type { RawInstagramProfile, ScrapeType } from "@/src/types/profile";

async function main() {
  const args = parseArgs();
  const file = requireArg(args, "file");
  const source = typeof args.source === "string" ? args.source.replace(/^@/, "") : "local";
  const type = (args.type || "following") as ScrapeType;
  const batchId = typeof args.batch === "string" ? args.batch : `${source}-${type}-${Date.now()}`;
  const raw = JSON.parse(fs.readFileSync(path.resolve(file), "utf8")) as RawInstagramProfile[];
  const profiles = raw
    .map((item) => scoreInstagramProfile(item, { sourceProfile: source, batchId, scrapeType: type }))
    .filter((profile) => profile !== null)
    .sort((a, b) => b.fit_score - a.fit_score);

  console.table(
    profiles.slice(0, 25).map((profile) => ({
      tier: profile.tier,
      score: profile.fit_score,
      username: profile.username,
      category: profile.category,
      location: profile.location ?? "",
      practice: profile.practice ?? "",
      followers: profile.followers ?? ""
    }))
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
