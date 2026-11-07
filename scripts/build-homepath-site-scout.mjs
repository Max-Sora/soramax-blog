import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = join(root, "apps", "homepath-site-scout");
const target = join(root, "dist", "tools", "homepath");

await mkdir(join(root, "dist", "tools"), { recursive: true });
await rm(target, { recursive: true, force: true });
await cp(source, target, { recursive: true });
console.log(`HomePath Site Scout copied to ${target}`);
