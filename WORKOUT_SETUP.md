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

Daily status uses `America/Toronto` including DST. The website refreshes every five minutes, when returning to the tab, and within 15 seconds of midnight. With no current-day sync, it shows **Status unavailable**. A fresh empty sync shows **Not yet today**; an empty sync older than two hours becomes unknown. Once a workout is confirmed, it counts until the Ottawa day ends. The last actual sync time is always displayed.

## Payload and storage

Accepts `{ "data": { "workouts": [...] } }` or `{ "workouts": [...] }` using Health Auto Export v2 fields `id`, `name`, `start`, `end`, `duration`, and optional `distance: { qty, units }`. Dates must contain offsets. Distances support `km`, `mi`, `m`, and `yd`. All records are validated; invalid or old-only payloads are rejected without overwriting the last valid state. Multiple requests with the same snapshot do not duplicate workouts. A full snapshot also reflects edits and deletions.

Only today's normalized summaries are stored, with a two-day TTL. No raw Health export is stored or logged. The read endpoint is public; uploads and deletion require the secret bearer token. To clear data, send an authenticated `DELETE /api/workouts`. Disable the phone automation and remove/rotate the ingest token to stop future publishing.

## Checks

```sh
node --test workouts.test.mjs
npm run build
```

Tests cover Ottawa midnight and DST, date/unit validation, idempotence, exact output allowlisting, unknown versus empty states, unauthorized writes, snapshots, and storage failures. Browser validation covers three display states, date rollover, mobile widths and accessibility. Fixtures are labeled and used only in intercepted test responses; they are never deployed as real activity.

## References

- https://help.healthyapps.dev/en/health-auto-export/automations/rest-api/
- https://help.healthyapps.dev/en/health-auto-export/export-format/workouts/
- https://upstash.com/docs/redis/features/restapi
