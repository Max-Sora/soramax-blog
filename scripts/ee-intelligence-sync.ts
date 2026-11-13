import { collectLiveSnapshot } from "../src/lib/ee-intelligence/collector";

const snapshot = await collectLiveSnapshot();
console.log(JSON.stringify({ status: snapshot.status, fetchedAt: snapshot.fetchedAt, items: snapshot.items.length, sources: snapshot.sources.length, reusedCacheCount: snapshot.reusedCacheCount, errors: snapshot.errors }, null, 2));
if (snapshot.status === "unavailable") process.exitCode = 1;
