import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import AdmZip from "adm-zip";

const SUPPORTED = new Set([".xlsx", ".docx", ".pptx", ".pdf"]);

function result(id, status, detail, evidence = {}) {
  return { id, status, detail, evidence };
}

function normalizeText(value) {
  return value.replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/\s+/g, " ").trim();
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}
function inspectOffice(buffer, ext) {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  const names = new Set(entries.map(e => e.entryName));
  const xml = entries.filter(e => e.entryName.endsWith(".xml"))
    .map(e => e.getData().toString("utf8"));
  const text = normalizeText(xml.join(" "));
  const expectedRoot = ext === ".xlsx" ? "xl/workbook.xml"
    : ext === ".docx" ? "word/document.xml"
    : "ppt/presentation.xml";
  const formulaErrors = xml.flatMap(x =>
    [...x.matchAll(/<v>(#(?:REF!|DIV\/0!|VALUE!|NAME\?|N\/A|NUM!|NULL!))<\/v>/g)]
      .map(m => m[1])
  );
  return {
    text,
    names,
    xml,
    expectedRoot,
    rootPresent: names.has(expectedRoot),
    formulaErrors
  };
}

function inspectPdf(buffer) {
  const raw = buffer.toString("latin1");
  const pageCount = (raw.match(/\/Type\s*\/Page(?!s)\b/g) || []).length;
  const strings = [...raw.matchAll(/\(([^()]*)\)\s*Tj/g)].map(m => m[1]);
  return { pageCount, text: normalizeText(strings.join(" ")) };
}
export function verifyArtifact(filePath, rules = {}) {
  const absolute = path.resolve(filePath);
  const checks = [];
  if (!fs.existsSync(absolute)) {
    return { ok: false, file: absolute, checks: [result("file.exists", "fail", "File does not exist")] };
  }

  const buffer = fs.readFileSync(absolute);
  const ext = path.extname(absolute).toLowerCase();
  checks.push(result("file.supported", SUPPORTED.has(ext) ? "pass" : "fail",
    SUPPORTED.has(ext) ? `Supported artifact type ${ext}` : `Unsupported artifact type ${ext}`));
  checks.push(result("file.nonempty", buffer.length > (rules.minBytes ?? 64) ? "pass" : "fail",
    `${buffer.length} bytes`, { bytes: buffer.length }));

  if (!SUPPORTED.has(ext)) {
    return summarize(absolute, buffer, checks);
  }

  let text = "";
  if (ext === ".pdf") {
    const pdf = inspectPdf(buffer);
    text = pdf.text;
    checks.push(result("pdf.header", buffer.subarray(0, 5).toString() === "%PDF-" ? "pass" : "fail",
      "PDF header signature"));
    if (rules.minPages != null) checks.push(result("pdf.minPages",
      pdf.pageCount >= rules.minPages ? "pass" : "fail", `${pdf.pageCount} pages`));
    if (rules.maxPages != null) checks.push(result("pdf.maxPages",
      pdf.pageCount <= rules.maxPages ? "pass" : "fail", `${pdf.pageCount} pages`));
  } else {
    let office;
    try { office = inspectOffice(buffer, ext); }
    catch (error) {
      checks.push(result("office.open", "fail", error.message));
      return summarize(absolute, buffer, checks);
    }
    text = office.text;
    checks.push(result("office.structure", office.rootPresent ? "pass" : "fail",
      office.rootPresent ? `Found ${office.expectedRoot}` : `Missing ${office.expectedRoot}`));
    if (ext === ".xlsx") checks.push(result("xlsx.formulaErrors",
      office.formulaErrors.length === 0 ? "pass" : "fail",
      office.formulaErrors.length ? `Formula errors: ${office.formulaErrors.join(", ")}` : "No cached Excel formula errors found"));
    for (const required of rules.requiredEntries ?? []) {
      checks.push(result(`entry:${required}`, office.names.has(required) ? "pass" : "fail",
        office.names.has(required) ? "Required package entry exists" : "Required package entry missing"));
    }
  }
  for (const needle of rules.requiredText ?? []) {
    const found = text.toLowerCase().includes(String(needle).toLowerCase());
    checks.push(result(`text.required:${needle}`, found ? "pass" : "fail",
      found ? "Required text found" : `Missing required text: ${needle}`));
  }

  for (const needle of rules.forbiddenText ?? []) {
    const found = text.toLowerCase().includes(String(needle).toLowerCase());
    checks.push(result(`text.forbidden:${needle}`, found ? "fail" : "pass",
      found ? `Forbidden text found: ${needle}` : "Forbidden text absent"));
  }

  if (rules.forbidPlaceholders !== false) {
    const placeholders = ["lorem ipsum", "todo", "tbd", "insert text", "example.com"];
    const hits = placeholders.filter(x => text.toLowerCase().includes(x));
    checks.push(result("content.placeholders", hits.length ? "fail" : "pass",
      hits.length ? `Placeholder text found: ${hits.join(", ")}` : "No common placeholder text found"));
  }

  return summarize(absolute, buffer, checks);
}

function summarize(file, buffer, checks) {
  const failed = checks.filter(c => c.status === "fail");
  return {
    ok: failed.length === 0,
    file,
    sha256: sha256(buffer),
    checkedAt: new Date().toISOString(),
    summary: { total: checks.length, passed: checks.length - failed.length, failed: failed.length },
    checks
  };
}
