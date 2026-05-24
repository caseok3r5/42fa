import { ApifyClient } from "apify-client";
import { env, requireCliEnv } from "@/src/config/env";
import type { RawInstagramProfile, ScrapeType } from "@/src/types/profile";

function scrapeInput(source: string, type: ScrapeType, limit: number) {
  return {
    sourceProfile: source.replace(/^@/, ""),
    type,
    limit
  };
}

function flattenNetworkItems(items: RawInstagramProfile[], type: ScrapeType) {
  return items.flatMap((item) => {
    const nested = type === "followers" ? item.followedBy : item.following;
    return Array.isArray(nested) && nested.length ? (nested as RawInstagramProfile[]) : [item];
  });
}

export async function runInstagramScrape(options: {
  source: string;
  type: ScrapeType;
  limit: number;
}) {
  requireCliEnv(["APIFY_TOKEN", "APIFY_ACTOR_ID"]);

  const client = new ApifyClient({ token: env.APIFY_TOKEN });
  const run = await client.actor(env.APIFY_ACTOR_ID!).call(scrapeInput(options.source, options.type, options.limit));
  const datasetId = run.defaultDatasetId;
  const { items } = await client.dataset(datasetId).listItems({ limit: options.limit });

  return {
    datasetId,
    items: flattenNetworkItems(items as RawInstagramProfile[], options.type).slice(0, options.limit)
  };
}
