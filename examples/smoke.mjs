import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { verifyArtifact } from "../packages/artifact-verify/src/index.mjs";
import { ActionClass, FileJournal, TransactionManager } from "../packages/action-guard/src/index.mjs";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "yashkhou-verify-demo-"));
const file = path.join(dir, "board-pack.pdf");
const pdf = "%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R >> endobj\n%%EOF\n";
fs.writeFileSync(file, pdf);

const artifact = verifyArtifact(file, {});
console.log(`Artifact Verify: ${artifact.ok ? "PASS" : "FAIL"}`);

let state = { stage: "draft" };
const tx = new TransactionManager({ journal: new FileJournal(path.join(dir, "journal.jsonl")) });
const action = await tx.run({
  id: "publish-board-pack",
  classification: ActionClass.REVERSIBLE,
  snapshot: async () => ({ ...state }),
  execute: async () => { state.stage = "published"; return state; },
  rollback: async previous => { state = previous; return state; }
});
console.log(`Action Guard: ${action.ok ? "COMMITTED" : "BLOCKED"}`);
