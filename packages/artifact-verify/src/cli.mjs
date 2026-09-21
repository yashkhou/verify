#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { verifyArtifact } from "./index.mjs";

const args = process.argv.slice(2);
const command = args[0];
if (!command || ["-h", "--help", "help"].includes(command)) {
  console.log("artifact-verify check <file> [--rules artifact-verify.json] [--json] [--out report.json]");
  process.exit(0);
}
if (command !== "check" || !args[1]) {
  console.error("Usage: artifact-verify check <file>");
  process.exit(2);
}

const file = args[1];
const rulesAt = args.indexOf("--rules");
const outAt = args.indexOf("--out");
const rules = rulesAt >= 0 ? JSON.parse(fs.readFileSync(path.resolve(args[rulesAt + 1]), "utf8")) : {};
const report = verifyArtifact(file, rules);
const serialized = JSON.stringify(report, null, 2);
if (outAt >= 0) fs.writeFileSync(path.resolve(args[outAt + 1]), serialized + "\n");

if (args.includes("--json")) console.log(serialized);
else {
  console.log(`Artifact Verify ${report.ok ? "PASS" : "FAIL"} · ${report.summary.passed}/${report.summary.total} checks passed`);
  for (const check of report.checks) console.log(`${check.status === "pass" ? "✓" : "✕"} ${check.id} — ${check.detail}`);
}
process.exit(report.ok ? 0 : 1);
