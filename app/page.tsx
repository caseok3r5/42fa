import { ArrowDownToLine, ExternalLink, Filter } from "lucide-react";
import { StatusControls } from "@/components/status-controls";
import { createServiceClient, hasServiceEnv } from "@/src/db/supabase";
import type { EnrichedProfile } from "@/src/types/profile";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function value(params: Record<string, string | string[] | undefined>, key: string) {
  const item = params[key];
  return Array.isArray(item) ? item[0] : item;
}

function optionUrl(params: Record<string, string | string[] | undefined>, key: string, nextValue: string) {
  const next = new URLSearchParams();
  Object.entries(params).forEach(([paramKey, paramValue]) => {
    const normalized = Array.isArray(paramValue) ? paramValue[0] : paramValue;
    if (normalized) next.set(paramKey, normalized);
  });
  if (nextValue) next.set(key, nextValue);
  else next.delete(key);
  return `/?${next.toString()}`;
}

async function getProfiles(params: Record<string, string | string[] | undefined>) {
  if (!hasServiceEnv()) return [];

  const supabase = createServiceClient();
  let query = supabase.from("profiles").select("*").order("fit_score", { ascending: false }).limit(500);

  for (const key of ["tier", "category", "source_profile", "review_status", "dm_status", "location"]) {
    const selected = value(params, key);
    if (selected) query = query.eq(key, selected);
  }

  const minFollowers = Number.parseInt(value(params, "min_followers") ?? "", 10);
  const maxFollowers = Number.parseInt(value(params, "max_followers") ?? "", 10);
  if (Number.isFinite(minFollowers)) query = query.gte("followers", minFollowers);
  if (Number.isFinite(maxFollowers)) query = query.lte("followers", maxFollowers);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as EnrichedProfile[];
}

