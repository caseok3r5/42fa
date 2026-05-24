import {
  businessTerms,
  categoryTerms,
  nycTerms,
  practitionerTerms
} from "@/src/scoring/dictionaries";
import { clamp, extractMentions, includesAny, normalizeText } from "@/src/scoring/helpers";
import type {
  AccountType,
  Category,
  Confidence,
  EnrichedProfile,
  RawInstagramProfile,
  ScrapeType,
  Tier
} from "@/src/types/profile";

const categoryPriority: Array<Exclude<Category, "unknown">> = ["pilates", "yoga", "hair", "aesthetician", "wellness"];

function getString(raw: RawInstagramProfile, keys: string[]) {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function getNumber(raw: RawInstagramProfile, keys: string[]) {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

function getBool(raw: RawInstagramProfile, keys: string[], fallback = false) {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "boolean") return value;
  }
  return fallback;
}

function classifyCategory(text: string): Category {
  for (const category of categoryPriority) {
    if (includesAny(text, categoryTerms[category])) return category;
  }
  return "unknown";
}

function inferHumanConfidence(fullName: string | null, username: string, bio: string, isBusiness: boolean): Confidence {
  const text = normalizeText(`${fullName ?? ""} ${username} ${bio}`);
  const hasBusinessTerm = includesAny(text, businessTerms);
  const hasPractitionerTerm = includesAny(text, practitionerTerms);
  const cleanName = fullName?.replace(/[^a-zA-Z\s'-]/g, "").trim() ?? "";
  const nameParts = cleanName.split(/\s+/).filter(Boolean);
  const looksLikeName = nameParts.length >= 2 && nameParts.length <= 4 && !includesAny(normalizeText(cleanName), businessTerms);

  if (isBusiness || (hasBusinessTerm && !looksLikeName)) return "low";
  if (looksLikeName && hasPractitionerTerm) return "high";
  if (looksLikeName) return "high";
  if (hasPractitionerTerm) return "medium";
  return "low";
}

function inferAccountType(text: string, confidence: Confidence, isBusiness: boolean): AccountType {
  if (isBusiness || includesAny(text, businessTerms)) return confidence === "high" ? "person_practice" : "studio_brand";
  if (confidence === "high") return "person";
  if (confidence === "medium") return "person_practice";
  return "unknown";
}

function followerScore(followers: number | null) {
  if (followers == null) return 0;
  if (followers >= 500 && followers <= 15_000) return 12;
  if (followers > 15_000 && followers <= 75_000) return 9;
  if (followers >= 200 && followers < 500) return 7;
  if (followers > 75_000 && followers <= 150_000) return 3;
  if (followers > 150_000) return -8;
  return -4;
}

function tierFor(score: number): Tier {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 65) return "C";
  return "D";
}

function pitchAngle(category: Category, practice: string | null) {
  if (category === "unknown") return null;
  const label = category === "aesthetician" ? "aesthetics" : category;
  return practice ? `${label} practitioner with studio/network adjacency` : `${label} practitioner discovery`;
}

export function scoreInstagramProfile(
  raw: RawInstagramProfile,
  options: { sourceProfile: string; batchId: string; scrapeType: ScrapeType; scrapedAt?: string }
): EnrichedProfile | null {
  const username = getString(raw, ["username", "ownerUsername"]);
  if (!username) return null;

  const fullName = getString(raw, ["fullName", "full_name"]);
  const bio = getString(raw, ["biography", "bio", "profile_description"]);
  const profilePic = getString(raw, ["profilePicUrl", "profile_pic_url"]);
  const followers = getNumber(raw, ["followersCount", "followers"]);
  const following = getNumber(raw, ["followsCount", "following"]);
  const posts = getNumber(raw, ["postsCount", "posts"]);
  const verified = getBool(raw, ["verified", "isVerified"]);
  const isBusiness = getBool(raw, ["isBusinessAccount"]);
  const isPrivate = getBool(raw, ["private", "isPrivate"]);
  const publicAccount = !isPrivate;
  const combinedText = normalizeText(`${username} ${fullName ?? ""} ${bio ?? ""}`);
  const category = classifyCategory(combinedText);
  const hasNyc = includesAny(combinedText, nycTerms);
  const location = hasNyc ? "NYC" : null;
  const mentions = extractMentions(bio ?? "");
  const relevantPractice = mentions.find((mention) => {
    const joined = normalizeText(`${mention} ${combinedText}`);
    return category !== "unknown" && includesAny(joined, categoryTerms[category]);
  });
  const genericPractice = mentions.length ? mentions[0] : null;
  const practice = relevantPractice ?? genericPractice;
  const humanConfidence = inferHumanConfidence(fullName, username, bio ?? "", isBusiness);
  const accountType = inferAccountType(combinedText, humanConfidence, isBusiness);

  let score = 0;
  const reasons: string[] = [];

  if (category !== "unknown") {
    score += 34;
    reasons.push(`category:${category} +34`);
  } else {
    score -= 18;
    reasons.push("unknown category -18");
  }

  if (hasNyc) {
    score += 26;
    reasons.push("NYC signal +26");
  } else {
    score -= 8;
    reasons.push("no NYC signal -8");
  }

  if (relevantPractice) {
    score += 16;
    reasons.push(`relevant practice ${relevantPractice} +16`);
  } else if (genericPractice) {
    score += 10;
    reasons.push(`practice mention ${genericPractice} +10`);
  }

  const followerComponent = followerScore(followers);
  score += followerComponent;
  reasons.push(`followers ${followers ?? "unknown"} ${followerComponent >= 0 ? "+" : ""}${followerComponent}`);

  if (humanConfidence === "high") {
    score += 9;
    reasons.push("high human confidence +9");
  } else if (humanConfidence === "medium") {
    score += 3;
    reasons.push("medium human confidence +3");
  } else {
    score -= 16;
    reasons.push("low human confidence -16");
  }

  if (accountType === "studio_brand") {
    score -= 28;
    reasons.push("brand/studio penalty -28");
  } else if (accountType === "person_practice") {
    score -= 2;
    reasons.push("person/practice account -2");
  }

  if (!publicAccount) {
    score -= 70;
    reasons.push("private account -70");
  }

  if (posts != null && posts < 8) {
    score -= 12;
    reasons.push("low post count -12");
  }

  if (!bio || !/(dm|book|email|contact|appointments?|link in bio|inquiries)/i.test(bio)) {
    score -= 8;
    reasons.push("no DM/contact language -8");
  }

  if (category === "wellness" && !(hasNyc && humanConfidence !== "low" && practice)) {
    score -= 8;
    reasons.push("broad wellness dampener -8");
  }

  const fitScore = clamp(Math.round(score), 0, 100);

  return {
    username: username.toLowerCase().replace(/^@/, ""),
    instagram_url: getString(raw, ["url", "inputUrl"]) ?? `https://www.instagram.com/${username.replace(/^@/, "")}/`,
    full_name: fullName,
    profile_description: bio,
    profile_pic_url: profilePic,
    category,
    location,
    practice,
    practice_tags: mentions,
    account_type: accountType,
    human_name_confidence: humanConfidence,
    gender_guess: null,
    followers,
    following,
    posts,
    verified,
    is_business_account: isBusiness,
    public_account: publicAccount,
    fit_score: fitScore,
    tier: tierFor(fitScore),
    pitch_angle: pitchAngle(category, practice),
    score_reason: reasons.join("; "),
    dm_template: null,
    review_status: "new",
    dm_status: "not_sent",
    outcome_status: "none",
    notes: null,
    source_profile: options.sourceProfile,
    batch_id: options.batchId,
    scrape_type: options.scrapeType,
    raw_json: raw,
    scraped_at: options.scrapedAt ?? new Date().toISOString()
  };
}
