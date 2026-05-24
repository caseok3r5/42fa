export type ScrapeType = "followers" | "following";

export type Category =
  | "pilates"
  | "yoga"
  | "hair"
  | "aesthetician"
  | "wellness"
  | "unknown";

export type AccountType = "person" | "person_practice" | "studio_brand" | "unknown";
export type Confidence = "high" | "medium" | "low";
export type Tier = "A" | "B" | "C" | "D";

export type ReviewStatus = "new" | "reviewed" | "shortlisted" | "skip" | "do_not_contact";
export type DmStatus = "not_sent" | "sent" | "responded" | "no_response";
export type OutcomeStatus = "none" | "seeded" | "posted" | "declined";

export interface RawInstagramProfile {
  username?: string;
  ownerUsername?: string;
  fullName?: string;
  full_name?: string;
  biography?: string;
  bio?: string;
  profilePicUrl?: string;
  profile_pic_url?: string;
  followersCount?: number;
  followers?: number;
  followsCount?: number;
  following?: number;
  postsCount?: number;
  posts?: number;
  verified?: boolean;
  isVerified?: boolean;
  isBusinessAccount?: boolean;
  private?: boolean;
  isPrivate?: boolean;
  url?: string;
  inputUrl?: string;
  [key: string]: unknown;
}

export interface EnrichedProfile {
  username: string;
  instagram_url: string;
  full_name: string | null;
  profile_description: string | null;
  profile_pic_url: string | null;
  category: Category;
  location: string | null;
  practice: string | null;
  practice_tags: string[];
  account_type: AccountType;
  human_name_confidence: Confidence;
  gender_guess: string | null;
  followers: number | null;
  following: number | null;
  posts: number | null;
  verified: boolean;
  is_business_account: boolean;
  public_account: boolean;
  fit_score: number;
  tier: Tier;
  pitch_angle: string | null;
  score_reason: string;
  dm_template: string | null;
  review_status: ReviewStatus;
  dm_status: DmStatus;
  outcome_status: OutcomeStatus;
  notes: string | null;
  source_profile: string;
  batch_id: string;
  scrape_type: ScrapeType;
  raw_json: RawInstagramProfile;
  scraped_at: string;
}

export interface BatchRecord {
  id: string;
  source_profile: string;
  scrape_type: ScrapeType;
  requested_limit: number;
  apify_dataset_id: string | null;
  status: "created" | "scraped" | "ingested" | "failed";
  created_at?: string;
  updated_at?: string;
}
