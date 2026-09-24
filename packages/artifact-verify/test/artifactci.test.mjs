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


test("fails unsupported artifact types", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "artifact-verify-"));
  const file = path.join(dir, "demo.txt");
  fs.writeFileSync(file, "plain text");
  const report = verifyArtifact(file, {});
  assert.equal(report.ok, false);
  assert.equal(report.checks.find(check => check.id === "file.supported").status, "fail");
});

test("detects cached Excel formula errors", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "artifact-verify-"));
  const file = path.join(dir, "demo.xlsx");
  const zip = new AdmZip();
  zip.addFile("xl/workbook.xml", Buffer.from("<workbook/>"));
  zip.addFile("xl/worksheets/sheet1.xml", Buffer.from('<worksheet><c t="e"><v>#REF!</v></c></worksheet>'));
  zip.writeZip(file);
  const report = verifyArtifact(file, {});
  assert.equal(report.ok, false);
  assert.match(report.checks.find(check => check.id === "xlsx.formulaErrors").detail, /#REF!/);
});

test("fails a corrupt Office container without throwing", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "artifact-verify-"));
  const file = path.join(dir, "broken.docx");
  fs.writeFileSync(file, "not a zip file");
  const report = verifyArtifact(file, {});
  assert.equal(report.ok, false);
  assert.equal(report.checks.some(check => check.id === "office.open" && check.status === "fail"), true);
});


test("detects broken internal Office relationships", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "artifact-verify-"));
  const file = path.join(dir, "broken-rel.docx");
  const zip = new AdmZip();
  zip.addFile("word/document.xml", Buffer.from("<w:document><w:t>Verified</w:t></w:document>"));
  zip.addFile("word/_rels/document.xml.rels", Buffer.from('<Relationships><Relationship Id="rId1" Type="image" Target="media/missing.png"/></Relationships>'));
  zip.writeZip(file);
  const report = verifyArtifact(file, { forbidPlaceholders: false });
  const check = report.checks.find(item => item.id === "office.relationships");
  assert.equal(check.status, "fail");
  assert.equal(check.evidence.brokenRelationships[0].resolved, "word/media/missing.png");
});

test("allows external Office relationships without requiring a package entry", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "artifact-verify-"));
  const file = path.join(dir, "external-rel.docx");
  const zip = new AdmZip();
  zip.addFile("word/document.xml", Buffer.from("<w:document><w:t>Verified</w:t></w:document>"));
  zip.addFile("word/_rels/document.xml.rels", Buffer.from('<Relationships><Relationship Id="rId1" Type="hyperlink" Target="https://example.org" TargetMode="External"/></Relationships>'));
  zip.writeZip(file);
  const report = verifyArtifact(file, { forbidPlaceholders: false });
  assert.equal(report.checks.find(item => item.id === "office.relationships").status, "pass");
});

test("requires a PDF startxref and terminal EOF trailer", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "artifact-verify-"));
  const file = path.join(dir, "broken.pdf");
  fs.writeFileSync(file, "%PDF-1.7\n1 0 obj\n<<>>\nendobj\n");
  const report = verifyArtifact(file, { forbidPlaceholders: false });
  assert.equal(report.checks.find(item => item.id === "pdf.header").status, "pass");
  assert.equal(report.checks.find(item => item.id === "pdf.trailer").status, "fail");
});
