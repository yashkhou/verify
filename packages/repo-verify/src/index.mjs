import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const clip = (value, limit = 6000) => String(value ?? "").slice(-limit);

function shell(command, cwd, timeoutMs = 120000) {
  const started = Date.now();
  const run = spawnSync(command, {
    cwd,
    shell: true,
    encoding: "utf8",
    timeout: timeoutMs,
    env: { ...process.env, CI: "1" }
  });
  return {
    command,
    ok: run.status === 0 && !run.error,
    status: run.status,
    signal: run.signal,
    durationMs: Date.now() - started,
    stdout: clip(run.stdout),
    stderr: clip(run.stderr || run.error?.message)
  };
}

function git(command, cwd) {
  const run = shell(`git ${command}`, cwd, 15000);
  return run.ok ? run.stdout.trim() : "";
}

function check(id, ok, detail, evidence = {}) {
  return { id, status: ok ? "pass" : "fail", detail, evidence };
}
function changedFiles(cwd, baseline) {
  const base = baseline || "HEAD";
  const committed = git(`diff --name-only ${base}...HEAD`, cwd)
    .split("\n").filter(Boolean);
  const working = git("diff --name-only HEAD", cwd).split("\n").filter(Boolean);
  const staged = git("diff --cached --name-only HEAD", cwd).split("\n").filter(Boolean);
  const untracked = git("ls-files --others --exclude-standard", cwd).split("\n").filter(Boolean);
  return [...new Set([...committed, ...working, ...staged, ...untracked])];
}

function scanForbidden(cwd, files, patterns, ignorePaths = []) {
  const hits = [];
  for (const file of files) {
    const ignored = ignorePaths.some(prefix =>
      file === prefix || file.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`)
    );
    if (ignored) continue;
    const absolute = path.join(cwd, file);
    if (!fs.existsSync(absolute) || fs.statSync(absolute).isDirectory()) continue;
    let text;
    try { text = fs.readFileSync(absolute, "utf8"); } catch { continue; }
    for (const pattern of patterns) {
      if (text.includes(pattern)) hits.push({ file, pattern });
    }
  }
  return hits;
}

async function runProbe(probe) {
  const started = Date.now();
  try {
    const response = await fetch(probe.url, { redirect: "manual" });
    const body = await response.text();
    const statusOk = response.status === (probe.status ?? 200);
    const textOk = probe.contains == null || body.includes(probe.contains);
    return {
      ok: statusOk && textOk,
      status: response.status,
      durationMs: Date.now() - started,
      contains: probe.contains ?? null,
      bodyPreview: clip(body, 1200)
    };
  } catch (error) {
    return { ok: false, error: error.message, durationMs: Date.now() - started };
  }
}
export async function verifyRepository(cwd, spec = {}) {
  const root = path.resolve(cwd);
  const checks = [];
  const files = changedFiles(root, spec.baseline);
  const commit = git("rev-parse HEAD", root);
  const branch = git("branch --show-current", root);

  if (spec.maxChangedFiles != null) {
    checks.push(check("scope.maxChangedFiles", files.length <= spec.maxChangedFiles,
      `${files.length} changed files (max ${spec.maxChangedFiles})`, { files }));
  }

  if (spec.allowedPaths?.length) {
    const outside = files.filter(f => !spec.allowedPaths.some(prefix => f.startsWith(prefix)));
    checks.push(check("scope.allowedPaths", outside.length === 0,
      outside.length ? `Out-of-scope files: ${outside.join(", ")}` : "All changed files are inside allowed paths",
      { outside }));
  }

  if (spec.forbiddenPatterns?.length) {
    const hits = scanForbidden(root, files, spec.forbiddenPatterns, spec.scanIgnorePaths ?? []);
    checks.push(check("code.forbiddenPatterns", hits.length === 0,
      hits.length ? `${hits.length} forbidden pattern hit(s)` : "No forbidden patterns found", { hits }));
  }

  const commands = [];
  for (const item of spec.commands ?? []) {
    const run = shell(item.run, root, item.timeoutMs ?? 120000);
    commands.push({ name: item.name ?? item.run, ...run });
    checks.push(check(`command:${item.name ?? item.run}`, run.ok,
      run.ok ? `Passed in ${run.durationMs}ms` : `Failed with status ${run.status}`, run));
  }

  const probes = [];
  for (const probe of spec.probes ?? []) {
    const run = await runProbe(probe);
    probes.push({ name: probe.name ?? probe.url, url: probe.url, ...run });
    checks.push(check(`probe:${probe.name ?? probe.url}`, run.ok,
      run.ok ? `HTTP verification passed in ${run.durationMs}ms` : "HTTP verification failed", run));
  }
  const failed = checks.filter(c => c.status === "fail");
  const digest = crypto.createHash("sha256")
    .update(JSON.stringify({ commit, branch, files, checks }))
    .digest("hex");

  return {
    ok: failed.length === 0,
    repo: root,
    commit,
    branch,
    checkedAt: new Date().toISOString(),
    evidenceDigest: digest,
    summary: { total: checks.length, passed: checks.length - failed.length, failed: failed.length },
    changedFiles: files,
    checks,
    commands,
    probes
  };
}

export function renderMarkdown(report) {
  const lines = [
    `# Repo Verify · ${report.ok ? "VERIFIED" : "NOT VERIFIED"}`,
    "",
    `- Commit: \`${report.commit || "working tree"}\``,
    `- Evidence digest: \`${report.evidenceDigest}\``,
    `- Checks: ${report.summary.passed}/${report.summary.total} passed`,
    "",
    "## Checks",
    ""
  ];
  for (const item of report.checks) {
    lines.push(`- ${item.status === "pass" ? "✓" : "✕"} **${item.id}** — ${item.detail}`);
  }
  return lines.join("\n") + "\n";
}
