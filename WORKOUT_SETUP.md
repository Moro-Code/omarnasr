# Apple Health workout check-in

The public section uses original Apple Health workout records, selected by Omar, with a link to his Strava profile. No Strava API data is consumed. Only workout type, start time, duration and distance are published. Heart rate, calories, location, routes and other health metrics are discarded before storage.

## Hosting setup

Create a durable Upstash Redis database and set three **server-only** environment variables on the production Vercel project:

- `UPSTASH_REDIS_REST_URL`: the database's HTTPS REST endpoint.
- `UPSTASH_REDIS_REST_TOKEN`: its write token.
- `WORKOUT_INGEST_TOKEN`: a unique random secret (at least 32 characters; generate 32 random bytes or more).

Redeploy after setting these values. Never commit secrets, paste them in chat, put them in URLs, or use `NEXT_PUBLIC_*`. Use isolated storage for preview deployments. The endpoint fails closed until configured.

## iPhone setup

Use [Health Auto Export](https://www.healthyapps.dev/apps/health-auto-export/) or another trusted publisher implementing the same JSON format. Its automation features may require a paid plan; review pricing in the App Store before purchasing.

1. Grant the exporter read access to Workouts and workout distance only. Do not enable unrelated health metrics.
2. Create a **REST API** automation with URL `https://www.omarnasr.ca/api/workouts`.
3. Set **Data type: Workouts**, **Export format: JSON**, **Export version: v2**, **Date range: Today**. Keep your phone in the Ottawa time zone for Today exports. Select the workout types you want to publish.
4. Disable **Include Route Data**, **Include Workout Metrics**, and **Batch requests**. Every request must contain the full Today workout list; batches would replace earlier entries.
5. Set headers `Authorization: Bearer <your WORKOUT_INGEST_TOKEN>` and `X-Workout-Window: today`. Use `Content-Type: application/json`.
6. Set an hourly sync and enable the automation. Run it manually once, then confirm the endpoint returns HTTP 200 and the website shows the correct activities.
7. Enable Background App Refresh. The app's automation widget and optional Shortcuts schedule can improve delivery, but iOS can delay exports while the phone is locked or in Low Power Mode. This is a synced feed, not an instantaneous activity detector.

Daily status uses `America/Toronto` including DST. The website refreshes every five minutes, when returning to the tab, and within 15 seconds of midnight. A fresh empty sync shows **Not yet today**. An empty sync older than two hours stays inconclusive (**Status unavailable**). That inconclusive read is HTTP 200: the sync is old, not a storage failure. Once a workout is confirmed, it counts until the Ottawa day ends. A current-day sync shows the time it landed.

If nothing has been stored for the current Ottawa day, `GET /api/workouts` returns HTTP 200 with `status: "pending"` and `sync: "none"`. The page says **No sync yet today**. A confirmed workout still inside the two-day TTL, from yesterday or the day before, is returned as `prior` and shown with that date. It is not described as today's result. An empty older sync is not a confirmation, so it is not shown as a rest day. As soon as today's export arrives, the response is that current-day snapshot again.

Missing storage configuration and storage failures still return HTTP 503 with `status: "unavailable"`. A missing daily snapshot is not a server error. A corrupt current-day value is treated as a storage failure. A corrupt older value is skipped.

## Payload and storage

Accepts `{ "data": { "workouts": [...] } }` or `{ "workouts": [...] }` using Health Auto Export v2 fields `id`, `name`, `start`, `end`, `duration`, and optional `distance: { qty, units }`. Dates must contain offsets. Distances support `km`, `mi`, `m`, and `yd`. All records are validated; invalid or old-only payloads are rejected without overwriting the last valid state. Multiple requests with the same snapshot do not duplicate workouts. A full snapshot also reflects edits and deletions.

Only today's normalized summaries are stored, with a two-day TTL. No raw Health export is stored or logged. Reads still publish only the existing allowlist: workout name, sport, start, duration, distance, and totals. The prior-day fallback uses that same shape and does not add health fields or Apple Health identifiers. The read endpoint is public; uploads and deletion require the secret bearer token. To clear data, send an authenticated `DELETE /api/workouts`. Disable the phone automation and remove/rotate the ingest token to stop future publishing.

## Checks

```sh
node --test workouts.test.mjs
npm run build
```

Tests cover Ottawa midnight and DST, date/unit validation, idempotence, exact output allowlisting, fresh empty versus stale empty versus no-sync, the prior-day fallback and its health-id stripping, unauthorized writes, snapshots, and storage failures. Browser validation covers today ready, today empty, fallback to the last confirmed check-in, nothing stored, desktop and mobile widths, and accessibility. Fixtures are labeled and used only in intercepted test responses; they are never deployed as real activity.

## References

- https://help.healthyapps.dev/en/health-auto-export/automations/rest-api/
- https://help.healthyapps.dev/en/health-auto-export/export-format/workouts/
- https://upstash.com/docs/redis/features/restapi
