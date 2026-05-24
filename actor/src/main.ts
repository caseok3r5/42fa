import { z } from "zod";
import { getActorInput, log, pushData } from "./runtime.js";

const inputSchema = z.object({
  sourceProfile: z.string().min(1),
  type: z.enum(["followers", "following"]).default("following"),
  limit: z.number().int().positive().max(10000).default(100),
  seedProfiles: z.array(z.string()).optional().default([]),
  sessionCookie: z.string().optional()
});

type ActorInput = z.infer<typeof inputSchema>;

interface PublicProfileRecord {
  username: string;
  fullName?: string | null;
  biography?: string | null;
  followersCount?: number | null;
  followsCount?: number | null;
  postsCount?: number | null;
  isBusinessAccount?: boolean;
  private?: boolean;
  verified?: boolean;
  profilePicUrl?: string | null;
  url: string;
  sourceProfile: string;
  scrapeType: "followers" | "following";
}

function cleanHandle(handle: string) {
  return handle.replace(/^@/, "").replace(/\/$/, "").trim().toLowerCase();
}

function parseCount(value: string | undefined) {
  if (!value) return null;
  const compact = value.toLowerCase().replace(/,/g, "").trim();
  const match = compact.match(/^([\d.]+)\s*([km])?/);
  if (!match) return null;
  const base = Number.parseFloat(match[1]);
  if (!Number.isFinite(base)) return null;
  if (match[2] === "m") return Math.round(base * 1_000_000);
  if (match[2] === "k") return Math.round(base * 1_000);
  return Math.round(base);
}

function extractMeta(html: string, property: string) {
  const pattern = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i");
  return html.match(pattern)?.[1]?.replace(/&quot;/g, '"').replace(/&amp;/g, "&") ?? null;
}

function parseProfileHtml(username: string, html: string, input: ActorInput): PublicProfileRecord {
  const description = extractMeta(html, "description") ?? "";
  const title = extractMeta(html, "og:title") ?? "";
  const image = extractMeta(html, "og:image");
  const countMatch = description.match(/([\d.,]+[km]?)\s+Followers,\s+([\d.,]+[km]?)\s+Following,\s+([\d.,]+[km]?)\s+Posts/i);

  return {
    username,
    fullName: title.replace(/\(@.*?\).*$/, "").trim() || null,
    biography: description || null,
    followersCount: parseCount(countMatch?.[1]),
    followsCount: parseCount(countMatch?.[2]),
    postsCount: parseCount(countMatch?.[3]),
    isBusinessAccount: false,
    private: /private/i.test(description),
    verified: false,
    profilePicUrl: image,
    url: `https://www.instagram.com/${username}/`,
    sourceProfile: cleanHandle(input.sourceProfile),
    scrapeType: input.type
  };
}

async function scrapePublicProfile(username: string, input: ActorInput) {
  const headers: Record<string, string> = {
    "accept-language": "en-US,en;q=0.9",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36"
  };
  if (input.sessionCookie) headers.cookie = input.sessionCookie;

  const response = await fetch(`https://www.instagram.com/${username}/`, { headers });
  if (!response.ok) {
    throw new Error(`Instagram returned ${response.status} for @${username}`);
  }

  const html = await response.text();
  return parseProfileHtml(username, html, input);
}

async function main() {
  const input = inputSchema.parse((await getActorInput<unknown>()) ?? {});
  const source = cleanHandle(input.sourceProfile);
  const handles = Array.from(new Set([source, ...input.seedProfiles.map(cleanHandle)])).slice(0, input.limit);

  log.info("Starting custom practitioner network scraper", {
    sourceProfile: source,
    type: input.type,
    limit: input.limit,
    handles: handles.length
  });

  let pushed = 0;
  for (const handle of handles) {
    try {
      const profile = await scrapePublicProfile(handle, input);
      await pushData(profile);
      pushed += 1;
    } catch (error) {
      log.warning(`Skipping @${handle}: ${(error as Error).message}`);
    }
  }

  log.info("Finished custom scraper run", { pushed });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