async function getFacets() {
  if (!hasServiceEnv()) return { sourceProfiles: [], categories: [] };

  const supabase = createServiceClient();
  const { data } = await supabase.from("profiles").select("source_profile, category");
  const sourceProfiles = Array.from(new Set((data ?? []).map((row) => row.source_profile).filter(Boolean))).sort();
  const categories = Array.from(new Set((data ?? []).map((row) => row.category).filter(Boolean))).sort();
  return { sourceProfiles, categories };
}

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const [profiles, facets] = await Promise.all([getProfiles(params), getFacets()]);
  const needsSetup = !hasServiceEnv();
  const tierCounts = profiles.reduce<Record<string, number>>((acc, profile) => {
    acc[profile.tier] = (acc[profile.tier] ?? 0) + 1;
    return acc;
  }, {});
  const exportParams = new URLSearchParams();
  Object.entries(params).forEach(([key, paramValue]) => {
    const normalized = Array.isArray(paramValue) ? paramValue[0] : paramValue;
    if (normalized) exportParams.set(key, normalized);
  });

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-moss">Internal sourcing</p>
            <h1 className="mt-1 text-3xl font-semibold">Practitioner Network</h1>
          </div>
          <div className="flex items-center gap-2">
            <a
              className="inline-flex items-center gap-2 rounded border border-line bg-white px-3 py-2 text-sm font-medium hover:border-moss"
              href={`/api/export?format=csv&${exportParams.toString()}`}
            >
              <ArrowDownToLine size={16} />
              CSV
            </a>
            <a
              className="inline-flex items-center gap-2 rounded bg-ink px-3 py-2 text-sm font-medium text-white hover:bg-moss"
              href={`/api/export?format=xlsx&${exportParams.toString()}`}
            >
              <ArrowDownToLine size={16} />
              XLSX
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-5">
        <div className="grid gap-3 md:grid-cols-4">
          {["A", "B", "C", "D"].map((tier) => (
            <a
              href={optionUrl(params, "tier", value(params, "tier") === tier ? "" : tier)}
              key={tier}
              className="rounded border border-line bg-white p-4 hover:border-moss"
            >
              <div className="text-sm text-moss">Tier {tier}</div>
              <div className="mt-1 text-3xl font-semibold">{tierCounts[tier] ?? 0}</div>
            </a>
          ))}
        </div>

        {needsSetup && (
          <div className="mt-5 rounded border border-line bg-white p-4 text-sm text-ink">
            Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`, then run the schema in a fresh Supabase project.
          </div>
        )}

        <form className="mt-5 grid gap-3 rounded border border-line bg-white p-4 md:grid-cols-6">
          <label className="text-sm">
            <span className="mb-1 flex items-center gap-1 text-moss">
              <Filter size={14} /> Tier
            </span>
            <select className="h-10 w-full rounded border border-line bg-white px-2" name="tier" defaultValue={value(params, "tier") ?? ""}>
              <option value="">All</option>
              {["A", "B", "C", "D"].map((tier) => (
                <option key={tier}>{tier}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-moss">Category</span>
            <select className="h-10 w-full rounded border border-line bg-white px-2" name="category" defaultValue={value(params, "category") ?? ""}>
              <option value="">All</option>
              {facets.categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-moss">Source</span>
            <select className="h-10 w-full rounded border border-line bg-white px-2" name="source_profile" defaultValue={value(params, "source_profile") ?? ""}>
              <option value="">All</option>
              {facets.sourceProfiles.map((source) => (
                <option key={source}>{source}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-moss">Review</span>
            <select className="h-10 w-full rounded border border-line bg-white px-2" name="review_status" defaultValue={value(params, "review_status") ?? ""}>
              <option value="">All</option>
              {["new", "reviewed", "shortlisted", "skip", "do_not_contact"].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-moss">DM</span>
            <select className="h-10 w-full rounded border border-line bg-white px-2" name="dm_status" defaultValue={value(params, "dm_status") ?? ""}>
              <option value="">All</option>
              {["not_sent", "sent", "responded", "no_response"].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button className="h-10 w-full rounded bg-clay px-3 text-sm font-semibold text-white hover:bg-ink">Apply</button>
          </div>
        </form>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-10">
        <div className="overflow-hidden rounded border border-line bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-paper text-left text-xs uppercase tracking-wide text-moss">
                <tr>
                  <th className="px-3 py-3">Rank</th>
                  <th className="px-3 py-3">Profile</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Network</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr className="border-t border-line align-top" key={profile.username}>
                    <td className="w-24 px-3 py-3">
                      <span className="block text-lg font-semibold">{profile.fit_score}</span>
                      <span className="text-xs text-moss">Tier {profile.tier}</span>
                    </td>
                    <td className="min-w-80 px-3 py-3">
                      <a className="inline-flex items-center gap-1 font-semibold hover:text-clay" href={profile.instagram_url} target="_blank">
                        @{profile.username}
                        <ExternalLink size={14} />
                      </a>
                      <div className="text-sm text-moss">{profile.full_name}</div>
                      <div className="mt-1 max-w-xl text-xs leading-5 text-ink/75">{profile.profile_description}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium">{profile.category}</div>
                      <div className="text-xs text-moss">{profile.human_name_confidence} human</div>
                      <div className="text-xs text-moss">{profile.account_type}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div>{profile.location ?? "No NYC signal"}</div>
                      <div className="text-xs text-moss">{profile.practice ?? "No practice tag"}</div>
                      <div className="text-xs text-moss">{profile.followers?.toLocaleString() ?? "?"} followers</div>
                    </td>
                    <td className="px-3 py-3">
                      <div>{profile.review_status}</div>
                      <div className="text-xs text-moss">DM: {profile.dm_status}</div>
                      <div className="text-xs text-moss">Outcome: {profile.outcome_status}</div>
                    </td>
                    <td className="min-w-96 px-3 py-3">
                      <StatusControls
                        username={profile.username}
                        reviewStatus={profile.review_status}
                        dmStatus={profile.dm_status}
                        outcomeStatus={profile.outcome_status}
                        notes={profile.notes ?? ""}
                      />
                      <div className="mt-2 text-xs leading-5 text-ink/65">{profile.score_reason}</div>
                    </td>
                  </tr>
                ))}
                {!profiles.length && (
                  <tr>
                    <td className="px-3 py-8 text-center text-moss" colSpan={6}>
                      No profiles match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
