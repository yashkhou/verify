#!/usr/bin/env node
import { FileJournal } from "./index.mjs";

const [command, file = ".action-guard/journal.jsonl"] = process.argv.slice(2);
if (!command || ["help", "-h", "--help"].includes(command)) {
  console.log("action-guard inspect [journal.jsonl]\naction-guard verify [journal.jsonl]");
  process.exit(0);
}
const journal = new FileJournal(file);
if (command === "verify") {
  const ok = journal.verify();
  console.log(ok ? "Journal hash chain verified." : "Journal verification failed.");
  process.exit(ok ? 0 : 1);
}
if (command === "inspect") {
  const rows = journal.read();
  console.log(JSON.stringify({ events: rows.length, verified: journal.verify(), rows }, null, 2));
  process.exit(0);
}
console.error("Unknown command.");
process.exit(2);
