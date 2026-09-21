import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ActionClass, FileJournal, TransactionManager } from "../src/index.mjs";

function manager() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "action-guard-"));
  return new TransactionManager({ journal: new FileJournal(path.join(dir, "journal.jsonl")) });
}

test("rolls back reversible action failure", async () => {
  const tx = manager();
  let value = 1;
  const result = await tx.run({
    id: "reversible-1",
    classification: ActionClass.REVERSIBLE,
    snapshot: async () => value,
    execute: async () => { value = 2; throw new Error("boom"); },
    rollback: async previous => { value = previous; return { restored: previous }; }
  });
  assert.equal(result.recovered, true);
  assert.equal(value, 1);
});

test("blocks irreversible action without approval", async () => {
  const tx = manager();
  const result = await tx.run({
    id: "irreversible-1",
    classification: ActionClass.IRREVERSIBLE,
    execute: async () => "sent"
  });
  assert.equal(result.blocked, true);
});

test("deduplicates committed actions by id", async () => {
  const tx = manager();
  let calls = 0;
  const action = { id: "same-id", execute: async () => ++calls };
  assert.equal((await tx.run(action)).result, 1);
  assert.equal((await tx.run(action)).deduplicated, true);
  assert.equal(calls, 1);
});
