import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { verifyRepository } from "../src/index.mjs";

const sh = (cmd, cwd) => spawnSync(cmd, { cwd, shell: true, encoding: "utf8" });

function repoFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "repo-verify-"));
  sh("git init -q && git config user.email test@example.com && git config user.name Test", dir);
  fs.mkdirSync(path.join(dir, "src"));
  fs.writeFileSync(path.join(dir, "src/app.js"), "export const value = 1;\n");
  sh("git add . && git commit -qm init", dir);
  fs.writeFileSync(path.join(dir, "src/app.js"), "export const value = 2;\n");
  return dir;
}

test("verifies scope and commands", async () => {
  const dir = repoFixture();
  const report = await verifyRepository(dir, {
    allowedPaths: ["src/"],
    maxChangedFiles: 2,
    commands: [{ name: "syntax", run: "node --check src/app.js" }]
  });
  assert.equal(report.ok, true);
});

test("fails forbidden patterns", async () => {
  const dir = repoFixture();
  fs.writeFileSync(path.join(dir, "src/app.js"), "eval('2+2');\n");
  const report = await verifyRepository(dir, { forbiddenPatterns: ["eval("] });
  assert.equal(report.ok, false);
});


test("fails changes outside allowed paths", async () => {
  const dir = repoFixture();
  fs.writeFileSync(path.join(dir, "README.md"), "unexpected scope\n");
  const report = await verifyRepository(dir, { allowedPaths: ["src/"] });
  assert.equal(report.ok, false);
  const scope = report.checks.find(check => check.id === "scope.allowedPaths");
  assert.equal(scope.status, "fail");
  assert.deepEqual(scope.evidence.outside, ["README.md"]);
});

test("captures a failing acceptance command", async () => {
  const dir = repoFixture();
  const report = await verifyRepository(dir, {
    commands: [{ name: "intentional-failure", run: 'node -e "process.exit(7)"' }]
  });
  assert.equal(report.ok, false);
  const command = report.commands.find(item => item.name === "intentional-failure");
  assert.equal(command.status, 7);
});


test("supports explicit paths excluded from forbidden-pattern scans", async () => {
  const dir = repoFixture();
  fs.writeFileSync(path.join(dir, "rules.json"), '{"forbiddenPatterns":["BLOCK_ME"]}\n');
  const report = await verifyRepository(dir, {
    forbiddenPatterns: ["BLOCK_ME"],
    scanIgnorePaths: ["rules.json"]
  });
  assert.equal(report.ok, true);
});
