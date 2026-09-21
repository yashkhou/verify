# Yashkhou Verify

**AI made creation cheap. Proof is now the bottleneck.**

Yashkhou Verify is an open-source suite for verifying AI-generated work and making agent actions safer to execute.

- **Artifact Verify** — deterministic checks for generated `.xlsx`, `.pptx`, `.docx` and `.pdf` files.
- **Repo Verify** — executable acceptance gates and evidence for agent-written code.
- **Action Guard** — approval, idempotency, rollback and compensation primitives for agent actions.

The three tools are independent. Use one or combine them into a build → verify → recover pipeline.

## Quick start

```bash
git clone https://github.com/yashkhou/verify.git
cd verify
npm install
npm test
```

Requires Node.js 20+.

## Artifact Verify

```bash
./packages/artifact-verify/src/cli.mjs check report.docx --rules artifact-verify.json
```

Example rules:

```json
{
  "requiredText": ["FY2026", "Source:"],
  "forbiddenText": ["DRAFT"],
  "forbidPlaceholders": true,
  "minBytes": 1000
}
```

Artifact Verify returns a SHA-256-addressed evidence report and a non-zero exit code when a check fails. The first release focuses on structural and content assertions; it does not pretend to recalculate arbitrary Excel models or visually proof every slide.

## Repo Verify

Create `repo-verify.json`:

```json
{
  "maxChangedFiles": 30,
  "allowedPaths": ["src/", "test/"],
  "forbiddenPatterns": ["eval("],
  "commands": [
    { "name": "test", "run": "npm test" },
    { "name": "build", "run": "npm run build" }
  ]
}
```

Then run:

```bash
./packages/repo-verify/src/cli.mjs verify
```

Evidence is written to `.repo-verify/evidence.json` and `.repo-verify/evidence.md`.

## Action Guard

```js
import { createTransactionManager, ActionClass } from "@yashkhou/action-guard";

const tx = createTransactionManager({
  approve: async ({ action }) => action.metadata?.preapproved === true
});

await tx.run({
  id: "crm-contact-184",
  classification: ActionClass.REVERSIBLE,
  snapshot: () => crm.getContact(184),
  execute: () => crm.updateContact(184, patch),
  rollback: previous => crm.replaceContact(184, previous)
});
```

Every event is appended to a hash-chained local journal. Irreversible actions are blocked unless explicitly approved.

## Philosophy

Yashkhou Verify is deliberately model-agnostic. The verifier should not need to trust the model that produced the work. Prefer deterministic checks, executable tests and source evidence; use probabilistic judgment only where deterministic verification is impossible.

## Status

This is an early open-source release. Treat it as verification infrastructure, not a guarantee of correctness. See each package and the launch notes in `docs/` for current scope and known limits.

MIT licensed.
