import type { EnrichedProfile } from "@/src/types/profile";

const profileColumns = [
  "username",
  "instagram_url",
  "full_name",
  "profile_description",
  "profile_pic_url",
  "category",
  "location",
  "practice",
  "account_type",
  "human_name_confidence",
  "gender_guess",
  "followers",
  "following",
  "posts",
  "verified",
  "is_business_account",
  "public_account",
  "fit_score",
  "tier",
  "pitch_angle",
  "score_reason",
  "dm_template",
  "review_status",
  "dm_status",
  "outcome_status",
  "notes",
  "source_profile",
  "batch_id",
  "scrape_type",
  "scraped_at",
  "raw_json"
] as const;

export function toProfileRow(profile: EnrichedProfile) {
  return Object.fromEntries(profileColumns.map((key) => [key, profile[key]]));
}
