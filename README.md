# Yashkhou Verify

[![CI](https://github.com/yashkhou/verify/actions/workflows/ci.yml/badge.svg)](https://github.com/yashkhou/verify/actions/workflows/ci.yml)
[![npm: Artifact Verify](https://img.shields.io/npm/v/yashkhou-artifact-verify)](https://www.npmjs.com/package/yashkhou-artifact-verify)
[![npm: Repo Verify](https://img.shields.io/npm/v/yashkhou-repo-verify)](https://www.npmjs.com/package/yashkhou-repo-verify)
[![npm: Action Guard](https://img.shields.io/npm/v/yashkhou-action-guard)](https://www.npmjs.com/package/yashkhou-action-guard)

**AI made creation cheap. Proof is now the bottleneck.**

Project page: https://yashkhou.com/projects/verify

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

Published packages:

```bash
npm install yashkhou-artifact-verify
npm install yashkhou-repo-verify
npm install yashkhou-action-guard
```

## Starter failure benchmark

`npm run benchmark` plants five transparent failure/recovery cases across the stack. The current suite contains all five: a DOCX placeholder, an XLSX `#REF!`, a forbidden code primitive, an unapproved irreversible action, and a compensating recovery. It is deliberately small and reproducible; it is not presented as a model leaderboard or representative failure-rate study.

## Artifact Verify

```bash
npx yashkhou-artifact-verify check report.docx --rules artifact-verify.json
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
  "requireArgvCommands": true,
  "commands": [
    { "name": "test", "argv": ["npm", "test"] },
    { "name": "build", "argv": ["npm", "run", "build"] }
  ]
}
```

Then run:

```bash
npx yashkhou-repo-verify verify
```

Evidence is written to `.repo-verify/evidence.json` and `.repo-verify/evidence.md`. Structured `argv` commands avoid invoking a shell; legacy `run` strings remain available unless `requireArgvCommands` is enabled.

## Action Guard

```js
import { createTransactionManager, ActionClass } from "yashkhou-action-guard";

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

See [Maintainer automation](docs/MAINTAINER_AUTOMATION.md) for the intended AI-assisted maintenance loop and trust boundary.

## Status

This is an early open-source release. Treat it as verification infrastructure, not a guarantee of correctness. See each package and the launch notes in `docs/` for current scope and known limits.

See also: [Agent verification checklist](docs/agent-verification-checklist.md).

## Community and security

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Security-sensitive reports should follow [SECURITY.md](SECURITY.md), and project spaces follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

Maintenance plans live in [docs/ROADMAP.md](docs/ROADMAP.md), and the release process is documented in [docs/RELEASING.md](docs/RELEASING.md).

MIT licensed.
