import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { createXlsxBuffer } from "@/src/export/xlsx";
import type { EnrichedProfile } from "@/src/types/profile";

const exportFields: Array<keyof EnrichedProfile> = [
  "tier",
  "fit_score",
  "username",
  "instagram_url",
  "full_name",
  "category",
  "location",
  "practice",
  "account_type",
  "human_name_confidence",
  "followers",
  "following",
  "posts",
  "public_account",
  "review_status",
  "dm_status",
  "outcome_status",
  "source_profile",
  "batch_id",
  "pitch_angle",
  "score_reason",
  "notes"
];

function ensureDir(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

export function writeCsv(profiles: EnrichedProfile[], filePath: string) {
  ensureDir(filePath);
  const rows = profiles.map((profile) =>
    Object.fromEntries(exportFields.map((field) => [field, profile[field] ?? ""]))
  );
  fs.writeFileSync(filePath, Papa.unparse(rows));
}

export async function writeXlsx(profiles: EnrichedProfile[], filePath: string) {
  ensureDir(filePath);
  const headers = [
    "Tier",
    "Score",
    "Username",
    "Instagram URL",
    "Name",
    "Category",
    "Location",
    "Practice",
    "Account Type",
    "Human Confidence",
    "Followers",
    "Following",
    "Posts",
    "Public",
    "Review",
    "DM",
    "Outcome",
    "Source",
    "Batch",
    "Pitch Angle",
    "Reason",
    "Notes"
  ];
  const rows = profiles.map((profile) => ({
    Tier: profile.tier,
    Score: profile.fit_score,
    Username: profile.username,
    "Instagram URL": profile.instagram_url,
    Name: profile.full_name ?? "",
    Category: profile.category,
    Location: profile.location ?? "",
    Practice: profile.practice ?? "",
    "Account Type": profile.account_type,
    "Human Confidence": profile.human_name_confidence,
    Followers: profile.followers ?? "",
    Following: profile.following ?? "",
    Posts: profile.posts ?? "",
    Public: profile.public_account,
    Review: profile.review_status,
    DM: profile.dm_status,
    Outcome: profile.outcome_status,
    Source: profile.source_profile,
    Batch: profile.batch_id,
    "Pitch Angle": profile.pitch_angle ?? "",
    Reason: profile.score_reason,
    Notes: profile.notes ?? ""
  }));
  const buffer = await createXlsxBuffer({
    headers,
    rows,
    hyperlinks: Object.fromEntries(
      profiles.map((profile, index) => [index + 1, { column: "Instagram URL", target: profile.instagram_url, tooltip: `Open @${profile.username}` }])
    ),
    widths: [8, 8, 20, 34, 24, 14, 14, 20, 18, 18, 10, 10, 8, 8, 14, 12, 12, 18, 18, 34, 60, 30]
  });
  fs.writeFileSync(filePath, buffer);
}
