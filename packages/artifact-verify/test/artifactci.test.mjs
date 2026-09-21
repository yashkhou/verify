import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import AdmZip from "adm-zip";
import { verifyArtifact } from "../src/index.mjs";

test("passes a valid DOCX package with required text", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "artifact-verify-"));
  const file = path.join(dir, "demo.docx");
  const zip = new AdmZip();
  zip.addFile("word/document.xml", Buffer.from("<w:document><w:t>Revenue verified</w:t></w:document>"));
  zip.writeZip(file);
  const report = verifyArtifact(file, { requiredText: ["Revenue verified"], forbidPlaceholders: true });
  assert.equal(report.ok, true);
});

test("fails placeholder content", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "artifact-verify-"));
  const file = path.join(dir, "demo.docx");
  const zip = new AdmZip();
  zip.addFile("word/document.xml", Buffer.from("<w:document><w:t>TODO replace me</w:t></w:document>"));
  zip.writeZip(file);
  const report = verifyArtifact(file, {});
  assert.equal(report.ok, false);
});
