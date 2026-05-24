# Practitioner Network Sourcing System

Fresh MVP for sourcing NYC practitioner profiles from Instagram follower/following networks.

This repo is intentionally separate from previous projects and databases. It is designed to be pushed to a new GitHub repository and linked to a custom Apify Actor that you own.

## What is included

- CLI-first Apify scrape flow using your own custom Actor ID
- Custom Apify Actor scaffold in `actor/`
- JSON ingestion and scoring
- Hierarchical practitioner fit scoring
- Supabase Postgres schema with username deduplication
- CSV and XLSX exports with clickable Instagram links
- Next.js review dashboard with filters and status actions

## Setup

```bash
npm install
cp .env.example .env.local
```

Create a new Supabase project, then run `supabase/schema.sql` in the SQL editor. This project intentionally uses its own tables and does not reference old projects, CSVs, scripts, or databases.

Required env values:

```bash
APIFY_TOKEN=...
APIFY_ACTOR_ID=your_apify_username/practitioner-network-scraper
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

`APIFY_ACTOR_ID` should point to the Actor you create from this GitHub repo, not Apify's official Instagram Scraper.

## GitHub + Custom Apify Actor

You said you created a new GitHub repo separate from any previous GitHub. Use this project as that repo's first push:

```bash
git init
git add .
git commit -m "Initial practitioner sourcing MVP"
git branch -M main
git remote add origin <YOUR_NEW_GITHUB_REPO_URL>
git push -u origin main
```

Then in Apify:

1. Create a new Actor.
2. Choose **Link Git repository**.
3. Select the new GitHub repo.
4. Set the Actor source directory to `actor`.
5. Build the Actor.
6. Copy its Actor ID into `.env.local` as `APIFY_ACTOR_ID`.

Apify's GitHub integration docs say you need an Apify account and a GitHub repository, then you can create an Actor by linking the GitHub repo. Their Actor input schema docs also recommend defining an input schema so Apify validates inputs and renders a usable run form.

## CLI

Scrape a source account's following network:

```bash
npm run scrape -- --source brooklynyogaproject --type following --limit 1000
```

Scrape followers:

```bash
npm run scrape -- --source brooklynyogaproject --type followers --limit 1000
```

The app sends this input to your custom Actor:

```json
{
  "sourceProfile": "brooklynyogaproject",
  "type": "following",
  "limit": 1000
}
```

The Actor should write profile-shaped records to its Apify dataset. The app then pulls that dataset, scores the records, dedupes by username, and stores them in Supabase.

Score a local Apify-style JSON file without writing to Supabase:

```bash
npm run score -- --file data/raw/example.json --source brooklynyogaproject --type following
```

Ingest a local JSON file into Supabase:

```bash
npm run ingest -- --file data/raw/example.json --source brooklynyogaproject --type following
```

Export:

```bash
npm run export -- --format xlsx --tier A --output data/exports/tier-a.xlsx
npm run export -- --format csv --category pilates --output data/exports/pilates.csv
```

## Dashboard

```bash
npm run dev
```

Open the local URL shown by Next. The dashboard supports:

- all profiles
- Tier A queue via filter/cards
- source profile filtering
- category, review, DM status filtering
- review status, DM sent, seeded, do-not-contact, and notes updates
- CSV/XLSX exports for the current filtered view

## Scoring

The scoring engine is intentionally hierarchical. Profiles rise when multiple core signals coexist:

- practitioner category
- NYC relevance
- practice or studio reference
- human/personal account confidence
- follower sweet spot
- public and operationally useful account

It penalizes private accounts, obvious studios/brands, low human confidence, generic broad wellness without supporting signals, low activity, and oversized creator-style accounts.
