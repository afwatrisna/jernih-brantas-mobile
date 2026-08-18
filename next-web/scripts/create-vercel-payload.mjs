import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const outputPath = "/tmp/jernih-next-vercel-payload.json";
const includedRootFiles = new Set([
  "package.json",
  "pnpm-lock.yaml",
  "next.config.ts",
  "tsconfig.json",
  "next-env.d.ts",
  "postcss.config.mjs",
  "eslint.config.mjs",
]);
const includedDirectories = new Set(["src"]);
const excludedFiles = new Set(["src/app/favicon.ico"]);

async function collect(directory, relative = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const nextRelative = path.posix.join(relative, entry.name);
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (relative === "" && !includedDirectories.has(entry.name)) continue;
      files.push(...(await collect(absolute, nextRelative)));
      continue;
    }
    if (relative === "" && !includedRootFiles.has(entry.name)) continue;
    if (excludedFiles.has(nextRelative)) continue;
    files.push({ file: nextRelative, data: await readFile(absolute, "utf8"), encoding: "utf-8" });
  }
  return files;
}

const files = await collect(projectRoot);
await writeFile(outputPath, JSON.stringify({
  name: "jernih-brantas-next",
  teamId: "team_Awlpz9WjqvalZ60DWfGsh9GQ",
  target: "production",
  files,
}, null, 2));
console.log(`Wrote ${files.length} deployable source files to ${outputPath}`);
