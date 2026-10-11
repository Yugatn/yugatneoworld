import { readdir } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = fileURLToPath(new URL("../", import.meta.url));
const ignored = new Set([".git", "node_modules", "coverage", "dist"]);
const extensions = new Set([".js", ".mjs", ".cjs"]);
const files = [];

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!ignored.has(entry.name)) await collect(join(directory, entry.name));
      continue;
    }
    if (entry.isFile() && extensions.has(extname(entry.name))) {
      files.push(join(directory, entry.name));
    }
  }
}

await collect(root);
if (files.length === 0) {
  throw new Error("No JavaScript files found; refusing to report a successful syntax check.");
}

for (const file of files) {
  execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
}
console.log(`Syntax check OK: ${files.length} JavaScript files.`);
