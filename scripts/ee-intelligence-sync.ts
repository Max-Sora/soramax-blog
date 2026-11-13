import { collectLiveSnapshot } from "../src/lib/ee-intelligence/collector";
import { buildPublicKnowledge, sanitizePublicSnapshot } from "../src/lib/ee-intelligence/knowledge";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

const snapshot = await collectLiveSnapshot();
const publicSnapshotPath = join(process.cwd(), "src", "data", "ee-intelligence", "public-snapshot.json");
await mkdir(dirname(publicSnapshotPath), { recursive: true });
await writeFile(publicSnapshotPath, JSON.stringify(sanitizePublicSnapshot(buildPublicKnowledge(snapshot.items, snapshot.sources, "live", snapshot.fetchedAt)), null, 2));
console.log(JSON.stringify({ status: snapshot.status, fetchedAt: snapshot.fetchedAt, items: snapshot.items.length, sources: snapshot.sources.length, reusedCacheCount: snapshot.reusedCacheCount, errors: snapshot.errors }, null, 2));
if (snapshot.status === "unavailable") process.exitCode = 1;
