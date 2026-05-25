# Practitioner Network Scraper Actor

This is the custom Apify Actor that replaces the official `apify/instagram-scraper` dependency.

It is intentionally shaped for the sourcing dashboard in the parent project. Each dataset item should look like an Instagram profile:

```json
{
  "username": "example",
  "fullName": "Example Person",
  "biography": "Pilates instructor in Brooklyn",
  "followersCount": 1200,
  "followsCount": 800,
  "postsCount": 42,
  "isBusinessAccount": false,
  "private": false,
  "verified": false,
  "profilePicUrl": "https://...",
  "url": "https://www.instagram.com/example/"
}
```

## Deploy from GitHub

1. Push the parent repo to GitHub.
2. In Apify Console, create a new Actor.
3. Choose **Link Git repository**.
4. Select this repository.
5. Set the Actor source directory to the repo root, or to `actor`. The repo root includes an Apify wrapper that runs this folder.
6. Build and run the Actor.
7. Copy the Actor ID into the app as `APIFY_ACTOR_ID`.

Apify's docs say their GitHub integration requires an Apify account and a GitHub repository, then lets you create an Actor by linking the GitHub repo.
