#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { verifyRepository, renderMarkdown } from "./index.mjs";

const args = process.argv.slice(2);
if (!args[0] || ["help", "-h", "--help"].includes(args[0])) {
  console.log("repo-verify verify [--spec repo-verify.json] [--repo .] [--json]");
  process.exit(0);
}
if (args[0] !== "verify") {
  console.error("Usage: repo-verify verify");
  process.exit(2);
}

const valueAfter = flag => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};
const repo = path.resolve(valueAfter("--repo") || ".");
const specPath = valueAfter("--spec") || path.join(repo, "repo-verify.json");
const spec = fs.existsSync(specPath) ? JSON.parse(fs.readFileSync(specPath, "utf8")) : {};
const report = await verifyRepository(repo, spec);
const dir = path.join(repo, ".repo-verify");
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "evidence.json"), JSON.stringify(report, null, 2) + "\n");
fs.writeFileSync(path.join(dir, "evidence.md"), renderMarkdown(report));
if (args.includes("--json")) console.log(JSON.stringify(report, null, 2));
else console.log(renderMarkdown(report));
process.exit(report.ok ? 0 : 1);
