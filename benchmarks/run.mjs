import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import AdmZip from "adm-zip";
import { verifyArtifact } from "../packages/artifact-verify/src/index.mjs";
import { verifyRepository } from "../packages/repo-verify/src/index.mjs";
import { ActionClass, FileJournal, TransactionManager } from "../packages/action-guard/src/index.mjs";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "yashkhou-verify-bench-"));
const results = [];
const add = (name, detected, detail) => results.push({ name, detected, detail });

const badDoc = path.join(dir, "placeholder.docx");
const docZip = new AdmZip();
docZip.addFile("word/document.xml", Buffer.from("<w:document><w:t>TODO replace this before client delivery</w:t></w:document>"));
docZip.writeZip(badDoc);
const docReport = verifyArtifact(badDoc, {});
add("DOCX placeholder", !docReport.ok, docReport.checks.find(c => c.status === "fail")?.detail);

const badSheet = path.join(dir, "broken.xlsx");
const xlsxZip = new AdmZip();
xlsxZip.addFile("xl/workbook.xml", Buffer.from("<workbook/>"));
xlsxZip.addFile("xl/worksheets/sheet1.xml", Buffer.from('<worksheet><c t="e"><v>#REF!</v></c></worksheet>'));
xlsxZip.writeZip(badSheet);
const sheetReport = verifyArtifact(badSheet, {});
add("XLSX cached #REF!", !sheetReport.ok, sheetReport.checks.find(c => c.id === "xlsx.formulaErrors")?.detail);

const repo = path.join(dir, "repo");
fs.mkdirSync(path.join(repo, "src"), { recursive: true });
spawnSync("git init -q && git config user.email bench@example.com && git config user.name Bench", { cwd: repo, shell: true });
fs.writeFileSync(path.join(repo, "src/app.js"), "export const safe = true;\n");
spawnSync("git add . && git commit -qm init", { cwd: repo, shell: true });
fs.writeFileSync(path.join(repo, "src/app.js"), "eval('unsafe');\n");
const repoReport = await verifyRepository(repo, { forbiddenPatterns: ["eval("] });
add("Agent PR forbidden primitive", !repoReport.ok, repoReport.checks.find(c => c.status === "fail")?.detail);

const journal = new FileJournal(path.join(dir, "journal.jsonl"));
const tx = new TransactionManager({ journal });
const blocked = await tx.run({
  id: "send-money",
  classification: ActionClass.IRREVERSIBLE,
  execute: async () => ({ sent: true })
});
add("Irreversible action without approval", blocked.blocked === true, blocked.reason);

let balance = 100;
const compensated = await tx.run({
  id: "charge-then-fail",
  classification: ActionClass.COMPENSABLE,
  execute: async () => { balance -= 20; throw new Error("downstream failed"); },
  compensate: async () => { balance += 20; return { balance }; }
});
add("Compensating recovery", compensated.recovered === true && balance === 100, compensated.recovery);

const detected = results.filter(r => r.detected).length;
console.log(`Yashkhou Verify benchmark: ${detected}/${results.length} planted failures contained`);
for (const row of results) console.log(`${row.detected ? "✓" : "✕"} ${row.name} — ${row.detail || ""}`);
if (detected !== results.length) process.exit(1);
